/** Structured runtime errors (fail-safe: never partially mutate state). */

export class RuntimeError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
  }
}

export class InvalidStateTransitionError extends RuntimeError {
  constructor(kind: string, from: string, to: string) {
    super(
      "INVALID_STATE_TRANSITION",
      `Invalid ${kind} state transition: ${from} -> ${to}`,
    );
    this.name = "InvalidStateTransitionError";
  }
}

export class InvalidDecisionPayloadError extends RuntimeError {
  constructor(message: string) {
    super("INVALID_DECISION_PAYLOAD", message);
    this.name = "InvalidDecisionPayloadError";
  }
}

export class NotFoundError extends RuntimeError {
  constructor(what: string, id: string) {
    super("NOT_FOUND", `${what} not found: ${id}`);
    this.name = "NotFoundError";
  }
}
