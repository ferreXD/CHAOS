/** Runner error types. Kept small and dependency-free. */

export class RunnerError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RunnerError";
    this.code = code;
  }
}

/** Raised when a configured agent adapter cannot be constructed/started. */
export class AdapterError extends RunnerError {
  constructor(message: string) {
    super("ADAPTER_ERROR", message);
    this.name = "AdapterError";
  }
}

/** Raised for invalid runner configuration. */
export class RunnerConfigError extends RunnerError {
  constructor(message: string) {
    super("RUNNER_CONFIG_ERROR", message);
    this.name = "RunnerConfigError";
  }
}
