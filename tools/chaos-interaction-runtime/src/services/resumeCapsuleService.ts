/** Builds compact resume capsules from session state. */

import type { CommandSession } from "../model/commandSession.ts";
import type {
  CapsuleState,
  Confidence,
  ContextCapsule,
  KnowledgeType,
  ResumeCapsule,
} from "../model/resumeCapsule.ts";

export interface CapsuleOverrides {
  intent?: string;
  approvedScope?: string[];
  selectedPath?: string | null;
  constraints?: string[];
  assumptions?: string[];
  openRisks?: string[];
  confidenceCaps?: string[];
  forbiddenActions?: string[];
  requiredArtifacts?: string[];
  nextStep?: string;
  lastCompletedStep?: string | null;
  confidence?: Confidence;
  knowledgeType?: KnowledgeType;
  metadata?: Record<string, unknown>;
}

function toCapsuleState(state: CommandSession["state"]): CapsuleState {
  switch (state) {
    case "created":
    case "running":
      // A capsule for a still-running session is recorded as waiting.
      return "waiting-for-decision";
    default:
      return state as CapsuleState;
  }
}

/**
 * Build/refresh a resume capsule. Existing capsule (if any) provides defaults so
 * repeated calls are idempotent and preserve `createdAt`.
 */
export function buildResumeCapsule(
  session: CommandSession,
  now: string,
  overrides: CapsuleOverrides = {},
  existing?: ResumeCapsule,
): ResumeCapsule {
  const context: ContextCapsule = {
    intent:
      overrides.intent ??
      existing?.contextCapsule.intent ??
      `Resume ${session.sourceCommand}${session.changeId ? ` for ${session.changeId}` : ""}.`,
    approvedScope: overrides.approvedScope ?? existing?.contextCapsule.approvedScope ?? [],
    selectedPath: overrides.selectedPath ?? existing?.contextCapsule.selectedPath ?? null,
    constraints: overrides.constraints ?? existing?.contextCapsule.constraints ?? [],
    assumptions: overrides.assumptions ?? existing?.contextCapsule.assumptions ?? [],
    openRisks: overrides.openRisks ?? existing?.contextCapsule.openRisks ?? [],
    confidenceCaps: overrides.confidenceCaps ?? existing?.contextCapsule.confidenceCaps ?? [],
    forbiddenActions: overrides.forbiddenActions ?? existing?.contextCapsule.forbiddenActions ?? [],
  };

  const nextStep =
    overrides.nextStep ??
    session.nextStep ??
    existing?.nextStep ??
    "resume-command";

  return {
    schemaVersion: 1,
    commandRunId: session.commandRunId,
    sourceCommand: session.sourceCommand,
    changeId: session.changeId,
    state: toCapsuleState(session.state),
    lastCompletedStep:
      overrides.lastCompletedStep ?? session.lastCompletedStep ?? existing?.lastCompletedStep ?? null,
    nextStep,
    answeredDecisionIds: [...session.answeredDecisionIds],
    consumedDecisionIds: [...session.consumedDecisionIds],
    requiredArtifacts: overrides.requiredArtifacts ?? existing?.requiredArtifacts ?? [],
    contextCapsule: context,
    confidence: overrides.confidence ?? existing?.confidence ?? "MEDIUM",
    knowledgeType: overrides.knowledgeType ?? existing?.knowledgeType ?? "INFERENCE",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    metadata: overrides.metadata ?? existing?.metadata ?? {},
  };
}
