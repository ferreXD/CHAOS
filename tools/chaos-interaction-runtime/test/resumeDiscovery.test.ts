/** Resume capsule discovery API tests (Iteration 4). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { makeRuntime, SAMPLE_OPTIONS } from "./helpers.ts";

/** Drive a run to ready-to-resume (which writes a capsule). */
function readyRun(runtime: ReturnType<typeof makeRuntime>["runtime"], changeId: string) {
  const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId });
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

test("1. listCapsules returns capsule summaries", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    const summaries = runtime.listCapsules();
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]!.commandRunId, runId);
    assert.equal(summaries[0]!.sourceCommand, "chaos:propose");
    assert.ok(summaries[0]!.capsulePath.includes("capsules/"));
    // Summary is compact — no full contextCapsule body.
    assert.equal((summaries[0] as any).contextCapsule, undefined);
  } finally {
    cleanup();
  }
});

test("2. listCapsules filters by changeId (and readyToResumeOnly)", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    readyRun(runtime, "c1");
    readyRun(runtime, "c2");
    assert.equal(runtime.listCapsules({ changeId: "c1" }).length, 1);
    assert.equal(runtime.listCapsules({ changeId: "c1" })[0]!.changeId, "c1");
    assert.equal(runtime.listCapsules({ readyToResumeOnly: true }).length, 2);
    assert.equal(runtime.listCapsules({ sourceCommand: "chaos:propose" }).length, 2);
    assert.equal(runtime.listCapsules({ changeId: "nope" }).length, 0);
  } finally {
    cleanup();
  }
});

test("3. findResumeCandidates handles none / one / many / latest", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    assert.equal(runtime.findResumeCandidates().length, 0); // none

    const r1 = readyRun(runtime, "c1");
    const one = runtime.findResumeCandidates();
    assert.equal(one.length, 1);
    assert.equal(one[0]!.commandRunId, r1);
    assert.equal(one[0]!.hasCapsule, true);

    readyRun(runtime, "c2");
    assert.equal(runtime.findResumeCandidates().length, 2); // many
    assert.equal(runtime.findResumeCandidates({ latest: true }).length, 1); // latest collapses
    assert.equal(runtime.findResumeCandidates({ changeId: "c2" }).length, 1); // filter
  } finally {
    cleanup();
  }
});

test("4. a malformed capsule file is skipped, not thrown", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    readyRun(runtime, "c1");
    // Corrupt an added capsule file.
    fs.writeFileSync(`${root}/capsules/RUN-broken.json`, "{ not json", "utf8");
    const summaries = runtime.listCapsules();
    assert.equal(summaries.length, 1); // the valid one, broken skipped
    assert.doesNotThrow(() => runtime.findResumeCandidates());
  } finally {
    cleanup();
  }
});

test("5. discovery does not modify any state", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    readyRun(runtime, "c1");
    const snapshot = (dir: string) =>
      fs.readdirSync(dir, { recursive: true }).toString();
    const before = snapshot(root);
    runtime.listCapsules();
    runtime.findResumeCandidates({ latest: true });
    runtime.getResumeCapsule("does-not-exist");
    assert.equal(snapshot(root), before);
  } finally {
    cleanup();
  }
});

test("getResumeCapsule returns the full capsule or null", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const runId = readyRun(runtime, "c1");
    const capsule = runtime.getResumeCapsule(runId);
    assert.ok(capsule);
    assert.equal(capsule!.commandRunId, runId);
    assert.ok(capsule!.contextCapsule);
    assert.equal(runtime.getResumeCapsule("missing"), null);
  } finally {
    cleanup();
  }
});
