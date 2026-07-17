/**
 * Pure projection/view-model builder for the Decision Center.
 *
 * Takes raw runtime artifacts (already read from disk by the RuntimeClient) plus
 * some environment flags and produces a compact, serialisable view model. No
 * filesystem and no vscode dependency, so it is fully unit-testable.
 */

import type {
  Decision,
  DecisionOption,
  DecisionResponse,
  InteractionType,
  CommandSession,
  ResumeCapsule,
  ActiveState,
  LockView,
} from "../runtime.ts";

export interface OptionVM {
  id: string;
  label: string;
  description: string | null;
  consequence: string | null;
  risk: string | null;
  recommended: boolean;
}

export interface ExpiryVM {
  expiresAt: string;
  expired: boolean;
  /** ms until expiry at render time (negative once expired). */
  remainingMs: number;
  /** e.g. "expires in 2h 15m" / "expired 5m ago". */
  label: string;
}

export interface DecisionVM {
  decisionId: string;
  commandRunId: string;
  changeId: string | null;
  sourceCommand: string;
  interactionType: InteractionType;
  title: string;
  context: string;
  options: OptionVM[];
  recommendedOptionId: string | null;
  requiresRationale: boolean;
  createdAt: string;
  expiresAt: string | null;
  /** Non-null when the decision declares an expiry (for countdown / expired flag). */
  expiry: ExpiryVM | null;
  decisionPath: string;
}

export interface ResumeInstruction {
  commandRunId: string;
  changeId: string | null;
  capsulePath: string | null;
  /** Planned Iteration 4 resume commands (labelled as not-yet-available). */
  commands: string[];
  planNote: string;
  manualFallback: string;
}

export interface ReadyVM {
  commandRunId: string;
  sourceCommand: string;
  changeId: string | null;
  nextStep: string | null;
  capsulePath: string | null;
  resume: ResumeInstruction;
}

/** The recorded human answer, resolved for display in History. */
export interface AnswerSummaryVM {
  selectedBy: string;
  selectedAt: string;
  /** Labels of the chosen option(s) (single or multi), resolved from the decision. */
  selectedLabels: string[];
  freeformValue: string | null;
  rationale: string | null;
}

export interface HistoryVM {
  decisionId: string;
  title: string;
  state: string;
  changeId: string | null;
  sourceCommand: string;
  interactionType: InteractionType;
  createdAt: string;
  /** Who/when/what was answered — null for cancelled/expired with no response. */
  answer: AnswerSummaryVM | null;
}

export type HealthLevel = "error" | "warning";

export interface HealthWarning {
  level: HealthLevel;
  code: string;
  message: string;
}

/** A single decision as it appears inside a change group (compact). */
export interface ChangeDecisionVM {
  decisionId: string;
  title: string;
  sourceCommand: string;
  state: string;
  isPending: boolean;
  createdAt: string;
}

/** All decisions that belong to one change (or the no-change bucket). */
export interface ChangeGroupVM {
  /** Stable id used for routing. `changeId` when present, otherwise the sentinel. */
  key: string;
  changeId: string | null;
  label: string;
  pendingCount: number;
  totalCount: number;
  /** Distinct source commands seen in this change, most-relevant first. */
  sourceCommands: string[];
  latestAt: string;
  decisions: ChangeDecisionVM[];
}

/** Sentinel routing key for decisions with no change id. */
export const NO_CHANGE_KEY = "__no-change__";

export type StatusState = "ready" | "pending" | "multiple" | "unavailable";

export interface StatusVM {
  state: StatusState;
  pendingCount: number;
  text: string;
}

export interface Projection {
  status: StatusVM;
  /** The single featured decision (runtime pointer, else the latest pending). */
  activeDecision: DecisionVM | null;
  /** Remaining pending decisions (everything except the featured one). */
  queue: DecisionVM[];
  /** All pending decisions in full detail, featured first (activeDecision + queue). */
  pending: DecisionVM[];
  /** Every decision grouped by change, pending-heavy changes first. */
  changeGroups: ChangeGroupVM[];
  readyToResume: ReadyVM[];
  history: HistoryVM[];
  health: HealthWarning[];
  generatedAt: string;
}

export interface ProjectionInput {
  active: ActiveState | null;
  decisions: Decision[];
  sessions: CommandSession[];
  capsules: ResumeCapsule[];
  locks: LockView[];
  /** Absolute path of the interaction root that was checked (for diagnostics). */
  rootPath: string;
  rootExists: boolean;
  schemaDirExists: boolean;
  malformedFiles: string[];
  maxHistoryItems: number;
  now: string;
  /** Relative-path builder (RuntimeClient injects the runtime's path resolver). */
  decisionRelPath: (decisionId: string) => string;
  capsuleRelPath: (commandRunId: string) => string;
  /** Resolve a decision's recorded response (for audit-rich history). */
  responseFor: (decisionId: string) => DecisionResponse | null;
}

const TERMINAL_DECISION_STATES = new Set(["answered", "consumed", "cancelled", "expired", "superseded"]);

