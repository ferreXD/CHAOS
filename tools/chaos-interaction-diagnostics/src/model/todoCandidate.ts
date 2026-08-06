/**
 * Todo Candidate model.
 *
 * A todo candidate is an advisory follow-up suggestion emitted into the doctor
 * report. Nothing consumes candidates automatically in the lean core; diagnostics
 * only EMITS them and never writes durable files for them.
 */

export type TodoPriority = "BLOCKER" | "HIGH" | "MEDIUM" | "LOW";

export type TodoSourceKind =
  | "finding"
  | "unresolved-decision"
  | "missing-evidence"
  | "missing-doc"
  | "deferred-work"
  | "hook-violation"
  | "doctor-warning";

export type TodoType =
  | "documentation"
  | "implementation"
  | "adapter"
  | "governance"
  | "hook"
  | "mcp"
  | "test"
  | "decision"
  | "cleanup";

export type TodoTarget =
  | "current-change"
  | "internal-alpha"
  | "public-alpha"
  | "beta"
  | "v1"
  | "vNext"
  | "later";

export type KnowledgeType = "FACT" | "INFERENCE" | "ASSUMPTION" | "UNKNOWN" | "CONFLICT";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export interface TodoCandidate {
  title: string;
  sourceArtifactPath: string;
  sourceIds?: string[];
  sourceKind: TodoSourceKind;
  recommendedPriority: TodoPriority;
  target: TodoTarget;
  type: TodoType;
  scope: "repository" | "current-change";
  nextAction: string;
  recommendedCommand?: string;
  closureCriteria: string[];
  knowledgeType: KnowledgeType;
  confidence: Confidence;
}
