/**
 * The runner control loop.
 *
 * Step-driven for deterministic testing: `tick()` advances exactly one step of
 * the runner state machine and reports whether the caller should wait (poll)
 * before the next tick. `ChaosRunner.run()` wraps this with real sleeps.
 *
 * Core principle: the interaction runtime is the source of truth. The loop never
 * invents state; it observes the runtime, forwards answered decisions into the
 * live agent when safe, and — on any uncertainty — leaves the session
 * `ready-to-resume` for `chaos:resume`.
 */

import type { Clock, Decision, DecisionResponse } from "../runtime.ts";
import type { Adapter } from "../runtime.ts";
import type { Logger } from "../logger.ts";
import type { RuntimeClient } from "../runtime/runtimeClient.ts";
import type { DecisionWatcher, DecisionObservation } from "../runtime/decisionWatcher.ts";
import type { SessionLeaseManager } from "../runtime/sessionLease.ts";
import type { ResumeCoordinator } from "../runtime/resumeCoordinator.ts";
import type { RunnerAudit } from "../audit/runnerAudit.ts";
import type { AgentSessionAdapter } from "./commandProcess.ts";
import { RunnerStateMachine } from "./runnerState.ts";
import { evaluateAutoResume } from "./autoResumePolicy.ts";
import {
  checkLeaseLive,
  checkManualStopFlag,
  stopForClosedDecision,
  stopForInvalidResponse,
  validateResponse,
  type StopCondition,
} from "./stopConditions.ts";
import { buildAgentResumeInput } from "./transcriptAdapter.ts";
import type {
  RunnerOutcome,
  RunnerRunResult,
  RunnerState,
  StopReason,
} from "../protocol/runnerResult.ts";

export interface RunnerLoopConfig {
  maxAutoResumeCycles: number;
  allowAutoResumeWhenRunnerActive: boolean;
  stopOnNewMaterialDecision: boolean;
  decisionPollMs: number;
}

export interface RunnerStartInfo {
  sourceCommand: string;
  changeId: string | null;
  commandRunId?: string;
  adapterName: Adapter;
}

export interface RunnerLoopDeps {
  runnerId: string;
  runtimeClient: RuntimeClient;
  adapter: AgentSessionAdapter;
  lease: SessionLeaseManager;
  audit: RunnerAudit;
  watcher: DecisionWatcher;
  resumeCoordinator: ResumeCoordinator;
  clock: Clock;
  logger: Logger;
  config: RunnerLoopConfig;
  start: RunnerStartInfo;
}

export interface TickResult {
  state: RunnerState;
  done: boolean;
  /** Caller should sleep decisionPollMs before the next tick. */
  needsWait: boolean;
}

interface PendingResume {
  decisionId: string;
  decision: Decision;
  response: DecisionResponse;
}

export class RunnerLoop {
  private readonly d: RunnerLoopDeps;
  private readonly sm = new RunnerStateMachine();

  private commandRunId: string | null = null;
  private cyclesUsed = 0;
  private decisionsSeen = 0;
  private readonly forwarded = new Set<string>();
  private readonly forwardedList: string[] = [];
  private readonly consumedList: string[] = [];
  private pending: PendingResume | null = null;

  private done = false;
  private outcome: RunnerOutcome = "FAILED";
  private stopReason: StopReason | undefined;
  private message = "";
  private manualResumeInstruction: string | undefined;

  constructor(deps: RunnerLoopDeps) {
    this.d = deps;
    this.commandRunId = deps.start.commandRunId ?? null;
  }

  get state(): RunnerState {
    return this.sm.state;
  }

  isDone(): boolean {
    return this.done;
  }

  result(): RunnerRunResult {
    return {
      runnerId: this.d.runnerId,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
      sourceCommand: this.d.start.sourceCommand,
      state: this.sm.state,
      outcome: this.outcome,
      autoResumeCyclesUsed: this.cyclesUsed,
      ...(this.stopReason ? { stopReason: this.stopReason } : {}),
      message: this.message,
      ...(this.manualResumeInstruction
        ? { manualResumeInstruction: this.manualResumeInstruction }
        : {}),
      forwardedDecisionIds: [...this.forwardedList],
      consumedDecisionIds: [...this.consumedList],
    };
  }

