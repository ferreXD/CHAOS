/**
 * Live Claude Code session adapter.
 *
 * Launches a headless Claude Code process in streaming mode and drives a CHAOS
 * command through it, keeping ONE live session across auto-resume cycles:
 *
 *   claude -p --input-format stream-json --output-format stream-json --verbose ...
 *
 * The runner (not this adapter) owns the runtime: it begins the command, watches
 * for decisions, and consumes them. This adapter only:
 *   - start()  — spawn the session and send the launch turn (run the command,
 *                re-enter the runner's commandRunId, stop on decisions).
 *   - send()   — write the answered-decision resume message as the next user turn
 *                and return an acknowledgement WHEN the agent's turn completes
 *                (a `result` event). That streamed turn-completion is the real
 *                proof the live agent received the answer; the runner consumes the
 *                decision only on that ack.
 *   - isAlive()/outcome()/stop() — process liveness + lifecycle.
 *
 * The (version-sensitive) wire format is confined to `streamJson.ts`.
 */

import { spawn, type ChildProcess } from "node:child_process";
import type {
  AgentAck,
  AgentOutcome,
  AgentSessionAdapter,
  RunnerStartInput,
} from "./commandProcess.ts";
import type { AgentResumeInput } from "./transcriptAdapter.ts";
import type { Logger } from "../logger.ts";
import { StreamJsonParser, buildUserMessageLine } from "./streamJson.ts";

export interface ClaudeCodeAdapterOptions {
  /** Executable, e.g. "claude" (never a hardcoded absolute path). */
  command: string;
  /** Fully-assembled CLI args (streaming flags, permission mode, model, …). */
  args: string[];
  cwd: string;
  env: Record<string, string>;
  /** How long send() waits for the agent's turn to complete before giving up. */
  ackTimeoutMs: number;
  logger?: Logger;
}

interface AckWaiter {
  threshold: number;
  resolve: (gotResult: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class ClaudeCodeSessionAdapter implements AgentSessionAdapter {
  readonly kind = "claude-code";

  private readonly options: ClaudeCodeAdapterOptions;
  private readonly parser = new StreamJsonParser();

  private child: ChildProcess | undefined;
  private exited = false;
  private exitCode: number | null = null;
  private startError: Error | undefined;
  private stopped = false;

  private sessionId: string | null = null;
  private resultCount = 0;
  private lastResultIsError = false;
  private readonly waiters: AckWaiter[] = [];

  constructor(options: ClaudeCodeAdapterOptions) {
    this.options = options;
  }

  /** This adapter can always inject a resume message into the live session. */
  supportsResume(): boolean {
    return true;
  }

  async start(input: RunnerStartInput): Promise<void> {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ...this.options.env,
      CHAOS_COMMAND_RUN_ID: input.commandRunId,
      CHAOS_SOURCE_COMMAND: input.sourceCommand,
      ...(input.changeId ? { CHAOS_CHANGE_ID: input.changeId } : {}),
    };

    let child: ChildProcess;
    try {
      child = spawn(this.options.command, this.options.args, {
        cwd: this.options.cwd,
        env,
        stdio: ["pipe", "pipe", "inherit"],
      });
    } catch (err) {
      this.startError = err instanceof Error ? err : new Error(String(err));
      this.exited = true;
      this.exitCode = 1;
      this.options.logger?.error("failed to spawn claude", this.startError);
      return;
    }

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => this.onStdout(chunk));
    child.on("exit", (code) => {
      this.exited = true;
      this.exitCode = code ?? null;
      this.resolveAllWaiters();
    });
    child.on("error", (err) => {
      this.startError = err instanceof Error ? err : new Error(String(err));
      this.exited = true;
      this.exitCode = this.exitCode ?? 1;
      this.options.logger?.error("claude process error", err);
      this.resolveAllWaiters();
    });
    this.child = child;

    this.writeTurn(buildLaunchPrompt(input));
  }

  async send(input: AgentResumeInput): Promise<AgentAck> {
    if (!(await this.isAlive())) return {};
    const threshold = this.resultCount + 1;
    if (!this.writeTurn(input.message)) return {};

    const gotResult = await new Promise<boolean>((resolve) => {
      const waiter: AckWaiter = {
        threshold,
        resolve,
        timer: setTimeout(() => this.settleWaiter(waiter, false), this.options.ackTimeoutMs),
      };
      this.waiters.push(waiter);
      // The turn may already have completed between the write and here.
      if (this.resultCount >= threshold) this.settleWaiter(waiter, true);
    });

    return gotResult ? { acknowledgedDecisionId: input.decisionId } : {};
  }

