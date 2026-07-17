/** MCP tool flow tests (cases 1-8, 11-17). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { makeCtx, OPTIONS } from "./helpers.ts";
import { TOOL_NAMES } from "../src/tools/registry.ts";
import { beginCommandTool } from "../src/tools/beginCommand.ts";
import { createDecisionTool } from "../src/tools/createDecision.ts";
import { getActiveDecisionTool } from "../src/tools/getActiveDecision.ts";
import { getDecisionResponseTool } from "../src/tools/getDecisionResponse.ts";
import { answerDecisionTool } from "../src/tools/answerDecision.ts";
import { markDecisionConsumedTool } from "../src/tools/markDecisionConsumed.ts";
import { createResumeCapsuleTool } from "../src/tools/createResumeCapsule.ts";
import { getResumeCapsuleTool } from "../src/tools/getResumeCapsule.ts";
import { completeCommandTool } from "../src/tools/completeCommand.ts";
import { cancelCommandTool } from "../src/tools/cancelCommand.ts";
import { listLocksTool } from "../src/tools/listLocks.ts";

const REQUIRED_TOOLS = [
  "chaos_begin_command",
  "chaos_create_decision",
  "chaos_get_active_decision",
  "chaos_get_decision_response",
  "chaos_answer_decision",
  "chaos_mark_decision_consumed",
  "chaos_create_resume_capsule",
  "chaos_get_resume_capsule",
  "chaos_find_resume_candidates",
  "chaos_complete_command",
  "chaos_cancel_command",
  "chaos_list_locks",
  "chaos_list_sessions",
];

test("1. registry includes all required tools", () => {
  for (const name of REQUIRED_TOOLS) assert.ok(TOOL_NAMES.includes(name), `missing ${name}`);
  assert.equal(TOOL_NAMES.length, REQUIRED_TOOLS.length);
});

test("2. begin_command returns READY for a new change", () => {
  const t = makeCtx();
  try {
    const r = t.run(beginCommandTool, { sourceCommand: "chaos:propose", changeId: "c1" });
    assert.equal(r.ok, true);
    assert.equal(r.status, "READY");
    assert.equal(r.mustStop, false);
    assert.ok(r.data["commandRunId"]);
  } finally {
    t.cleanup();
  }
});

function begin(t: ReturnType<typeof makeCtx>, changeId = "c1", cmd = "chaos:propose"): string {
  const r = t.run(beginCommandTool, { sourceCommand: cmd, changeId });
  return r.data["commandRunId"] as string;
}

test("3. create_decision creates a decision and returns mustStop:true", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Choose execution profile",
      context: "Strict-risk change.",
      options: OPTIONS,
      recommendedOptionId: "strict-risk-compact",
    });
    assert.equal(r.status, "WAITING_FOR_USER_DECISION");
    assert.equal(r.mustStop, true);
    assert.ok(r.data["decisionId"]);
    assert.ok(String(r.data["decisionPath"]).includes("decisions/"));
    assert.match(String(r.nextAction), /Stop now/i);
  } finally {
    t.cleanup();
  }
});

test("4. duplicate create_decision returns existing pending decision", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const a = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const b = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    assert.equal(b.status, "PENDING_DECISION_EXISTS");
    assert.equal(b.mustStop, true);
    assert.equal(a.data["decisionId"], b.data["decisionId"]);
  } finally {
    t.cleanup();
  }
});

test("5. get_active_decision returns the active decision", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const r = t.run(getActiveDecisionTool, { changeId: "c1" });
    assert.equal(r.status, "ACTIVE_DECISION");
    assert.equal(r.mustStop, true);
    assert.equal((r.data["decision"] as any).decisionId, dec.data["decisionId"]);
  } finally {
    t.cleanup();
  }
});

test("6/8. get_decision_response NO_RESPONSE_YET before, ANSWERED after", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const decisionId = dec.data["decisionId"] as string;

    const before = t.run(getDecisionResponseTool, { decisionId });
    assert.equal(before.status, "NO_RESPONSE_YET");
    assert.equal(before.mustStop, true);

    // 7. answer_decision records response.
    const ans = t.run(answerDecisionTool, { decisionId, selectedOptionId: "strict-risk-compact", selectedBy: "ferrexd" });
    assert.equal(ans.ok, true);
    assert.equal(ans.status, "ANSWERED");
    assert.ok(ans.warnings.some((w) => /manual\/dev/i.test(w)));

    const after = t.run(getDecisionResponseTool, { decisionId });
    assert.equal(after.status, "ANSWERED");
    assert.equal(after.mustStop, false);
    assert.equal(after.data["selectedOptionId"], "strict-risk-compact");
  } finally {
    t.cleanup();
  }
});

test("11. same-change conflicting command returns CONFLICTING_COMMAND_ACTIVE", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const apply = t.run(beginCommandTool, { sourceCommand: "chaos:apply", changeId: "c1" });
    assert.equal(apply.status, "CONFLICTING_COMMAND_ACTIVE");
    assert.equal(apply.mustStop, true);
    assert.ok(apply.data["conflictingCommandRunId"]);
  } finally {
    t.cleanup();
  }
});

test("12. different change command is allowed", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const other = t.run(beginCommandTool, { sourceCommand: "chaos:apply", changeId: "c2" });
    assert.equal(other.status, "READY");
    assert.equal(other.mustStop, false);
  } finally {
    t.cleanup();
  }
});

test("13/14. create + get resume capsule (latest)", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const created = t.run(createResumeCapsuleTool, {
      commandRunId: runId,
      intent: "Prepare compact proposal.",
      nextStep: "continue",
      approvedScope: "request context",
      constraints: ["no ambient static context"],
      openRisks: ["hidden consumers"],
    });
    assert.equal(created.ok, true);
    assert.ok(String(created.data["capsulePath"]).includes("capsules/"));

    const got = t.run(getResumeCapsuleTool, { latest: true });
    assert.equal(got.status, "FOUND");
    assert.equal((got.data["capsule"] as any).commandRunId, runId);
  } finally {
    t.cleanup();
  }
});

test("get_resume_capsule returns MULTIPLE_FOUND when ambiguous", () => {
  const t = makeCtx();
  try {
    const r1 = begin(t, "c1");
    const r2 = begin(t, "c2");
    t.run(createResumeCapsuleTool, { commandRunId: r1, nextStep: "a" });
    t.run(createResumeCapsuleTool, { commandRunId: r2, nextStep: "b" });
    const got = t.run(getResumeCapsuleTool, {});
    assert.equal(got.status, "MULTIPLE_FOUND");
    assert.equal((got.data["capsules"] as any[]).length, 2);
  } finally {
    t.cleanup();
  }
});

test("15. complete_command releases locks (administrative from ready-to-resume)", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    t.run(answerDecisionTool, { decisionId: dec.data["decisionId"], selectedOptionId: "stop", selectedBy: "u" });

    const done = t.run(completeCommandTool, { commandRunId: runId });
    assert.equal(done.status, "COMPLETED");
    assert.equal((done.data["releasedLocks"] as string[]).length, 1);
    assert.equal(done.data["completionMode"], "administrative-terminalization");
    assert.ok(done.warnings.some((w) => /administrative terminalization/i.test(w)));
  } finally {
    t.cleanup();
  }
});

test("16. cancel_command cancels pending decisions and releases locks", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    const cancelled = t.run(cancelCommandTool, { commandRunId: runId, reason: "user abort" });
    assert.equal(cancelled.status, "CANCELLED");
    assert.deepEqual(cancelled.data["cancelledDecisionIds"], [dec.data["decisionId"]]);
    assert.equal((cancelled.data["releasedLocks"] as string[]).length, 1);
  } finally {
    t.cleanup();
  }
});

test("17. list_locks reports stale flag without deleting", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });

    // Healthy lock: not stale.
    const healthy = t.run(listLocksTool, { includeStale: true });
    assert.equal(healthy.status, "LOCKS");
    assert.equal((healthy.data["staleLocks"] as any[]).length, 0);

    // Remove the owning session to make the lock stale.
    fs.rmSync(`${t.root}/sessions/${runId}.json`, { force: true });
    const stale = t.run(listLocksTool, { includeStale: true });
    assert.equal((stale.data["staleLocks"] as any[]).length, 1);
    assert.ok(stale.warnings.some((w) => /stale/i.test(w)));
    // Lock is NOT deleted by listing.
    assert.equal((stale.data["locks"] as any[])[0].state, "active");
  } finally {
    t.cleanup();
  }
});

test("mark_decision_consumed transitions answered -> consumed", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const dec = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c", options: OPTIONS });
    t.run(answerDecisionTool, { decisionId: dec.data["decisionId"], selectedOptionId: "stop", selectedBy: "u" });
    const consumed = t.run(markDecisionConsumedTool, { decisionId: dec.data["decisionId"] });
    assert.equal(consumed.status, "CONSUMED");
    assert.equal(consumed.data["previousState"], "answered");
    assert.equal(consumed.data["nextState"], "consumed");
  } finally {
    t.cleanup();
  }
});

test("create_decision honours interactionType (multi-choice)", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Approve which items",
      context: "Pick any.",
      interactionType: "multi-choice-decision",
      options: OPTIONS,
    });
    assert.equal(r.mustStop, true);
    const dec = t.ctx.runtime.getDecision(String(r.data["decisionId"]))!;
    assert.equal(dec.interactionType, "multi-choice-decision");
  } finally {
    t.cleanup();
  }
});

test("create_decision confirmation with two options", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Proceed with repo-wide sync?",
      context: "Confirm.",
      interactionType: "confirmation",
      options: [
        { id: "confirm", label: "Yes" },
        { id: "deny", label: "No" },
      ],
    });
    const dec = t.ctx.runtime.getDecision(String(r.data["decisionId"]))!;
    assert.equal(dec.interactionType, "confirmation");
  } finally {
    t.cleanup();
  }
});

test("create_decision freeform-input needs no options (placeholder supplied)", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Provide the connection string",
      context: "A value is missing.",
      interactionType: "freeform-input",
    });
    assert.equal(r.mustStop, true);
    const dec = t.ctx.runtime.getDecision(String(r.data["decisionId"]))!;
    assert.equal(dec.interactionType, "freeform-input");
    assert.equal(dec.options.length, 1);
  } finally {
    t.cleanup();
  }
});

test("create_decision without options for a non-freeform type is a VALIDATION_ERROR", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, { commandRunId: runId, title: "Pick", context: "c" });
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
    assert.match(r.message, /at least one option/i);
  } finally {
    t.cleanup();
  }
});

test("create_decision rejects an unknown interactionType", () => {
  const t = makeCtx();
  try {
    const runId = begin(t);
    const r = t.run(createDecisionTool, {
      commandRunId: runId,
      title: "Pick",
      context: "c",
      interactionType: "bogus-type",
      options: OPTIONS,
    });
    assert.equal(r.ok, false);
    assert.equal(r.status, "VALIDATION_ERROR");
  } finally {
    t.cleanup();
  }
});
