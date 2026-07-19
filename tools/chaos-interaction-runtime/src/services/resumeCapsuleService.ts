/** Builds compact resume capsules from session state. */

import { createHash } from "node:crypto";
import type { CommandSession } from "../model/commandSession.ts";
import type {
  CapsuleState,
  Confidence,
  ContextCapsule,
  KnowledgeType,
  ResumeCapsule,
} from "../model/resumeCapsule.ts";

/** Deterministic (sorted-key) JSON serialisation for stable hashing. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

/**
 * SHA-256 over the capsule's content, excluding the hash field itself. Closes the
 * EA-I09 "null capsule hash" gap: a resume capsule can now be integrity-checked
 * against a torn or tampered write. Stored in `metadata.contentHash` (the schema
 * permits additional metadata properties, so no schema change is required).
 */
export function capsuleContentHash(capsule: ResumeCapsule): string {
  const meta = { ...(capsule.metadata ?? {}) } as Record<string, unknown>;
  delete meta["contentHash"];
  const payload = { ...capsule, metadata: meta };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

/** True iff the capsule carries a `metadata.contentHash` that matches its content. */
export function verifyCapsuleIntegrity(capsule: ResumeCapsule): boolean {
  const stored = (capsule.metadata as Record<string, unknown> | undefined)?.["contentHash"];
  if (typeof stored !== "string" || stored.length === 0) return false;
  return stored === capsuleContentHash(capsule);
}

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

  // Base metadata without any prior hash (recomputed below over fresh content).
  const baseMetadata = { ...(overrides.metadata ?? existing?.metadata ?? {}) } as Record<string, unknown>;
  delete baseMetadata["contentHash"];

  const capsule: ResumeCapsule = {
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
    metadata: baseMetadata,
  };
  // Stamp the integrity hash last (EA-I09).
  return { ...capsule, metadata: { ...baseMetadata, contentHash: capsuleContentHash(capsule) } };
}
