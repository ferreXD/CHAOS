/**
 * Change lock model.
 *
 * Mirrors `.chaos/interactions/schema/lock.schema.json` and the policy in
 * `.chaos/interactions/contracts/session-locking-policy.md`.
 */

export type LockReason =
  | "waiting-for-user-decision"
  | "ready-to-resume"
  | "command-running"
  | "manual-hold"
  | "unknown";

export type LockState = "active" | "released" | "expired" | "stale";

export interface ChangeLock {
  schemaVersion: 1;
  lockId: string;
  changeId: string;
  lockedByCommandRunId: string;
  lockedByCommand: string;
  reason: LockReason;
  state: LockState;
  blockingDecisionIds: string[];
  compatibleCommands: string[];
  createdAt: string;
  expiresAt: string | null;
  releasedAt: string | null;
  metadata: Record<string, unknown>;
}

/** Aggregate lock file (`.chaos/interactions/locks.json`). */
export interface LocksFile {
  schemaVersion: 1;
  locks: ChangeLock[];
  updatedAt: string;
}
