/** Status reporter compactness (Iteration 7 test 15). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { generateHealthReport } from "../src/probes/registry.ts";
import { renderStatusSummary } from "../src/reporters/statusSummaryReporter.ts";
import { makeEnv, nowPlusHours, seedPendingDecision, seedReadyToResume } from "./helpers.ts";

test("15. status summary is compact and actionable", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = generateHealthReport(env.config, { now: nowPlusHours(1) });
    const status = renderStatusSummary(report);

    assert.ok(status.includes("## Interaction Runtime"));
    assert.ok(status.includes("Runtime health:"));
    assert.ok(status.includes("Pending decisions: 1"));
    // Compact: no verbose findings list, and short.
    assert.ok(!status.includes("Findings:"));
    assert.ok(status.split("\n").length < 15);
  } finally {
    env.cleanup();
  }
});

test("status summary suggests chaos:resume when a session is ready", () => {
  const env = makeEnv();
  try {
    const { runId } = seedReadyToResume(env);
    const report = generateHealthReport(env.config, { now: nowPlusHours(1) });
    const status = renderStatusSummary(report);
    assert.ok(status.includes("Ready to resume: 1"));
    assert.ok(status.includes(`chaos:resume --run ${runId}`));
  } finally {
    env.cleanup();
  }
});
