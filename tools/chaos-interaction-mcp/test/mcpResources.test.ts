/** Read-only resource tests (case 20). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeCtx, OPTIONS } from "./helpers.ts";
import { beginCommandTool } from "../src/tools/beginCommand.ts";
import { createDecisionTool } from "../src/tools/createDecision.ts";
import { activeInteractionResource } from "../src/resources/activeInteractionResource.ts";
import { lockResource } from "../src/resources/lockResource.ts";
import { sessionsListResource, sessionResource } from "../src/resources/sessionResource.ts";
import { decisionResource } from "../src/resources/decisionResource.ts";
import { capsuleResource } from "../src/resources/capsuleResource.ts";

function seed(t: ReturnType<typeof makeCtx>) {
  const runId = t.run(beginCommandTool, { sourceCommand: "chaos:propose", changeId: "c1" }).data[
    "commandRunId"
  ] as string;
  const decisionId = t.run(createDecisionTool, {
    commandRunId: runId,
    title: "Pick",
    context: "c",
    options: OPTIONS,
  }).data["decisionId"] as string;
  return { runId, decisionId };
}

test("20. active + locks + sessions resources return JSON", () => {
  const t = makeCtx();
  try {
    const { runId } = seed(t);

    const active = activeInteractionResource.read(t.ctx);
    assert.equal(active.found, true);
    assert.equal((active.json as any).state, "waiting-for-user-decision");

    const locks = lockResource.read(t.ctx);
    assert.equal(locks.found, true);
    assert.equal((locks.json as any).locks.length, 1);

    const sessions = sessionsListResource.read(t.ctx);
    assert.equal((sessions.json as any).sessions.length, 1);

    const session = sessionResource.read(t.ctx, { commandRunId: runId });
    assert.equal(session.found, true);
    assert.equal((session.json as any).commandRunId, runId);
  } finally {
    t.cleanup();
  }
});

test("decision + capsule resources return JSON and not-found is clean", () => {
  const t = makeCtx();
  try {
    const { decisionId } = seed(t);

    const decision = decisionResource.read(t.ctx, { decisionId });
    assert.equal(decision.found, true);
    assert.equal((decision.json as any).decision.decisionId, decisionId);
    assert.equal((decision.json as any).response, null);

    const missing = decisionResource.read(t.ctx, { decisionId: "DEC-nope" });
    assert.equal(missing.found, false);
    assert.equal((missing.json as any).status, "NOT_FOUND");

    const capsuleMissing = capsuleResource.read(t.ctx, { commandRunId: "RUN-nope" });
    assert.equal(capsuleMissing.found, false);
    assert.equal((capsuleMissing.json as any).status, "NOT_FOUND");
  } finally {
    t.cleanup();
  }
});
