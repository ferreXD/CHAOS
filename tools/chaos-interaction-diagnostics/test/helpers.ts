/** Diagnostics test helpers: temp repo + seeded runtime against the real schemas. */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { InteractionRuntime, type Clock, type IdFactory } from "../src/runtime.ts";
import type { DiagnosticsConfig } from "../src/config/diagnosticsConfig.ts";

export const REAL_SCHEMA_DIR = path.resolve(
  import.meta.dirname,
  "../../../.chaos/interactions/schema",
);

export const START_ISO = "2026-07-07T09:00:00.000Z";

export function fixedClock(startIso = START_ISO): Clock {
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

export const OPTIONS = [
  { id: "proceed", label: "Proceed", recommended: true },
  { id: "stop", label: "Stop" },
];

export interface DiagEnv {
  repoRoot: string;
  interactionsRoot: string;
  runnersDir: string;
  runtimeDir: string;
  config: DiagnosticsConfig;
  /** Seeding runtime (validate:true) — the diagnostics build their own read-only one. */
  runtime: InteractionRuntime;
  cleanup: () => void;
}

export function makeEnv(overrides: Partial<DiagnosticsConfig> = {}): DiagEnv {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-diag-"));
  const interactionsRoot = path.join(repoRoot, ".chaos", "interactions");
  const runnersDir = path.join(interactionsRoot, "runners");
  const runtimeDir = path.join(repoRoot, ".chaos", "runtime");
  fs.mkdirSync(runnersDir, { recursive: true });
  fs.mkdirSync(runtimeDir, { recursive: true });
  // A minimal command so the command-contract probe does not flag a missing resume.
  fs.mkdirSync(path.join(repoRoot, ".claude", "commands"), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, ".claude", "commands", "chaos-resume.md"),
    "# chaos:resume\n",
    "utf8",
  );

  const config: DiagnosticsConfig = {
    repositoryRoot: repoRoot,
    interactionsRoot,
    schemaDir: REAL_SCHEMA_DIR,
    runnersDir,
    runtimeDir,
    commandsEnabled: true,
    enabled: true,
    staleDecisionAgeHours: 24,
    staleLockAgeHours: 24,
    expiredRunnerLeaseGraceMs: 30000,
    includeTodoCandidates: true,
    validateArtifacts: true,
    checkMcpPackage: true,
    checkDecisionCenterPackage: true,
    enforcementMode: "advisory",
    strictBlocksOnBlocker: true,
    writeHookViolations: true,
    blockOnPendingDecisionSameChange: false,
    blockOnMalformedState: false,
    hookViolationsPath: path.join(runtimeDir, "hook-violations.jsonl"),
    ...overrides,
  };

  const runtime = new InteractionRuntime({
    root: interactionsRoot,
    schemaDir: REAL_SCHEMA_DIR,
    validate: true,
    clock: fixedClock(),
    idFactory: counterIds(),
  });

  return {
    repoRoot,
    interactionsRoot,
    runnersDir,
    runtimeDir,
    config,
    runtime,
    cleanup: () => fs.rmSync(repoRoot, { recursive: true, force: true }),
  };
}

/** now = START + hours. */
export function nowPlusHours(hours: number): Date {
  return new Date(new Date(START_ISO).getTime() + hours * 3_600_000);
}

/** Seed a pending decision; returns { runId, decisionId }. */
export function seedPendingDecision(env: DiagEnv, changeId = "c1") {
  const begin = env.runtime.beginCommand({ sourceCommand: "chaos:apply", changeId });
  const dec = env.runtime.createDecision({
    commandRunId: begin.commandRunId!,
    title: "Choose",
    context: "ctx",
    options: OPTIONS,
    nextStep: "continue",
  });
  return { runId: begin.commandRunId!, decisionId: dec.decisionId };
}

/** Seed a ready-to-resume session (answers the decision). */
export function seedReadyToResume(env: DiagEnv, changeId = "c1") {
  const { runId, decisionId } = seedPendingDecision(env, changeId);
  env.runtime.answerDecision({ decisionId, selectedOptionId: "proceed", selectedBy: "u", rationale: "ok" });
  return { runId, decisionId };
}

export function writeRunnerLease(env: DiagEnv, lease: Record<string, unknown>): string {
  const p = path.join(env.runnersDir, `${lease.runnerId}.json`);
  fs.writeFileSync(p, JSON.stringify(lease, null, 2), "utf8");
  return p;
}

export function readHookViolations(env: DiagEnv): Array<Record<string, unknown>> {
  const p = env.config.hookViolationsPath;
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}
