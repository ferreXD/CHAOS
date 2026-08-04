/**
 * EA-X4 abuse suite — shared harness (kill/resume under abuse).
 *
 * Grows inside the runtime test tree so it is CI-wireable and advances IL-RT9
 * (abuse-suite skeleton in CI). Everything runs in an isolated temp dir; the
 * real repo `.chaos/interactions/` is never touched.
 *
 * The model:
 *   - A child *worker* process drives a scripted governed command sequence
 *     (begin -> create decision -> write capsule -> answer) through the real
 *     `InteractionRuntime`, announcing checkpoints on stdout.
 *   - The parent hard-kills the worker (SIGKILL) at/near a seeded checkpoint so a
 *     write may be interrupted mid-flight (boundary kill) or mid-operation
 *     (mid-op kill, via a jittered delay after the op window opens).
 *   - From a clean in-process runtime the parent then runs a CORRUPTION AUDIT of
 *     the on-disk state and a RESUME ORACLE that continues the command and checks
 *     for correct continuation / exactly-once decision consumption / lock sanity.
 *
 * "Correct continuation" is judged against the *last durably committed* state
 * (read from disk), not against "the script finished" — because a hard kill can
 * legitimately land before, during, or after any commit. A run is CORRECT when
 * resume deterministically reaches a coherent, continuable state matching what
 * actually committed; it is INCORRECT when resume loses an answered decision,
 * double-consumes, finds the wrong candidate, or lands in an unrecoverable
 * inconsistent state.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { InteractionRuntime } from "../../src/index.ts";
import {
  MalformedStateError,
  validateAgainstSchemaFile,
  SchemaValidationError,
  SCHEMA_FILES,
  verifyCapsuleIntegrity,
  type Clock,
  type IdFactory,
} from "../../src/index.ts";
import type { ResumeCapsule } from "../../src/index.ts";
import { Prng } from "./prng.ts";

// --------------------------------------------------------------------------
// Paths / constants
// --------------------------------------------------------------------------

/** Authoritative Iteration-0 schema directory (repo `.chaos/interactions/schema`). */
export const REAL_SCHEMA_DIR = path.resolve(
  import.meta.dirname,
  "../../../../.chaos/interactions/schema",
);

export const WORKER_PATH = path.resolve(import.meta.dirname, "worker.ts");

/** The ordered checkpoints of the scripted governed sequence. */
export const CHECKPOINTS = ["begin", "decision", "capsule", "answer", "post"] as const;
export type Checkpoint = (typeof CHECKPOINTS)[number];

export const EXPECTED_NEXT_STEP = "ea-x4-continue";

// --------------------------------------------------------------------------
// Deterministic clock + id factory (per process, collision-safe across roles)
// --------------------------------------------------------------------------

/** Monotonic 1s-step clock from a fixed base (schema-valid ISO date-times). */
export function seededClock(baseIso = "2026-07-19T00:00:00.000Z"): Clock {
  let t = new Date(baseIso).getTime();
  return {
    now() {
      const d = new Date(t);
      t += 1000;
      return d;
    },
  };
}

/**
 * Counter-based ids namespaced by `prefix` so parallel processes writing to the
 * same store never collide on decision/lock/event ids. Ids satisfy the schema
 * pattern `^[A-Za-z0-9][A-Za-z0-9._:-]*$`.
 */
export function prefixedIds(prefix: string): IdFactory {
  let dec = 0;
  let lock = 0;
  let evt = 0;
  let run = 0;
  return {
    runId: () => `RUN-${prefix}-${++run}`,
    decisionId: () => `DEC-${prefix}-${++dec}`,
    lockId: () => `LOCK-${prefix}-${++lock}`,
    eventId: () => `EVT-${prefix}-${++evt}`,
  };
}

export function makeRuntime(root: string, prefix: string): InteractionRuntime {
  return new InteractionRuntime({
    root,
    schemaDir: REAL_SCHEMA_DIR,
    validate: true,
    clock: seededClock(),
    idFactory: prefixedIds(prefix),
  });
}

export const ANSWER_OPTIONS = [
  { id: "proceed", label: "Proceed", recommended: true },
  { id: "stop", label: "Stop" },
];

// --------------------------------------------------------------------------
// Corruption audit
// --------------------------------------------------------------------------

