/** resumeCommand: ready-to-resume -> resumed -> running (Iteration 5 addition). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { makeRuntime, SAMPLE_OPTIONS } from "./helpers.ts";

/** Drive a run to ready-to-resume (answered decision), returning its run id. */
function readyRun(runtime: ReturnType<typeof makeRuntime>["runtime"], changeId: string) {
  const begin = runtime.beginCommand({ sourceCommand: "chaos:apply", changeId });
  const dec = runtime.createDecision({
    commandRunId: begin.commandRunId!,
    title: "Pick",
    context: "ctx",
    options: SAMPLE_OPTIONS,
    nextStep: "continue",
  });
  runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionId: "stop", selectedBy: "u" });
  return begin.commandRunId!;
}

test("resumeCommand advances a ready-to-resume session to running", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    assert.equal(runtime.getSession(runId)!.state, "ready-to-resume");
    const result = runtime.resumeCommand(runId);
    assert.equal(result.status, "RESUMED");
    assert.equal(result.sessionState, "running");
    assert.equal(runtime.getSession(runId)!.state, "running");
  } finally {
    cleanup();
  }
});

test("resumeCommand is idempotent when already running", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    runtime.resumeCommand(runId);
    // Calling again on a running session is a no-op that stays running.
    const result = runtime.resumeCommand(runId);
    assert.equal(result.sessionState, "running");
  } finally {
    cleanup();
  }
});

test("resumeCommand refuses a non-resumable (completed) session", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    runtime.completeCommand(runId);
    assert.throws(() => runtime.resumeCommand(runId), /SESSION_NOT_RESUMABLE|not resumable|ready-to-resume/i);
  } finally {
    cleanup();
  }
});

test("resumeCommand throws NotFound for an unknown run", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    assert.throws(() => runtime.resumeCommand("RUN-nope"));
  } finally {
    cleanup();
  }
});

// --- B3 regression (2026-08-05): the duplicate-question defect ---------------
// A createDecision on a ready-to-resume session used to persist the decision and
// its lock BEFORE the state transition threw INVALID_STATE_TRANSITION: the caller
// saw an error while the Decision Center showed the question. The retry then
// duplicated it (and once the human had answered the first copy, the "waiting"
// idempotency guard no longer matched, so a third copy could appear).

function decisionDirs(root: string): string[] {
  const dir = path.join(root, "decisions");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((e) => e.startsWith("DEC-")) : [];
}

test("createDecision on ready-to-resume persists NOTHING (no decision, no lock)", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    const decisionsBefore = decisionDirs(root).length;
    const locksBefore = runtime.listLocks().length;
    assert.throws(
      () =>
        runtime.createDecision({
          commandRunId: runId,
          title: "Second stop",
          context: "ctx",
          options: SAMPLE_OPTIONS,
        }),
      /INVALID_STATE_TRANSITION|Invalid session state transition/i,
    );
    assert.equal(decisionDirs(root).length, decisionsBefore, "no decision persisted");
    assert.equal(runtime.listLocks().length, locksBefore, "no lock persisted");
    assert.equal(runtime.getSession(runId)!.state, "ready-to-resume", "session untouched");
  } finally {
    cleanup();
  }
});

test("createDecision retry after the human answered the twin returns ANSWERED_DECISION_EXISTS", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:run", changeId: "c1" });
    const runId = begin.commandRunId!;
    const first = runtime.createDecision({
      commandRunId: runId,
      title: "Same question",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    runtime.answerDecision({
      decisionId: first.decisionId,
      selectedOptionId: "stop",
      selectedBy: "u",
    });
    // The retry of the same create (same run/title/command) must surface the
    // answered twin instead of filing a fresh copy for the human to answer again.
    const retry = runtime.createDecision({
      commandRunId: runId,
      title: "Same question",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    assert.equal(retry.status, "ANSWERED_DECISION_EXISTS");
    assert.equal(retry.decisionId, first.decisionId);
    assert.equal(retry.mustStop, false);
    assert.equal(decisionDirs(root).length, 1, "no duplicate decision filed");
  } finally {
    cleanup();
  }
});

test("after resumeCommand a follow-up decision can be created (running is a valid source)", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    runtime.resumeCommand(runId);
    const dec = runtime.createDecision({
      commandRunId: runId,
      title: "Second",
      context: "ctx",
      options: SAMPLE_OPTIONS,
      nextStep: "continue-2",
    });
    assert.equal(dec.status, "WAITING_FOR_USER_DECISION");
    assert.equal(runtime.getSession(runId)!.state, "waiting-for-decision");
  } finally {
    cleanup();
  }
});
