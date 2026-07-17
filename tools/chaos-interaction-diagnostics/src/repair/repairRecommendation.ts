/**
 * Repair recommendation model.
 *
 * IMPORTANT: recommendations are ADVISORY. This package never mutates runtime
 * state. There is deliberately no executor — state changes must remain explicit
 * and command-driven (see the Iteration 7 repair policy).
 */

import type { HealthCategory } from "../model/healthFinding.ts";

export type RepairKind =
  | "inspect-artifact"
  | "resume-session"
  | "cancel-session"
  | "answer-decision"
  | "recreate-capsule"
  | "review-lock"
  | "review-lease"
  | "align-command-contract"
  | "no-action";

export interface RepairRecommendation {
  findingId: string;
  category: HealthCategory;
  kind: RepairKind;
  /** Human-readable, non-destructive recommendation. */
  description: string;
  /** A CHAOS command to run next, if any. Never executed by diagnostics. */
  suggestedCommand?: string;
  affectedArtifacts: string[];
  /** Always false in Iteration 7: diagnostics never auto-applies. */
  destructive: false;
}
