/** chaos_find_resume_candidates tests (Iteration 4). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeCtx, OPTIONS } from "./helpers.ts";
import { beginCommandTool } from "../src/tools/beginCommand.ts";
import { createDecisionTool } from "../src/tools/createDecision.ts";
import { answerDecisionTool } from "../src/tools/answerDecision.ts";
import { findResumeCandidatesTool } from "../src/tools/findResumeCandidates.ts";

/** Drive a change to ready-to-resume through the MCP tools. */
function ready(t: ReturnType<typeof makeCtx>, changeId: string): string {
  const runId = t.run(beginCommandTool, { sourceCommand: "chaos:propose", changeId }).data[
    "commandRunId"
  ] as string;
  const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
  t.run(answerDecisionTool, { decisionId: dec.data["decisionId"], selectedOptionId: "stop", selectedBy: "u" });
  return runId;
}

test("1. NOT_FOUND when there are no resumable sessions", () => {
  const t = makeCtx();
  try {
    const r = t.run(findResumeCandidatesTool, {});
    assert.equal(r.ok, true);
    assert.equal(r.status, "NOT_FOUND");
    assert.match(String(r.nextAction), /do not invent context/i);
  } finally {
    t.cleanup();
  }
});

test("2. FOUND for exactly one candidate", () => {
  const t = makeCtx();
  try {
    const runId = ready(t, "c1");
    const r = t.run(findResumeCandidatesTool, {});
    assert.equal(r.status, "FOUND");
    assert.equal(r.mustStop, false);
    assert.equal((r.data["candidates"] as any[]).length, 1);
    assert.equal((r.data["candidates"] as any[])[0].commandRunId, runId);
  } finally {
    t.cleanup();
  }
});

test("3. MULTIPLE_FOUND for ambiguous candidates (mustStop)", () => {
  const t = makeCtx();
  try {
    ready(t, "c1");
    ready(t, "c2");
    const r = t.run(findResumeCandidatesTool, {});
    assert.equal(r.status, "MULTIPLE_FOUND");
    assert.equal(r.mustStop, true);
    assert.equal((r.data["candidates"] as any[]).length, 2);

    // latest collapses to one.
    const latest = t.run(findResumeCandidatesTool, { latest: true });
    assert.equal(latest.status, "FOUND");
  } finally {
    t.cleanup();
  }
});

test("4. respects the changeId filter", () => {
  const t = makeCtx();
  try {
    ready(t, "c1");
    ready(t, "c2");
    const r = t.run(findResumeCandidatesTool, { changeId: "c2" });
    assert.equal(r.status, "FOUND");
    assert.equal((r.data["candidates"] as any[])[0].changeId, "c2");
  } finally {
    t.cleanup();
  }
});

test("5. structured errors carry no stack traces", () => {
  const t = makeCtx();
  try {
    // Bad arg type triggers validation; result must be structured, no stack.
    const r = t.run(findResumeCandidatesTool, { changeId: 123 as unknown as string });
    // changeId is optional-string; a number is coerced away by optionalString -> throws VALIDATION_ERROR.
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
    const serialized = JSON.stringify(r);
    assert.ok(!/\.ts:\d+/.test(serialized));
    assert.ok(!/\bat\s+.*\(.*:\d+:\d+\)/.test(serialized));
  } finally {
    t.cleanup();
  }
});
