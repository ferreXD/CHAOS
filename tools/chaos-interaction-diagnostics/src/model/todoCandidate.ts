/**
 * Todo Candidate model.
 *
 * Aligned with the repo's authoritative contract
 * `.claude/skills/chaos-todo/reference/todo-candidate-contract.md` so an emitted
 * candidate is actually promotable by `chaos:todo`. Diagnostics only EMITS
 * candidates; it never writes durable `.chaos/todo/items/` files.
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