export interface CorruptionReport {
  corrupted: boolean;
  tornJson: string[];          // *.json files that failed to parse
  tornAuditLine: string[];     // *.jsonl files with an unparseable line
  schemaInvalid: string[];     // persisted records that violate their schema
  orphanTemp: string[];        // leftover atomic-write .tmp files
  missingTrailingNewline: string[]; // *.jsonl not ending in '\n' (soft signal)
  nullCapsuleHash: boolean;    // any capsule lacking a metadata.contentHash (EA-I09 gap)
  capsuleHashInvalid: string[]; // capsule whose stored hash does not match its content (corruption)
  capsulesVerified: number;    // capsules with a present, valid integrity hash
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function validateRecord(label: string, schemaFile: string, data: unknown): string | null {
  try {
    validateAgainstSchemaFile(label, path.join(REAL_SCHEMA_DIR, schemaFile), data);
    return null;
  } catch (err) {
    if (err instanceof SchemaValidationError) return `${label}: ${err.errors.map((e) => e.message).join("; ")}`;
    throw err;
  }
}

/** Audit every on-disk artifact under a runtime root for kill-induced corruption. */
export function corruptionAudit(root: string): CorruptionReport {
  const rep: CorruptionReport = {
    corrupted: false,
    tornJson: [],
    tornAuditLine: [],
    schemaInvalid: [],
    orphanTemp: [],
    missingTrailingNewline: [],
    nullCapsuleHash: false,
    capsuleHashInvalid: [],
    capsulesVerified: 0,
  };
  const rel = (p: string) => path.relative(root, p).split(path.sep).join("/");

  for (const file of walk(root)) {
    const base = path.basename(file);
    if (file.startsWith(path.join(root, "schema") + path.sep)) continue; // skip schema copies if any
    if (base.endsWith(".tmp")) {
      rep.orphanTemp.push(rel(file));
      continue;
    }
    if (base.endsWith(".jsonl")) {
      let raw: string;
      try {
        raw = fs.readFileSync(file, "utf8");
      } catch {
        rep.tornAuditLine.push(rel(file));
        continue;
      }
      if (raw.length > 0 && !raw.endsWith("\n")) rep.missingTrailingNewline.push(rel(file));
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t) continue;
        try {
          const evt = JSON.parse(t);
          const schemaErr = validateRecord(`audit-event ${rel(file)}`, SCHEMA_FILES.auditEvent, evt);
          if (schemaErr) rep.schemaInvalid.push(schemaErr);
        } catch {
          rep.tornAuditLine.push(`${rel(file)} :: ${t.slice(0, 60)}`);
        }
      }
      continue;
    }
    if (base.endsWith(".json")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        rep.tornJson.push(rel(file));
        continue;
      }
      // Schema-validate by location.
      const relPath = rel(file);
      let err: string | null = null;
      if (relPath.startsWith("sessions/")) err = validateRecord(`session ${relPath}`, SCHEMA_FILES.session, parsed);
      else if (relPath.endsWith("/decision.json")) err = validateRecord(`decision ${relPath}`, SCHEMA_FILES.decision, parsed);
      else if (relPath.endsWith("/response.json")) err = validateRecord(`response ${relPath}`, SCHEMA_FILES.response, parsed);
      else if (relPath.startsWith("capsules/")) {
        err = validateRecord(`capsule ${relPath}`, SCHEMA_FILES.resumeCapsule, parsed);
        // EA-I09: a resume capsule now carries a metadata.contentHash integrity
        // check. Missing => the null-hash gap; present-but-mismatched => the
        // capsule content was torn/tampered (counts as corruption).
        const capsule = parsed as ResumeCapsule;
        const stored = (capsule.metadata as Record<string, unknown> | undefined)?.["contentHash"];
        if (typeof stored !== "string" || stored.length === 0) {
          rep.nullCapsuleHash = true;
        } else if (verifyCapsuleIntegrity(capsule)) {
          rep.capsulesVerified++;
        } else {
          rep.capsuleHashInvalid.push(relPath);
        }
      } else if (relPath === "locks.json") {
        const locks = (parsed as { locks?: unknown[] }).locks ?? [];
        for (const lock of locks) {
          const e = validateRecord(`lock ${relPath}`, SCHEMA_FILES.lock, lock);
          if (e) { err = e; break; }
        }
      } else if (relPath === "active.json") err = validateRecord(`active ${relPath}`, SCHEMA_FILES.activeState, parsed);
      else if (relPath === "index.json") err = validateRecord(`index ${relPath}`, SCHEMA_FILES.index, parsed);
      if (err) rep.schemaInvalid.push(err);
    }
  }

  rep.corrupted =
    rep.tornJson.length > 0 ||
    rep.tornAuditLine.length > 0 ||
    rep.schemaInvalid.length > 0 ||
    rep.capsuleHashInvalid.length > 0;
  return rep;
}