  async stop(_reason: string): Promise<void> {
    this.stopped = true;
    const child = this.child;
    if (!child || this.exited) {
      this.resolveAllWaiters();
      return;
    }
    try {
      child.stdin?.end();
    } catch {
      /* ignore */
    }
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    this.resolveAllWaiters();
  }

  async isAlive(): Promise<boolean> {
    return (
      !this.exited &&
      !this.stopped &&
      this.startError === undefined &&
      this.child !== undefined &&
      this.child.exitCode === null
    );
  }

  outcome(): AgentOutcome | null {
    if (!this.exited) return null;
    if (this.startError) return "failed";
    return this.exitCode === 0 && !this.lastResultIsError ? "completed" : "failed";
  }

  /** The Claude Code session id, once the init event has been seen (diagnostics). */
  get claudeSessionId(): string | null {
    return this.sessionId;
  }

  // ---------------------------------------------------------------------------

  private onStdout(chunk: string): void {
    for (const ev of this.parser.push(chunk)) {
      if (ev.kind === "init") {
        this.sessionId = ev.sessionId;
      } else if (ev.kind === "result") {
        this.resultCount += 1;
        this.lastResultIsError = ev.isError;
        this.resolveReadyWaiters();
      }
    }
  }

  private writeTurn(text: string): boolean {
    const stdin = this.child?.stdin;
    if (!stdin || !stdin.writable) return false;
    try {
      stdin.write(buildUserMessageLine(text));
      return true;
    } catch (err) {
      this.options.logger?.warn("failed to write turn to claude stdin", err);
      return false;
    }
  }

  private resolveReadyWaiters(): void {
    for (const w of [...this.waiters]) {
      if (this.resultCount >= w.threshold) this.settleWaiter(w, true);
    }
  }

  private resolveAllWaiters(): void {
    for (const w of [...this.waiters]) {
      this.settleWaiter(w, this.resultCount >= w.threshold);
    }
  }

  private settleWaiter(waiter: AckWaiter, gotResult: boolean): void {
    const idx = this.waiters.indexOf(waiter);
    if (idx === -1) return; // already settled
    this.waiters.splice(idx, 1);
    clearTimeout(waiter.timer);
    waiter.resolve(gotResult);
  }
}

/**
 * The launch turn. The agent's FIRST action must adopt the runner's existing
 * commandRunId (the runtime supports re-entry) so it does not create a second run
 * for the change and collide with the runner's lock.
 */
export function buildLaunchPrompt(input: RunnerStartInput): string {
  const lines: string[] = [];
  lines.push("You are executing a CHAOS command under the CHAOS interaction runner");
  lines.push("(headless live auto-resume). The interaction runtime is the source of truth.");
  lines.push("");
  lines.push(`Command to run: ${input.sourceCommand}`);
  lines.push("");
  lines.push("Operate under the EXISTING runner-owned command run — do NOT begin a new run:");
  lines.push(`- commandRunId: ${input.commandRunId}`);
  lines.push(`- changeId: ${input.changeId ?? "(none)"}`);
  if (input.resumeCapsulePath) lines.push(`- resumeCapsule: ${input.resumeCapsulePath}`);
  lines.push("");
  lines.push(
    `Your FIRST runtime action must be chaos_begin_command with commandRunId "${input.commandRunId}" ` +
      "so you re-enter the existing session. Never create a second run for this change.",
  );
  lines.push("");
  lines.push("When you reach a material decision:");
  lines.push("- create it through the runtime (chaos_create_decision) and then STOP your turn;");
  lines.push("- a human answers it in the Decision Center and the runner sends you the answer;");
  lines.push(
    "- do NOT answer decisions yourself, and do NOT call chaos_mark_decision_consumed — the runner owns decision consumption.",
  );
  lines.push("");
  lines.push(
    "Otherwise execute the command normally through to completion (including chaos_complete_command). Do not invent context.",
  );
  return lines.join("\n");
}

/**
 * Assemble the default Claude Code CLI args for headless streaming. Callers may
 * append overrides (they win — later args take precedence in the CLI).
 */
export function buildClaudeArgs(opts: {
  permissionMode: string;
  model?: string | null;
  extraArgs?: string[];
}): string[] {
  const args = [
    "-p",
    "--input-format",
    "stream-json",
    "--output-format",
    "stream-json",
    "--verbose",
    "--permission-mode",
    opts.permissionMode,
  ];
  if (opts.model) args.push("--model", opts.model);
  if (opts.extraArgs && opts.extraArgs.length > 0) args.push(...opts.extraArgs);
  return args;
}
