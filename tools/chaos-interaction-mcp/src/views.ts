/** Compact, model-friendly projections of runtime artifacts (summaries + rel paths). */

import type {
  InteractionRuntime,
  Decision,
  CommandSession,
  ResumeCapsule,
} from "./runtime.ts";

export function decisionPath(runtime: InteractionRuntime, decisionId: string): string {
  return runtime.paths.relative(runtime.paths.decision(decisionId));
}
export function responsePath(runtime: InteractionRuntime, decisionId: string): string {
  return runtime.paths.relative(runtime.paths.response(decisionId));
}
export function sessionPath(runtime: InteractionRuntime, commandRunId: string): string {
  return runtime.paths.relative(runtime.paths.session(commandRunId));
}
export function capsulePath(runtime: InteractionRuntime, commandRunId: string): string {
  return runtime.paths.relative(runtime.paths.capsule(commandRunId));
}

export function decisionSummary(runtime: InteractionRuntime, d: Decision): Record<string, unknown> {
  return {
    decisionId: d.decisionId,
    commandRunId: d.commandRunId,
    changeId: d.changeId,
    sourceCommand: d.sourceCommand,
    interactionType: d.interactionType,
    state: d.state,
    title: d.title,
    recommendedOptionId: d.recommendedOptionId,
    requiresRationale: d.requiresRationale,
    options: d.options.map((o) => ({ id: o.id, label: o.label, recommended: o.recommended })),
    createdAt: d.createdAt,
    expiresAt: d.expiresAt,
    decisionPath: decisionPath(runtime, d.decisionId),
  };
}

export function sessionSummary(runtime: InteractionRuntime, s: CommandSession): Record<string, unknown> {
  return {
    commandRunId: s.commandRunId,
    sourceCommand: s.sourceCommand,
    changeId: s.changeId,
    adapter: s.adapter,
    state: s.state,
    requestedMode: s.requestedMode,
    activeDecisionIds: s.activeDecisionIds,
    answeredDecisionIds: s.answeredDecisionIds,
    consumedDecisionIds: s.consumedDecisionIds,
    lockIds: s.lockIds,
    lastCompletedStep: s.lastCompletedStep,
    nextStep: s.nextStep,
    resumeCapsulePath: s.resumeCapsulePath,
    createdAt: s.createdAt,
    lastSeenAt: s.lastSeenAt,
    sessionPath: sessionPath(runtime, s.commandRunId),
  };
}

export function capsuleSummary(c: ResumeCapsule): Record<string, unknown> {
  return {
    commandRunId: c.commandRunId,
    sourceCommand: c.sourceCommand,
    changeId: c.changeId,
    state: c.state,
    lastCompletedStep: c.lastCompletedStep,
    nextStep: c.nextStep,
    answeredDecisionIds: c.answeredDecisionIds,
    consumedDecisionIds: c.consumedDecisionIds,
    requiredArtifacts: c.requiredArtifacts,
    confidence: c.confidence,
    knowledgeType: c.knowledgeType,
    updatedAt: c.updatedAt,
  };
}
