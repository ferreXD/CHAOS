/** Pure helpers for decision construction, validation, and transitions. */

import type {
  Decision,
  DecisionOption,
  DecisionState,
  InteractionType,
} from "../model/decision.ts";
import { canTransitionDecision } from "../model/decision.ts";
import { InvalidDecisionPayloadError, InvalidStateTransitionError } from "./errors.ts";

export interface CreateDecisionInput {
  decisionId: string;
  commandRunId: string;
  changeId: string | null;
  sourceCommand: string;
  title: string;
  context: string;
  options: DecisionOption[];
  interactionType?: InteractionType;
  recommendation?: string | null;
  recommendedOptionId?: string | null;
  requiresRationale?: boolean;
  independent?: boolean;
  expiresAt?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
  now: string;
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/** Validate the decision payload before anything is written. */
export function validateDecisionPayload(input: CreateDecisionInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new InvalidDecisionPayloadError("Decision title must be non-empty.");
  }
  if (!input.context || input.context.trim().length === 0) {
    throw new InvalidDecisionPayloadError("Decision context must be non-empty.");
  }
  if (!Array.isArray(input.options) || input.options.length === 0) {
    throw new InvalidDecisionPayloadError("Decision must declare at least one option.");
  }

  const seen = new Set<string>();
  for (const option of input.options) {
    if (!option.id || !ID_PATTERN.test(option.id)) {
      throw new InvalidDecisionPayloadError(
        `Option id "${option.id}" is missing or invalid (must match ${ID_PATTERN}).`,
      );
    }
    if (!option.label || option.label.trim().length === 0) {
      throw new InvalidDecisionPayloadError(`Option "${option.id}" must have a label.`);
    }
    if (seen.has(option.id)) {
      throw new InvalidDecisionPayloadError(`Duplicate option id "${option.id}".`);
    }
    seen.add(option.id);
  }

  if (
    input.recommendedOptionId != null &&
    !seen.has(input.recommendedOptionId)
  ) {
    throw new InvalidDecisionPayloadError(
      `recommendedOptionId "${input.recommendedOptionId}" does not match any option id.`,
    );
  }
}

function inferInteractionType(input: CreateDecisionInput): InteractionType {
  if (input.interactionType) return input.interactionType;
  return "single-choice-decision";
}

/**
 * Placeholder option for a freeform-input decision authored without options. The
 * answer is the typed text (`freeformValue`), not a selected option, but the
 * decision schema still requires at least one option, so a stable placeholder is
 * supplied. The Decision Center renders freeform as a text field and ignores it.
 */
export const DEFAULT_FREEFORM_OPTION: DecisionOption = {
  id: "freeform-response",
  label: "Provide a written answer",
};

/** Options actually stored for a decision, applying the freeform placeholder rule. */
export function effectiveOptionsFor(
  interactionType: InteractionType,
  options: DecisionOption[] | undefined,
): DecisionOption[] {
  const supplied = Array.isArray(options) ? options : [];
  if (interactionType === "freeform-input" && supplied.length === 0) {
    return [DEFAULT_FREEFORM_OPTION];
  }
  return supplied;
}

export function buildDecision(input: CreateDecisionInput): Decision {
  const interactionType = inferInteractionType(input);
  const effectiveOptions = effectiveOptionsFor(interactionType, input.options);
  const normalized: CreateDecisionInput = { ...input, options: effectiveOptions, interactionType };
  validateDecisionPayload(normalized);

  const recommendedOptionId =
    normalized.recommendedOptionId ??
    effectiveOptions.find((o) => o.recommended)?.id ??
    null;

  const options: DecisionOption[] = effectiveOptions.map((o) => ({
    id: o.id,
    label: o.label,
    description: o.description ?? null,
    consequence: o.consequence ?? null,
    risk: o.risk ?? null,
    recommended: o.recommended ?? o.id === recommendedOptionId,
  }));

  return {
    schemaVersion: 1,
    decisionId: input.decisionId,
    commandRunId: input.commandRunId,
    changeId: input.changeId,
    sourceCommand: input.sourceCommand,
    interactionType,
    // Decisions are created directly in `waiting` (they require input now).
    state: "waiting",
    title: input.title,
    context: input.context,
    recommendation: input.recommendation ?? null,
    recommendedOptionId,
    options,
    requiresRationale: input.requiresRationale ?? false,
    independent: input.independent ?? false,
    blocks: [],
    unlocksOn: {},
    createdAt: input.now,
    expiresAt: input.expiresAt ?? null,
    createdBy: input.createdBy ?? input.sourceCommand,
    metadata: input.metadata ?? {},
  };
}

export function transitionDecision(
  decision: Decision,
  to: DecisionState,
): Decision {
  if (decision.state === to) return decision;
  if (!canTransitionDecision(decision.state, to)) {
    throw new InvalidStateTransitionError("decision", decision.state, to);
  }
  return { ...decision, state: to };
}

export function optionExists(decision: Decision, optionId: string): boolean {
  return decision.options.some((o) => o.id === optionId);
}