function optionVM(o: DecisionOption, recommendedOptionId: string | null): OptionVM {
  return {
    id: o.id,
    label: o.label,
    description: o.description ?? null,
    consequence: o.consequence ?? null,
    risk: o.risk ?? null,
    recommended: o.recommended === true || o.id === recommendedOptionId,
  };
}

/** Human-readable coarse duration: "3d 2h", "2h 15m", "5m", "45s". */
export function humanizeDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** Compute the expiry view for a decision, relative to `now`. */
export function computeExpiry(expiresAt: string, now: string): ExpiryVM {
  const remainingMs = Date.parse(expiresAt) - Date.parse(now);
  if (Number.isNaN(remainingMs)) {
    return { expiresAt, expired: false, remainingMs: 0, label: "" };
  }
  const expired = remainingMs <= 0;
  return {
    expiresAt,
    expired,
    remainingMs,
    label: expired
      ? `expired ${humanizeDuration(remainingMs)} ago`
      : `expires in ${humanizeDuration(remainingMs)}`,
  };
}

export function toDecisionVM(
  d: Decision,
  decisionRelPath: (id: string) => string,
  now: string,
): DecisionVM {
  return {
    decisionId: d.decisionId,
    commandRunId: d.commandRunId,
    changeId: d.changeId,
    sourceCommand: d.sourceCommand,
    interactionType: d.interactionType,
    title: d.title,
    context: d.context,
    options: d.options.map((o) => optionVM(o, d.recommendedOptionId)),
    recommendedOptionId: d.recommendedOptionId,
    requiresRationale: d.requiresRationale,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt,
    expiry: d.expiresAt ? computeExpiry(d.expiresAt, now) : null,
    decisionPath: decisionRelPath(d.decisionId),
  };
}

/** Resolve the answer summary (with option labels) for a terminal decision. */
function toAnswerSummary(d: Decision, response: DecisionResponse | null): AnswerSummaryVM | null {
  if (!response) return null;
  const labelFor = (id: string): string => d.options.find((o) => o.id === id)?.label ?? id;
  const ids =
    response.selectedOptionIds && response.selectedOptionIds.length > 0
      ? response.selectedOptionIds
      : response.selectedOptionId
        ? [response.selectedOptionId]
        : [];
  return {
    selectedBy: response.selectedBy,
    selectedAt: response.selectedAt,
    selectedLabels: ids.map(labelFor),
    freeformValue: response.freeformValue ?? null,
    rationale: response.rationale ?? null,
  };
}

export function buildResumeInstruction(
  session: CommandSession,
  capsulePath: string | null,
): ResumeInstruction {
  const commands: string[] = [`chaos:resume --run ${session.commandRunId}`];
  if (session.changeId) commands.push(`chaos:resume --change ${session.changeId}`);
  commands.push("chaos:resume --latest");
  return {
    commandRunId: session.commandRunId,
    changeId: session.changeId,
    capsulePath,
    commands,
    planNote: "Planned Iteration 4 resume command (chaos:resume is not implemented yet).",
    manualFallback: capsulePath
      ? `Until chaos:resume exists, continue manually by asking Claude to resume from capsule: ${capsulePath}`
      : "Until chaos:resume exists, continue manually by asking Claude to resume this session.",
  };
}

/**
 * Return a projection with the given pending decision promoted to active (used
 * when the user selects a queued decision to inspect). Pure; no-op if the id is
 * not a queued pending decision.
 */
export function withActiveDecision(projection: Projection, decisionId: string): Projection {
  const inQueue = projection.queue.find((d) => d.decisionId === decisionId);
  if (!inQueue) return projection;
  const queue = projection.queue.filter((d) => d.decisionId !== decisionId);
  if (projection.activeDecision) queue.unshift(projection.activeDecision);
  return { ...projection, activeDecision: inQueue, queue };
}

export function statusBarText(state: StatusState, pendingCount: number): string {
  switch (state) {
    case "unavailable":
      return "CHAOS: runtime unavailable";
    case "ready":
      return "CHAOS: Ready";
    case "pending":
      return "CHAOS: 1 decision pending";
    case "multiple":
      return `CHAOS: ${pendingCount} decisions pending`;
  }
}

function buildStatus(pendingCount: number, unavailable: boolean): StatusVM {
  let state: StatusState;
  if (unavailable) state = "unavailable";
  else if (pendingCount === 0) state = "ready";
  else if (pendingCount === 1) state = "pending";
  else state = "multiple";
  return { state, pendingCount, text: statusBarText(state, pendingCount) };
}

