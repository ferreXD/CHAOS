/** Validation + structured-error tests (cases 9, 10, 18). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeCtx, OPTIONS } from "./helpers.ts";
import { beginCommandTool } from "../src/tools/beginCommand.ts";
import { createDecisionTool } from "../src/tools/createDecision.ts";
import { answerDecisionTool } from "../src/tools/answerDecision.ts";
import { getDecisionResponseTool } from "../src/tools/getDecisionResponse.ts";

function begin(t: ReturnType<typeof makeCtx>): string {
  return t.run(beginCommandTool, { sourceCommand: "chaos:propose", changeId: "c1" }).data[
    "commandRunId"
  ] as string;
}

test("9. required rationale is enforced (VALIDATION_ERROR)", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Pick",
      context: "c",
      options: OPTIONS,
      requiresRationale: true,
    });
    const r = t.run(answerDecisionTool, {
      decisionId: dec.data["decisionId"],
      selectedOptionId: "stop",
      selectedBy: "u",
    });
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
    assert.equal(r.mustStop, true);
    assert.match(r.message, /rationale/i);
  } finally {
    t.cleanup();
  }
});

test("10. invalid selected option returns VALIDATION_ERROR", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const r = t.run(answerDecisionTool, {
      decisionId: dec.data["decisionId"],
      selectedOptionId: "nope",
      selectedBy: "u",
    });
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
    assert.ok(r.error);
  } finally {
    t.cleanup();
  }
});

test("create_decision rejects duplicate option ids (VALIDATION_ERROR)", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Dup",
      context: "c",
      options: [
        { id: "a", label: "A" },
        { id: "a", label: "A2" },
      ],
    });
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
  } finally {
    t.cleanup();
  }
});

test("missing required argument returns VALIDATION_ERROR", () => {
  const t = makeCtx();
  try {
    const r = t.run(createDecisionTool, { title: "no run id", context: "c", options: OPTIONS });
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
    assert.match(r.message, /commandRunId/);
  } finally {
    t.cleanup();
  }
});

test("18. errors are structured and never expose stack traces", () => {
  const t = makeCtx();
  try {
    // NOT_FOUND from the runtime -> structured error, no stack.
    const r = t.run(getDecisionResponseTool, { decisionId: "DEC-does-not-exist" });
    assert.equal(r.ok, false);
    assert.equal(r.status, "NOT_FOUND");
    const serialized = JSON.stringify(r);
    assert.ok(!/\bat\s+.*\(.*:\d+:\d+\)/.test(serialized), "must not contain a stack frame");
    assert.ok(!/\.ts:\d+/.test(serialized), "must not contain source line refs");
    assert.ok(r.error && typeof r.error.code === "string");
  } finally {
    t.cleanup();
  }
});