  async tick(): Promise<TickResult> {
    if (this.done) return { state: this.sm.state, done: true, needsWait: false };
    try {
      switch (this.sm.state) {
        case "created":
          return await this.tickCreated();
        case "starting":
          return this.tickStarting();
        case "running":
          return await this.tickRunning();
        case "waiting-for-decision":
          return await this.tickWaiting();
        case "auto-resuming":
          return await this.tickAutoResuming();
        default:
          return { state: this.sm.state, done: true, needsWait: false };
      }
    } catch (err) {
      // Any unexpected error resolves to a safe, resumable stop.
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      this.d.logger.error("runner tick failed", err);
      return this.finishStop({
        reason: "malformed-state",
        outcome: "READY_FOR_MANUAL_RESUME",
        message: `Runner error: ${msg}`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // State handlers
  // ---------------------------------------------------------------------------

  private async tickCreated(): Promise<TickResult> {
    const { start } = this.d;
    this.d.audit.append({
      eventType: "runner-started",
      message: `Runner ${this.d.runnerId} started for ${start.sourceCommand}.`,
      commandRunId: this.commandRunId,
      changeId: start.changeId,
      data: { adapter: this.d.adapter.kind },
    });

    // Register the lease up-front so even a failed begin leaves an auditable record.
    this.d.lease.register({
      commandRunId: this.commandRunId,
      changeId: start.changeId,
      sourceCommand: start.sourceCommand,
      processId: process.pid,
      state: "created",
    });

    const begin = this.d.runtimeClient.beginCommand({
      sourceCommand: start.sourceCommand,
      changeId: start.changeId,
      adapter: start.adapterName,
      ...(start.commandRunId ? { commandRunId: start.commandRunId } : {}),
    });

    if (begin.status === "CONFLICTING_COMMAND_ACTIVE") {
      this.commandRunId = begin.conflictingCommandRunId ?? this.commandRunId;
      return this.finishFailure("lock-conflict", begin.message);
    }
    if (begin.status === "RUNTIME_UNAVAILABLE") {
      return this.finishFailure("malformed-state", begin.message);
    }

    this.commandRunId = begin.commandRunId ?? start.commandRunId ?? null;
    if (!this.commandRunId) {
      return this.finishFailure("session-missing", "beginCommand returned no commandRunId.");
    }
    this.d.lease.heartbeat({ commandRunId: this.commandRunId, state: "created" });

    if (begin.status === "BLOCKED_BY_PENDING_DECISION") {
      // A decision is already pending on this change, owned by another run. The
      // runner did not create it and cannot resume that agent, so hand off.
      return this.finishStop({
        reason: "pending-decision-exists",
        outcome: "READY_FOR_MANUAL_RESUME",
        message:
          "A decision is already pending for this change. Answer it in the Decision Center, " +
          "then use chaos:resume.",
      });
    }

    await this.d.adapter.start({
      commandRunId: this.commandRunId,
      changeId: start.changeId,
      sourceCommand: start.sourceCommand,
      resumeCapsulePath: begin.resumeCapsulePath ?? null,
    });
    this.d.audit.append({
      eventType: "command-started",
      message: `Command ${start.sourceCommand} started under runner control.`,
      commandRunId: this.commandRunId,
      changeId: start.changeId,
    });

    this.sm.transition("starting");
    return { state: this.sm.state, done: false, needsWait: false };
  }

  private tickStarting(): TickResult {
    this.d.lease.heartbeat({ state: "starting" });
    const outcome = this.d.adapter.outcome();
    if (outcome === "failed") {
      return this.finishFailure("process-dead", "Agent process failed during startup.");
    }
    this.sm.transition("running");
    return { state: this.sm.state, done: false, needsWait: false };
  }

  private async tickRunning(): Promise<TickResult> {
    this.d.lease.heartbeat({ state: "running" });
    const pf = this.preflight();
    if (pf) return this.finishStop(pf);

    const obs = this.observe();
    switch (obs.kind) {
      case "malformed":
        return this.finishStop(this.malformed());
      case "session-missing":
        return this.finishFailure("run-mismatch", "Runtime session disappeared.");
      case "session-terminal":
        return this.handleSessionTerminal(obs);
      case "decision-closed":
        return this.finishStop(stopForClosedDecision(obs.closedReason!));
      case "waiting": {
        this.decisionsSeen += 1;
        if (this.d.config.stopOnNewMaterialDecision && this.cyclesUsed > 0) {
          return this.finishStop({
            reason: "new-material-decision",
            outcome: "READY_FOR_MANUAL_RESUME",
            message: "A new material decision appeared; stopping per stopOnNewMaterialDecision.",
          });
        }
        this.d.audit.append({
          eventType: "decision-wait-started",
          message: "Command reached a material decision; waiting for the human.",
          commandRunId: this.commandRunId,
          changeId: this.d.start.changeId,
          decisionId: obs.decisionId ?? null,
        });
        this.sm.transition("waiting-for-decision");
        return { state: this.sm.state, done: false, needsWait: false };
      }
      case "answered":
        // Missed the waiting edge; process it in the waiting handler.
        this.sm.transition("waiting-for-decision");
        return { state: this.sm.state, done: false, needsWait: false };
      case "no-decision":
      default:
        return await this.handleNoDecision(true);
    }
  }

  private async tickWaiting(): Promise<TickResult> {
    this.d.lease.heartbeat({ state: "waiting-for-decision" });
    const pf = this.preflight();
    if (pf) return this.finishStop(pf);

    // A dead agent cannot be auto-resumed regardless of the answer.
    if (!(await this.d.adapter.isAlive())) {
      return this.finishStop({
        reason: "process-dead",
        outcome: "READY_FOR_MANUAL_RESUME",
        message: "Agent process is no longer alive; leaving session for chaos:resume.",
      });
    }

    const obs = this.observe();
    switch (obs.kind) {
      case "malformed":
        return this.finishStop(this.malformed());
      case "session-missing":
        return this.finishFailure("run-mismatch", "Runtime session disappeared.");
      case "session-terminal":
        return this.handleSessionTerminal(obs);
      case "decision-closed":
        return this.finishStop(stopForClosedDecision(obs.closedReason!));
      case "waiting":
        // Still waiting for the human. Poll.
        return { state: this.sm.state, done: false, needsWait: true };
      case "answered":
        return this.handleAnswered(obs);
      case "no-decision":
      default:
        // Answer may already be consumed/session advanced; re-evaluate as running.
        this.sm.transition("running");
        return { state: this.sm.state, done: false, needsWait: true };
    }
  }

  private handleAnswered(obs: DecisionObservation): TickResult {
    const decision = this.d.runtimeClient.getDecision(obs.decisionId!);
    if (!decision) {
      return this.finishStop(this.malformed("Answered decision could not be read."));
    }
    const validation = validateResponse(decision, obs.response);
    if (!validation.valid) {
      this.d.audit.append({
        eventType: "auto-resume-skipped",
        message: validation.message ?? "Response failed validation.",
        commandRunId: this.commandRunId,
        changeId: this.d.start.changeId,
        decisionId: obs.decisionId ?? null,
      });
      return this.finishStop(stopForInvalidResponse(validation));
    }

    const policy = evaluateAutoResume({
      cyclesUsed: this.cyclesUsed,
      maxCycles: this.d.config.maxAutoResumeCycles,
      responseValid: true,
      rationaleSatisfied: true,
      allowAutoResumeWhenRunnerActive: this.d.config.allowAutoResumeWhenRunnerActive,
      runnerAlive: true, // liveness already checked at the top of tickWaiting
      adapterSupportsResume: this.d.adapter.supportsResume(),
    });

    if (policy.action === "stop-manual") {
      const auditType =
        policy.reason === "max-cycles-reached" ? "auto-resume-cycle-limit" : "auto-resume-skipped";
      this.d.audit.append({
        eventType: auditType,
        message: `Auto-resume stopped before cycle ${this.cyclesUsed + 1}: ${policy.reason}.`,
        commandRunId: this.commandRunId,
        changeId: this.d.start.changeId,
        decisionId: obs.decisionId ?? null,
        cycle: this.cyclesUsed,
      });
      return this.finishStop({
        reason: policy.reason,
        outcome: "READY_FOR_MANUAL_RESUME",
        message: `Auto-resume stopped: ${policy.reason}. Use chaos:resume.`,
      });
    }

    this.pending = { decisionId: obs.decisionId!, decision, response: obs.response! };
    this.d.audit.append({
      eventType: "decision-answered",
      message: `Decision answered: ${obs.response!.selectedOptionId}.`,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
      decisionId: obs.decisionId ?? null,
      data: { selectedOptionId: obs.response!.selectedOptionId },
    });
    this.sm.transition("auto-resuming");
    return { state: this.sm.state, done: false, needsWait: false };
  }

  private async tickAutoResuming(): Promise<TickResult> {
    this.d.lease.heartbeat({ state: "auto-resuming" });
    const pf = this.preflight();
    if (pf) return this.finishStop(pf);

    const pend = this.pending!;
    const alive = await this.d.adapter.isAlive();
    if (!alive || !this.d.adapter.supportsResume()) {
      this.d.audit.append({
        eventType: "auto-resume-skipped",
        message: alive
          ? "Adapter cannot inject a resume message; leaving for chaos:resume."
          : "Agent died before resume; leaving for chaos:resume.",
        commandRunId: this.commandRunId,
        changeId: this.d.start.changeId,
        decisionId: pend.decisionId,
      });
      return this.finishStop({
        reason: alive ? "adapter-cannot-resume" : "process-dead",
        outcome: "READY_FOR_MANUAL_RESUME",
        message: "Cannot auto-resume the live session; use chaos:resume.",
      });
    }

    // Reference the capsule by path — never inline large bodies.
    const capsulePath = this.d.runtimeClient.ensureResumeCapsule(this.commandRunId!);
    const capsule = this.d.runtimeClient.getResumeCapsule(this.commandRunId!);
    const selectedOptionId = pend.response.selectedOptionId ?? "";
    const selectedOption = pend.decision.options.find((o) => o.id === selectedOptionId);

    const resumeInput = buildAgentResumeInput({
      commandRunId: this.commandRunId!,
      changeId: this.d.start.changeId,
      sourceCommand: this.d.start.sourceCommand,
      decisionId: pend.decisionId,
      selectedOptionId,
      selectedOptionLabel: selectedOption?.label ?? null,
      rationale: pend.response.rationale,
      capsulePath,
      nextStep: capsule?.nextStep ?? null,
      cycle: this.cyclesUsed + 1,
    });

    this.d.audit.append({
      eventType: "auto-resume-started",
      message: `Auto-resume cycle ${this.cyclesUsed + 1}.`,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
      decisionId: pend.decisionId,
      cycle: this.cyclesUsed + 1,
      data: { selectedOptionId: pend.response.selectedOptionId, capsulePath },
    });

    // Advance the session ready-to-resume -> resumed -> running so the live agent
    // can continue (and, if needed, create the next decision).
    this.d.runtimeClient.resumeCommand(this.commandRunId!);

    this.forwarded.add(pend.decisionId);
    this.forwardedList.push(pend.decisionId);
    const ack = await this.d.adapter.send(resumeInput);
    this.cyclesUsed += 1;
    this.d.lease.heartbeat({ state: "running", autoResumeCyclesUsed: this.cyclesUsed });

    // Consume ONLY on an explicit acknowledgement that the agent received it.
    if (ack.acknowledgedDecisionId === pend.decisionId) {
      // Idempotent: a live agent may have consumed it itself. markDecisionConsumed
      // enforces answered -> consumed and would throw on a double-consume, so gate
      // on the current state and never re-consume.
      const current = this.d.runtimeClient.getDecision(pend.decisionId);
      if (current?.state === "consumed") {
        this.consumedList.push(pend.decisionId);
        this.d.audit.append({
          eventType: "decision-consumed",
          message: "Decision already consumed by the live agent (idempotent).",
          commandRunId: this.commandRunId,
          changeId: this.d.start.changeId,
          decisionId: pend.decisionId,
        });
      } else if (current?.state === "answered") {
        this.d.runtimeClient.markDecisionConsumed(pend.decisionId);
        this.consumedList.push(pend.decisionId);
        this.d.audit.append({
          eventType: "decision-consumed",
          message: "Decision consumed after agent acknowledgement.",
          commandRunId: this.commandRunId,
          changeId: this.d.start.changeId,
          decisionId: pend.decisionId,
        });
      } else {
        this.d.audit.append({
          eventType: "auto-resume-skipped",
          message: `Decision not in a consumable state (${current?.state ?? "missing"}); left for the command contract.`,
          commandRunId: this.commandRunId,
          changeId: this.d.start.changeId,
          decisionId: pend.decisionId,
          data: { consumed: false },
        });
      }
    } else {
      this.d.audit.append({
        eventType: "auto-resume-skipped",
        message: "No acknowledgement; decision NOT consumed (left for chaos:resume/command contract).",
        commandRunId: this.commandRunId,
        changeId: this.d.start.changeId,
        decisionId: pend.decisionId,
        data: { consumed: false },
      });
    }

    this.pending = null;
    this.sm.transition("running");
    return { state: this.sm.state, done: false, needsWait: false };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private observe(): DecisionObservation {
    return this.d.watcher.observe(this.commandRunId!, this.forwarded);
  }

  private async handleNoDecision(fromRunning: boolean): Promise<TickResult> {
    const outcome = this.d.adapter.outcome();
    if (outcome === "completed") return this.handleAgentCompleted();
    if (outcome === "failed") {
      return this.finishFailure("process-dead", "Agent process exited with failure.");
    }
    if (!(await this.d.adapter.isAlive())) {
      return this.finishStop({
        reason: "process-dead",
        outcome: "READY_FOR_MANUAL_RESUME",
        message: "Agent process is no longer alive; leaving session for chaos:resume.",
      });
    }
    // Still working — wait for the agent to make progress.
    void fromRunning;
    return { state: this.sm.state, done: false, needsWait: true };
  }

  private handleAgentCompleted(): TickResult {
    // Complete the command in the runtime if the agent did not already.
    const session = this.d.runtimeClient.getSession(this.commandRunId!);
    if (session && !["completed", "cancelled", "failed", "expired"].includes(session.state)) {
      this.d.runtimeClient.completeCommand(this.commandRunId!);
    }
    return this.finishComplete();
  }

  private handleSessionTerminal(obs: DecisionObservation): TickResult {
    switch (obs.sessionState) {
      case "completed":
        return this.finishComplete();
      case "cancelled":
        return this.finishCancelled("Command was cancelled in the runtime.");
      default:
        return this.finishFailure("malformed-state", `Session is ${obs.sessionState}.`);
    }
  }

  private preflight(): StopCondition | null {
    if (this.d.lease.hasStopFlag()) return checkManualStopFlag(true);
    return checkLeaseLive(this.d.lease.current(), this.d.clock.now().toISOString());
  }

  private malformed(message = "Runtime state is malformed; run chaos:doctor."): StopCondition {
    return { reason: "malformed-state", outcome: "READY_FOR_MANUAL_RESUME", message };
  }

  // ---------------------------------------------------------------------------
  // Terminal transitions
  // ---------------------------------------------------------------------------

  private finishComplete(): TickResult {
    this.outcome = "COMPLETED";
    this.message = `Command ${this.d.start.sourceCommand} completed under runner control.`;
    this.d.audit.append({
      eventType: "runner-completed",
      message: this.message,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
      cycle: this.cyclesUsed,
    });
    return this.terminate("completed");
  }

  private finishFailure(reason: StopReason, message: string): TickResult {
    this.outcome = "FAILED";
    this.stopReason = reason;
    this.message = message;
    this.d.audit.append({
      eventType: "runner-failed",
      message,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
      data: { reason },
    });
    return this.terminate("failed");
  }

  private finishCancelled(message: string): TickResult {
    this.outcome = "CANCELLED";
    this.stopReason = "user-cancelled";
    this.message = message;
    this.d.audit.append({
      eventType: "runner-cancelled",
      message,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
    });
    return this.terminate("cancelled");
  }

  private finishStop(cond: StopCondition): TickResult {
    this.outcome = cond.outcome;
    this.stopReason = cond.reason;
    this.message = cond.message;

    if (cond.outcome === "READY_FOR_MANUAL_RESUME") {
      this.d.resumeCoordinator.ensureResumeCapsule(this.commandRunId ?? "");
      this.manualResumeInstruction = this.d.resumeCoordinator.manualResumeInstruction(
        this.commandRunId,
      );
      this.d.audit.append({
        eventType: "session-ready-for-manual-resume",
        message: `${cond.message} (${this.manualResumeInstruction})`,
        commandRunId: this.commandRunId,
        changeId: this.d.start.changeId,
        data: { reason: cond.reason },
      });
      return this.terminate("ready-for-manual-resume");
    }
    // Non-resumable stop outcomes.
    if (cond.outcome === "CANCELLED") return this.terminate("cancelled");
    if (cond.outcome === "ABANDONED") return this.terminate("abandoned");
    this.d.audit.append({
      eventType: "runner-failed",
      message: cond.message,
      commandRunId: this.commandRunId,
      changeId: this.d.start.changeId,
      data: { reason: cond.reason },
    });
    return this.terminate("failed");
  }

  private terminate(state: RunnerState): TickResult {
    try {
      this.d.lease.release(state);
    } catch (err) {
      this.d.logger.warn("failed to release lease", err);
    }
    this.sm.transition(state);
    this.done = true;
    return { state, done: true, needsWait: false };
  }
}
