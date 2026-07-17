/**
 * Resume capsule model.
 *
 * Mirrors `.chaos/interactions/schema/resume-capsule.schema.json` and the
 * contract in `.chaos/interactions/contracts/resume-capsule-contract.md`.
 */

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type KnowledgeType = "FACT" | "INFERENCE" | "ASSUMPTION" | "UNKNOWN" | "CONFLICT";

export type CapsuleState =
  | "waiting-for-decision"
  | "ready-to-resume"
  | "resumed"
  | "completed"
  | "cancelled"
  | "expired"
  | "failed";

export interface ContextCapsule {
  intent: string;
  approvedScope: string[];
  selectedPath?: string | null;
  constraints: string[];
  assumptions?: string[];
  openRisks: string[];
  confidenceCaps?: string[];
  forbiddenActions?: string[];
}

export interface ResumeCapsule {
  schemaVersion: 1;
  commandRunId: string;
  sourceCommand: string;
  changeId: string | null;
  state: CapsuleState;
  lastCompletedStep: string | null;
  nextStep: string;
  answeredDecisionIds: string[];
  consumedDecisionIds: string[];
  requiredArtifacts: string[];
  contextCapsule: ContextCapsule;
  confidence: Confidence;
  knowledgeType: KnowledgeType;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/** Compact projection of a capsule for discovery/listing (never full bodies). */
export interface ResumeCapsuleSummary {
  commandRunId: string;
  sourceCommand: string;
  changeId: string | null;
  state: CapsuleState;
  lastCompletedStep: string | null;
  nextStep: string;
  answeredDecisionIds: string[];
  consumedDecisionIds: string[];
  requiredArtifacts: string[];
  confidence: Confidence;
  updatedAt: string;
  capsulePath: string;
}

/** A resumable session (ready-to-resume) joined with its capsule, if any. */
export interface ResumeCandidate {
  commandRunId: string;
  sourceCommand: string;
  changeId: string | null;
  sessionState: string;
  nextStep: string | null;
  capsulePath: string | null;
  hasCapsule: boolean;
  answeredDecisionIds: string[];
  updatedAt: string;
}

export interface ListCapsulesFilter {
  changeId?: string;
  commandRunId?: string;
  sourceCommand?: string;
  state?: string;
  readyToResumeOnly?: boolean;
}

export interface FindResumeCandidatesFilter {
  changeId?: string;
  commandRunId?: string;
  sourceCommand?: string;
  latest?: boolean;
}