// --------------------------------------------------------------------------
// Resume oracle
// --------------------------------------------------------------------------

export interface ResumeExpectation {
  runId: string;
  changeId: string;
  decisionId: string;
  expectedNextStep: string;
  answerOptionId: string;
  selectedBy: string;
}

export type Classification =
  | "no-session"                     // begin never committed — nothing to resume (legal)
  | "no-decision"                    // decision never committed — session running (legal)
  | "waiting-answerable"             // decision waiting + session flipped — answer now (legal)
  | "ready-answer-committed"         // answer fully committed — resume directly (legal)
  | "consumed"                       // decision already consumed coherently (legal)
  | "degraded-createdecision-window" // decision persisted but session not flipped (BUG: non-atomic createDecision)
  | "inconsistent-lost-answer"       // decision answered/consumed but session not flipped (BUG: lost session flip)
  | "inconsistent-other";            // any other incoherent shape (BUG)

export interface ResumeResult {
  classification: Classification;
  continuedCorrectly: boolean;
  resumeFoundCandidate: boolean | null;
  nextStepMatched: boolean | null;
  consumeExactlyOnce: boolean | null; // idempotent consume leaves exactly-once effect
  lockAnomaly: string | null;
  capsuleUseful: boolean | null;   // did a resume capsule alone carry nextStep?
  notes: string[];
  error?: string;
}

/**
 * Continue the killed command from a clean in-process runtime and judge whether
 * it resumed correctly. Mutates the store (this IS the resume happening).
 */
