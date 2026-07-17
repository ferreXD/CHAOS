/** Probe 7: resume-capsule integrity vs sessions/decisions/artifacts. */

import * as fs from "node:fs";
import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { rel, safeList, type ProbeContext } from "./probeContext.ts";

export function capsuleProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const capsules = safeList(() => ctx.runtime.store.capsules.list());

  for (const capsule of capsules) {
    const runId = capsule.commandRunId;
    const session = ctx.runtime.getSession(runId);

    if (!session) {
      out.push(
        finding({
          id: `IR-CAPSULE-ORPHAN-${runId}`,
          severity: "WARN",
          category: "capsule",
          title: `Capsule ${runId} has no session`,
          message: "The capsule references a commandRunId with no session file.",
          evidence: [rel(ctx, ctx.paths.capsule(runId))],
          affectedArtifacts: [runId],
          recommendedActions: ["Inspect; the session may have been removed out-of-band."],
          confidence: "MEDIUM",
        }),
      );
    } else if (session.changeId !== capsule.changeId) {
      out.push(
        finding({
          id: `IR-CAPSULE-CHANGE-MISMATCH-${runId}`,
          severity: "WARN",
          category: "capsule",
          title: `Capsule ${runId} changeId mismatch`,
          message: `Capsule changeId "${capsule.changeId}" ≠ session changeId "${session.changeId}".`,
          evidence: [rel(ctx, ctx.paths.capsule(runId))],
          affectedArtifacts: [runId],
          recommendedActions: ["Recreate the capsule from current session state."],
          confidence: "HIGH",
        }),
      );
    }

    if (!capsule.nextStep || capsule.nextStep.trim().length === 0) {
      out.push(
        finding({
          id: `IR-CAPSULE-NONEXTSTEP-${runId}`,
          severity: "WARN",
          category: "capsule",
          title: `Capsule ${runId} has no nextStep`,
          message: "A resume capsule without nextStep cannot drive chaos:resume.",
          evidence: [rel(ctx, ctx.paths.capsule(runId))],
          affectedArtifacts: [runId],
          recommendedActions: ["Recreate the capsule with a concrete nextStep."],
          confidence: "HIGH",
        }),
      );
    }

    // answeredDecisionIds should reference decisions that are answered/consumed.
    for (const decisionId of capsule.answeredDecisionIds) {
      const d = ctx.runtime.getDecision(decisionId);
      if (!d) {
        out.push(
          finding({
            id: `IR-CAPSULE-DEC-MISSING-${runId}-${decisionId}`,
            severity: "WARN",
            category: "capsule",
            title: `Capsule ${runId} references missing decision ${decisionId}`,
            message: "answeredDecisionIds points to a decision with no artifact.",
            evidence: [rel(ctx, ctx.paths.capsule(runId))],
            affectedArtifacts: [runId, decisionId],
            recommendedActions: ["Inspect the capsule; the decision reference is dangling."],
            confidence: "MEDIUM",
          }),
        );
      } else if (d.state !== "answered" && d.state !== "consumed") {
        out.push(
          finding({
            id: `IR-CAPSULE-DEC-STATE-${runId}-${decisionId}`,
            severity: "INFO",
            category: "capsule",
            title: `Capsule ${runId} lists decision ${decisionId} in state ${d.state}`,
            message: "answeredDecisionIds should reference answered/consumed decisions.",
            evidence: [rel(ctx, ctx.paths.decision(decisionId))],
            affectedArtifacts: [runId, decisionId],
            confidence: "MEDIUM",
          }),
        );
      }
    }

    // requiredArtifacts should exist on disk (relative to repo root).
    for (const artifact of capsule.requiredArtifacts) {
      const abs = path.resolve(ctx.config.repositoryRoot, artifact);
      if (!fs.existsSync(abs)) {
        out.push(
          finding({
            id: `IR-CAPSULE-ARTIFACT-MISSING-${runId}`,
            severity: "WARN",
            category: "capsule",
            title: `Capsule ${runId} requires a missing artifact`,
            message: `Required artifact not found: ${artifact}`,
            evidence: [rel(ctx, ctx.paths.capsule(runId)), artifact],
            affectedArtifacts: [runId, artifact],
            recommendedActions: ["Restore the artifact or update the capsule; chaos:resume will otherwise stop."],
            confidence: "HIGH",
          }),
        );
      }
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-CAPSULE-OK",
        severity: "OK",
        category: "capsule",
        title: "No capsule anomalies",
        message: `Inspected ${capsules.length} capsule(s); all consistent with sessions/decisions/artifacts.`,
      }),
    );
  }
  return out;
}
