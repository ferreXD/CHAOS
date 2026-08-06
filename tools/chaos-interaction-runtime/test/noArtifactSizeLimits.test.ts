/**
 * No size ceilings on authored content (operator decision, 2026-08-06).
 *
 * The lean core folds every question, doubt and crossing into ONE decision, and the record
 * carries whatever a future stop needs. The interaction schemas used to cap that content
 * (decision context at 6,000 chars, option descriptions at 2,000, rationale at 4,000, …);
 * on the B3-lean arena run the cap rejected a legitimate folded stop and cost a retry.
 * Those caps are gone. Identifier and path caps stay — they are structural hygiene, not
 * limits on what a run may say.
 *
 * These tests run against the REAL schema directory (see helpers.ts), so they fail if a cap
 * is ever reintroduced there.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRuntime, SAMPLE_OPTIONS } from "./helpers.ts";

/** Comfortably past every cap that used to exist (6,000 was the largest). */
const HUGE = "x".repeat(25_000);

test("a decision context far past the old 6,000-char cap is accepted and round-trips", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:run", changeId: "big-stop" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "A folded stop that carries every question, doubt and crossing",
      context: HUGE,
      options: SAMPLE_OPTIONS,
      nextStep: "build",
    });
    const stored = runtime.getDecision(dec.decisionId)!;
    assert.equal(stored.context.length, HUGE.length, "context was truncated or rejected");
  } finally {
    cleanup();
  }
});

test("option label/description/consequence/risk have no ceiling", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:run", changeId: "big-options" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Ladder with fully explained rungs",
      context: "ctx",
      options: [
        {
          id: "a",
          label: `A — ${"long ".repeat(200)}`,
          description: HUGE,
          consequence: HUGE,
          risk: HUGE,
        },
        { id: "b", label: "B", recommended: true },
      ],
      nextStep: "build",
    });
    const stored = runtime.getDecision(dec.decisionId)!;
    const first = stored.options[0]!;
    assert.equal(first.description!.length, HUGE.length);
    assert.equal(first.consequence!.length, HUGE.length);
    assert.equal(first.risk!.length, HUGE.length);
  } finally {
    cleanup();
  }
});

test("an answer rationale far past the old 4,000-char cap is accepted", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:run", changeId: "big-rationale" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
      nextStep: "build",
    });
    runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionId: "stop",
      selectedBy: "operator",
      rationale: HUGE,
    });
    const result = runtime.getDecisionResponse(dec.decisionId);
    assert.equal(result.response!.rationale!.length, HUGE.length);
  } finally {
    cleanup();
  }
});

test("resume-capsule context fields have no ceiling", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:run", changeId: "big-capsule" });
    runtime.createResumeCapsule(begin.commandRunId!, {
      intent: HUGE,
      approvedScope: [HUGE],
      selectedPath: HUGE,
      constraints: [HUGE],
      assumptions: [HUGE],
      openRisks: [HUGE],
      confidenceCaps: [HUGE],
      forbiddenActions: [HUGE],
      nextStep: HUGE,
    });
    const capsule = runtime.getResumeCapsule(begin.commandRunId!)!;
    assert.equal(capsule.contextCapsule.intent!.length, HUGE.length);
    assert.equal(capsule.contextCapsule.openRisks![0]!.length, HUGE.length);
  } finally {
    cleanup();
  }
});

test("identifier hygiene is still enforced — this removed content caps, not validation", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:run", changeId: "id-hygiene" });
    assert.throws(
      () =>
        runtime.createDecision({
          commandRunId: begin.commandRunId!,
          title: "Pick",
          context: "ctx",
          options: SAMPLE_OPTIONS,
          nextStep: "build",
          createdBy: HUGE, // an actor, not authored content — still capped
        }),
      /maxLength|createdBy/i,
    );
  } finally {
    cleanup();
  }
});
