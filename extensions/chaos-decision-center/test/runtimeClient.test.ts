/** RuntimeClient integration: real response writing + malformed resilience (cases 7, 13). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { makeTempRuntime, seedPendingDecision } from "./helpers.ts";

test("7. answering through the client writes a valid response.json via the runtime", () => {
  const t = makeTempRuntime();
  try {
    const { commandRunId, decisionId } = seedPendingDecision(t.runtime);

    // Projection sees the pending decision.
    const before = t.client.getProjection();
    assert.equal(before.status.state, "pending");
    assert.equal(before.activeDecision!.decisionId, decisionId);

    const result = t.client.answerDecision({ decisionId, selectedOptionId: "strict-risk-compact" });
    assert.equal(result.status, "ANSWERED");
    assert.equal(result.sessionState, "ready-to-resume");

    // response.json exists and records the vscode source + configured user.
    const responsePath = `${t.root}/decisions/${decisionId}/response.json`;
    assert.ok(fs.existsSync(responsePath));
    const response = JSON.parse(fs.readFileSync(responsePath, "utf8"));
    assert.equal(response.selectedOptionId, "strict-risk-compact");
    assert.equal(response.source, "vscode-decision-center");
    assert.equal(response.selectedBy, "vscode-user");

    // Projection now shows ready-to-resume and a copyable resume instruction.
    const after = t.client.getProjection();
    assert.equal(after.status.state, "ready");
    assert.equal(after.readyToResume.length, 1);
    assert.equal(after.readyToResume[0]!.commandRunId, commandRunId);
    assert.match(t.client.resumeInstructionText(commandRunId)!, /chaos:resume --run/);
  } finally {
    t.cleanup();
  }
});

test("13. malformed runtime state produces a warning, not a crash", () => {
  const t = makeTempRuntime();
  try {
    const { decisionId } = seedPendingDecision(t.runtime);
    // Corrupt the decision file.
    fs.writeFileSync(`${t.root}/decisions/${decisionId}/decision.json`, "{ not valid json", "utf8");

    // getProjection must not throw.
    const projection = t.client.getProjection();
    assert.ok(projection.health.some((h) => h.code === "MALFORMED_STATE"));
    // UI stays available.
    assert.ok(projection.status);
  } finally {
    t.cleanup();
  }
});

test("getProjection reports RUNTIME_ROOT_MISSING when the root does not exist", () => {
  const t = makeTempRuntime();
  try {
    t.cleanup(); // remove the root dir
    const projection = t.client.getProjection();
    assert.equal(projection.status.state, "unavailable");
    assert.ok(projection.health.some((h) => h.code === "RUNTIME_ROOT_MISSING"));
  } finally {
    t.cleanup();
  }
});