export function resumeOracle(root: string, exp: ResumeExpectation): ResumeResult {
  const rt = makeRuntime(root, "resume");
  const res: ResumeResult = {
    classification: "inconsistent-other",
    continuedCorrectly: false,
    resumeFoundCandidate: null,
    nextStepMatched: null,
    consumeExactlyOnce: null,
    lockAnomaly: null,
    capsuleUseful: null,
    notes: [],
  };

  try {
    // Self-heal: the fixed runtime reconciles partial/raced state on every resume
    // entry point (beginCommand / findResumeCandidates / getActiveDecision). Invoke
    // it explicitly here so the oracle measures the runtime's actual resume path.
    // (No-op on a healthy store; on the pre-fix runtime this method does not exist
    // and the harness measured the raw, un-healed state — see the pre-fix results.)
    if (typeof (rt as unknown as { reconcile?: unknown }).reconcile === "function") {
      (rt as unknown as { reconcile: () => void }).reconcile();
    }
    const session = rt.getSession(exp.runId);
    const decision = rt.getDecision(exp.decisionId);
    const capsule = rt.getResumeCapsule(exp.runId);
    res.capsuleUseful = capsule ? capsule.nextStep === exp.expectedNextStep : null;

    // ---- classify committed state --------------------------------------
    if (!session) {
      res.classification = "no-session";
      res.continuedCorrectly = true; // nothing was durably promised
      res.notes.push("begin did not commit; no orphaned state to resume");
      return res;
    }
    if (!decision) {
      res.classification = "no-decision";
      // Legal iff the session is in a non-terminal, re-drivable state.
      res.continuedCorrectly = session.state === "running" || session.state === "created";
      res.notes.push(`session=${session.state}, no decision committed (re-drivable, nothing lost)`);
      return res;
    }

    const dState = decision.state;
    const sState = session.state;

    // BUG class: the answer (and/or consume) committed on the decision side but
    // the session was never flipped to ready-to-resume. The answer is durable
    // (response.json exists) yet the run is frozen: findResumeCandidates skips it
    // (not ready-to-resume) and getActiveDecision skips it (decision not waiting),
    // so neither the auto-resume path nor the Decision Center can continue it.
    if ((dState === "answered" || dState === "consumed") && sState === "waiting-for-decision") {
      res.classification = "inconsistent-lost-answer";
      res.resumeFoundCandidate = rt.findResumeCandidates({ commandRunId: exp.runId }).length > 0;
      const active = rt.getActiveDecision({ commandRunId: exp.runId });
      res.continuedCorrectly = false;
      res.notes.push(
        `decision=${dState} but session=waiting-for-decision (session flip lost); ` +
          `findResumeCandidates=${res.resumeFoundCandidate}, getActiveDecision=${active.status} -> not continuable via public API`,
      );
      return res;
    }

    // BUG class: createDecision persisted decision.json BEFORE flipping the
    // session (non-atomic multi-file op). A kill in that window leaves the
    // decision waiting but the session still 'running' and NOT referencing it,
    // and the derived active.json/index.json stale. The decision is only
    // discoverable via a direct getActiveDecision scan; answering it will NOT
    // reach ready-to-resume (session state/activeDecisionIds mismatch), so the
    // documented resume path cannot continue it to the expected nextStep.
    if (dState === "waiting" && sState !== "waiting-for-decision") {
      res.classification = "degraded-createdecision-window";
      const active = rt.getActiveDecision({ commandRunId: exp.runId });
      const discoverable = active.status === "ACTIVE_DECISION";
      const referenced = session.activeDecisionIds.includes(exp.decisionId);
      res.resumeFoundCandidate = false;
      res.continuedCorrectly = false;
      res.notes.push(
        `decision=waiting but session=${sState}, activeDecisionIds${referenced ? " references" : " does NOT reference"} it; ` +
          `getActiveDecision=${active.status} (scan-discoverable=${discoverable}); ` +
          `derived active.json stale, session flip + nextStep linkage lost -> auto-resume cannot continue`,
      );
      return res;
    }

    if (dState === "waiting" && sState === "waiting-for-decision") {
      // Clean paused-for-decision state — resume by answering now.
      res.classification = "waiting-answerable";
      const ans = rt.answerDecision({
        decisionId: exp.decisionId,
        selectedOptionId: exp.answerOptionId,
        selectedBy: exp.selectedBy,
      });
      if (ans.sessionState !== "ready-to-resume") {
        res.notes.push(`answer did not reach ready-to-resume (got ${ans.sessionState})`);
        return res;
      }
      return finishResume(rt, exp, res, "answered-on-resume");
    }

    if (dState === "answered" && sState === "ready-to-resume") {
      res.classification = "ready-answer-committed";
      // Verify the persisted response reflects the intended answer.
      const resp = rt.store.decisions.readResponse(exp.decisionId);
      if (!resp) res.notes.push("answered decision has no response.json");
      return finishResume(rt, exp, res, "answer-committed");
    }

    if (dState === "consumed" && (sState === "ready-to-resume" || sState === "resumed" || sState === "running")) {
      // Already consumed by a (concurrent) writer; the run is past the decision.
      res.classification = "consumed";
      res.consumeExactlyOnce = assertConsumeExactlyOnce(rt, exp.runId, exp.decisionId, res);
      res.continuedCorrectly = res.consumeExactlyOnce === true;
      res.lockAnomaly = lockCheck(rt, exp.changeId);
      return res;
    }

    // Anything else is an unexpected shape.
    res.classification = "inconsistent-other";
    res.notes.push(`unexpected shape: decision=${dState}, session=${sState}`);
    return res;
  } catch (err) {
    res.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    res.notes.push(`oracle threw: ${res.error}`);
    return res;
  }
}

function finishResume(
  rt: InteractionRuntime,
  exp: ResumeExpectation,
  res: ResumeResult,
  via: string,
): ResumeResult {
  const candidates = rt.findResumeCandidates({ commandRunId: exp.runId });
  res.resumeFoundCandidate = candidates.length === 1;
  const cand = candidates[0];
  res.nextStepMatched = cand ? cand.nextStep === exp.expectedNextStep : false;
  if (!cand) {
    res.notes.push(`no resume candidate found after ${via}`);
    return res;
  }
  // Advance ready-to-resume -> running, then consume the decision.
  rt.resumeCommand(exp.runId);
  const consumed = rt.markDecisionConsumed(exp.decisionId);
  const okConsumed = consumed.status === "CONSUMED";
  res.consumeExactlyOnce = assertConsumeExactlyOnce(rt, exp.runId, exp.decisionId, res);
  res.lockAnomaly = lockCheck(rt, exp.changeId);
  // Complete the command to release the lock (mirrors a real command finishing).
  let completedOk = true;
  try {
    rt.completeCommand(exp.runId);
  } catch (err) {
    completedOk = false;
    res.notes.push(`completeCommand failed: ${(err as Error).message}`);
  }
  res.continuedCorrectly =
    res.resumeFoundCandidate === true &&
    res.nextStepMatched === true &&
    okConsumed &&
    res.consumeExactlyOnce === true &&
    completedOk;
  return res;
}

