/**
 * Audit event model.
 *
 * Mirrors `.chaos/interactions/schema/audit-event.schema.json`.
 */

export type AuditEventType =
  | "session-created"
  | "command-started"
  | "decision-created"
  | "decision-answered"
  | "decision-cancelled"
  | "decision-expired"
  | "decision-consumed"
  | "capsule-created"
  | "capsule-pruned"
  | "lock-acquired"
  | "lock-released"
  | "command-completed"
  | "command-cancelled"
  | "command-failed"
  | "auto-resume-started"
  | "auto-resume-stopped"
  | "runtime-warning";

export type AuditSource =
  | "mcp"
  | "vscode-decision-center"
  | "chaos-command"
  | "hook"
  | "manual"
  | "unknown";

export interface AuditEvent {
  schemaVersion: 1;
  eventId: string;
  eventType: AuditEventType;
  commandRunId: string | null;
  decisionId: string | null;
  changeId: string | null;
  timestamp: string;
  actor: string | null;
  source: AuditSource;
  message: string;
  data: Record<string, unknown>;
}
