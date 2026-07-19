/**
 * CHAOS Interaction Runtime — Iteration 1.
 *
 * File-backed, deterministic implementation of the interaction runtime
 * operations defined by the Iteration 0 contracts under `.chaos/interactions/`.
 *
 * The runtime is the source of truth for whether a CHAOS command is ready,
 * waiting, blocked, resumable, completed, or cancelled. It never blocks waiting
 * for a human: `createDecision` records the decision and returns `mustStop`.
 */

import * as path from "node:path";
import type { Adapter, CommandSession, RequestedMode } from "../model/commandSession.ts";
import { canTransitionSession, isTerminalSessionState } from "../model/commandSession.ts";
import type { Decision, DecisionOption, InteractionType } from "../model/decision.ts";
import type { AuditEvent, AuditEventType, AuditSource } from "../model/auditEvent.ts";
import type { ChangeLock } from "../model/lock.ts";
import type { DecisionResponse, ResponseStatus } from "../model/response.ts";
import { normalizeResponseSource } from "../model/response.ts";
import type {
  ResumeCapsule,
  ResumeCapsuleSummary,
  ResumeCandidate,
  ListCapsulesFilter,
  FindResumeCandidatesFilter,
} from "../model/resumeCapsule.ts";
import * as nodePath from "node:path";
import { InteractionStore } from "../store/interactionStore.ts";
import { PathResolver } from "../store/pathResolver.ts";
import { sweepStaleTempFiles } from "../store/atomicWrite.ts";
import { withFileLock } from "../store/writeLock.ts";
import {
  addUnique,
  buildSession,
  removeValue,
  transitionSession,
} from "./commandSessionService.ts";
import {
  buildDecision,
  optionExists,
  transitionDecision,
  type CreateDecisionInput,
} from "./decisionService.ts";
import { InvalidDecisionPayloadError, NotFoundError, RuntimeError } from "./errors.ts";
import {
  buildLock,
  evaluateLock,
  findActiveLockForChange,
} from "./lockService.ts";
import {
  buildResumeCapsule,
  verifyCapsuleIntegrity,
  type CapsuleOverrides,
} from "./resumeCapsuleService.ts";
import {
  createIdFactory,
  systemClock,
  type Clock,
  type IdFactory,
} from "./identifiers.ts";
import { normalizeCommand } from "../validation/schemas.ts";

export interface RuntimeOptions {
  /** Runtime storage root; defaults to `.chaos/interactions`. */
  root: string;
  /** Schema directory; defaults to `<root>/schema`. */
  schemaDir?: string;
  /** Toggle schema validation on write (default true). */
  validate?: boolean;
  clock?: Clock;
  idFactory?: IdFactory;
}

export interface Envelope {
  mustStop: boolean;
  commandRunId?: string | null;
  changeId?: string | null;
  message: string;
  warnings: string[];
  errors: string[];
}

export type BeginStatus =
  | "READY"
  | "RESUME_AVAILABLE"
  | "BLOCKED_BY_PENDING_DECISION"
  | "CONFLICTING_COMMAND_ACTIVE"
  | "RUNTIME_UNAVAILABLE";

export interface BeginResult extends Envelope {
  status: BeginStatus;
  decisionId?: string | null;
  conflictingCommandRunId?: string | null;
  uiAction?: string;
  resumeCapsulePath?: string | null;
}

export interface BeginCommandInput {
  sourceCommand: string;
  changeId?: string | null;
  adapter?: Adapter;
  requestedMode?: RequestedMode;
  commandRunId?: string;
  metadata?: Record<string, unknown>;
}

export type CreateDecisionStatus = "WAITING_FOR_USER_DECISION" | "PENDING_DECISION_EXISTS";

export interface CreateDecisionResult extends Envelope {
  status: CreateDecisionStatus;
  decisionId: string;
}

