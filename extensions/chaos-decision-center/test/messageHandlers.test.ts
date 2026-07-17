/** Message validation + dispatch tests (cases 7, 8, 9). */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleMessage,
  validateMessage,
  type AnswerInput,
  type DecisionCenterClient,
} from "../src/decisionCenter/messageHandlers.ts";
import { makeTempRuntime, seedPendingDecision } from "./helpers.ts";

function fakeClient(): { client: DecisionCenterClient; answered: AnswerInput[] } {
  const answered: AnswerInput[] = [];
  const client: DecisionCenterClient = {
    answerDecision(input) {
      answered.push(input);
      return { status: "ANSWERED", decisionId: input.decisionId, sessionState: "ready-to-resume", resumeCapsulePath: "capsules/x.json" };
    },
    cancelCommandForDecision(decisionId) {
      return { status: "CANCELLED", commandRunId: "RUN-x", releasedLockIds: ["L"], cancelledDecisionIds: [decisionId] };
    },
    resumeInstructionText(commandRunId) {
      return `chaos:resume --run ${commandRunId}`;
    },
  };
  return { client, answered };
}

test("validateMessage rejects non-objects and unknown types", () => {
  assert.throws(() => validateMessage(null));
  assert.throws(() => validateMessage("nope"));
  assert.throws(() => validateMessage({ type: "explode" }));
});

test("7. submit with a valid option calls the answer path", () => {
  const { client, answered } = fakeClient();
  const outcome = handleMessage(
    { type: "answerDecision", decisionId: "DEC-1", selectedOptionId: "b", rationale: "because" },
    client,
  );
  assert.equal(outcome.ok, true);
  assert.equal(outcome.action, "answerDecision");
  assert.equal(answered.length, 1);
  assert.deepEqual(answered[0], {
    decisionId: "DEC-1",
    selectedOptionId: "b",
    selectedOptionIds: [],
    freeformValue: null,
    rationale: "because",
  });
  assert.equal(outcome.data["sessionState"], "ready-to-resume");
});

test("answerDecision message requires decisionId and some answer payload", () => {
  const { client } = fakeClient();
  const missing = handleMessage({ type: "answerDecision", decisionId: "DEC-1" }, client);
  assert.equal(missing.ok, false);
  assert.equal(missing.status, "VALIDATION_ERROR");
});

test("answerDecision forwards multi-choice selection", () => {
  const { client, answered } = fakeClient();
  const outcome = handleMessage(
    { type: "answerDecision", decisionId: "DEC-1", selectedOptionIds: ["a", "c"] },
    client,
  );
  assert.equal(outcome.ok, true);
  assert.deepEqual(answered[0]!.selectedOptionIds, ["a", "c"]);
  assert.equal(answered[0]!.selectedOptionId, null);
});

test("answerDecision forwards a freeform answer", () => {
  const { client, answered } = fakeClient();
  const outcome = handleMessage(
    { type: "answerDecision", decisionId: "DEC-1", freeformValue: "Server=db;" },
    client,
  );
  assert.equal(outcome.ok, true);
  assert.equal(answered[0]!.freeformValue, "Server=db;");
});

test("answerDecision rejects a non-string-array selectedOptionIds", () => {
  const { client } = fakeClient();
  const outcome = handleMessage(
    { type: "answerDecision", decisionId: "DEC-1", selectedOptionIds: [1, 2] },
    client,
  );
  assert.equal(outcome.ok, false);
  assert.equal(outcome.status, "VALIDATION_ERROR");
});

test("8. invalid selected option is rejected (real runtime)", () => {
  const t = makeTempRuntime();
  try {
    const { decisionId } = seedPendingDecision(t.runtime);
    const outcome = handleMessage(
      { type: "answerDecision", decisionId, selectedOptionId: "does-not-exist" },
      t.client,
    );
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, "VALIDATION_ERROR");
    assert.match(outcome.message, /not a valid option/i);
  } finally {
    t.cleanup();
  }
});

test("9. required rationale is enforced (real runtime)", () => {
  const t = makeTempRuntime();
  try {
    const { decisionId } = seedPendingDecision(t.runtime, { requiresRationale: true });
    const empty = handleMessage(
      { type: "answerDecision", decisionId, selectedOptionId: "stop", rationale: "" },
      t.client,
    );
    assert.equal(empty.ok, false);
    assert.equal(empty.status, "VALIDATION_ERROR");
    assert.match(empty.message, /rationale/i);

    const ok = handleMessage(
      { type: "answerDecision", decisionId, selectedOptionId: "stop", rationale: "Safest." },
      t.client,
    );
    assert.equal(ok.ok, true);
    assert.equal(ok.status, "ANSWERED");
  } finally {
    t.cleanup();
  }
});

test("copyResumeInstruction and cancelDecision dispatch correctly", () => {
  const { client } = fakeClient();
  const copy = handleMessage({ type: "copyResumeInstruction", commandRunId: "RUN-9" }, client);
  assert.equal(copy.ok, true);
  assert.match(String(copy.data["text"]), /chaos:resume --run RUN-9/);

  const cancel = handleMessage({ type: "cancelDecision", decisionId: "DEC-9" }, client);
  assert.equal(cancel.ok, true);
  assert.equal(cancel.status, "CANCELLED");
});
