/**
 * Runner audit trail.
 *
 * Append-only JSONL at `.chaos/interactions/runners/<runnerId>.audit.jsonl`.
 * Records only small, structured events — never secrets or transcript bodies.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Clock } from "../runtime.ts";

export type RunnerAuditEventType =
  | "runner-started"
  | "command-started"
  | "decision-wait-started"
  | "decision-answered"
  | "auto-resume-started"
  | "auto-resume-skipped"
  | "auto-resume-cycle-limit"
  | "decision-consumed"
  | "session-ready-for-manual-resume"
  | "runner-completed"
  | "runner-failed"
  | "runner-cancelled";

export interface RunnerAuditEvent {
  schemaVersion: 1;
  runnerId: string;
  eventType: RunnerAuditEventType;
  timestamp: string;
  commandRunId: string | null;
  decisionId: string | null;
  changeId: string | null;
  cycle: number | null;
  message: string;
  data: Record<string, unknown>;
}

export interface RunnerAuditOptions {
  auditPath: string;
  runnerId: string;
  clock: Clock;
  enabled?: boolean;
}

/** Max length for any string value written into audit `data` (defensive). */
const MAX_DATA_STRING = 500;

export class RunnerAudit {
  private readonly auditPath: string;
  private readonly runnerId: string;
  private readonly clock: Clock;
  private readonly enabled: boolean;
  private readonly events: RunnerAuditEvent[] = [];

  constructor(options: RunnerAuditOptions) {
    this.auditPath = options.auditPath;
    this.runnerId = options.runnerId;
    this.clock = options.clock;
    this.enabled = options.enabled ?? true;
  }

  append(event: {
    eventType: RunnerAuditEventType;
    message: string;
    commandRunId?: string | null;
    decisionId?: string | null;
    changeId?: string | null;
    cycle?: number | null;
    data?: Record<string, unknown>;
  }): RunnerAuditEvent {
    const full: RunnerAuditEvent = {
      schemaVersion: 1,
      runnerId: this.runnerId,
      eventType: event.eventType,
      timestamp: this.clock.now().toISOString(),
      commandRunId: event.commandRunId ?? null,
      decisionId: event.decisionId ?? null,
      changeId: event.changeId ?? null,
      cycle: event.cycle ?? null,
      message: truncate(event.message),
      data: sanitize(event.data ?? {}),
    };
    this.events.push(full);
    if (this.enabled) {
      fs.mkdirSync(path.dirname(this.auditPath), { recursive: true });
      fs.appendFileSync(this.auditPath, JSON.stringify(full) + "\n", "utf8");
    }
    return full;
  }

  /** In-memory copy of everything appended (useful for tests/summaries). */
  all(): RunnerAuditEvent[] {
    return [...this.events];
  }
}

function truncate(value: string): string {
  return value.length > MAX_DATA_STRING ? value.slice(0, MAX_DATA_STRING) + "…" : value;
}

/** Shallowly clamp string values so oversized bodies never enter the audit. */
function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = typeof value === "string" ? truncate(value) : value;
  }
  return out;
}
