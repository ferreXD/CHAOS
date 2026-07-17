/**
 * Doctor reporter: a standalone Markdown document wrapping the Interaction Runtime
 * section, for when diagnostics is run on its own (the CLI `doctor` command). When
 * embedded by `chaos:doctor`, use `renderDoctorSection` directly instead.
 */

import type { InteractionRuntimeHealthReport } from "../model/healthReport.ts";
import { renderDoctorSection } from "./markdownReporter.ts";

export function renderDoctorReport(report: InteractionRuntimeHealthReport): string {
  const lines: string[] = [];
  lines.push("# Interaction Runtime Health");
  lines.push("");
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Repository root: ${report.repositoryRoot}`);
  lines.push(`- Interactions root: ${report.interactionsRoot}`);
  lines.push("");
  lines.push("> Read-only diagnostics. No runtime state was modified; no repair was performed.");
  lines.push("");
  lines.push(renderDoctorSection(report));
  return lines.join("\n");
}
