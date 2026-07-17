/**
 * Schema filename map + lock policy constants.
 *
 * Filenames correspond to `.chaos/interactions/schema/*.schema.json`.
 * Lock policy mirrors `.chaos/interactions/contracts/session-locking-policy.md`.
 */

export const SCHEMA_FILES = {
  decision: "decision.schema.json",
  response: "response.schema.json",
  session: "session.schema.json",
  lock: "lock.schema.json",
  activeState: "active.schema.json",
  index: "index.schema.json",
  auditEvent: "audit-event.schema.json",
  resumeCapsule: "resume-capsule.schema.json",
} as const;

export type SchemaKind = keyof typeof SCHEMA_FILES;

/**
 * Commands that are compatible with an existing same-change lock (they may run
 * while a decision is pending). Matched on the normalised base command.
 */
export const DEFAULT_COMPATIBLE_COMMANDS: readonly string[] = [
  "chaos:status",
  "chaos:doctor",
  "chaos:help",
  "chaos:resume",
];

/**
 * Commands blocked by default when a lock exists for the same `changeId`.
 * (Informational — the runtime blocks any non-compatible command; this list
 * documents the canonical blocked set for diagnostics/messages.)
 */
export const DEFAULT_BLOCKED_COMMANDS: readonly string[] = [
  "chaos:apply",
  "chaos:verify",
  "chaos:archive",
  "chaos:sync",
  "chaos:review",
];

/** Normalise a command invocation to its base command name (drops arguments). */
export function normalizeCommand(command: string): string {
  return command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

/**
 * Decide whether an incoming command is compatible with an active lock over the
 * same changeId. `chaos:todo --dry-run` is compatible; a bare `chaos:todo`
 * (which can mutate) is not.
 */
export function isCompatibleWithLock(command: string, compatibleCommands: readonly string[]): boolean {
  const base = normalizeCommand(command);
  const lower = command.trim().toLowerCase();
  if (base === "chaos:todo") {
    return /--dry-run\b/.test(lower);
  }
  return compatibleCommands.map((c) => normalizeCommand(c)).includes(base);
}