/**
 * markDecisionConsumed is idempotent by design (consumed->consumed is a no-op,
 * per transitionDecision + addUnique). The invariant that matters is exactly-once
 * EFFECT: a redundant consume must not duplicate the record or resurrect the
 * answered state. Returns true iff the effect stays exactly-once.
 */
function assertConsumeExactlyOnce(
  rt: InteractionRuntime,
  runId: string,
  decisionId: string,
  res: ResumeResult,
): boolean {
  let redundantThrew = false;
  try {
    rt.markDecisionConsumed(decisionId); // redundant call; expected to be a safe no-op
  } catch {
    redundantThrew = true; // also acceptable (hard refusal) — still exactly-once
  }
  const s = rt.getSession(runId);
  const consumedCount = s ? s.consumedDecisionIds.filter((d) => d === decisionId).length : -1;
  const stillAnswered = s ? s.answeredDecisionIds.includes(decisionId) : false;
  const decState = rt.getDecision(decisionId)?.state;
  const ok = consumedCount === 1 && !stillAnswered && decState === "consumed";
  if (!ok) {
    res.notes.push(
      `consume-exactly-once VIOLATED: consumedCount=${consumedCount}, stillAnswered=${stillAnswered}, ` +
        `decisionState=${decState}, redundantThrew=${redundantThrew}`,
    );
  }
  return ok;
}

/** Returns a description of a lock anomaly, or null when locks look coherent. */
function lockCheck(rt: InteractionRuntime, changeId: string): string | null {
  const locks = rt.listLocks().filter((l) => l.changeId === changeId);
  // After a completed command the owning lock must not remain active.
  const activeStale = locks.filter((l) => l.state === "active" && l.stale);
  if (activeStale.length > 0) {
    return `active-but-stale lock(s): ${activeStale.map((l) => `${l.lockId}(${l.staleReason})`).join(", ")}`;
  }
  return null;
}

// --------------------------------------------------------------------------
// Worker spawning + kill orchestration
// --------------------------------------------------------------------------

export type Mechanism = "boundary" | "mid-op" | "concurrent";

export interface WorkerConfig {
  root: string;
  runId: string;
  changeId: string;
  idPrefix: string;
  role: "solo" | "panel" | "runner";
  killAt: Checkpoint;
  burst: boolean;
  answerOptionId: string;
  selectedBy: string;
  preSeeded: boolean; // panel/runner: base already seeded by parent
  decisionId?: string; // concurrent: the shared decision id
}

interface WorkerOutcome {
  killedBySignal: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  sawHot: boolean;
  lastStep: string | null;
  stderr: string;
}

