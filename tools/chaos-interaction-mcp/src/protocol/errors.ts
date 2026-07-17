/**
 * Maps runtime/validation errors to structured tool results.
 *
 * Stack traces are NEVER returned to the model. Full error detail is logged to
 * stderr by the caller; the model sees a clean code + message.
 */

import {
  InvalidDecisionPayloadError,
  InvalidStateTransitionError,
  NotFoundError,
  RuntimeError,
  SchemaValidationError,
  MalformedStateError,
} from "../runtime.ts";
import { failure, type ToolResult } from "./toolResult.ts";

/** Raised by tool input validation (missing/invalid arguments). */
export class ToolInputError extends Error {
  readonly details: unknown[];
  constructor(message: string, details: unknown[] = []) {
    super(message);
    this.name = "ToolInputError";
    this.details = details;
  }
}

export function toErrorResult(err: unknown): ToolResult {
  if (err instanceof ToolInputError) {
    return failure("VALIDATION_ERROR", err.message, err.details);
  }
  if (err instanceof InvalidDecisionPayloadError) {
    return failure("VALIDATION_ERROR", err.message);
  }
  if (err instanceof SchemaValidationError) {
    return failure("SCHEMA_VALIDATION_ERROR", err.message, err.errors);
  }
  if (err instanceof InvalidStateTransitionError) {
    return failure("INVALID_STATE_TRANSITION", err.message);
  }
  if (err instanceof NotFoundError) {
    return failure("NOT_FOUND", err.message);
  }
  if (err instanceof MalformedStateError) {
    return failure("MALFORMED_STATE", err.message);
  }
  if (err instanceof RuntimeError) {
    return failure(err.code, err.message);
  }
  // Unknown/unexpected: return a generic message (no internals, no stack).
  return failure("INTERNAL_ERROR", "An internal runtime error occurred.");
}
