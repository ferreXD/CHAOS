/** Shared runner test helpers: temp repo rooted against the real Iteration 0 schemas. */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { InteractionRuntime, type Clock, type IdFactory } from "../src/runtime.ts";
import { RuntimeClient } from "../src/runtime/runtimeClient.ts";
import { ChaosRunner } from "../src/runner/chaosRunner.ts";
import { MockAgentSessionAdapter, type MockBeat } from "../src/runner/commandProcess.ts";
import type { RunnerConfig } from "../src/config/runnerConfig.ts";
import type { RunnerLoop } from "../src/runner/runnerLoop.ts";
import type { RunnerLease } from "../src/runtime/sessionLease.ts";

export const REAL_SCHEMA_DIR = path.resolve(
  import.meta.dirname,
  "../../../.chaos/interactions/schema",
);

export function fixedClock(startIso = "2026-07-07T09:00:00.000Z"): Clock {
  let t = new Date(startIso).getTime();
  return {
    now() {
      const d = new Date(t);
      t += 1000;
      return d;
    },
  };
}

export function counterIds(): IdFactory {
  let run = 0;
  let dec = 0;
  let lock = 0;
  let evt = 0;
  return {
    runId: () => `RUN-test-${++run}`,
    decisionId: () => `DEC-test-${++dec}`,
    lockId: () => `LOCK-test-${++lock}`,
    eventId: () => `EVT-test-${++evt}`,
  };
}

export const PROCEED_OPTIONS = [
  { id: "proceed", label: "Proceed", recommended: true },
  { id: "stop", label: "Stop" },
];

export interface RunnerEnv {
  repoRoot: string;
  config: RunnerConfig;
  clock: Clock;
  runtimeClient: RuntimeClient;
  cleanup: () => void;
}

export function makeEnv(overrides: Partial<RunnerConfig> = {}): RunnerEnv {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-runner-"));
  const interactionsRoot = path.join(repoRoot, ".chaos", "interactions");
  const runnersDir = path.join(interactionsRoot, "runners");
  fs.mkdirSync(runnersDir, { recursive: true });

  const config: RunnerConfig = {
    repositoryRoot: repoRoot,
    interactionsRoot,
    schemaDir: REAL_SCHEMA_DIR,
    runnersDir,
    validate: true,
    agentCommand: "node",
    agentArgs: [],
    workingDirectory: repoRoot,
    sessionAdapter: "process",
    claudeModel: null,
    claudePermissionMode: "acceptEdits",
    agentAckTimeoutMs: 120000,
    forceAdapter: false,
    maxAutoResumeCycles: 3,
    decisionPollMs: 0,
    sessionLeaseTtlMs: 300000,
    heartbeatIntervalMs: 60000,
    requireExplicitResumeForDeadSessions: true,
    allowAutoResumeWhenRunnerActive: true,
    allowAutoResumeAcrossDeadSessions: false,
    stopOnNewMaterialDecision: false,
    stopOnUnsafeWriteRisk: true,
    stopOnValidationFailure: true,
    writeRunnerAudit: true,
    allowProcessResume: false,
    logLevel: "silent",
    ...overrides,
  };

  const clock = fixedClock();
  const runtimeClient = new RuntimeClient(
    new InteractionRuntime({
      root: interactionsRoot,
      schemaDir: REAL_SCHEMA_DIR,
      validate: true,
      clock,
      idFactory: counterIds(),
    }),
  );

  return {
    repoRoot,
    config,
    clock,
    runtimeClient,
    cleanup: () => fs.rmSync(repoRoot, { recursive: true, force: true }),
  };
}

let runnerCounter = 0;

export function makeRunner(env: RunnerEnv, runnerId?: string): ChaosRunner {
  return new ChaosRunner(env.config, {
    clock: env.clock,
    runtimeClient: env.runtimeClient,
    runnerId: runnerId ?? `RUNNER-test-${++runnerCounter}`,
  });
}

export function mockAdapter(
  env: RunnerEnv,
  script: MockBeat[],
  opts: { supportsResume?: boolean; supportsAck?: boolean } = {},
): MockAgentSessionAdapter {
  return new MockAgentSessionAdapter({
    runtime: env.runtimeClient.runtime,
    script,
    ...opts,
  });
}

/** Answer the current active decision (simulating the Decision Center). */
export function answerActive(
  env: RunnerEnv,
  selectedOptionId = "proceed",
  rationale: string | null = "test rationale",
): boolean {
  const active = env.runtimeClient.runtime.getActiveDecision();
  if (active.status !== "ACTIVE_DECISION" || !active.decision) return false;
  env.runtimeClient.runtime.answerDecision({
    decisionId: active.decision.decisionId,
    selectedOptionId,
    selectedBy: "test-user",
    rationale,
    source: "vscode-decision-center",
  });
  return true;
}

/** Answer the pending decision for a specific change (disambiguates multiple). */
export function answerActiveForChange(
  env: RunnerEnv,
  changeId: string,
  selectedOptionId = "proceed",
  rationale: string | null = "test rationale",
): boolean {
  const active = env.runtimeClient.runtime.getActiveDecision({ changeId });
  if (active.status !== "ACTIVE_DECISION" || !active.decision) return false;
  env.runtimeClient.runtime.answerDecision({
    decisionId: active.decision.decisionId,
    selectedOptionId,
    selectedBy: "test-user",
    rationale,
    source: "vscode-decision-center",
  });
  return true;
}

export interface DriveOptions {
  onWait?: (loop: RunnerLoop) => void | Promise<void>;
  maxTicks?: number;
}

/** Step the loop to completion, invoking onWait whenever it needs to poll. */
export async function drive(loop: RunnerLoop, opts: DriveOptions = {}) {
  let ticks = 0;
  const max = opts.maxTicks ?? 2000;
  while (!loop.isDone() && ticks < max) {
    const t = await loop.tick();
    ticks += 1;
    if (t.needsWait && !loop.isDone() && opts.onWait) {
      await opts.onWait(loop);
    }
  }
  return loop.result();
}

/** Step exactly until the loop reports needsWait or done, returning the last tick. */
export async function stepToWait(loop: RunnerLoop, maxTicks = 50) {
  for (let i = 0; i < maxTicks; i++) {
    const t = await loop.tick();
    if (t.needsWait || t.done) return t;
  }
  throw new Error("loop did not reach a wait/done state");
}

export function leasePath(env: RunnerEnv, runnerId: string): string {
  return path.join(env.config.runnersDir, `${runnerId}.json`);
}

export function readLease(env: RunnerEnv, runnerId: string): RunnerLease {
  return JSON.parse(fs.readFileSync(leasePath(env, runnerId), "utf8")) as RunnerLease;
}

export function readAudit(env: RunnerEnv, runnerId: string): Array<Record<string, unknown>> {
  const p = path.join(env.config.runnersDir, `${runnerId}.audit.jsonl`);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

export function writeStopFlag(env: RunnerEnv, runnerId: string): void {
  fs.writeFileSync(path.join(env.config.runnersDir, `${runnerId}.stop`), "", "utf8");
}
