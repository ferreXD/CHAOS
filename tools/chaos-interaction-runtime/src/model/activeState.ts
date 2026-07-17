/**
 * Active interaction state + interaction index models.
 *
 * Mirrors `.chaos/interactions/schema/active.schema.json` and
 * `.chaos/interactions/schema/index.schema.json`.
 */

export type ActiveStateValue =
  | "ready"
  | "waiting-for-user-decision"
  | "ready-to-resume"
  | "blocked"
  | "unknown";

export interface ActiveState {
  schemaVersion: 1;
  state: ActiveStateValue;
  activeDecisionId: string | null;
  activeCommandRunId: string | null;
  activeChangeId: string | null;
  pendingDecisionIds: string[];
  readyToResumeCommandRunIds: string[];
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface IndexSessionEntry {
  commandRunId: string;
  path: string;
  state: string;
  changeId?: string | null;
  sourceCommand: string;
}

export interface IndexDecisionEntry {
  decisionId: string;
  path: string;
  state: string;
  commandRunId: string;
  changeId?: string | null;
}

export interface InteractionIndex {
  schemaVersion: 1;
  sessions: IndexSessionEntry[];
  decisions: IndexDecisionEntry[];
  locksPath: string;
  updatedAt: string;
}
