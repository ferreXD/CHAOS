/**
 * Todo Candidate builders for recurring runtime issues.
 *
 * Candidates align with `.claude/skills/chaos-todo/reference/todo-candidate-contract.md`
 * (so `chaos:todo` can promote them). Diagnostics only emits candidates for
 * *material* issues — routine/expected states do not get candidates (see the
 * contract's "What counts as material" guardrail).
 */

import type { TodoCandidate } from "../model/todoCandidate.ts";
import { rel, type ProbeContext } from "./probeContext.ts";

export function malformedArtifactCandidate(
  ctx: ProbeContext,
  filePath: string,
  kind: string,
): TodoCandidate {
  return {
    title: `Repair malformed interaction ${kind} artifact`,
    sourceArtifactPath: rel(ctx, filePath),
    sourceKind: "hook-violation",
    recommendedPriority: "HIGH",
    target: "current-change",
    type: "cleanup",
    scope: "repository",
    nextAction: `Inspect ${rel(ctx, filePath)} and repair via the owning command; do not hand-edit runtime JSON.`,
    recommendedCommand: "chaos:doctor",
    closureCriteria: [
      "Artifact parses and validates against its schema.",
      "chaos:doctor no longer reports it as malformed.",
    ],
    knowledgeType: "FACT",
    confidence: "HIGH",
  };
}

export function staleLockCandidate(
  ctx: ProbeContext,
  changeId: string | null,
  commandRunId: string,
  reason: string,
): TodoCandidate {
  return {
    title: `Review stale interaction lock${changeId ? ` for ${changeId}` : ""}`,
    sourceArtifactPath: rel(ctx, ctx.paths.locks()),
    sourceKind: "finding",
    recommendedPriority: "HIGH",
    target: "current-change",
    type: "governance",
    scope: "repository",
    nextAction: `Inspect the lock (${reason}); resume via chaos:resume --run ${commandRunId} or cancel the obsolete session. Do not auto-delete.`,
    recommendedCommand: `chaos:resume --run ${commandRunId}`,
    closureCriteria: [
      "Lock is released by completing/cancelling the owning session, or confirmed still valid.",
    ],
    knowledgeType: "INFERENCE",
    confidence: "MEDIUM",
  };
}

export function missingCapsuleCandidate(
  ctx: ProbeContext,
  commandRunId: string,
): TodoCandidate {
  return {
    title: `Recreate missing resume capsule for ${commandRunId}`,
    sourceArtifactPath: rel(ctx, ctx.paths.session(commandRunId)),
    sourceKind: "missing-evidence",
    recommendedPriority: "MEDIUM",
    target: "current-change",
    type: "cleanup",
    scope: "repository",
    nextAction: `Session is ready-to-resume but has no capsule; recreate it (chaos_create_resume_capsule) or inspect why it is missing.`,
    recommendedCommand: `chaos:resume --run ${commandRunId}`,
    closureCriteria: ["A valid resume capsule exists for the session, or the session is closed."],
    knowledgeType: "FACT",
    confidence: "HIGH",
  };
}

export function expiredLeaseCandidate(
  ctx: ProbeContext,
  leasePath: string,
  commandRunId: string | null,
): TodoCandidate {
  return {
    title: `Clean up expired runner lease`,
    sourceArtifactPath: rel(ctx, leasePath),
    sourceKind: "finding",
    recommendedPriority: "LOW",
    target: "current-change",
    type: "cleanup",
    scope: "repository",
    nextAction: commandRunId
      ? `Runner is no longer live; resume the session explicitly with chaos:resume --run ${commandRunId}.`
      : "Runner is no longer live; review the expired lease.",
    ...(commandRunId ? { recommendedCommand: `chaos:resume --run ${commandRunId}` } : {}),
    closureCriteria: ["Session resumed or closed; expired lease no longer blocks understanding of state."],
    knowledgeType: "FACT",
    confidence: "HIGH",
  };
}

export function oldPendingDecisionCandidate(
  ctx: ProbeContext,
  decisionId: string,
  ageHours: number,
): TodoCandidate {
  return {
    title: `Answer or cancel long-pending decision ${decisionId}`,
    sourceArtifactPath: rel(ctx, ctx.paths.decision(decisionId)),
    sourceIds: [decisionId],
    sourceKind: "unresolved-decision",
    recommendedPriority: "HIGH",
    target: "current-change",
    type: "decision",
    scope: "repository",
    nextAction: `Decision has been pending ~${Math.round(ageHours)}h. Answer it in the Decision Center or cancel the owning session.`,
    recommendedCommand: "chaos:status",
    closureCriteria: ["Decision answered and consumed, or the owning session cancelled."],
    knowledgeType: "FACT",
    confidence: "HIGH",
  };
}

export function commandIntegrationCandidate(
  ctx: ProbeContext,
  commandFile: string,
  commandName: string,
): TodoCandidate {
  return {
    title: `Integrate interaction runtime into ${commandName}`,
    sourceArtifactPath: rel(ctx, commandFile),
    sourceKind: "missing-doc",
    recommendedPriority: "MEDIUM",
    target: "vNext",
    type: "documentation",
    scope: "repository",
    nextAction: `${commandName} does not reference the interaction runtime / mustStop / decision protocol; align its contract (Iteration 6 integration).`,
    closureCriteria: [`${commandName} documents how it reads runtime state and honours mustStop.`],
    knowledgeType: "INFERENCE",
    confidence: "MEDIUM",
  };
}
