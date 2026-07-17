/**
 * Thin, read-mostly wrapper over the Iteration 1 InteractionRuntime.
 *
 * The runner observes runtime state (the agent, via MCP, is what creates
 * decisions and completes commands). The runner uses a handful of operations
 * directly: begin (to obtain/own the session + detect lock conflicts), read
 * session/decisions/responses/capsules, and — only when safe — mark a decision
 * consumed and complete the command.
 *
 * Both this runtime client and the Iteration 2 MCP server read/write the same
 * file-backed state, so observing the runtime directly is the honest integration
 * point; there is no separate source of truth to reconcile.
 */

import type { RunnerConfig } from "../config/runnerConfig.ts";
import {
  InteractionRuntime,
  type BeginCommandInput,
  type BeginResult,
  type CommandSession,
  type Decision,
  type DecisionResponse,
  type DecisionResponseResult,
  type ResumeCapsule,
  type ResumeCandidate,
  type FindResumeCandidatesFilter,
  type LockView,
} from "../runtime.ts";

export class RuntimeClient {
  readonly runtime: InteractionRuntime;

  constructor(runtime: InteractionRuntime) {
    this.runtime = runtime;
  }

  static fromConfig(config: RunnerConfig): RuntimeClient {
    return new RuntimeClient(
      new InteractionRuntime({
        root: config.interactionsRoot,
        schemaDir: config.schemaDir,
        validate: config.validate,
      }),
    );
  }

  beginCommand(input: BeginCommandInput): BeginResult {
    return this.runtime.beginCommand(input);
  }

  getSession(commandRunId: string): CommandSession | undefined {
    return this.runtime.getSession(commandRunId);
  }

  /** Decisions belonging to a specific run, newest-created heuristic aside. */
  listDecisionsForRun(commandRunId: string): Decision[] {
    return this.runtime.store.decisions.list().filter((d) => d.commandRunId === commandRunId);
  }

  getDecision(decisionId: string): Decision | undefined {
    return this.runtime.getDecision(decisionId);
  }

  getDecisionResponse(decisionId: string): DecisionResponseResult {
    return this.runtime.getDecisionResponse(decisionId);
  }

  getResponse(decisionId: string): DecisionResponse | undefined {
    return this.runtime.getDecisionResponse(decisionId).response;
  }

  markDecisionConsumed(decisionId: string): void {
    this.runtime.markDecisionConsumed(decisionId);
  }

  /** Advance a resumable session back to running (ready-to-resume -> resumed -> running). */
  resumeCommand(commandRunId: string): void {
    this.runtime.resumeCommand(commandRunId);
  }

  completeCommand(commandRunId: string): void {
    this.runtime.completeCommand(commandRunId);
  }

  cancelCommand(commandRunId: string): void {
    this.runtime.cancelCommand(commandRunId);
  }

  getResumeCapsule(commandRunId: string): ResumeCapsule | null {
    return this.runtime.getResumeCapsule(commandRunId);
  }

  findResumeCandidates(filter: FindResumeCandidatesFilter = {}): ResumeCandidate[] {
    return this.runtime.findResumeCandidates(filter);
  }

  ensureResumeCapsule(commandRunId: string): string | null {
    const existing = this.runtime.getResumeCapsule(commandRunId);
    if (existing) {
      const candidate = this.runtime
        .findResumeCandidates({ commandRunId })
        .find((c) => c.commandRunId === commandRunId);
      return candidate?.capsulePath ?? null;
    }
    // Create one from current session state so chaos:resume can pick it up.
    const session = this.runtime.getSession(commandRunId);
    if (!session) return null;
    const result = this.runtime.createResumeCapsule(commandRunId);
    return result.path;
  }

  listLocks(): LockView[] {
    return this.runtime.listLocks();
  }
}
