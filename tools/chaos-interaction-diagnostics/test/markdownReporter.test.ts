/** Doctor markdown + JSON reporters (Iteration 7 tests 14, 16). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { generateHealthReport } from "../src/probes/registry.ts";
import { renderDoctorSection } from "../src/reporters/markdownReporter.ts";
import { renderDoctorReport as _standalone } from "../src/reporters/doctorReporter.ts";
import { renderJson } from "../src/reporters/jsonReporter.ts";
import { makeEnv, nowPlusHours, seedPendingDecision } from "./helpers.ts";

test("14. markdown doctor section includes the Interaction Runtime block", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = generateHealthReport(env.config, { now: nowPlusHours(48) });
    const md = renderDoctorSection(report);
    assert.ok(md.includes("## Interaction Runtime"));
    assert.ok(md.includes("Summary:"));
    assert.ok(md.includes("Pending decisions:"));
    assert.ok(md.includes("Findings:"));
    // Stale lock/decision produce Todo Candidates with the canonical table.
    assert.ok(md.includes("Todo Candidates:"));
    assert.ok(md.includes("| Title |"));
  } finally {
    env.cleanup();
  }
});

test("standalone doctor report wraps the section with a header", () => {
  const env = makeEnv();
  try {
    const report = generateHealthReport(env.config, { now: nowPlusHours(1) });
    const doc = _standalone(report);
    assert.ok(doc.startsWith("# Interaction Runtime Health"));
    assert.ok(doc.includes("No runtime state was modified"));
    assert.ok(doc.includes("## Interaction Runtime"));
  } finally {
    env.cleanup();
  }
});

test("16. JSON reporter returns a structured, parseable report", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = generateHealthReport(env.config, { now: nowPlusHours(1) });
    const parsed = JSON.parse(renderJson(report));
    assert.equal(typeof parsed.generatedAt, "string");
    assert.ok(["healthy", "degraded", "blocked", "unknown"].includes(parsed.overallStatus));
    assert.ok(Array.isArray(parsed.findings));
    assert.equal(parsed.summary.pendingDecisions, 1);
  } finally {
    env.cleanup();
  }
});
