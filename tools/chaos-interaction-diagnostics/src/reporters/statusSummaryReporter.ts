/** Status reporter: a compact, actionable Interaction Runtime block for chaos:status. */

import type { InteractionRuntimeHealthReport } from "../model/healthReport.ts";
import type { HealthFinding } from "../model/healthFinding.ts";

/** First actionable next step, preferring blockers, then resume, then decisions. */
function nextAction(report: InteractionRuntimeHealthReport): string | null {
  const withAction = (f: HealthFinding): string | null =>
    f.recommendedActions.find((a) => a.startsWith("chaos:")) ?? null;

  const blocker = report.findings.find((f) => f.severity === "BLOCKER");
  if (blocker) {
    const a = withAction(blocker);
    if (a) return a;
  }
  const resume = report.findings.find((f) => f.id.startsWith("IR-SESSION-READY"));
  if (resume) {
    const a = resume.recommendedActions.find((x) => x.startsWith("chaos:resume"));
    if (a) return a;
  }
  if (report.summary.pendingDecisions > 0) {
    return "Answer pending decision(s) in the Decision Center.";
  }
  return null;
}

export function renderStatusSummary(report: InteractionRuntimeHealthReport): string {
  const s = report.summary;
  const lines: string[] = [];
  lines.push("## Interaction Runtime");
  lines.push("");
  lines.push(`- Runtime health: ${report.overallStatus}`);
  lines.push(`- Pending decisions: ${s.pendingDecisions}`);
  lines.push(`- Ready to resume: ${s.readyToResumeSessions}`);
  lines.push(`- Blocking locks: ${s.staleLocks}`);
  if (s.expiredRunnerLeases > 0) lines.push(`- Expired runner leases: ${s.expiredRunnerLeases}`);
  if (s.malformedArtifacts > 0) lines.push(`- Malformed artifacts: ${s.malformedArtifacts}`);

  const next = nextAction(report);
  if (next) {
    lines.push("");
    lines.push("Next suggested action:");
    lines.push(next);
  }
  lines.push("");
  return lines.join("\n");
}