export interface CreateDecisionArgs {
  commandRunId: string;
  changeId?: string | null;
  sourceCommand?: string;
  title: string;
  context: string;
  options: DecisionOption[];
  interactionType?: InteractionType;
  recommendation?: string | null;
  recommendedOptionId?: string | null;
  requiresRationale?: boolean;
  independent?: boolean;
  expiresAt?: string | null;
  createdBy?: string | null;
  lastCompletedStep?: string | null;
  nextStep?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AnswerDecisionArgs {
  decisionId: string;
  /** Single-choice / confirmation answer (an option id). */
  selectedOptionId?: string | null;
  /** Multi-choice answer (one or more option ids). */
  selectedOptionIds?: string[];
  /** Freeform-input answer (the typed text). */
  freeformValue?: string | null;
  selectedBy: string;
  rationale?: string | null;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface AnswerResult extends Envelope {
  status: "ANSWERED";
  decisionId: string;
  sessionState: CommandSession["state"];
  resumeCapsulePath?: string | null;
}

interface ResolvedAnswer {
  selectedOptionId: string | null;
  selectedOptionIds: string[];
  freeformValue: string | null;
  /** Human-readable one-line summary for audit/messages. */
  summary: string;
}

/**
 * Validate + normalise a human answer per the decision's interaction type.
 * Backward compatible: a single-choice/confirmation answer is exactly the prior
 * behaviour. Throws InvalidDecisionPayloadError on an answer that does not match
 * the decision's type.
 */
function resolveDecisionAnswer(decision: Decision, args: AnswerDecisionArgs): ResolvedAnswer {
  const type = decision.interactionType;

  if (type === "freeform-input") {
    const value = String(args.freeformValue ?? "");
    if (value.trim().length === 0) {
      throw new InvalidDecisionPayloadError(
        `Decision ${decision.decisionId} is freeform-input and requires a non-empty freeformValue.`,
      );
    }
    // A freeform decision may still carry options; keep a valid one if supplied.
    const sel =
      args.selectedOptionId && optionExists(decision, args.selectedOptionId)
        ? args.selectedOptionId
        : null;
    return {
      selectedOptionId: sel,
      selectedOptionIds: [],
      freeformValue: value,
      summary: `freeform (${value.length} chars)`,
    };
  }

  if (type === "multi-choice-decision") {
    const ids =
      Array.isArray(args.selectedOptionIds) && args.selectedOptionIds.length > 0
        ? args.selectedOptionIds
        : args.selectedOptionId
          ? [args.selectedOptionId]
          : [];
    if (ids.length === 0) {
      throw new InvalidDecisionPayloadError(
        `Decision ${decision.decisionId} is multi-choice and requires at least one selected option.`,
      );
    }
    const unique: string[] = [];
    for (const id of ids) {
      if (!optionExists(decision, id)) {
        throw new InvalidDecisionPayloadError(
          `Selected option "${id}" is not a valid option for ${decision.decisionId}.`,
        );
      }
      if (!unique.includes(id)) unique.push(id);
    }
    return {
      selectedOptionId: unique[0] ?? null,
      selectedOptionIds: unique,
      freeformValue: null,
      summary: unique.join(", "),
    };
  }

  // single-choice-decision | confirmation
  const sel = args.selectedOptionId ?? "";
  if (!sel || !optionExists(decision, sel)) {
    throw new InvalidDecisionPayloadError(
      `Selected option "${sel}" is not a valid option for ${decision.decisionId}.`,
    );
  }
  return { selectedOptionId: sel, selectedOptionIds: [], freeformValue: null, summary: sel };
}

export interface ActiveDecisionResult {
  status: "NO_ACTIVE_DECISION" | "ACTIVE_DECISION" | "BLOCKED_MULTIPLE_DECISIONS";
  decision?: Decision;
  decisions?: Decision[];
}

export interface DecisionResponseResult {
  status: ResponseStatus;
  decisionId: string;
  response?: DecisionResponse;
}

export interface LockView extends ChangeLock {
  stale: boolean;
  staleReason?: string;
}

/** Order-insensitive equality of two string id lists (as sets). */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const v of b) if (!sa.has(v)) return false;
  return true;
}

/** Read a decision's durable resume hint (nextStep) stashed at creation, if any. */
function resumeHintNextStep(decision: Decision): string | null {
  const hints = (decision.metadata as Record<string, unknown> | undefined)?.["resumeHints"];
  if (hints && typeof hints === "object") {
    const ns = (hints as Record<string, unknown>)["nextStep"];
    if (typeof ns === "string" && ns.length > 0) return ns;
  }
  return null;
}

export class InteractionRuntime {
  readonly paths: PathResolver;
  readonly store: InteractionStore;
  private readonly clock: Clock;
  private readonly ids: IdFactory;
  /** Re-entrancy depth for the cross-process write lock (0 = not held). */
  private lockDepth = 0;

  constructor(options: RuntimeOptions) {
    this.paths = new PathResolver(options.root, options.schemaDir);
    this.store = new InteractionStore(this.paths, options.validate ?? true);
    this.clock = options.clock ?? systemClock;
    this.ids = options.idFactory ?? createIdFactory(this.clock);
    // Best-effort GC of temp files orphaned by a hard-killed prior process. Age
    // threshold (default 30s) protects any in-flight atomic write (EA-X4).
    try {
      sweepStaleTempFiles(this.paths.root);
    } catch {
      /* never let cleanup break construction */
    }
  }

  private iso(): string {
    return this.clock.now().toISOString();
  }

  /**
   * Run `fn` while holding the store-wide write lock, serialising mutations
   * across processes. Re-entrant within a single runtime instance (nested
   * mutating calls, e.g. beginCommand -> reconcile, do not re-acquire).
   */
  private withLock<T>(fn: () => T): T {
    if (this.lockDepth > 0) {
      this.lockDepth++;
      try {
        return fn();
      } finally {
        this.lockDepth--;
      }
    }
    return withFileLock(nodePath.join(this.paths.root, ".runtime.lock"), () => {
      this.lockDepth = 1;
      try {
        return fn();
      } finally {
        this.lockDepth = 0;
      }
    });
  }

  private audit(event: {
    eventType: AuditEventType;
    message: string;
    commandRunId?: string | null;
    decisionId?: string | null;
    changeId?: string | null;
    actor?: string | null;
    source?: AuditSource;
    data?: Record<string, unknown>;
  }): void {
    const full: AuditEvent = {
      schemaVersion: 1,
      eventId: this.ids.eventId(),
      eventType: event.eventType,
      commandRunId: event.commandRunId ?? null,
      decisionId: event.decisionId ?? null,
      changeId: event.changeId ?? null,
      timestamp: this.iso(),
      actor: event.actor ?? null,
      source: event.source ?? "chaos-command",
      message: event.message,
      data: event.data ?? {},
    };
    this.store.audit.append(full);
  }

  // ---------------------------------------------------------------------------
  // 1. beginCommand
  // ---------------------------------------------------------------------------
  beginCommand(input: BeginCommandInput): BeginResult {
    return this.withLock(() => this.beginCommandImpl(input));
  }

