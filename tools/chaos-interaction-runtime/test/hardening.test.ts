/**
 * EA-V3 hardening unit tests — the fixes routed from EA-X4.
 *
 * Covers reconcile() (F1/F2 self-heal + no-op-when-healthy), durable nextStep,
 * resume-capsule integrity hash (EA-I09), stale-temp GC, and the cross-process
 * write lock. These lock in the guarantees the EA-X4 abuse suite proves at scale.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { makeRuntime, SAMPLE_OPTIONS, REAL_SCHEMA_DIR, fixedClock, counterIds } from "./helpers.ts";
import { InteractionRuntime, verifyCapsuleIntegrity, sweepStaleTempFiles } from "../src/index.ts";
import { withFileLock } from "../src/store/writeLock.ts";

const OPTS = [
  { id: "proceed", label: "Proceed", recommended: true },
  { id: "stop", label: "Stop" },
];

// --------------------------------------------------------------------------
// reconcile — F1: decision persisted but session flip lost
// --------------------------------------------------------------------------
test("reconcile heals F1: a stranded waiting decision re-flips the session and recovers nextStep", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    runtime.beginCommand({ sourceCommand: "chaos:apply", changeId: "c1", commandRunId: "RUN-1" });
    const dec = runtime.createDecision({
      commandRunId: "RUN-1",
      changeId: "c1",
      title: "Pick",
      context: "ctx",
      options: OPTS,
      nextStep: "continue-step",
    });

    // Simulate the createDecision crash window: session never flipped, lost nextStep.
    const s = runtime.getSession("RUN-1")!;
    runtime.store.sessions.write({ ...s, state: "running", activeDecisionIds: [], nextStep: null });

    const { repaired } = runtime.reconcile();
    assert.deepEqual(repaired, ["RUN-1"]);

    const healed = runtime.getSession("RUN-1")!;
    assert.equal(healed.state, "waiting-for-decision");
    assert.deepEqual(healed.activeDecisionIds, [dec.decisionId]);
    assert.equal(healed.nextStep, "continue-step", "nextStep recovered from the decision's durable hint");

    // And it is now answerable -> ready-to-resume (continuation restored).
    const ans = runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionId: "proceed", selectedBy: "u" });
    assert.equal(ans.sessionState, "ready-to-resume");
  } finally {
    cleanup();
  }
});

// --------------------------------------------------------------------------
// reconcile — F2: decision answered but session flip lost
// --------------------------------------------------------------------------
test("reconcile heals F2: an answered decision with a lost session flip becomes ready-to-resume", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    runtime.beginCommand({ sourceCommand: "chaos:apply", changeId: "c1", commandRunId: "RUN-2" });
    const dec = runtime.createDecision({
      commandRunId: "RUN-2",
      changeId: "c1",
      title: "Pick",
      context: "ctx",
      options: OPTS,
      nextStep: "next-x",
    });
    runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionId: "proceed", selectedBy: "u" });

    // Simulate the lost session flip (panel+runner race): decision stays answered,
    // but the session is clobbered back to waiting-for-decision.
    const s = runtime.getSession("RUN-2")!;
    runtime.store.sessions.write({
      ...s,
      state: "waiting-for-decision",
      activeDecisionIds: [dec.decisionId],
      answeredDecisionIds: [],
      resumeCapsulePath: null,
    });

    const { repaired } = runtime.reconcile();
    assert.deepEqual(repaired, ["RUN-2"]);

    const healed = runtime.getSession("RUN-2")!;
    assert.equal(healed.state, "ready-to-resume");
    assert.deepEqual(healed.activeDecisionIds, []);
    assert.deepEqual(healed.answeredDecisionIds, [dec.decisionId]);

    // Now discoverable + resumable.
    const cands = runtime.findResumeCandidates({ commandRunId: "RUN-2" });
    assert.equal(cands.length, 1);
    assert.equal(cands[0]!.nextStep, "next-x");
    assert.equal(runtime.resumeCommand("RUN-2").sessionState, "running");
  } finally {
    cleanup();
  }
});

// --------------------------------------------------------------------------
// reconcile — no-op on healthy state
// --------------------------------------------------------------------------
test("reconcile is a strict no-op on a healthy store", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const b = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const d = runtime.createDecision({
      commandRunId: b.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
      nextStep: "n",
    });
    runtime.answerDecision({ decisionId: d.decisionId, selectedOptionId: "stop", selectedBy: "u" });

    const snapshot = () =>
      fs
        .readdirSync(root, { recursive: true })
        .map((f) => String(f))
        .filter((f) => !f.endsWith(".runtime.lock"))
        .sort()
        .map((f) => {
          const p = path.join(root, f);
          return fs.statSync(p).isFile() ? `${f}:${fs.readFileSync(p, "utf8")}` : f;
        })
        .join("\n");
    const before = snapshot();
    const { repaired } = runtime.reconcile();
    assert.deepEqual(repaired, []);
    assert.equal(snapshot(), before, "no file content changed by a no-op reconcile");
  } finally {
    cleanup();
  }
});

// --------------------------------------------------------------------------
// Capsule integrity hash (EA-I09)
// --------------------------------------------------------------------------
test("resume capsules carry a valid metadata.contentHash (EA-I09)", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const b = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const d = runtime.createDecision({
      commandRunId: b.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
      nextStep: "n",
    });
    runtime.answerDecision({ decisionId: d.decisionId, selectedOptionId: "stop", selectedBy: "u" });

    const capsule = runtime.getResumeCapsule(b.commandRunId!)!;
    assert.ok(capsule);
    assert.equal(typeof (capsule.metadata as Record<string, unknown>).contentHash, "string");
    assert.equal(verifyCapsuleIntegrity(capsule), true);
    assert.equal(runtime.verifyResumeCapsule(b.commandRunId!), "valid");
  } finally {
    cleanup();
  }
});

test("a tampered capsule is detected as 'tampered'", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const b = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const d = runtime.createDecision({
      commandRunId: b.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
      nextStep: "n",
    });
    runtime.answerDecision({ decisionId: d.decisionId, selectedOptionId: "stop", selectedBy: "u" });

    // Tamper with the content but keep the old hash.
    const capsule = runtime.getResumeCapsule(b.commandRunId!)!;
    runtime.store.capsules.write({ ...capsule, nextStep: "tampered-step" });
    assert.equal(runtime.verifyResumeCapsule(b.commandRunId!), "tampered");
  } finally {
    cleanup();
  }
});

// --------------------------------------------------------------------------
// Stale-temp GC
// --------------------------------------------------------------------------
test("sweepStaleTempFiles removes aged orphan temps but keeps fresh ones", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-sweep-"));
  try {
    const oldTmp = path.join(dir, ".locks.json.111.222.abc.tmp");
    const freshTmp = path.join(dir, ".index.json.333.444.def.tmp");
    const keep = path.join(dir, "index.json");
    fs.writeFileSync(oldTmp, "partial");
    fs.writeFileSync(freshTmp, "partial");
    fs.writeFileSync(keep, "{}");
    // Age the old temp well past the threshold.
    const past = new Date(Date.now() - 60_000);
    fs.utimesSync(oldTmp, past, past);

    const removed = sweepStaleTempFiles(dir, 30_000);
    assert.deepEqual(
      removed.map((p) => path.basename(p)),
      [".locks.json.111.222.abc.tmp"],
    );
    assert.ok(!fs.existsSync(oldTmp), "aged temp removed");
    assert.ok(fs.existsSync(freshTmp), "fresh temp preserved (may be an in-flight write)");
    assert.ok(fs.existsSync(keep), "non-temp file untouched");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --------------------------------------------------------------------------
// Write lock
// --------------------------------------------------------------------------
test("withFileLock runs the critical section and releases the lock file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-lock-"));
  try {
    const lock = path.join(dir, ".runtime.lock");
    const out = withFileLock(lock, () => {
      assert.ok(fs.existsSync(lock), "lock held during the critical section");
      return 42;
    });
    assert.equal(out, 42);
    assert.ok(!fs.existsSync(lock), "lock released after the critical section");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("withFileLock breaks a lock held by a dead pid (never wedges after a hard kill)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-lock-"));
  try {
    const lock = path.join(dir, ".runtime.lock");
    // A stale lock left by a process that no longer exists.
    fs.writeFileSync(lock, JSON.stringify({ pid: 2147483646, at: Date.now() }));
    const out = withFileLock(lock, () => "acquired", { timeoutMs: 2000 });
    assert.equal(out, "acquired");
    assert.ok(!fs.existsSync(lock));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("two runtimes over the same root serialise without wedging (lock released each op)", () => {
  const { runtime: rtA, root, cleanup } = makeRuntime();
  try {
    rtA.beginCommand({ sourceCommand: "chaos:apply", changeId: "c1", commandRunId: "RUN-A" });

    // A second runtime instance over the SAME root operates on the same store.
    const rtB = new InteractionRuntime({
      root,
      schemaDir: REAL_SCHEMA_DIR,
      validate: true,
      clock: fixedClock(),
      idFactory: counterIds(),
    });
    const dec = rtB.createDecision({
      commandRunId: "RUN-A",
      changeId: "c1",
      title: "Pick",
      context: "ctx",
      options: OPTS,
      nextStep: "n",
    });
    assert.equal(dec.status, "WAITING_FOR_USER_DECISION");

    // rtA still sees the decision and can act on it — neither instance is wedged.
    const active = rtA.getActiveDecision({ commandRunId: "RUN-A" });
    assert.equal(active.status, "ACTIVE_DECISION");
    assert.ok(!fs.existsSync(path.join(root, ".runtime.lock")), "lock not left held between ops");
  } finally {
    cleanup();
  }
});
