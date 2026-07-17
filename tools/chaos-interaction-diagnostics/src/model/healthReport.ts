/** Aggregate interaction-runtime health report + assembly helpers. */

import type { HealthFinding } from "./healthFinding.ts";
import type { TodoCandidate } from "./todoCandidate.ts";
import { rollUpStatus, type OverallStatus } from "./severity.ts";

export interface HealthReportSummary {
  pendingDecisions: number;
  readyToResumeSessions: number;
  staleLocks: number;
  expiredRunnerLeases: number;
  malformedArtifacts: number;
  blockingFindings: number;
}

export interface InteractionRuntimeHealthReport {
  generatedAt: string;
  repositoryRoot: string;
  interactionsRoot: string;
  overallStatus: OverallStatus;
  summary: HealthReportSummary;
  findings: HealthFinding[];
  todoCandidates: TodoCandidate[];
}

/** Counters a probe can bump as it runs; folded into the report summary. */
export interface SummaryCounters {
  pendingDecisions: number;
  readyToResumeSessions: number;
  staleLocks: number;
  expiredRunnerLeases: number;
  malformedArtifacts: number;
}

export function emptyCounters(): SummaryCounters {
  return {
    pendingDecisions: 0,
    readyToResumeSessions: 0,
    staleLocks: 0,
    expiredRunnerLeases: 0,
    malformedArtifacts: 0,
  };
}

export function assembleReport(input: {
  generatedAt: string;
  repositoryRoot: string;
  interactionsRoot: string;
  findings: HealthFinding[];
  counters: SummaryCounters;
}): InteractionRuntimeHealthReport {
  const { findings } = input;
  const blockingFindings = findings.filter((f) => f.severity === "BLOCKER").length;
  const todoCandidates = findings
    .filter((f) => f.todoCandidate)
    .map((f) => f.todoCandidate!);

  return {
    generatedAt: input.generatedAt,
    repositoryRoot: input.repositoryRoot,
    interactionsRoot: input.interactionsRoot,
    overallStatus: rollUpStatus(findings.map((f) => f.severity)),
    summary: {
      pendingDecisions: input.counters.pendingDecisions,
      readyToResumeSessions: input.counters.readyToResumeSessions,
      staleLocks: input.counters.staleLocks,
      expiredRunnerLeases: input.counters.expiredRunnerLeases,
      malformedArtifacts: input.counters.malformedArtifacts,
      blockingFindings,
    },
    findings,
    todoCandidates,
  };
}