  private beginCommandImpl(input: BeginCommandInput): BeginResult {
    const now = this.iso();
    // Self-heal any partial/raced state before evaluating re-entry, resumability,
    // or locks, so a crash-interrupted prior run is continued, not stranded.
    this.reconcile(now);
    const changeId = input.changeId ?? null;
    const adapter: Adapter = input.adapter ?? "unknown";

    // Re-entry with an explicit, existing commandRunId.
    if (input.commandRunId) {
      const existing = this.store.sessions.read(input.commandRunId);
      if (existing && !isTerminalSessionState(existing.state)) {
        this.store.sessions.write({ ...existing, lastSeenAt: now });
        if (existing.state === "waiting-for-decision") {
          const decisionId = existing.activeDecisionIds[0] ?? null;
          return this.begin(
            "BLOCKED_BY_PENDING_DECISION",
            true,
            existing,
            `Session ${existing.commandRunId} is waiting for a pending decision.`,
            { decisionId, uiAction: "focus-existing-decision" },
          );
        }
        if (existing.state === "ready-to-resume") {
          return this.begin(
            "RESUME_AVAILABLE",
            false,
            existing,
            `Session ${existing.commandRunId} is ready to resume.`,
            { resumeCapsulePath: existing.resumeCapsulePath },
          );
        }
        return this.begin("READY", false, existing, `Continuing session ${existing.commandRunId}.`);
      }
    }

    // New command: evaluate same-change lock.
    const lock = findActiveLockForChange(this.store.locks.activeLocks(), changeId);
    if (lock) {
      const evaluation = evaluateLock(lock, input.sourceCommand, input.commandRunId);
      if (!evaluation.allowed) {
        const decisionId = lock.blockingDecisionIds[0] ?? null;
        if (evaluation.isCompatible) {
          // Same command re-invoked for the same change while a decision pends.
          return {
            status: "BLOCKED_BY_PENDING_DECISION",
            mustStop: true,
            commandRunId: lock.lockedByCommandRunId,
            changeId,
            decisionId,
            conflictingCommandRunId: lock.lockedByCommandRunId,
            uiAction: "focus-existing-decision",
            message: `A pending decision already exists for change "${changeId}". Answer it in the Decision Center.`,
            warnings: [],
            errors: [],
          };
        }
        return {
          status: "CONFLICTING_COMMAND_ACTIVE",
          mustStop: true,
          commandRunId: null,
          changeId,
          decisionId,
          conflictingCommandRunId: lock.lockedByCommandRunId,
          uiAction: "inspect-or-cancel-conflicting-session",
          message: `Command "${input.sourceCommand}" is blocked: change "${changeId}" is locked by ${lock.lockedByCommand} (${lock.lockedByCommandRunId}).`,
          warnings: [],
          errors: [],
        };
      }
      // Compatible/owner command: allowed to proceed (no new lock acquired).
    } else {
      // No lock: a ready-to-resume session for the same command/change is resumable.
      const resumable = this.store.sessions
        .list()
        .find(
          (s) =>
            s.state === "ready-to-resume" &&
            s.changeId === changeId &&
            normalizeCommand(s.sourceCommand) === normalizeCommand(input.sourceCommand),
        );
      if (resumable) {
        return this.begin(
          "RESUME_AVAILABLE",
          false,
          resumable,
          `A ready-to-resume ${input.sourceCommand} session exists for change "${changeId}".`,
          { resumeCapsulePath: resumable.resumeCapsulePath },
        );
      }
    }

    // Create a fresh running session.
    const commandRunId = input.commandRunId ?? this.ids.runId(input.sourceCommand, changeId);
    let session = buildSession({
      commandRunId,
      sourceCommand: input.sourceCommand,
      changeId,
      adapter,
      requestedMode: input.requestedMode ?? null,
      now,
      metadata: input.metadata,
    });
    session = transitionSession(session, "running", now);
    this.store.sessions.write(session);
    this.audit({
      eventType: "session-created",
      message: `Session created for ${input.sourceCommand}.`,
      commandRunId,
      changeId,
      data: { adapter, requestedMode: input.requestedMode ?? null },
    });
    this.audit({
      eventType: "command-started",
      message: `Command ${input.sourceCommand} started.`,
      commandRunId,
      changeId,
    });
    this.store.refreshDerived(now);
    return this.begin("READY", false, session, `Command ${input.sourceCommand} is ready.`);
  }

