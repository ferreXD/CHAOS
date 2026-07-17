/**
 * Validate and dispatch messages received from the webview.
 *
 * SECURITY: webview payloads are untrusted. Every message is validated for
 * shape before any action is taken. Pure (no vscode) and dependency-injected
 * with a `DecisionCenterClient` so it is fully unit-testable.
 */

import {
  InvalidDecisionPayloadError,
  InvalidStateTransitionError,
  NotFoundError,
  RuntimeError,
  SchemaValidationError,
  MalformedStateError,
} from "../runtime.ts";

export interface AnswerInput {
  decisionId: string;
  /** Single-choice / confirmation. */
  selectedOptionId?: string | null;
  /** Multi-choice. */
  selectedOptionIds?: string[];
  /** Freeform-input (the typed answer). */
  freeformValue?: string | null;
  rationale?: string | null;
}

export interface AnswerOutcome {
  status: string;
  decisionId: string;
  sessionState: string;
  resumeCapsulePath: string | null;
}

export interface CancelOutcome {
  status: string;
  commandRunId: string;
  releasedLockIds: string[];
  cancelledDecisionIds: string[];
}

/** Actions the message layer needs from the runtime. Implemented by RuntimeClient. */
export interface DecisionCenterClient {
  answerDecision(input: AnswerInput): AnswerOutcome;
  cancelCommandForDecision(decisionId: string): CancelOutcome;
  resumeInstructionText(commandRunId: string): string | null;
}

export type MessageAction =
  | "refresh"
  | "selectDecision"
  | "answerDecision"
  | "cancelDecision"
  | "copyResumeInstruction";

export interface HandleOutcome {
  ok: boolean;
  action: MessageAction | "unknown";
  status: string;
  message: string;
  data: Record<string, unknown>;
}

class MessageError extends Error {
  readonly status: string;
  constructor(status: string, message: string) {
    super(message);
    this.status = status;
  }
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new MessageError("VALIDATION_ERROR", "Message must be an object.");
  }
  return raw as Record<string, unknown>;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MessageError("VALIDATION_ERROR", `"${key}" is required and must be a non-empty string.`);
  }
  return value;
}

function optionalString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new MessageError("VALIDATION_ERROR", `"${key}" must be a string when provided.`);
  }
  return value;
}

function optionalStringArray(obj: Record<string, unknown>, key: string): string[] | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new MessageError("VALIDATION_ERROR", `"${key}" must be an array of strings when provided.`);
  }
  return value as string[];
}

const KNOWN_ACTIONS = new Set<string>([
  "refresh",
  "selectDecision",
  "answerDecision",
  "cancelDecision",
  "copyResumeInstruction",
]);

/** Parse + validate a raw webview message. Throws MessageError on bad shape. */
export function validateMessage(raw: unknown): { type: MessageAction; obj: Record<string, unknown> } {
  const obj = asRecord(raw);
  const type = obj["type"];
  if (typeof type !== "string" || !KNOWN_ACTIONS.has(type)) {
    throw new MessageError("VALIDATION_ERROR", `Unknown message type: ${String(type)}.`);
  }
  return { type: type as MessageAction, obj };
}

function mapError(err: unknown): HandleOutcome {
  const base = (action: MessageAction | "unknown", status: string, message: string): HandleOutcome => ({
    ok: false,
    action,
    status,
    message,
    data: {},
  });
  if (err instanceof MessageError) return base("unknown", err.status, err.message);
  if (err instanceof InvalidDecisionPayloadError) return base("answerDecision", "VALIDATION_ERROR", err.message);
  if (err instanceof SchemaValidationError) return base("answerDecision", "SCHEMA_VALIDATION_ERROR", err.message);
  if (err instanceof InvalidStateTransitionError) return base("unknown", "INVALID_STATE_TRANSITION", err.message);
  if (err instanceof NotFoundError) return base("unknown", "NOT_FOUND", err.message);
  if (err instanceof MalformedStateError) return base("unknown", "MALFORMED_STATE", err.message);
  if (err instanceof RuntimeError) return base("unknown", err.code, err.message);
  return base("unknown", "INTERNAL_ERROR", "An internal error occurred.");
}

/** Validate + execute a webview message. Never throws; always returns an outcome. */
export function handleMessage(raw: unknown, client: DecisionCenterClient): HandleOutcome {
  try {
    const { type, obj } = validateMessage(raw);

    switch (type) {
      case "refresh":
        return { ok: true, action: "refresh", status: "REFRESH", message: "Refresh requested.", data: {} };

      case "selectDecision": {
        const decisionId = requireString(obj, "decisionId");
        return {
          ok: true,
          action: "selectDecision",
          status: "SELECTED",
          message: `Selected decision ${decisionId}.`,
          data: { decisionId },
        };
      }

      case "answerDecision": {
        const decisionId = requireString(obj, "decisionId");
        const selectedOptionId = optionalString(obj, "selectedOptionId") ?? null;
        const selectedOptionIds = optionalStringArray(obj, "selectedOptionIds") ?? [];
        const freeformValue = optionalString(obj, "freeformValue") ?? null;
        const rationale = optionalString(obj, "rationale") ?? null;
        if (
          !selectedOptionId &&
          selectedOptionIds.length === 0 &&
          (freeformValue === null || freeformValue.trim().length === 0)
        ) {
          throw new MessageError(
            "VALIDATION_ERROR",
            "An answer requires a selected option, selected options, or a freeform value.",
          );
        }
        const result = client.answerDecision({
          decisionId,
          selectedOptionId,
          selectedOptionIds,
          freeformValue,
          rationale,
        });
        return {
          ok: true,
          action: "answerDecision",
          status: result.status,
          message: "Decision answered. Session is ready to resume.",
          data: {
            decisionId: result.decisionId,
            sessionState: result.sessionState,
            resumeCapsulePath: result.resumeCapsulePath,
          },
        };
      }

      case "cancelDecision": {
        const decisionId = requireString(obj, "decisionId");
        const result = client.cancelCommandForDecision(decisionId);
        return {
          ok: true,
          action: "cancelDecision",
          status: result.status,
          message: `Command session ${result.commandRunId} cancelled.`,
          data: {
            commandRunId: result.commandRunId,
            releasedLockIds: result.releasedLockIds,
            cancelledDecisionIds: result.cancelledDecisionIds,
          },
        };
      }

      case "copyResumeInstruction": {
        const commandRunId = requireString(obj, "commandRunId");
        const text = client.resumeInstructionText(commandRunId);
        if (text === null) {
          return {
            ok: false,
            action: "copyResumeInstruction",
            status: "NOT_FOUND",
            message: `No resumable session for ${commandRunId}.`,
            data: {},
          };
        }
        return {
          ok: true,
          action: "copyResumeInstruction",
          status: "OK",
          message: "Resume instruction ready to copy.",
          data: { commandRunId, text },
        };
      }
    }
  } catch (err) {
    return mapError(err);
  }
}
