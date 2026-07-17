/**
 * Pure auto-resume decision.
 *
 * Encodes the Iteration 0 auto-resume policy: auto-resume is only allowed when a
 * live runner controls the session, the answer validates, and the cycle budget is
 * not exhausted. Any failure resolves to a manual-resume stop (never a guess).
 */

import type { StopReason } from "../protocol/runnerResult.ts";

export interface AutoResumePolicyInput {
  cyclesUsed: number;
  maxCycles: number;
  responseValid: boolean;
  rationaleSatisfied: boolean;
  allowAutoResumeWhenRunnerActive: boolean;
  runnerAlive: boolean;
  adapterSupportsResume: boolean;
}

export type AutoResumeDecision =
  | { action: "auto-resume" }
  | { action: "stop-manual"; reason: StopReason };

export function evaluateAutoResume(input: AutoResumePolicyInput): AutoResumeDecision {
  if (!input.allowAutoResumeWhenRunnerActive) {
    return { action: "stop-manual", reason: "auto-resume-disabled" };
  }
  if (!input.runnerAlive) {
    return { action: "stop-manual", reason: "process-dead" };
  }
  if (!input.adapterSupportsResume) {
    return { action: "stop-manual", reason: "adapter-cannot-resume" };
  }
  if (!input.responseValid) {
    return { action: "stop-manual", reason: "invalid-response" };
  }
  if (!input.rationaleSatisfied) {
    return { action: "stop-manual", reason: "missing-rationale" };
  }
  if (input.cyclesUsed >= input.maxCycles) {
    return { action: "stop-manual", reason: "max-cycles-reached" };
  }
  return { action: "auto-resume" };
}
