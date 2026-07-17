/**
 * Pure stop-condition predicates and response validation.
 *
 * These are the safety gates from the Iteration 5 brief and the auto-resume
 * policy. Each returns a StopCondition (reason + outcome + message) or null.
 */

import type { Decision, DecisionResponse } from "../runtime.ts";
import type { RunnerOutcome, StopReason } from "../protocol/runnerResult.ts";
import type { RunnerLease } from "../runtime/sessionLease.ts";

export interface StopCondition {
  reason: StopReason;
  outcome: RunnerOutcome;
  message: string;
}

export interface ResponseValidation {
  valid: boolean;
  reason?: StopReason;
  message?: string;
}

/** Validate an answered response against its decision. */
export function validateResponse(
  decision: Decision,
  response: DecisionResponse | undefined,
): ResponseValidation {
  if (!response) {
    return { valid: false, reason: "invalid-response", message: "No response recorded for decision." };
  }
  if (!response.selectedOptionId) {
    return {
      valid: false,
      reason: "invalid-response",
      message: `Decision ${decision.decisionId} has no selected option (runner requires a discrete choice).`,
    };
  }
  const optionIds = new Set(decision.options.map((o) => o.id));
  if (!optionIds.has(response.selectedOptionId)) {
    return {
      valid: false,
      reason: "invalid-response",
      message: `Selected option "${response.selectedOptionId}" is not valid for ${decision.decisionId}.`,
    };
  }
  if (decision.requiresRationale && !(response.rationale && response.rationale.trim().length > 0)) {
    return {
      valid: false,
      reason: "missing-rationale",
      message: `Decision ${decision.decisionId} requires a rationale.`,
    };
  }
  return { valid: true };
}

/** Manual stop flag present → stop safely, leaving the session resumable. */
export function checkManualStopFlag(present: boolean): StopCondition | null {
  return present
    ? {
        reason: "manual-stop-flag",
        outcome: "READY_FOR_MANUAL_RESUME",
        message: "Manual stop flag present; stopping and leaving session resumable.",
      }
    : null;
}

/** Own lease expired unexpectedly → treat the session as no longer live. */
export function checkLeaseLive(lease: RunnerLease | null, nowIso: string): StopCondition | null {
  if (!lease) return null;
  const expired = new Date(nowIso).getTime() > new Date(lease.leaseExpiresAt).getTime();
  return expired
    ? {
        reason: "lease-expired",
        outcome: "READY_FOR_MANUAL_RESUME",
        message: "Runner lease expired; session is no longer live. Use chaos:resume.",
      }
    : null;
}

/** A ready-to-resume decision that was cancelled/expired/superseded blocks resume. */
export function stopForClosedDecision(
  closedReason: "cancelled" | "expired" | "superseded",
): StopCondition {
  const reason: StopReason =
    closedReason === "cancelled"
      ? "decision-cancelled"
      : closedReason === "expired"
        ? "decision-expired"
        : "decision-superseded";
  return {
    reason,
    outcome: "READY_FOR_MANUAL_RESUME",
    message: `Decision ${closedReason}; cannot auto-resume. Use chaos:resume.`,
  };
}

/** Convert a validation failure into a stop condition. */
export function stopForInvalidResponse(validation: ResponseValidation): StopCondition {
  return {
    reason: validation.reason ?? "invalid-response",
    outcome: "READY_FOR_MANUAL_RESUME",
    message: validation.message ?? "Response failed validation.",
  };
}