export function buildProjection(input: ProjectionInput): Projection {
  const health: HealthWarning[] = [];
  const unavailable = !input.rootExists;

  if (!input.rootExists) {
    health.push({
      level: "error",
      code: "RUNTIME_ROOT_MISSING",
      message:
        `Interaction runtime root not found at "${input.rootPath}". ` +
        "Open the repository that contains .chaos/interactions as the workspace folder, " +
        "or set chaosDecisionCenter.interactionsRoot to its path.",
    });
  }
  if (input.rootExists && !input.schemaDirExists) {
    health.push({
      level: "warning",
      code: "SCHEMA_DIR_MISSING",
      message: "Schema directory not found. Responses will be written without schema validation.",
    });
  }
  for (const file of input.malformedFiles) {
    health.push({
      level: "warning",
      code: "MALFORMED_STATE",
      message: `Malformed runtime file skipped: ${file}. Run chaos:doctor.`,
    });
  }
  for (const lock of input.locks) {
    if (lock.stale) {
      health.push({
        level: "warning",
        code: "STALE_LOCK",
        message: `Stale lock ${lock.lockId} on change ${lock.changeId}: ${lock.staleReason ?? "unknown"}.`,
      });
    }
  }

  const waiting = input.decisions.filter((d) => d.state === "waiting");

  // A pending decision past its expiry still holds a lock but is never terminalised
  // by the runtime. Surface it so it does not silently keep the change locked.
  for (const d of waiting) {
    if (d.expiresAt && Date.parse(d.expiresAt) <= Date.parse(input.now)) {
      health.push({
        level: "warning",
        code: "DECISION_EXPIRED",
        message:
          `Decision ${d.decisionId} ("${d.title}") is past its expiry but still pending and ` +
          "holding a lock. Answer it, or cancel its session to release the lock.",
      });
    }
  }

  const activeId = input.active?.activeDecisionId ?? null;

  // Feature the runtime's active pointer when set; otherwise the latest-created
  // pending decision — "something to submit right off the bat".
  const latest =
    waiting.length > 0
      ? waiting.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b))
      : undefined;
  const active = waiting.find((d) => d.decisionId === activeId) ?? latest;

  let activeDecision: DecisionVM | null = null;
  if (active) activeDecision = toDecisionVM(active, input.decisionRelPath, input.now);

  const queue = waiting
    .filter((d) => d.decisionId !== active?.decisionId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((d) => toDecisionVM(d, input.decisionRelPath, input.now));

  const pending = activeDecision ? [activeDecision, ...queue] : [];
  const changeGroups = buildChangeGroups(input.decisions);

  const capsuleByRun = new Map(input.capsules.map((c) => [c.commandRunId, c]));
  const readyToResume: ReadyVM[] = input.sessions
    .filter((s) => s.state === "ready-to-resume")
    .map((s) => {
      const hasCapsule = capsuleByRun.has(s.commandRunId);
      const capPath = hasCapsule ? input.capsuleRelPath(s.commandRunId) : s.resumeCapsulePath;
      return {
        commandRunId: s.commandRunId,
        sourceCommand: s.sourceCommand,
        changeId: s.changeId,
        nextStep: s.nextStep,
        capsulePath: capPath,
        resume: buildResumeInstruction(s, capPath),
      };
    });

  const history: HistoryVM[] = input.decisions
    .filter((d) => TERMINAL_DECISION_STATES.has(d.state))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, Math.max(0, input.maxHistoryItems))
    .map((d) => ({
      decisionId: d.decisionId,
      title: d.title,
      state: d.state,
      changeId: d.changeId,
      sourceCommand: d.sourceCommand,
      interactionType: d.interactionType,
      createdAt: d.createdAt,
      answer: toAnswerSummary(d, input.responseFor(d.decisionId)),
    }));

  return {
    status: buildStatus(waiting.length, unavailable),
    activeDecision,
    queue,
    pending,
    changeGroups,
    readyToResume,
    history,
    health,
    generatedAt: input.now,
  };
}

/**
 * Group every decision by change id. Changes with pending decisions sort first
 * (by pending count), then by most-recent activity. Within a group, pending
 * decisions come first, each list newest-first.
 */
export function buildChangeGroups(decisions: Decision[]): ChangeGroupVM[] {
  const byKey = new Map<string, Decision[]>();
  for (const d of decisions) {
    const key = d.changeId ?? NO_CHANGE_KEY;
    const bucket = byKey.get(key);
    if (bucket) bucket.push(d);
    else byKey.set(key, [d]);
  }

  const groups: ChangeGroupVM[] = [];
  for (const [key, bucket] of byKey) {
    const changeId = key === NO_CHANGE_KEY ? null : key;
    const sorted = [...bucket].sort((a, b) => {
      const ap = a.state === "waiting" ? 0 : 1;
      const bp = b.state === "waiting" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    const pendingCount = sorted.filter((d) => d.state === "waiting").length;
    const sourceCommands: string[] = [];
    for (const d of sorted) {
      if (!sourceCommands.includes(d.sourceCommand)) sourceCommands.push(d.sourceCommand);
    }
    const latestAt = sorted.reduce((acc, d) => (d.createdAt > acc ? d.createdAt : acc), "");
    groups.push({
      key,
      changeId,
      label: changeId ?? "(no change)",
      pendingCount,
      totalCount: sorted.length,
      sourceCommands,
      latestAt,
      decisions: sorted.map((d) => ({
        decisionId: d.decisionId,
        title: d.title,
        sourceCommand: d.sourceCommand,
        state: d.state,
        isPending: d.state === "waiting",
        createdAt: d.createdAt,
      })),
    });
  }

  return groups.sort((a, b) => {
    if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;
    return a.latestAt < b.latestAt ? 1 : -1;
  });
}
