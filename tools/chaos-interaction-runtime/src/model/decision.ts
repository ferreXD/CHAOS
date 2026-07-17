/**
 * Decision model + state machine.
 *
 * Mirrors `.chaos/interactions/schema/decision.schema.json` and the decision
 * transitions in `.chaos/interactions/contracts/state-machine-contract.md`.
 */

export type DecisionState =
  | "created"
  | "waiting"
  | "answered"
  | "consumed"
  | "cancelled"
  | "expired"
  | "superseded";

export type InteractionType =
  | "single-choice-decision"
  | "multi-choice-decision"
  | "confirmation"
  | "freeform-input";

export interface DecisionOption {
  id: string;
  label: string;
  description?: string | null;
  consequence?: string | null;
  risk?: string | null;
  recommended?: boolean;
}

export interface Decision {
  schemaVersion: 1;
  decisionId: string;
  commandRunId: string;
  changeId: string | null;
  sourceCommand: string;
  interactionType: InteractionType;
  state: DecisionState;
  title: string;
  context: string;
  recommendation: string | null;
  recommendedOptionId: string | null;
  options: DecisionOption[];
  requiresRationale: boolean;
  independent: boolean;
  blocks: string[];
  unlocksOn: Record<string, string[]>;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string | null;
  metadata: Record<string, unknown>;
}

export const DECISION_TERMINAL_STATES: ReadonlySet<DecisionState> = new Set([
  "consumed",
  "cancelled",
  "expired",
  "superseded",
]);

export const DECISION_TRANSITIONS: Readonly<Record<DecisionState, ReadonlySet<DecisionState>>> = {
  created: new Set(["waiting", "cancelled", "superseded"]),
  waiting: new Set(["answered", "cancelled", "expired", "superseded"]),
  answered: new Set(["consumed", "superseded"]),
  consumed: new Set([]),
  cancelled: new Set([]),
  expired: new Set([]),
  superseded: new Set([]),
};

export function isTerminalDecisionState(state: DecisionState): boolean {
  return DECISION_TERMINAL_STATES.has(state);
}

export function canTransitionDecision(from: DecisionState, to: DecisionState): boolean {
  return DECISION_TRANSITIONS[from]?.has(to) ?? false;
}
