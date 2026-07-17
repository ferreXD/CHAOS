/**
 * Same-change lock policy.
 *
 * Mirrors `.chaos/interactions/contracts/session-locking-policy.md`:
 *   - Locks are scoped to `changeId`, not the whole repo.
 *   - A pending material decision blocks conflicting commands over the same
 *     change; compatible read-only commands and the lock owner are allowed.
 *   - Locks are not released merely because a decision was answered.
 */

import type { ChangeLock, LockReason } from "../model/lock.ts";
import { DEFAULT_COMPATIBLE_COMMANDS, isCompatibleWithLock, normalizeCommand } from "../validation/schemas.ts";

export interface BuildLockInput {
  lockId: string;
  changeId: string;
  lockedByCommandRunId: string;
  lockedByCommand: string;
  reason: LockReason;
  blockingDecisionIds: string[];
  now: string;
  expiresAt?: string | null;
  compatibleCommands?: string[];
}

export function buildLock(input: BuildLockInput): ChangeLock {
  return {
    schemaVersion: 1,
    lockId: input.lockId,
    changeId: input.changeId,
    lockedByCommandRunId: input.lockedByCommandRunId,
    lockedByCommand: input.lockedByCommand,
    reason: input.reason,
    state: "active",
    blockingDecisionIds: input.blockingDecisionIds,
    compatibleCommands: input.compatibleCommands ?? [...DEFAULT_COMPATIBLE_COMMANDS],
    createdAt: input.now,
    expiresAt: input.expiresAt ?? null,
    releasedAt: null,
    metadata: {},
  };
}

/** The active lock for a change, if any. */
export function findActiveLockForChange(
  locks: ChangeLock[],
  changeId: string | null,
): ChangeLock | undefined {
  if (!changeId) return undefined;
  return locks.find((l) => l.state === "active" && l.changeId === changeId);
}

export interface LockDecision {
  /** True if the incoming command may proceed despite the lock. */
  allowed: boolean;
  /** True if the incoming command is the lock owner re-entering. */
  isOwner: boolean;
  /** True if the command is compatible (read-only/allow-listed). */
  isCompatible: boolean;
}

/**
 * Decide whether `incomingCommand`/`incomingCommandRunId` may proceed against an
 * existing active lock.
 */
export function evaluateLock(
  lock: ChangeLock,
  incomingCommand: string,
  incomingCommandRunId: string | undefined,
): LockDecision {
  const isOwner =
    incomingCommandRunId !== undefined && incomingCommandRunId === lock.lockedByCommandRunId;
  const isCompatible = isCompatibleWithLock(incomingCommand, lock.compatibleCommands);
  const isSameCommand = normalizeCommand(incomingCommand) === normalizeCommand(lock.lockedByCommand);
  return {
    allowed: isOwner || isCompatible,
    isOwner,
    isCompatible: isCompatible || isSameCommand,
  };
}
