/** resumeCommand: ready-to-resume -> resumed -> running (Iteration 5 addition). */

import { test } from "node:test";
import assert from "node:assert/strict";
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
