/**
 * Markdown reporter: the detailed `## Interaction Runtime` section that
 * `chaos:doctor` embeds in its report.
 */

import type { InteractionRuntimeHealthReport } from "../model/healthReport.ts";
import type { HealthFinding } from "../model/healthFinding.ts";
import type { TodoCandidate } from "../model/todoCandidate.ts";
import { SEVERITY_ORDER, type HealthSeverity } from "../model/severity.ts";

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function findingBlock(f: HealthFinding): string[] {
  const lines: string[] = [];
  lines.push(`- ${f.severity} ${f.id}: ${f.title}`);
  if (f.message) lines.push(`  ${f.message}`);
  if (f.evidence.length) lines.push(`  Evidence: ${f.evidence.join(", ")}`);
  if (f.recommendedActions.length) {
    lines.push(`  Recommended action: ${f.recommendedActions.join(" ")}`);
  }
  return lines;
}

/** Canonical "Todo Candidates" table row (matches todo-candidate-contract.md). */
function candidateRow(c: TodoCandidate): string {
  return (
    `| ${cell(c.title)} | ${cell((c.sourceIds ?? []).join(", ") || "—")} | ${cell(c.sourceKind)} ` +
    `| ${cell(c.recommendedPriority)} | ${cell(c.target)} | ${cell(c.type)} | ${cell(c.nextAction)} ` +
    `| ${cell(c.knowledgeType)} | ${cell(c.confidence)} |`
  );
}

export function renderDoctorSection(report: InteractionRuntimeHealthReport): string {
  const s = report.summary;
  const lines: string[] = [];

  lines.push("## Interaction Runtime");
  lines.push("");
  lines.push(`Status: ${report.overallStatus}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(`- Pending decisions: ${s.pendingDecisions}`);
  lines.push(`- Ready to resume sessions: ${s.readyToResumeSessions}`);
  lines.push(`- Stale locks: ${s.staleLocks}`);
  lines.push(`- Expired runner leases: ${s.expiredRunnerLeases}`);
  lines.push(`- Malformed artifacts: ${s.malformedArtifacts}`);
  lines.push(`- Blocking findings: ${s.blockingFindings}`);
  lines.push("");

  const actionable = report.findings
    .filter((f) => f.severity !== "OK")
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  const okCount = report.findings.filter((f) => f.severity === "OK").length;

  lines.push("Findings:");
  if (actionable.length === 0) {
    lines.push(`- OK: all ${okCount} checks healthy.`);
  } else {
    for (const f of actionable) lines.push(...findingBlock(f));
    if (okCount > 0) lines.push(`- (${okCount} additional check(s) OK.)`);
  }
  lines.push("");

  if (report.todoCandidates.length > 0) {
    lines.push("Todo Candidates:");
    lines.push("");
    lines.push(
      "> Optional. This section does not create durable todo items — run `chaos:todo` to curate the backlog.",
    );
    lines.push("");
    lines.push(
      "| Title | Source ID(s) | Kind | Priority | Target | Type | Next action | Knowledge type | Confidence |",
    );
    lines.push("|---|---|---|---|---|---|---|---|---|");
    for (const c of report.todoCandidates) lines.push(candidateRow(c));
    lines.push("");
  }

  return lines.join("\n");
}

/** Convenience: the highest severity present (for callers wanting a badge). */
export function worstSeverity(report: InteractionRuntimeHealthReport): HealthSeverity {
  let worst: HealthSeverity = "OK";
  for (const f of report.findings) {
    if (SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[worst]) worst = f.severity;
  }
  return worst;
}
