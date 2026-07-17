/**
 * CHAOS Interaction Diagnostics — public API (Iteration 7).
 *
 * Read-only health checks, doctor/status reporting, stale-state detection, Todo
 * Candidate emission, and an advisory runtime-contract hook guard over the
 * Iteration 1 runtime. Diagnostics never mutates runtime state and never performs
 * destructive repair.
 */

export { resolveDiagnosticsConfig } from "./config/diagnosticsConfig.ts";
export type { DiagnosticsConfig, EnforcementMode } from "./config/diagnosticsConfig.ts";

export { generateHealthReport, ALL_PROBES } from "./probes/registry.ts";
export type { GenerateOptions } from "./probes/registry.ts";
export { createProbeContext } from "./probes/probeContext.ts";
export type { ProbeContext, Probe } from "./probes/probeContext.ts";

export type {
  HealthSeverity,
  OverallStatus,
} from "./model/severity.ts";
export { rollUpStatus, maxSeverity, SEVERITY_ORDER } from "./model/severity.ts";
export type { HealthFinding, HealthCategory } from "./model/healthFinding.ts";
export { finding } from "./model/healthFinding.ts";
export type {
  InteractionRuntimeHealthReport,
  HealthReportSummary,
  SummaryCounters,
} from "./model/healthReport.ts";
export { assembleReport, emptyCounters } from "./model/healthReport.ts";
export type { TodoCandidate } from "./model/todoCandidate.ts";

export { renderJson } from "./reporters/jsonReporter.ts";
export { renderStatusSummary } from "./reporters/statusSummaryReporter.ts";
export { renderDoctorSection, worstSeverity } from "./reporters/markdownReporter.ts";
export { renderDoctorReport } from "./reporters/doctorReporter.ts";

export { planRepairs } from "./repair/repairPlanner.ts";
export type { RepairRecommendation, RepairKind } from "./repair/repairRecommendation.ts";

export {
  RuntimeContractGuard,
} from "./hooks/runtimeContractGuard.ts";
export type {
  RuntimeHookViolation,
  RuntimeViolationType,
  GuardResult,
  MustStopContext,
  WriteContext,
} from "./hooks/runtimeContractGuard.ts";
export { HookViolationWriter, toStreamLine, IR_GUARD_HOOK } from "./hooks/hookViolationWriter.ts";
