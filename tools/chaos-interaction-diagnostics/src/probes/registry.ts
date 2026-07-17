/** Probe registry + top-level health report generation. */

import type { DiagnosticsConfig } from "../config/diagnosticsConfig.ts";
import {
  assembleReport,
  emptyCounters,
  type InteractionRuntimeHealthReport,
} from "../model/healthReport.ts";
import type { HealthFinding } from "../model/healthFinding.ts";
import { createProbeContext, type Probe } from "./probeContext.ts";
import { runtimeRootProbe } from "./runtimeRootProbe.ts";
import { schemaProbe } from "./schemaProbe.ts";
import { artifactValidationProbe } from "./artifactValidationProbe.ts";
import { decisionProbe } from "./decisionProbe.ts";
import { sessionProbe } from "./sessionProbe.ts";
import { lockProbe } from "./lockProbe.ts";
import { capsuleProbe } from "./capsuleProbe.ts";
import { runnerLeaseProbe } from "./runnerLeaseProbe.ts";
import { mcpProbe } from "./mcpProbe.ts";
import { decisionCenterProbe } from "./decisionCenterProbe.ts";
import { hooksProbe } from "./hooksProbe.ts";
import { commandContractProbe } from "./commandContractProbe.ts";

/** All probes in report order. */
export const ALL_PROBES: Array<[string, Probe]> = [
  ["runtime-root", runtimeRootProbe],
  ["schema", schemaProbe],
  ["artifact-validation", artifactValidationProbe],
  ["decision", decisionProbe],
  ["session", sessionProbe],
  ["lock", lockProbe],
  ["capsule", capsuleProbe],
  ["runner", runnerLeaseProbe],
  ["mcp", mcpProbe],
  ["decision-center", decisionCenterProbe],
  ["hook", hooksProbe],
  ["command-contract", commandContractProbe],
];

export interface GenerateOptions {
  now?: Date;
}

/**
 * Run every probe (read-only) and assemble the health report. A probe throwing
 * unexpectedly is contained: it becomes an ERROR finding rather than aborting the
 * whole run (diagnostics must never crash the caller).
 */
export function generateHealthReport(
  config: DiagnosticsConfig,
  options: GenerateOptions = {},
): InteractionRuntimeHealthReport {
  const now = options.now ?? new Date();
  const counters = emptyCounters();
  const ctx = createProbeContext(config, counters, now);
  const findings: HealthFinding[] = [];

  for (const [name, probe] of ALL_PROBES) {
    try {
      findings.push(...probe(ctx));
    } catch (err) {
      findings.push({
        id: `IR-PROBE-CRASH-${name}`,
        severity: "ERROR",
        category: "runtime-root",
        title: `Probe "${name}" failed to run`,
        message: `The ${name} probe threw: ${err instanceof Error ? err.message : String(err)}. Other probes still ran.`,
        evidence: [],
        affectedArtifacts: [],
        recommendedActions: ["Report this as a diagnostics bug; it does not reflect runtime state."],
        confidence: "LOW",
      });
    }
  }

  const filtered = config.includeTodoCandidates
    ? findings
    : findings.map((f) => {
        if (!f.todoCandidate) return f;
        const { todoCandidate: _omit, ...rest } = f;
        return rest;
      });

  return assembleReport({
    generatedAt: now.toISOString(),
    repositoryRoot: config.repositoryRoot,
    interactionsRoot: config.interactionsRoot,
    findings: filtered,
    counters,
  });
}
