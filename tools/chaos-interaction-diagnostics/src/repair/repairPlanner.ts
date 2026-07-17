/**
 * Maps findings to advisory repair recommendations.
 *
 * This is a *planner*, not an executor. It classifies and suggests; it never
 * deletes locks, cancels sessions, mutates decisions, rewrites artifacts, marks
 * decisions consumed, or completes commands. All of those remain explicit,
 * command-driven actions.
 */

import type { HealthFinding } from "../model/healthFinding.ts";
import type { InteractionRuntimeHealthReport } from "../model/healthReport.ts";
import type { RepairKind, RepairRecommendation } from "./repairRecommendation.ts";

function kindFor(f: HealthFinding): RepairKind {
  if (f.category === "lock") return "review-lock";
  if (f.category === "runner") return "review-lease";
  if (f.category === "command-contract") return "align-command-contract";
  if (f.id.startsWith("IR-SESSION-READY-NOCAPSULE") || f.id.startsWith("IR-CAPSULE")) {
    return "recreate-capsule";
  }
  if (f.id.startsWith("IR-DECISION-STALE") || f.id.startsWith("IR-DECISION-PENDING")) {
    return "answer-decision";
  }
  if (f.id.startsWith("IR-SESSION-READY")) return "resume-session";
  if (f.category === "artifact-validation" || f.id.includes("MALFORMED")) return "inspect-artifact";
  return "no-action";
}

function suggestedCommand(f: HealthFinding): string | undefined {
  const cmd = f.recommendedActions.find((a) => /chaos:/.test(a));
  if (!cmd) return undefined;
  const match = cmd.match(/chaos:[\w-]+(?:\s+--[\w-]+\s+[\w:.-]+)?/);
  return match ? match[0] : undefined;
}

export function planRepairs(report: InteractionRuntimeHealthReport): RepairRecommendation[] {
  return report.findings
    .filter((f) => f.severity !== "OK" && f.severity !== "INFO")
    .map((f) => {
      const rec: RepairRecommendation = {
        findingId: f.id,
        category: f.category,
        kind: kindFor(f),
        description: f.recommendedActions[0] ?? f.message,
        affectedArtifacts: f.affectedArtifacts,
        destructive: false,
      };
      const cmd = suggestedCommand(f);
      return cmd ? { ...rec, suggestedCommand: cmd } : rec;
    });
}
