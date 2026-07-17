/** Health model: severity rollup + report assembly. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { rollUpStatus, maxSeverity } from "../src/model/severity.ts";
import { assembleReport, emptyCounters } from "../src/model/healthReport.ts";
import { finding } from "../src/model/healthFinding.ts";

test("rollUpStatus maps severities to overall status", () => {
  assert.equal(rollUpStatus([]), "unknown");
  assert.equal(rollUpStatus(["OK", "INFO"]), "healthy");
  assert.equal(rollUpStatus(["OK", "WARN"]), "degraded");
  assert.equal(rollUpStatus(["INFO", "ERROR"]), "degraded");
  assert.equal(rollUpStatus(["WARN", "BLOCKER"]), "blocked");
});

test("maxSeverity picks the worst", () => {
  assert.equal(maxSeverity("OK", "WARN"), "WARN");
  assert.equal(maxSeverity("BLOCKER", "ERROR"), "BLOCKER");
});

test("assembleReport counts blockers and collects candidates", () => {
  const findings = [
    finding({ id: "A", severity: "OK", category: "schema", title: "ok", message: "" }),
    finding({
      id: "B",
      severity: "BLOCKER",
      category: "runtime-root",
      title: "bad",
      message: "",
      todoCandidate: {
        title: "fix",
        sourceArtifactPath: "x",
        sourceKind: "finding",
        recommendedPriority: "HIGH",
        target: "current-change",
        type: "cleanup",
        scope: "repository",
        nextAction: "do",
        closureCriteria: ["done"],
        knowledgeType: "FACT",
        confidence: "HIGH",
      },
    }),
  ];
  const report = assembleReport({
    generatedAt: "2026-07-07T09:00:00.000Z",
    repositoryRoot: "/repo",
    interactionsRoot: "/repo/.chaos/interactions",
    findings,
    counters: { ...emptyCounters(), pendingDecisions: 2 },
  });
  assert.equal(report.overallStatus, "blocked");
  assert.equal(report.summary.blockingFindings, 1);
  assert.equal(report.summary.pendingDecisions, 2);
  assert.equal(report.todoCandidates.length, 1);
});
