/** Normalized runtime health finding. */

import type { HealthSeverity } from "./severity.ts";
import type { TodoCandidate } from "./todoCandidate.ts";

export type HealthCategory =
  | "runtime-root"
  | "schema"
  | "artifact-validation"
  | "decision"
  | "session"
  | "lock"
  | "capsule"
  | "runner"
  | "mcp"
  | "decision-center"
  | "hook"
  | "command-contract"
  | "todo";

export interface HealthFinding {
  id: string;
  severity: HealthSeverity;
  category: HealthCategory;
  title: string;
  message: string;
  evidence: string[];
  affectedArtifacts: string[];
  recommendedActions: string[];
  todoCandidate?: TodoCandidate;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

/** Small builder to keep probe code terse and consistent. */
export function finding(input: {
  id: string;
  severity: HealthSeverity;
  category: HealthCategory;
  title: string;
  message: string;
  evidence?: string[];
  affectedArtifacts?: string[];
  recommendedActions?: string[];
  todoCandidate?: TodoCandidate;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
}): HealthFinding {
  return {
    id: input.id,
    severity: input.severity,
    category: input.category,
    title: input.title,
    message: input.message,
    evidence: input.evidence ?? [],
    affectedArtifacts: input.affectedArtifacts ?? [],
    recommendedActions: input.recommendedActions ?? [],
    ...(input.todoCandidate ? { todoCandidate: input.todoCandidate } : {}),
    confidence: input.confidence ?? "HIGH",
  };
}
