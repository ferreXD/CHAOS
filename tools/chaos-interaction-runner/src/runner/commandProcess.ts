/**
 * Agent session adapters.
 *
 * The runner controls only executions it launches through an adapter. Two are
 * provided:
 *
 *   - MockAgentSessionAdapter   — deterministic, in-process; drives the runtime
 *     the way a real agent would (creates decisions, acknowledges resumes). Used
 *     by tests and `run-mock`.
 *   - ProcessAgentSessionAdapter — spawns a configured command and, if permitted,
 *     forwards a resume message to its stdin. Because a generic process gives no
 *     acknowledgement that it consumed the message, this adapter defaults to
 *     `supportsResume() === false`, so the runner prefers READY_FOR_MANUAL_RESUME
 *     rather than pretending it resumed a live agent.
 */

import { spawn, type ChildProcess } from "node:child_process";
import type { InteractionRuntime, DecisionOption } from "../runtime.ts";
import type { AgentResumeInput } from "./transcriptAdapter.ts";
import type { Logger } from "../logger.ts";

export type AgentOutcome = "completed" | "failed";

export interface RunnerStartInput {
  commandRunId: string;
  changeId: string | null;
  sourceCommand: string;
  resumeCapsulePath?: string | null;
}

export interface AgentAck {
  /** Set to the decision id the agent confirmed it received/incorporated. */
  acknowledgedDecisionId?: string;
}

export interface AgentSessionAdapter {
  readonly kind: string;
  /** Whether this adapter can inject a resume message into the live session. */
  supportsResume(): boolean;
  start(input: RunnerStartInput): Promise<void>;
  send(input: AgentResumeInput): Promise<AgentAck>;
  stop(reason: string): Promise<void>;
  isAlive(): Promise<boolean>;
  /** Final outcome once the agent finished, or null while still running. */
  outcome(): AgentOutcome | null;
}

// ---------------------------------------------------------------------------
// Mock adapter
// ---------------------------------------------------------------------------

export type MockBeat =
  | {
      type: "decision";
      title: string;
      options: DecisionOption[];
      context?: string;
      requiresRationale?: boolean;
      recommendedOptionId?: string | null;
      nextStep?: string;
    }
  | { type: "complete" }
  | { type: "fail" }
  | { type: "die" };

export interface MockAdapterOptions {
  runtime: InteractionRuntime;
  script: MockBeat[];
  /** Whether the mock can be resumed (default true). */
  supportsResume?: boolean;
  /** Whether the mock acknowledges forwarded decisions (default true). */
  supportsAck?: boolean;
}

export class MockAgentSessionAdapter implements AgentSessionAdapter {
  readonly kind = "mock";
  private readonly runtime: InteractionRuntime;
  private readonly script: MockBeat[];
  private readonly supportsResumeValue: boolean;
  private readonly supportsAck: boolean;

  private index = 0;
  private aliveValue = true;
  private outcomeValue: AgentOutcome | null = null;
  private runId = "";
  pendingDecisionId: string | null = null;
  /** Decision ids the mock created, in order (test visibility). */
  readonly createdDecisionIds: string[] = [];
  /** Decision ids the mock received a resume for (test visibility). */
  readonly resumedDecisionIds: string[] = [];
  /** Resume message bodies received (test visibility). */
  readonly receivedMessages: string[] = [];

  constructor(options: MockAdapterOptions) {
    this.runtime = options.runtime;
    this.script = options.script;
    this.supportsResumeValue = options.supportsResume ?? true;
    this.supportsAck = options.supportsAck ?? true;
  }

  supportsResume(): boolean {
    return this.supportsResumeValue;
  }

  async start(input: RunnerStartInput): Promise<void> {
    this.runId = input.commandRunId;
    this.advance();
  }

  async send(input: AgentResumeInput): Promise<AgentAck> {
    this.resumedDecisionIds.push(input.decisionId);
    this.receivedMessages.push(input.message);
    if (!this.aliveValue) return {};
    this.advance();
    return this.supportsAck ? { acknowledgedDecisionId: input.decisionId } : {};
  }

