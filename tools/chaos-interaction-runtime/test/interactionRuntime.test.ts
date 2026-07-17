/** Core runtime lifecycle tests (required cases 1-6, 11-13). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { makeRuntime, SAMPLE_OPTIONS } from "./helpers.ts";

test("1. beginCommand creates a running session", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const res = runtime.beginCommand({
      sourceCommand: "chaos:propose",
      changeId: "request-context-middleware",
      adapter: "claude",
      requestedMode: "strict",
    });
    assert.equal(res.status, "READY");
    assert.equal(res.mustStop, false);
    assert.ok(res.commandRunId);
    const session = runtime.getSession(res.commandRunId!);
    assert.ok(session);
    assert.equal(session!.state, "running");
    assert.ok(fs.existsSync(`${root}/sessions/${res.commandRunId}.json`));
  } finally {
    cleanup();
  }
});

test("2. createDecision writes decision.json and active.json", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({
      sourceCommand: "chaos:propose",
      changeId: "request-context-middleware",
    });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Choose execution profile",
      context: "Strict-risk change touching the request pipeline.",
      options: SAMPLE_OPTIONS,
      recommendedOptionId: "strict-risk-compact",
    });
    assert.ok(fs.existsSync(`${root}/decisions/${dec.decisionId}/decision.json`));
    const active = JSON.parse(fs.readFileSync(`${root}/active.json`, "utf8"));
    assert.equal(active.state, "waiting-for-user-decision");
    assert.deepEqual(active.pendingDecisionIds, [dec.decisionId]);
    assert.equal(active.activeDecisionId, dec.decisionId);
  } finally {
    cleanup();
  }
});

test("3. createDecision returns mustStop=true and WAITING_FOR_USER_DECISION", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick one",
      context: "Because.",
      options: SAMPLE_OPTIONS,
    });
    assert.equal(dec.status, "WAITING_FOR_USER_DECISION");
    assert.equal(dec.mustStop, true);
    const session = runtime.getSession(begin.commandRunId!);
    assert.equal(session!.state, "waiting-for-decision");
  } finally {
    cleanup();
  }
});

test("4. answerDecision writes response.json and marks decision answered", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick one",
      context: "Because.",
      options: SAMPLE_OPTIONS,
    });
    const ans = runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionId: "strict-risk-compact",
      selectedBy: "ferrexd",
    });
    assert.equal(ans.status, "ANSWERED");
    assert.ok(fs.existsSync(`${root}/decisions/${dec.decisionId}/response.json`));
    assert.equal(runtime.getDecision(dec.decisionId)!.state, "answered");
    const resp = JSON.parse(
      fs.readFileSync(`${root}/decisions/${dec.decisionId}/response.json`, "utf8"),
    );
    assert.equal(resp.selectedOptionId, "strict-risk-compact");
    assert.equal(resp.selectedBy, "ferrexd");
  } finally {
    cleanup();
  }
});

test("5. answerDecision rejects an option that is not declared", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick one",
      context: "Because.",
      options: SAMPLE_OPTIONS,
    });
    assert.throws(
      () =>
        runtime.answerDecision({
          decisionId: dec.decisionId,
          selectedOptionId: "does-not-exist",
          selectedBy: "ferrexd",
        }),
      /not a valid option/,
    );
    // Decision must remain answerable (no partial state mutation).
    assert.equal(runtime.getDecision(dec.decisionId)!.state, "waiting");
  } finally {
    cleanup();
  }
});

test("6. required rationale is enforced", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick one",
      context: "Because.",
      options: SAMPLE_OPTIONS,
      requiresRationale: true,
    });
    assert.throws(
      () =>
        runtime.answerDecision({
          decisionId: dec.decisionId,
          selectedOptionId: "stop",
          selectedBy: "ferrexd",
        }),
      /requires a non-empty rationale/,
    );
    // With a rationale it succeeds.
    const ok = runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionId: "stop",
      selectedBy: "ferrexd",
      rationale: "Stopping is safest.",
    });
    assert.equal(ok.status, "ANSWERED");
  } finally {
    cleanup();
  }
});

test("createDecision rejects duplicate option ids and unknown recommendedOptionId", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    assert.throws(
      () =>
        runtime.createDecision({
          commandRunId: begin.commandRunId!,
          title: "dupe",
          context: "ctx",
          options: [
            { id: "a", label: "A" },
            { id: "a", label: "A again" },
          ],
        }),
      /Duplicate option id/,
    );
    assert.throws(
      () =>
        runtime.createDecision({
          commandRunId: begin.commandRunId!,
          title: "bad-rec",
          context: "ctx",
          options: [{ id: "a", label: "A" }],
          recommendedOptionId: "z",
        }),
      /does not match any option id/,
    );
  } finally {
    cleanup();
  }
});

test("createDecision is idempotent for the same unresolved purpose", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const a = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Choose execution profile",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    const b = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Choose execution profile",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    assert.equal(b.status, "PENDING_DECISION_EXISTS");
    assert.equal(a.decisionId, b.decisionId);
  } finally {
    cleanup();
  }
});

test("11. completeCommand releases the change lock", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionId: "stop",
      selectedBy: "ferrexd",
    });
    // Lock is still active while ready-to-resume.
    assert.equal(runtime.listLocks().filter((l) => l.state === "active").length, 1);

    const done = runtime.completeCommand(begin.commandRunId!);
    assert.equal(done.status, "COMPLETED");
    assert.equal(done.releasedLockIds.length, 1);
    assert.equal(runtime.getSession(begin.commandRunId!)!.state, "completed");
    assert.equal(runtime.listLocks().filter((l) => l.state === "active").length, 0);
  } finally {
    cleanup();
  }
});

test("12. cancelCommand releases lock and preserves decision artifacts", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    const cancelled = runtime.cancelCommand(begin.commandRunId!);
    assert.equal(cancelled.status, "CANCELLED");
    assert.deepEqual(cancelled.cancelledDecisionIds, [dec.decisionId]);
    assert.equal(cancelled.releasedLockIds.length, 1);
    assert.equal(runtime.getSession(begin.commandRunId!)!.state, "cancelled");
    assert.equal(runtime.getDecision(dec.decisionId)!.state, "cancelled");
    // Artifact preserved (not deleted).
    assert.ok(fs.existsSync(`${root}/decisions/${dec.decisionId}/decision.json`));
    assert.equal(runtime.listLocks().filter((l) => l.state === "active").length, 0);
  } finally {
    cleanup();
  }
});

test("13. invalid state transition fails safely", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    runtime.cancelCommand(begin.commandRunId!);
    // cancelled -> completed is not an allowed transition.
    assert.throws(
      () => runtime.completeCommand(begin.commandRunId!),
      /Invalid session state transition: cancelled -> completed/,
    );
    // Session remains cancelled (fail-safe, no partial mutation).
    assert.equal(runtime.getSession(begin.commandRunId!)!.state, "cancelled");
    // Creating a decision on a terminal session is refused.
    assert.throws(
      () =>
        runtime.createDecision({
          commandRunId: begin.commandRunId!,
          title: "late",
          context: "ctx",
          options: SAMPLE_OPTIONS,
        }),
      /terminal|cancelled/i,
    );
  } finally {
    cleanup();
  }
});

test("getDecisionResponse reports NO_RESPONSE_YET then ANSWERED then CONSUMED", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    assert.equal(runtime.getDecisionResponse(dec.decisionId).status, "NO_RESPONSE_YET");
    runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionId: "stop",
      selectedBy: "ferrexd",
    });
    assert.equal(runtime.getDecisionResponse(dec.decisionId).status, "ANSWERED");
    runtime.markDecisionConsumed(dec.decisionId);
    assert.equal(runtime.getDecisionResponse(dec.decisionId).status, "CONSUMED");
  } finally {
    cleanup();
  }
});

test("answerDecision supports multi-choice (selectedOptionIds)", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick several",
      context: "Approve which items?",
      options: SAMPLE_OPTIONS,
      interactionType: "multi-choice-decision",
    });
    const ans = runtime.answerDecision({
      decisionId: dec.decisionId,
      selectedOptionIds: ["full-strict", "stop", "full-strict"],
      selectedBy: "ferrexd",
    });
    assert.equal(ans.status, "ANSWERED");
    const resp = JSON.parse(fs.readFileSync(`${root}/decisions/${dec.decisionId}/response.json`, "utf8"));
    assert.deepEqual(resp.selectedOptionIds, ["full-strict", "stop"]); // de-duplicated
    assert.equal(resp.selectedOptionId, "full-strict");
    assert.equal(resp.freeformValue, null);
  } finally {
    cleanup();
  }
});

test("answerDecision multi-choice rejects empty selection and invalid ids", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick several",
      context: "x",
      options: SAMPLE_OPTIONS,
      interactionType: "multi-choice-decision",
    });
    assert.throws(() => runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionIds: [], selectedBy: "p" }));
    assert.throws(() => runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionIds: ["nope"], selectedBy: "p" }));
  } finally {
    cleanup();
  }
});

test("answerDecision supports freeform-input (freeformValue)", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Provide the connection string",
      context: "Missing config value.",
      options: SAMPLE_OPTIONS, // freeform decisions still declare >=1 option per schema
      interactionType: "freeform-input",
    });
    const ans = runtime.answerDecision({
      decisionId: dec.decisionId,
      freeformValue: "Server=db;Database=app;",
      selectedBy: "ferrexd",
    });
    assert.equal(ans.status, "ANSWERED");
    const resp = JSON.parse(fs.readFileSync(`${root}/decisions/${dec.decisionId}/response.json`, "utf8"));
    assert.equal(resp.freeformValue, "Server=db;Database=app;");
    assert.equal(resp.selectedOptionId, null);
    assert.deepEqual(resp.selectedOptionIds, []);
  } finally {
    cleanup();
  }
});

test("answerDecision freeform-input rejects an empty value", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Provide value",
      context: "x",
      options: SAMPLE_OPTIONS,
      interactionType: "freeform-input",
    });
    assert.throws(() => runtime.answerDecision({ decisionId: dec.decisionId, freeformValue: "   ", selectedBy: "p" }));
  } finally {
    cleanup();
  }
});

test("answerDecision handles confirmation as a single-choice answer", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:sync", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Proceed with repo-wide sync?",
      context: "Confirm you are the maintainer.",
      options: [
        { id: "confirm", label: "Yes, I am the maintainer" },
        { id: "deny", label: "No, stop" },
      ],
      interactionType: "confirmation",
    });
    const ans = runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionId: "confirm", selectedBy: "ferrexd" });
    assert.equal(ans.status, "ANSWERED");
    const resp = JSON.parse(fs.readFileSync(`${root}/decisions/${dec.decisionId}/response.json`, "utf8"));
    assert.equal(resp.selectedOptionId, "confirm");
  } finally {
    cleanup();
  }
});

test("createDecision allows a freeform-input decision with no options (placeholder supplied)", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Provide the connection string",
      context: "A required value is missing.",
      options: [],
      interactionType: "freeform-input",
    });
    const stored = runtime.getDecision(dec.decisionId)!;
    assert.equal(stored.interactionType, "freeform-input");
    assert.equal(stored.options.length, 1);
    assert.equal(stored.options[0]!.id, "freeform-response");
    const ans = runtime.answerDecision({ decisionId: dec.decisionId, freeformValue: "conn=x", selectedBy: "p" });
    assert.equal(ans.status, "ANSWERED");
  } finally {
    cleanup();
  }
});

test("createDecision still rejects empty options for non-freeform types", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    assert.throws(() =>
      runtime.createDecision({
        commandRunId: begin.commandRunId!,
        title: "Pick one",
        context: "x",
        options: [],
        interactionType: "single-choice-decision",
      }),
    );
  } finally {
    cleanup();
  }
});