  private begin(
    status: BeginStatus,
    mustStop: boolean,
    session: CommandSession,
    message: string,
    extra: Partial<BeginResult> = {},
  ): BeginResult {
    return {
      status,
      mustStop,
      commandRunId: session.commandRunId,
      changeId: session.changeId,
      message,
      warnings: [],
      errors: [],
      ...extra,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. createDecision
  // ---------------------------------------------------------------------------
  createDecision(args: CreateDecisionArgs): CreateDecisionResult {
    return this.withLock(() => this.createDecisionImpl(args));
  }

  private createDecisionImpl(args: CreateDecisionArgs): CreateDecisionResult {
    const now = this.iso();
    const session = this.store.sessions.read(args.commandRunId);
    if (!session) throw new NotFoundError("session", args.commandRunId);
    if (isTerminalSessionState(session.state)) {
      throw new RuntimeError(
        "SESSION_TERMINAL",
        `Cannot create a decision on a ${session.state} session.`,
      );
    }
    const changeId = args.changeId ?? session.changeId;
    const sourceCommand = args.sourceCommand ?? session.sourceCommand;

    // Idempotency: reuse an existing unresolved decision with the same purpose.
    const existing = this.store.decisions
      .list()
      .find(
        (d) =>
          d.commandRunId === args.commandRunId &&
          d.state === "waiting" &&
          d.title === args.title &&
          normalizeCommand(d.sourceCommand) === normalizeCommand(sourceCommand),
      );
    if (existing) {
      return {
        status: "PENDING_DECISION_EXISTS",
        mustStop: true,
        commandRunId: args.commandRunId,
        changeId,
        decisionId: existing.decisionId,
        message: `An equivalent pending decision already exists (${existing.decisionId}).`,
        warnings: ["Duplicate decision creation suppressed (idempotency)."],
        errors: [],
      };
    }

    const decisionInput: CreateDecisionInput = {
      decisionId: this.ids.decisionId(changeId, sourceCommand, args.title),
      commandRunId: args.commandRunId,
      changeId,
      sourceCommand,
      title: args.title,
      context: args.context,
      options: args.options,
      interactionType: args.interactionType,
      recommendation: args.recommendation ?? null,
      recommendedOptionId: args.recommendedOptionId ?? null,
      requiresRationale: args.requiresRationale ?? false,
      independent: args.independent ?? false,
      expiresAt: args.expiresAt ?? null,
      createdBy: args.createdBy ?? sourceCommand,
      // Stash the resume hints durably ON the decision (which is written first and
      // atomically), so a crash before the session write can still recover the
      // correct nextStep/lastCompletedStep during reconcile. Schema allows
      // additional metadata properties, so this needs no schema change.
      metadata: {
        ...(args.metadata ?? {}),
        resumeHints: {
          nextStep: args.nextStep ?? null,
          lastCompletedStep: args.lastCompletedStep ?? null,
        },
      },
      now,
    };
    // buildDecision validates the payload (duplicate/invalid option ids, etc.).
    const decision = buildDecision(decisionInput);
    this.store.decisions.writeDecision(decision);

    // Acquire/extend the change lock (only for change-scoped decisions).
    let lockId: string | undefined;
    if (changeId) {
      const file = this.store.locks.read();
      let lock = file.locks.find(
        (l) => l.state === "active" && l.changeId === changeId && l.lockedByCommandRunId === args.commandRunId,
      );
      if (lock) {
        lock.blockingDecisionIds = addUnique(lock.blockingDecisionIds, decision.decisionId);
        lock.reason = "waiting-for-user-decision";
        lockId = lock.lockId;
      } else {
        lock = buildLock({
          lockId: this.ids.lockId(changeId),
          changeId,
          lockedByCommandRunId: args.commandRunId,
          lockedByCommand: sourceCommand,
          reason: "waiting-for-user-decision",
          blockingDecisionIds: [decision.decisionId],
          now,
        });
        file.locks.push(lock);
        lockId = lock.lockId;
      }
      file.updatedAt = now;
      this.store.locks.write(file);
      this.audit({
        eventType: "lock-acquired",
        message: `Lock acquired for change "${changeId}".`,
        commandRunId: args.commandRunId,
        decisionId: decision.decisionId,
        changeId,
        data: { lockId },
      });
    }

    // Update the session: waiting-for-decision.
    let updated = transitionSession(session, "waiting-for-decision", now);
    updated = {
      ...updated,
      activeDecisionIds: addUnique(updated.activeDecisionIds, decision.decisionId),
      lockIds: lockId ? addUnique(updated.lockIds, lockId) : updated.lockIds,
      lastCompletedStep: args.lastCompletedStep ?? updated.lastCompletedStep,
      nextStep: args.nextStep ?? updated.nextStep,
    };
    this.store.sessions.write(updated);

    this.audit({
      eventType: "decision-created",
      message: `Decision created: ${args.title}`,
      commandRunId: args.commandRunId,
      decisionId: decision.decisionId,
      changeId,
      data: { optionIds: decision.options.map((o) => o.id) },
    });

    this.store.refreshDerived(now);

    return {
      status: "WAITING_FOR_USER_DECISION",
      mustStop: true,
      commandRunId: args.commandRunId,
      changeId,
      decisionId: decision.decisionId,
      message: `Waiting for user decision: ${args.title}`,
      warnings: [],
      errors: [],
    };
  }

  // ---------------------------------------------------------------------------
  // 3. answerDecision
  // ---------------------------------------------------------------------------
  answerDecision(args: AnswerDecisionArgs): AnswerResult {
    return this.withLock(() => this.answerDecisionImpl(args));
  }

  private answerDecisionImpl(args: AnswerDecisionArgs): AnswerResult {
    const now = this.iso();
    const decision = this.store.decisions.readDecision(args.decisionId);
    if (!decision) throw new NotFoundError("decision", args.decisionId);

    if (decision.state !== "waiting") {
      throw new RuntimeError(
        "DECISION_NOT_ANSWERABLE",
        `Decision ${args.decisionId} is ${decision.state}, not waiting.`,
      );
    }
    const answer = resolveDecisionAnswer(decision, args);
    if (decision.requiresRationale && !(args.rationale && args.rationale.trim().length > 0)) {
      throw new InvalidDecisionPayloadError(
        `Decision ${args.decisionId} requires a non-empty rationale.`,
      );
    }

    const response: DecisionResponse = {
      schemaVersion: 1,
      decisionId: decision.decisionId,
      commandRunId: decision.commandRunId,
      selectedOptionId: answer.selectedOptionId,
      selectedOptionIds: answer.selectedOptionIds,
      freeformValue: answer.freeformValue,
      rationale: args.rationale ?? null,
      selectedBy: args.selectedBy,
      selectedAt: now,
      source: normalizeResponseSource(args.source),
      validatesAgainstDecisionHash: null,
      metadata: args.metadata ?? {},
    };
    this.store.decisions.writeResponse(response);
    this.store.decisions.writeDecision(transitionDecision(decision, "answered"));

    this.audit({
      eventType: "decision-answered",
      message: `Decision answered: ${answer.summary}`,
      commandRunId: decision.commandRunId,
      decisionId: decision.decisionId,
      changeId: decision.changeId,
      actor: args.selectedBy,
      source: "vscode-decision-center",
      data: {
        selectedOptionId: answer.selectedOptionId,
        selectedOptionIds: answer.selectedOptionIds,
        freeform: answer.freeformValue !== null,
      },
    });

    // Update the session.
    const session = this.store.sessions.read(decision.commandRunId);
    let sessionState: CommandSession["state"] = session?.state ?? "waiting-for-decision";
    let resumeCapsulePath: string | null = session?.resumeCapsulePath ?? null;

    if (session) {
      let updated: CommandSession = {
        ...session,
        activeDecisionIds: removeValue(session.activeDecisionIds, decision.decisionId),
        answeredDecisionIds: addUnique(session.answeredDecisionIds, decision.decisionId),
        lastSeenAt: now,
      };

      // All blocking decisions answered -> ready-to-resume (+ resume capsule).
      if (updated.activeDecisionIds.length === 0 && updated.state === "waiting-for-decision") {
        updated = transitionSession(updated, "ready-to-resume", now);
        const capsule = buildResumeCapsule(updated, now, {}, this.store.capsules.read(updated.commandRunId));
        this.store.capsules.write(capsule);
        resumeCapsulePath = this.paths.relative(this.paths.capsule(updated.commandRunId));
        updated = { ...updated, resumeCapsulePath };
        this.audit({
          eventType: "capsule-created",
          message: `Resume capsule created for ${updated.commandRunId}.`,
          commandRunId: updated.commandRunId,
          changeId: updated.changeId,
          data: { path: resumeCapsulePath },
        });

        // Downgrade lock reason to ready-to-resume (lock is NOT released).
        if (updated.changeId) {
          const file = this.store.locks.read();
          const lock = file.locks.find(
            (l) => l.state === "active" && l.lockedByCommandRunId === updated.commandRunId,
          );
          if (lock) {
            lock.reason = "ready-to-resume";
            file.updatedAt = now;
            this.store.locks.write(file);
          }
        }
      }

      this.store.sessions.write(updated);
      sessionState = updated.state;
    }

    this.store.refreshDerived(now);

    return {
      status: "ANSWERED",
      mustStop: false,
      commandRunId: decision.commandRunId,
      changeId: decision.changeId,
      decisionId: decision.decisionId,
      sessionState,
      resumeCapsulePath,
      message: `Decision ${decision.decisionId} answered (${answer.summary}).`,
      warnings: [],
      errors: [],
    };
  }

  // ---------------------------------------------------------------------------
  // 4. getActiveDecision
  // ---------------------------------------------------------------------------
  getActiveDecision(filter: { changeId?: string | null; commandRunId?: string } = {}): ActiveDecisionResult {
    this.reconcile(); // surface decisions stranded by a partial createDecision (no-op if healthy)
    let pending = this.store.decisions.list().filter((d) => d.state === "waiting");
    if (filter.commandRunId) pending = pending.filter((d) => d.commandRunId === filter.commandRunId);
    if (filter.changeId !== undefined && filter.changeId !== null) {
      pending = pending.filter((d) => d.changeId === filter.changeId);
    }
    if (pending.length === 0) return { status: "NO_ACTIVE_DECISION" };
    if (pending.length === 1) return { status: "ACTIVE_DECISION", decision: pending[0] };
    return { status: "BLOCKED_MULTIPLE_DECISIONS", decisions: pending };
  }

  // ---------------------------------------------------------------------------
  // 5. getDecisionResponse
  // ---------------------------------------------------------------------------
  getDecisionResponse(decisionId: string): DecisionResponseResult {
    const decision = this.store.decisions.readDecision(decisionId);
    if (!decision) throw new NotFoundError("decision", decisionId);
    const map: Record<Decision["state"], ResponseStatus> = {
      created: "NO_RESPONSE_YET",
      waiting: "NO_RESPONSE_YET",
      answered: "ANSWERED",
      consumed: "CONSUMED",
      cancelled: "CANCELLED",
      expired: "EXPIRED",
      superseded: "SUPERSEDED",
    };
    const status = map[decision.state];
    const response = this.store.decisions.readResponse(decisionId);
    return response ? { status, decisionId, response } : { status, decisionId };
  }

  // ---------------------------------------------------------------------------
  // 6. markDecisionConsumed
  // ---------------------------------------------------------------------------
  markDecisionConsumed(decisionId: string): { status: "CONSUMED"; decisionId: string; commandRunId: string } {
    return this.withLock(() => this.markDecisionConsumedImpl(decisionId));
  }

  private markDecisionConsumedImpl(decisionId: string): { status: "CONSUMED"; decisionId: string; commandRunId: string } {
    const now = this.iso();
    const decision = this.store.decisions.readDecision(decisionId);
    if (!decision) throw new NotFoundError("decision", decisionId);
    // transitionDecision enforces answered -> consumed.
    this.store.decisions.writeDecision(transitionDecision(decision, "consumed"));

    const session = this.store.sessions.read(decision.commandRunId);
    if (session) {
      this.store.sessions.write({
        ...session,
        answeredDecisionIds: removeValue(session.answeredDecisionIds, decisionId),
        consumedDecisionIds: addUnique(session.consumedDecisionIds, decisionId),
        lastSeenAt: now,
      });
    }

    this.audit({
      eventType: "decision-consumed",
      message: `Decision consumed: ${decisionId}`,
      commandRunId: decision.commandRunId,
      decisionId,
      changeId: decision.changeId,
    });
    this.store.refreshDerived(now);
    return { status: "CONSUMED", decisionId, commandRunId: decision.commandRunId };
  }

  // ---------------------------------------------------------------------------
  // 7. completeCommand
  // ---------------------------------------------------------------------------
  completeCommand(commandRunId: string): { status: "COMPLETED"; commandRunId: string; releasedLockIds: string[] } {
    return this.withLock(() => this.completeCommandImpl(commandRunId));
  }

  private completeCommandImpl(commandRunId: string): { status: "COMPLETED"; commandRunId: string; releasedLockIds: string[] } {
    const now = this.iso();
    const session = this.store.sessions.read(commandRunId);
    if (!session) throw new NotFoundError("session", commandRunId);
    // transitionSession enforces valid source states (running/resumed/ready-to-resume).
    const completed = transitionSession(session, "completed", now);
    const releasedLockIds = this.releaseLocksForRun(commandRunId, now);
    this.store.sessions.write(completed);
    this.audit({
      eventType: "command-completed",
      message: `Command ${session.sourceCommand} completed.`,
      commandRunId,
      changeId: session.changeId,
      data: { releasedLockIds },
    });
    this.store.refreshDerived(now);
    return { status: "COMPLETED", commandRunId, releasedLockIds };
  }

  // ---------------------------------------------------------------------------
  // 8. cancelCommand
  // ---------------------------------------------------------------------------
  cancelCommand(
    commandRunId: string,
  ): { status: "CANCELLED"; commandRunId: string; releasedLockIds: string[]; cancelledDecisionIds: string[] } {
    return this.withLock(() => this.cancelCommandImpl(commandRunId));
  }

  private cancelCommandImpl(
    commandRunId: string,
  ): { status: "CANCELLED"; commandRunId: string; releasedLockIds: string[]; cancelledDecisionIds: string[] } {
    const now = this.iso();
    const session = this.store.sessions.read(commandRunId);
    if (!session) throw new NotFoundError("session", commandRunId);
    const cancelled = transitionSession(session, "cancelled", now);

    // Cancel this run's waiting decisions (artifacts are preserved, not deleted).
    const cancelledDecisionIds: string[] = [];
    for (const decision of this.store.decisions.list()) {
      if (decision.commandRunId === commandRunId && decision.state === "waiting") {
        this.store.decisions.writeDecision(transitionDecision(decision, "cancelled"));
        cancelledDecisionIds.push(decision.decisionId);
        this.audit({
          eventType: "decision-cancelled",
          message: `Decision cancelled by command cancellation.`,
          commandRunId,
          decisionId: decision.decisionId,
          changeId: decision.changeId,
        });
      }
    }

    const releasedLockIds = this.releaseLocksForRun(commandRunId, now);
    this.store.sessions.write(cancelled);
    this.audit({
      eventType: "command-cancelled",
      message: `Command ${session.sourceCommand} cancelled.`,
      commandRunId,
      changeId: session.changeId,
      data: { releasedLockIds, cancelledDecisionIds },
    });
    this.store.refreshDerived(now);
    return { status: "CANCELLED", commandRunId, releasedLockIds, cancelledDecisionIds };
  }

  private releaseLocksForRun(commandRunId: string, now: string): string[] {
    const file = this.store.locks.read();
    const released: string[] = [];
    for (const lock of file.locks) {
      if (lock.lockedByCommandRunId === commandRunId && lock.state === "active") {
        lock.state = "released";
        lock.releasedAt = now;
        released.push(lock.lockId);
      }
    }
    if (released.length > 0) {
      file.updatedAt = now;
      this.store.locks.write(file);
      for (const lockId of released) {
        this.audit({
          eventType: "lock-released",
          message: `Lock released.`,
          commandRunId,
          data: { lockId },
        });
      }
    }
    return released;
  }

  // ---------------------------------------------------------------------------
  // 9. listLocks
  // ---------------------------------------------------------------------------
  listLocks(): LockView[] {
    const file = this.store.locks.read();
    return file.locks.map((lock) => {
      let stale = false;
      let staleReason: string | undefined;
      if (lock.state === "active") {
        const session = this.store.sessions.read(lock.lockedByCommandRunId);
        if (!session) {
          stale = true;
          staleReason = "owning session no longer exists";
        } else if (isTerminalSessionState(session.state)) {
          stale = true;
          staleReason = `owning session is ${session.state}`;
        } else {
          const missing = lock.blockingDecisionIds.filter(
            (id) => !this.store.decisions.readDecision(id),
          );
          if (missing.length > 0) {
            stale = true;
            staleReason = `blocking decisions missing: ${missing.join(", ")}`;
          }
        }
      }
      return staleReason ? { ...lock, stale, staleReason } : { ...lock, stale };
    });
  }

  // ---------------------------------------------------------------------------
  // 10. createResumeCapsule
  // ---------------------------------------------------------------------------
  createResumeCapsule(
    commandRunId: string,
    overrides: CapsuleOverrides = {},
  ): { status: "CAPSULE_CREATED"; commandRunId: string; path: string; capsule: ResumeCapsule } {
    return this.withLock(() => this.createResumeCapsuleImpl(commandRunId, overrides));
  }

  private createResumeCapsuleImpl(
    commandRunId: string,
    overrides: CapsuleOverrides = {},
  ): { status: "CAPSULE_CREATED"; commandRunId: string; path: string; capsule: ResumeCapsule } {
    const now = this.iso();
    const session = this.store.sessions.read(commandRunId);
    if (!session) throw new NotFoundError("session", commandRunId);
    const existing = this.store.capsules.read(commandRunId);
    const capsule = buildResumeCapsule(session, now, overrides, existing);
    this.store.capsules.write(capsule);
    const relPath = this.paths.relative(this.paths.capsule(commandRunId));
    // Re-read the freshest session immediately before writing and patch only the
    // capsule-pointer fields, so a concurrent writer (e.g. the panel answering a
    // decision) does not have its session-state flip clobbered by this write
    // (EA-X4 F2 mitigation; combined with the global write lock + reconcile).
    const fresh = this.store.sessions.read(commandRunId) ?? session;
    this.store.sessions.write({ ...fresh, resumeCapsulePath: relPath, lastSeenAt: now });
    this.audit({
      eventType: "capsule-created",
      message: `Resume capsule created for ${commandRunId}.`,
      commandRunId,
      changeId: session.changeId,
      data: { path: relPath },
    });
    this.store.refreshDerived(now);
    return { status: "CAPSULE_CREATED", commandRunId, path: relPath, capsule };
  }

  // ---------------------------------------------------------------------------
  // 11. resumeCommand (added in Iteration 5 for the live auto-resume runner)
  // ---------------------------------------------------------------------------
  /**
   * Move a resumable session back into active execution:
   * `ready-to-resume -> resumed -> running`.
   *
   * This is the smallest compatible operation the live runner needs so an already
   * answered session can accept the next step (e.g. a follow-up decision) without
   * re-running `beginCommand`. It is idempotent when the session is already
   * `running`, and refuses non-resumable states. Locks and decisions are left
   * untouched; this only advances the session state machine.
   */
  resumeCommand(commandRunId: string): {
    status: "RESUMED";
    commandRunId: string;
    sessionState: CommandSession["state"];
  } {
    return this.withLock(() => this.resumeCommandImpl(commandRunId));
  }

  private resumeCommandImpl(commandRunId: string): {
    status: "RESUMED";
    commandRunId: string;
    sessionState: CommandSession["state"];
  } {
    const now = this.iso();
    const session = this.store.sessions.read(commandRunId);
    if (!session) throw new NotFoundError("session", commandRunId);
    if (session.state === "running" || session.state === "resumed") {
      // Already active; treat as idempotent and ensure we end at running.
      const updated =
        session.state === "resumed" ? transitionSession(session, "running", now) : session;
      if (updated !== session) this.store.sessions.write(updated);
      return { status: "RESUMED", commandRunId, sessionState: "running" };
    }
    if (session.state !== "ready-to-resume") {
      throw new RuntimeError(
        "SESSION_NOT_RESUMABLE",
        `Cannot resume a ${session.state} session (expected ready-to-resume).`,
      );
    }
    let updated = transitionSession(session, "resumed", now);
    updated = transitionSession(updated, "running", now);
    this.store.sessions.write(updated);
    this.audit({
      eventType: "auto-resume-started",
      message: `Session ${commandRunId} resumed to running.`,
      commandRunId,
      changeId: session.changeId,
    });
    this.store.refreshDerived(now);
    return { status: "RESUMED", commandRunId, sessionState: updated.state };
  }

  // ---------------------------------------------------------------------------
  // reconcile — self-heal partial/torn/raced state from the source of truth.
  // ---------------------------------------------------------------------------
  /**
   * Recompute each non-terminal session's decision buckets and lifecycle state
   * from the authoritative decision + response files, and rebuild the derived
   * pointers. This is the crash-consistency backstop for the runtime's
   * non-atomic multi-file mutations (EA-X4): it heals
   *   - F1: a decision was persisted but the session never flipped to
   *     `waiting-for-decision` (kill mid-`createDecision`) — the decision would
   *     otherwise be invisible to the resume path.
   *   - F2: a decision was answered/consumed but the session flip to
   *     `ready-to-resume` was lost (kill mid-`answerDecision`, or a concurrent
   *     panel+runner lost update) — the run would otherwise be frozen.
   *
   * Idempotent and a strict no-op when state is already consistent (so read-path
   * callers do not mutate a healthy store). Returns the runs it repaired.
   */
  reconcile(nowArg?: string): { repaired: string[] } {
    return this.withLock(() => this.reconcileImpl(nowArg));
  }

  private reconcileImpl(nowArg?: string): { repaired: string[] } {
    // Lazily materialise a timestamp only when a repair actually writes, so a
    // no-op reconcile on a healthy store has zero side effects (no clock tick).
    let cachedNow = nowArg;
    const now = (): string => (cachedNow ??= this.iso());
    const repaired: string[] = [];
    const allDecisions = this.store.decisions.list();

    for (const session of this.store.sessions.list()) {
      if (isTerminalSessionState(session.state)) continue;
      const decisions = allDecisions.filter((d) => d.commandRunId === session.commandRunId);
      if (decisions.length === 0) continue;

      const waiting = decisions.filter((d) => d.state === "waiting").map((d) => d.decisionId);
      const answered = decisions.filter((d) => d.state === "answered").map((d) => d.decisionId);
      const consumed = decisions.filter((d) => d.state === "consumed").map((d) => d.decisionId);

      let updated: CommandSession = { ...session };
      let changed = false;

      // Rebuild the id buckets from decision truth (order-insensitive).
      if (!sameSet(updated.activeDecisionIds, waiting)) { updated = { ...updated, activeDecisionIds: [...waiting] }; changed = true; }
      if (!sameSet(updated.answeredDecisionIds, answered)) { updated = { ...updated, answeredDecisionIds: [...answered] }; changed = true; }
      if (!sameSet(updated.consumedDecisionIds, consumed)) { updated = { ...updated, consumedDecisionIds: [...consumed] }; changed = true; }

      // Recover a lost nextStep from a decision's durable resume hint.
      if (!updated.nextStep) {
        const hinted = decisions.map((d) => resumeHintNextStep(d)).find((s): s is string => !!s);
        if (hinted) { updated = { ...updated, nextStep: hinted }; changed = true; }
      }

      // Repair lifecycle state to match the decisions.
      let flippedToReady = false;
      if (waiting.length > 0) {
        // An unanswered decision exists -> the session must be waiting-for-decision.
        if (updated.state !== "waiting-for-decision" && canTransitionSession(updated.state, "waiting-for-decision")) {
          updated = transitionSession(updated, "waiting-for-decision", now());
          changed = true;
        }
      } else if (answered.length > 0 && updated.state === "waiting-for-decision") {
        // All blocking decisions answered but the flip was lost -> ready-to-resume.
        updated = transitionSession(updated, "ready-to-resume", now());
        changed = true;
        flippedToReady = true;
      }

      if (!changed) continue;
      updated = { ...updated, lastSeenAt: now() };

      if (flippedToReady) {
        const capsule = buildResumeCapsule(updated, now(), {}, this.store.capsules.read(updated.commandRunId));
        this.store.capsules.write(capsule);
        updated = { ...updated, resumeCapsulePath: this.paths.relative(this.paths.capsule(updated.commandRunId)) };
        if (updated.changeId) {
          const file = this.store.locks.read();
          const lock = file.locks.find(
            (l) => l.state === "active" && l.lockedByCommandRunId === updated.commandRunId,
          );
          if (lock) { lock.reason = "ready-to-resume"; file.updatedAt = now(); this.store.locks.write(file); }
        }
        this.audit({
          eventType: "capsule-created",
          message: `Resume capsule rebuilt during reconcile for ${updated.commandRunId}.`,
          commandRunId: updated.commandRunId,
          changeId: updated.changeId,
          data: { path: updated.resumeCapsulePath, reconciled: true },
        });
      }

      this.store.sessions.write(updated);
      this.audit({
        eventType: "runtime-warning",
        message: `Reconciled inconsistent session ${updated.commandRunId}: ${session.state} -> ${updated.state}.`,
        commandRunId: updated.commandRunId,
        changeId: updated.changeId,
        data: { fromState: session.state, toState: updated.state },
      });
      repaired.push(updated.commandRunId);
    }

    if (repaired.length > 0) this.store.refreshDerived(now());
    return { repaired };
  }

  // ---------------------------------------------------------------------------
  // Resume capsule discovery (read-only; added in Iteration 4).
  // ---------------------------------------------------------------------------

  /** Full resume capsule for a run, or null. */
  getResumeCapsule(commandRunId: string): ResumeCapsule | null {
    return this.store.capsules.read(commandRunId) ?? null;
  }

  /**
   * Verify a resume capsule's integrity against its stored `metadata.contentHash`
   * (EA-I09). Returns `"valid"`, `"tampered"` (hash present but mismatched), or
   * `"missing"` (no hash / no capsule).
   */
  verifyResumeCapsule(commandRunId: string): "valid" | "tampered" | "missing" {
    const capsule = this.store.capsules.read(commandRunId);
    if (!capsule) return "missing";
    const stored = (capsule.metadata as Record<string, unknown> | undefined)?.["contentHash"];
    if (typeof stored !== "string" || stored.length === 0) return "missing";
    return verifyCapsuleIntegrity(capsule) ? "valid" : "tampered";
  }

  /** Compact summaries of all capsules matching the filter. Read-only. */
  listCapsules(filter: ListCapsulesFilter = {}): ResumeCapsuleSummary[] {
    const sessionState = new Map(
      this.store.sessions.list().map((s) => [s.commandRunId, s.state] as const),
    );
    let summaries = this.store.capsules.list().map((c) => this.toCapsuleSummary(c));

    if (filter.commandRunId) summaries = summaries.filter((s) => s.commandRunId === filter.commandRunId);
    if (filter.changeId) summaries = summaries.filter((s) => s.changeId === filter.changeId);
    if (filter.sourceCommand) {
      const target = normalizeCommand(filter.sourceCommand);
      summaries = summaries.filter((s) => normalizeCommand(s.sourceCommand) === target);
    }
    if (filter.state) summaries = summaries.filter((s) => s.state === filter.state);
    if (filter.readyToResumeOnly) {
      summaries = summaries.filter((s) => sessionState.get(s.commandRunId) === "ready-to-resume");
    }
    return summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  /**
   * Ready-to-resume sessions joined with their capsules (if any). With
   * `latest: true`, collapses to the single most-recently-seen candidate.
   */
  findResumeCandidates(filter: FindResumeCandidatesFilter = {}): ResumeCandidate[] {
    this.reconcile(); // heal answered-but-not-flipped runs so they appear as candidates (no-op if healthy)
    const capsulesByRun = new Map(this.store.capsules.list().map((c) => [c.commandRunId, c] as const));
    let sessions = this.store.sessions.list().filter((s) => s.state === "ready-to-resume");

    if (filter.commandRunId) sessions = sessions.filter((s) => s.commandRunId === filter.commandRunId);
    if (filter.changeId) sessions = sessions.filter((s) => s.changeId === filter.changeId);
    if (filter.sourceCommand) {
      const target = normalizeCommand(filter.sourceCommand);
      sessions = sessions.filter((s) => normalizeCommand(s.sourceCommand) === target);
    }

    const candidates: ResumeCandidate[] = sessions
      .map((s) => {
        const capsule = capsulesByRun.get(s.commandRunId);
        return {
          commandRunId: s.commandRunId,
          sourceCommand: s.sourceCommand,
          changeId: s.changeId,
          sessionState: s.state,
          nextStep: capsule?.nextStep ?? s.nextStep,
          capsulePath: capsule
            ? this.paths.relative(this.paths.capsule(s.commandRunId))
            : s.resumeCapsulePath,
          hasCapsule: capsule !== undefined,
          answeredDecisionIds: [...s.answeredDecisionIds],
          updatedAt: s.lastSeenAt,
        };
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    return filter.latest ? candidates.slice(0, 1) : candidates;
  }

  private toCapsuleSummary(c: ResumeCapsule): ResumeCapsuleSummary {
    return {
      commandRunId: c.commandRunId,
      sourceCommand: c.sourceCommand,
      changeId: c.changeId,
      state: c.state,
      lastCompletedStep: c.lastCompletedStep,
      nextStep: c.nextStep,
      answeredDecisionIds: [...c.answeredDecisionIds],
      consumedDecisionIds: [...c.consumedDecisionIds],
      requiredArtifacts: [...c.requiredArtifacts],
      confidence: c.confidence,
      updatedAt: c.updatedAt,
      capsulePath: this.paths.relative(this.paths.capsule(c.commandRunId)),
    };
  }

  // Convenience read-through accessors.
  getSession(commandRunId: string): CommandSession | undefined {
    return this.store.sessions.read(commandRunId);
  }
  getDecision(decisionId: string): Decision | undefined {
    return this.store.decisions.readDecision(decisionId);
  }
  get absoluteRoot(): string {
    return path.resolve(this.paths.root);
  }
}