  async stop(_reason: string): Promise<void> {
    this.aliveValue = false;
  }

  async isAlive(): Promise<boolean> {
    return this.aliveValue;
  }

  outcome(): AgentOutcome | null {
    return this.outcomeValue;
  }

  /** Test helper: simulate an abrupt process death. */
  kill(): void {
    this.aliveValue = false;
  }

  private advance(): void {
    while (this.index < this.script.length) {
      const beat = this.script[this.index++]!;
      switch (beat.type) {
        case "decision": {
          const result = this.runtime.createDecision({
            commandRunId: this.runId,
            title: beat.title,
            context: beat.context ?? `Mock decision: ${beat.title}`,
            options: beat.options,
            requiresRationale: beat.requiresRationale ?? false,
            recommendedOptionId: beat.recommendedOptionId ?? null,
            nextStep: beat.nextStep ?? "continue-mock",
          });
          this.pendingDecisionId = result.decisionId;
          this.createdDecisionIds.push(result.decisionId);
          return; // pause until answered + resumed
        }
        case "complete":
          this.outcomeValue = "completed";
          this.aliveValue = false;
          return;
        case "fail":
          this.outcomeValue = "failed";
          this.aliveValue = false;
          return;
        case "die":
          // Abnormal death: no outcome recorded, process no longer alive.
          this.aliveValue = false;
          return;
      }
    }
    // Script exhausted with no explicit terminal beat: treat as completed.
    this.outcomeValue = "completed";
    this.aliveValue = false;
  }
}

// ---------------------------------------------------------------------------
// Generic process adapter
// ---------------------------------------------------------------------------

export interface ProcessAdapterOptions {
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  /**
   * Whether the runner may write a resume message to the process's stdin. Default
   * false: without an acknowledgement channel the runner cannot prove the process
   * consumed the message, so it prefers manual resume.
   */
  allowResume?: boolean;
  logger?: Logger;
}

export class ProcessAgentSessionAdapter implements AgentSessionAdapter {
  readonly kind = "process";
  private readonly options: ProcessAdapterOptions;
  private child: ChildProcess | undefined;
  private exited = false;
  private exitCode: number | null = null;

  constructor(options: ProcessAdapterOptions) {
    this.options = options;
  }

  supportsResume(): boolean {
    return this.options.allowResume ?? false;
  }

  async start(input: RunnerStartInput): Promise<void> {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ...this.options.env,
      CHAOS_COMMAND_RUN_ID: input.commandRunId,
      CHAOS_SOURCE_COMMAND: input.sourceCommand,
      ...(input.changeId ? { CHAOS_CHANGE_ID: input.changeId } : {}),
    };
    const child = spawn(this.options.command, this.options.args, {
      cwd: this.options.cwd,
      env,
      stdio: ["pipe", "inherit", "inherit"],
    });
    child.on("exit", (code) => {
      this.exited = true;
      this.exitCode = code ?? null;
    });
    child.on("error", (err) => {
      this.exited = true;
      this.exitCode = 1;
      this.options.logger?.error("agent process error", err);
    });
    this.child = child;
  }

  async send(input: AgentResumeInput): Promise<AgentAck> {
    if (!this.supportsResume()) return {};
    if (this.exited || !this.child) return {};
    const stdin = this.child.stdin;
    if (!stdin || !stdin.writable) {
      // Cannot inject input: leave to manual resume (no ack).
      return {};
    }
    stdin.write(input.message + "\n");
    // A generic process gives no confirmation that it consumed the message, so we
    // deliberately return NO acknowledgement. The runner will not mark the
    // decision consumed on this path.
    return {};
  }

  async stop(_reason: string): Promise<void> {
    if (this.child && !this.exited) {
      try {
        this.child.kill();
      } catch {
        /* ignore */
      }
    }
  }

  async isAlive(): Promise<boolean> {
    return !this.exited && this.child !== undefined && this.child.exitCode === null;
  }

  outcome(): AgentOutcome | null {
    if (!this.exited) return null;
    return this.exitCode === 0 ? "completed" : "failed";
  }
}
