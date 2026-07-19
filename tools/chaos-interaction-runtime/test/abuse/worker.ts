/**
 * EA-X4 abuse suite — child worker.
 *
 * Spawned by the harness as a subprocess: `node worker.ts <configJson>`. It
 * drives a scripted governed command sequence through the REAL InteractionRuntime
 * against an isolated temp store, announcing checkpoints on stdout so the parent
 * can hard-kill (SIGKILL) it at/near a chosen point — possibly mid-write.
 *
 * Protocol (stdout, one token per line):
 *   STEP <checkpoint>   about to perform that step
 *   DONE <checkpoint>   step's runtime call returned (committed)
 *   HOT                 write window is open (mid-op kill target)
 *   FINISHED            whole sequence completed without being killed
 *
 * The worker only ever uses public runtime APIs — exactly how a real command,
 * the Decision Center answer bridge, and the auto-resume runner drive the store.
 *
 * Import-safe: only runs when invoked as the process entry point, so `node --test`
 * (which imports every file under `test/`) does not execute it.
 */

import * as path from "node:path";
import { InteractionRuntime } from "../../src/index.ts";
import {
  REAL_SCHEMA_DIR,
  seededClock,
  prefixedIds,
  ANSWER_OPTIONS,
  EXPECTED_NEXT_STEP,
  type WorkerConfig,
} from "./harness.ts";

const CHURN_CAP = 1_000_000;

function say(line: string): void {
  process.stdout.write(line + "\n");
}

function makeRuntime(cfg: WorkerConfig): InteractionRuntime {
  return new InteractionRuntime({
    root: cfg.root,
    schemaDir: REAL_SCHEMA_DIR,
    validate: true,
    clock: seededClock(),
    idFactory: prefixedIds(cfg.idPrefix),
  });
}

/** Keep writes flowing (atomic capsule + session + audit rewrites) until killed. */
function churn(rt: InteractionRuntime, cfg: WorkerConfig, tag: string): never {
  for (let i = 0; i < CHURN_CAP; i++) {
    try {
      rt.createResumeCapsule(cfg.runId, { nextStep: EXPECTED_NEXT_STEP, intent: `${tag}-${i}` });
    } catch {
      /* session may be gone/terminal in a race; keep spinning until killed */
    }
  }
  process.exit(0);
}

function runSolo(rt: InteractionRuntime, cfg: WorkerConfig): void {
  const hotAt = cfg.burst ? cfg.killAt : null;

  if (hotAt === "begin") say("HOT");
  say("STEP begin");
  rt.beginCommand({ sourceCommand: "chaos:apply", changeId: cfg.changeId, commandRunId: cfg.runId });
  say("DONE begin");

  if (hotAt === "decision") say("HOT");
  say("STEP decision");
  const dec = rt.createDecision({
    commandRunId: cfg.runId,
    changeId: cfg.changeId,
    title: "EA-X4 execution decision",
    context: "Scripted governed sequence under kill/resume abuse.",
    options: ANSWER_OPTIONS,
    recommendedOptionId: "proceed",
    nextStep: EXPECTED_NEXT_STEP,
  });
  say("DONE decision");

  if (hotAt === "capsule") say("HOT");
  say("STEP capsule");
  rt.createResumeCapsule(cfg.runId, {
    nextStep: EXPECTED_NEXT_STEP,
    intent: "Resume EA-X4 scripted sequence.",
    approvedScope: ["ea-x4-scope"],
  });
  say("DONE capsule");

  if (hotAt === "answer") say("HOT");
  say("STEP answer");
  rt.answerDecision({
    decisionId: dec.decisionId,
    selectedOptionId: cfg.answerOptionId,
    selectedBy: cfg.selectedBy,
  });
  say("DONE answer");

  say("FINISHED");
  if (cfg.burst) churn(rt, cfg, "post"); // keep writing so a late kill still lands on a write
  process.exit(0);
}

function runPanel(rt: InteractionRuntime, cfg: WorkerConfig): void {
  // Decision Center answer bridge: answer the shared decision, then keep writing.
  say("HOT");
  try {
    rt.answerDecision({ decisionId: cfg.decisionId!, selectedOptionId: cfg.answerOptionId, selectedBy: "panel" });
  } catch {
    /* runner may have already driven the decision past 'waiting' */
  }
  churn(rt, cfg, "panel");
}

function runRunner(rt: InteractionRuntime, cfg: WorkerConfig): void {
  // Auto-resume runner: persist runner artifacts (capsule rewrites) and try to
  // consume the decision, racing the panel's answer on the same session/change.
  say("HOT");
  for (let i = 0; i < CHURN_CAP; i++) {
    try {
      rt.createResumeCapsule(cfg.runId, { nextStep: EXPECTED_NEXT_STEP, intent: `runner-${i}` });
    } catch {
      /* ignore */
    }
    if (i % 3 === 0) {
      try {
        rt.markDecisionConsumed(cfg.decisionId!); // valid only once the panel has answered
      } catch {
        /* not answerable yet / already consumed — expected in the race */
      }
    }
  }
  process.exit(0);
}

function main(): void {
  const cfg: WorkerConfig = JSON.parse(process.argv[2]!);
  const rt = makeRuntime(cfg);
  try {
    if (cfg.role === "solo") runSolo(rt, cfg);
    else if (cfg.role === "panel") runPanel(rt, cfg);
    else runRunner(rt, cfg);
  } catch (err) {
    process.stderr.write((err instanceof Error ? `${err.name}: ${err.message}` : String(err)) + "\n");
    process.exit(1);
  }
}

const isMain = !!process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename;
if (isMain) main();
