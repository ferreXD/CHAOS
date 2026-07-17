/**
 * Writes runtime-contract violations to the EXISTING repo hook-violations stream
 * (`.chaos/runtime/hook-violations.jsonl`) — not a new duplicate stream.
 *
 * Each line is a superset of the existing schema: the base fields consumers
 * already read (`schemaVersion, timestamp, severity, hook, command, changeId,
 * code, message, path, confidence`) plus additive interaction-runtime fields
 * (`id, violationType, commandRunId, evidence, recommendedAction, sourceCommand`).
 * Additive JSON fields are harmless to existing readers.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { RuntimeHookViolation } from "./runtimeContractGuard.ts";

export const IR_GUARD_HOOK = "chaos-interaction-runtime-guard";
export const IR_VIOLATION_CODE = "CHAOS-IR-VIOLATION";

/** Map an interaction violation onto the existing hook-violation line shape. */
export function toStreamLine(v: RuntimeHookViolation): Record<string, unknown> {
  return {
    // Existing base fields (kept identical so current consumers keep working).
    schemaVersion: 1,
    timestamp: v.timestamp,
    severity: v.severity,
    hook: IR_GUARD_HOOK,
    command: v.sourceCommand ?? "",
    changeId: v.changeId ?? "",
    code: IR_VIOLATION_CODE,
    message: v.message,
    path: v.evidence[0] ?? "",
    confidence: "HIGH",
    // Additive interaction-runtime fields.
    id: v.id,
    violationType: v.violationType,
    commandRunId: v.commandRunId ?? null,
    sourceCommand: v.sourceCommand ?? null,
    evidence: v.evidence,
    recommendedAction: v.recommendedAction,
  };
}

export class HookViolationWriter {
  private readonly filePath: string;
  private readonly enabled: boolean;

  constructor(filePath: string, enabled = true) {
    this.filePath = filePath;
    this.enabled = enabled;
  }

  /** Append one violation line. No-op when disabled. Returns the line written. */
  write(v: RuntimeHookViolation): Record<string, unknown> {
    const line = toStreamLine(v);
    if (this.enabled) {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.appendFileSync(this.filePath, JSON.stringify(line) + "\n", "utf8");
    }
    return line;
  }
}