function spawnWorker(config: WorkerConfig): {
  child: ChildProcess;
  onLine: (cb: (line: string) => void) => void;
  done: Promise<WorkerOutcome>;
} {
  const child = spawn(process.execPath, [WORKER_PATH, JSON.stringify(config)], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lineCbs: Array<(line: string) => void> = [];
  let buf = "";
  let sawHot = false;
  let lastStep: string | null = null;
  let stderr = "";
  child.stdout!.setEncoding("utf8");
  child.stdout!.on("data", (chunk: string) => {
    buf += chunk;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      if (line === "HOT") sawHot = true;
      if (line.startsWith("STEP ")) lastStep = line.slice(5);
      for (const cb of lineCbs) cb(line);
    }
  });
  child.stderr!.setEncoding("utf8");
  child.stderr!.on("data", (c: string) => (stderr += c));

  const done = new Promise<WorkerOutcome>((resolve) => {
    child.on("exit", (code, signal) => {
      resolve({
        killedBySignal: signal !== null,
        exitCode: code,
        signal,
        sawHot,
        lastStep,
        stderr,
      });
    });
  });
  return { child, onLine: (cb) => lineCbs.push(cb), done };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hard-kill helper (SIGKILL == TerminateProcess on Windows). */
function hardKill(child: ChildProcess): void {
  try {
    child.kill("SIGKILL");
  } catch {
    /* already gone */
  }
}

// --------------------------------------------------------------------------
// Per-iteration run
// --------------------------------------------------------------------------

export interface IterationResult {
  iteration: number;
  seed: number;
  variant: "single" | "concurrent";
  killAt: Checkpoint;
  mechanism: Mechanism;
  jitterMs: number;
  killLanded: boolean;          // was the worker actually terminated by signal
  lastStepReached: string | null;
  classification: Classification;
  continuedCorrectly: boolean;
  corruptionPostKill: boolean;
  corruption: CorruptionReport;
  corruptionPostResume: boolean;
  consumeExactlyOnce: boolean | null;
  resumeFoundCandidate: boolean | null;
  nextStepMatched: boolean | null;
  capsuleUseful: boolean | null;
  lockAnomaly: string | null;
  workerStderr: string;
  notes: string[];
}

const SAFETY_TIMEOUT_MS = 10_000;

export async function runIteration(iteration: number): Promise<IterationResult> {
  const seed = iteration;
  const prng = new Prng(seed * 2654435761);
  const variant: "single" | "concurrent" = iteration > 14 ? "concurrent" : "single";
  // For the concurrent variant the kill is always mid-race on the answer, so the
  // recorded killAt/mechanism reflect what actually happens (not the unused
  // single-kill draw). Single-kill runs vary checkpoint + boundary/mid-op.
  const killAt: Checkpoint = variant === "concurrent" ? "answer" : (prng.pick(CHECKPOINTS.filter((c) => c !== "post")) as Checkpoint);
  const mechanism: Mechanism = variant === "concurrent" ? "concurrent" : prng.next() < 0.5 ? "boundary" : "mid-op";
  const jitterMs = prng.int(0, 6);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), `chaos-x4-it${iteration}-`));
  const changeId = `ea-x4-change-${iteration}`;
  const runId = `RUN-x4-it${iteration}`;
  const decisionId = `DEC-x4-it${iteration}`;
  const notes: string[] = [];

  try {
    if (variant === "single") {
      await runSingle(root, runId, changeId, killAt, mechanism, jitterMs, prng, notes);
    } else {
      await runConcurrent(root, runId, changeId, decisionId, jitterMs, prng, notes);
    }

    // Corruption audit of the on-disk state left by the kill.
    const corruption = corruptionAudit(root);

    // Resume + correctness oracle.
    const oracle = resumeOracle(root, {
      runId,
      changeId,
      decisionId: variant === "concurrent" ? decisionId : deriveSoloDecisionId(root, runId, decisionId),
      expectedNextStep: EXPECTED_NEXT_STEP,
      answerOptionId: "proceed",
      selectedBy: variant === "concurrent" ? "panel" : "abuse-runner",
    });

    // Re-audit after resume to ensure resume itself did not corrupt anything.
    const postResume = corruptionAudit(root);

    return {
      iteration,
      seed,
      variant,
      killAt,
      mechanism,
      jitterMs,
      killLanded: notes.includes("__killed__"),
      lastStepReached: notes.find((n) => n.startsWith("laststep:"))?.slice("laststep:".length) ?? null,
      classification: oracle.classification,
      continuedCorrectly: oracle.continuedCorrectly,
      corruptionPostKill: corruption.corrupted,
      corruption,
      corruptionPostResume: postResume.corrupted,
      consumeExactlyOnce: oracle.consumeExactlyOnce,
      resumeFoundCandidate: oracle.resumeFoundCandidate,
      nextStepMatched: oracle.nextStepMatched,
      capsuleUseful: oracle.capsuleUseful,
      lockAnomaly: oracle.lockAnomaly,
      workerStderr: notes.find((n) => n.startsWith("stderr:"))?.slice("stderr:".length) ?? "",
      notes: [...oracle.notes, ...notes.filter((n) => !n.startsWith("laststep:") && !n.startsWith("stderr:") && n !== "__killed__")],
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/**
 * The solo worker creates the decision with its own id-prefix, so we must
 * discover the actual decision id on disk (there is exactly one).
 */
function deriveSoloDecisionId(root: string, _runId: string, fallback: string): string {
  const dir = path.join(root, "decisions");
  if (!fs.existsSync(dir)) return fallback;
  const dirs = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  return dirs[0]?.name ?? fallback;
}

async function runSingle(
  root: string,
  runId: string,
  changeId: string,
  killAt: Checkpoint,
  mechanism: Mechanism,
  jitterMs: number,
  prng: Prng,
  notes: string[],
): Promise<void> {
  const cfg: WorkerConfig = {
    root,
    runId,
    changeId,
    idPrefix: "solo",
    role: "solo",
    killAt,
    burst: mechanism === "mid-op",
    answerOptionId: "proceed",
    selectedBy: "abuse-runner",
    preSeeded: false,
  };
  const { child, onLine, done } = spawnWorker(cfg);
  let killScheduled = false;
  const scheduleKill = async (delay: number) => {
    if (killScheduled) return;
    killScheduled = true;
    if (delay > 0) await sleep(delay);
    hardKill(child);
  };

  onLine((line) => {
    if (mechanism === "boundary" && line === `STEP ${killAt}`) {
      // Kill at/around the start of the target op (may land just before/inside it).
      void scheduleKill(prng.int(0, 1));
    } else if (mechanism === "mid-op" && line === "HOT") {
      void scheduleKill(jitterMs);
    }
  });

  const safety = setTimeout(() => hardKill(child), SAFETY_TIMEOUT_MS);
  const outcome = await done;
  clearTimeout(safety);
  recordOutcome(outcome, notes);
}

async function runConcurrent(
  root: string,
  runId: string,
  changeId: string,
  decisionId: string,
  jitterMs: number,
  prng: Prng,
  notes: string[],
): Promise<void> {
  // Parent pre-seeds the base run to waiting-for-decision (+ capsule) with a
  // fixed, shared decision id both writers will race on.
  const seedRt = makeRuntime(root, "seed");
  seedRt.beginCommand({ sourceCommand: "chaos:apply", changeId, commandRunId: runId });
  // Force the shared decision id via a dedicated id factory.
  const seedRt2 = new InteractionRuntime({
    root,
    schemaDir: REAL_SCHEMA_DIR,
    validate: true,
    clock: seededClock(),
    idFactory: {
      runId: () => runId,
      decisionId: () => decisionId,
      lockId: () => `LOCK-seed-${changeId}`,
      eventId: (() => { let n = 0; return () => `EVT-seed-${++n}`; })(),
    },
  });
  seedRt2.createDecision({
    commandRunId: runId,
    changeId,
    title: "EA-X4 concurrent decision",
    context: "panel+runner race",
    options: ANSWER_OPTIONS,
    nextStep: EXPECTED_NEXT_STEP,
  });
  seedRt2.createResumeCapsule(runId, { nextStep: EXPECTED_NEXT_STEP, intent: "EA-X4 concurrent seed" });

  const mkCfg = (role: "panel" | "runner", prefix: string): WorkerConfig => ({
    root,
    runId,
    changeId,
    idPrefix: prefix,
    role,
    killAt: "answer",
    burst: true,
    answerOptionId: "proceed",
    selectedBy: role,
    preSeeded: true,
    decisionId,
  });

  const panel = spawnWorker(mkCfg("panel", `p${prng.int(1000, 9999)}`));
  const runner = spawnWorker(mkCfg("runner", `r${prng.int(1000, 9999)}`));

  // Wait until both writers have opened their write window (HOT), then kill
  // mid-race after a small jitter. Order of kills varies by seed.
  let panelHot = false;
  let runnerHot = false;
  const bothHot = new Promise<void>((resolve) => {
    const check = () => { if (panelHot && runnerHot) resolve(); };
    panel.onLine((l) => { if (l === "HOT") { panelHot = true; check(); } });
    runner.onLine((l) => { if (l === "HOT") { runnerHot = true; check(); } });
  });
  await Promise.race([bothHot, sleep(2000)]);
  await sleep(jitterMs);
  const killPanelFirst = prng.next() < 0.5;
  if (killPanelFirst) { hardKill(panel.child); hardKill(runner.child); }
  else { hardKill(runner.child); hardKill(panel.child); }

  const safety = setTimeout(() => { hardKill(panel.child); hardKill(runner.child); }, SAFETY_TIMEOUT_MS);
  const [po, ro] = await Promise.all([panel.done, runner.done]);
  clearTimeout(safety);
  recordOutcome(po, notes, "panel");
  recordOutcome(ro, notes, "runner");
}

function recordOutcome(outcome: WorkerOutcome, notes: string[], label = "worker"): void {
  if (outcome.killedBySignal) notes.push("__killed__");
  if (outcome.lastStep) notes.push(`laststep:${outcome.lastStep}`);
  if (outcome.stderr.trim()) notes.push(`stderr:[${label}] ${outcome.stderr.trim().slice(0, 400)}`);
}
