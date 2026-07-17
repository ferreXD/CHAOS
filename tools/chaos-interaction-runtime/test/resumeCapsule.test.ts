/** Resume capsule tests (required case 10). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { makeRuntime, SAMPLE_OPTIONS } from "./helpers.ts";

test("10. a resume capsule is created when all blocking decisions are answered", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({
      sourceCommand: "chaos:propose",
      changeId: "request-context-middleware",
      adapter: "claude",
      requestedMode: "strict",
    });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Choose execution profile",
      context: "Strict-risk change.",
      options: SAMPLE_OPTIONS,
      recommendedOptionId: "strict-risk-compact",
      nextStep: "continue-with-selected-execution-profile",
    });
    const ans = runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionId: "strict-risk-compact",
      selectedBy: "ferrexd",
    });

    assert.equal(ans.sessionState, "ready-to-resume");
    const capsulePath = `${root}/capsules/${begin.commandRunId}.json`;
    assert.ok(fs.existsSync(capsulePath), "capsule file should exist");

    const capsule = JSON.parse(fs.readFileSync(capsulePath, "utf8"));
    assert.equal(capsule.commandRunId, begin.commandRunId);
    assert.equal(capsule.state, "ready-to-resume");
    assert.equal(capsule.nextStep, "continue-with-selected-execution-profile");
    assert.deepEqual(capsule.answeredDecisionIds, [dec.decisionId]);
    assert.ok(capsule.contextCapsule);

    // Session points at the capsule.
    const session = runtime.getSession(begin.commandRunId!);
    assert.ok(session!.resumeCapsulePath?.includes("capsules/"));
  } finally {
    cleanup();
  }
});

test("createResumeCapsule is idempotent and preserves createdAt while updating updatedAt", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const first = runtime.createResumeCapsule(begin.commandRunId!, {
      intent: "Prepare compact strict-risk proposal.",
      nextStep: "continue",
      approvedScope: ["request context abstraction"],
      constraints: ["Do not introduce ambient static context"],
      openRisks: ["Hidden consumers"],
      confidence: "HIGH",
      knowledgeType: "FACT",
    });
    const second = runtime.createResumeCapsule(begin.commandRunId!, { nextStep: "continue-2" });
    assert.equal(second.capsule.createdAt, first.capsule.createdAt);
    assert.notEqual(second.capsule.updatedAt, first.capsule.createdAt);
    assert.equal(second.capsule.nextStep, "continue-2");
    // Prior context is preserved across updates.
    assert.equal(second.capsule.contextCapsule.intent, "Prepare compact strict-risk proposal.");
  } finally {
    cleanup();
  }
});

test("multiple pending decisions keep the session waiting until all are answered", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const d1 = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "First",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    const d2 = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Second",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    runtime.answerDecision({ decisionId: d1.decisionId, selectedOptionId: "stop", selectedBy: "u" });
    assert.equal(runtime.getSession(begin.commandRunId!)!.state, "waiting-for-decision");
    const ans2 = runtime.answerDecision({
      decisionId: d2.decisionId,
      selectedOptionId: "stop",
      selectedBy: "u",
    });
    assert.equal(ans2.sessionState, "ready-to-resume");
  } finally {
    cleanup();
  }
});
