/**
 * Consistent, model-friendly tool result wrapper.
 *
 * Every MCP tool returns a `ToolResult`. Success and blocking states use
 * `ok: true`; only genuine failures use `ok: false`. Any result that requires
 * the model to stop sets `mustStop: true` and includes an explicit instruction.
 */

export interface ToolError {
  code: string;
  details: unknown[];
}

export interface ToolResult {
  ok: boolean;
  status: string;
  mustStop: boolean;
  message: string;
  data: Record<string, unknown>;
  warnings: string[];
  nextAction?: string;
  error?: ToolError;
}

export interface SuccessInit {
  status: string;
  message: string;
  mustStop?: boolean;
  data?: Record<string, unknown>;
  warnings?: string[];
  nextAction?: string;
}

export function success(init: SuccessInit): ToolResult {
  return {
    ok: true,
    status: init.status,
    mustStop: init.mustStop ?? false,
    message: init.message,
    data: init.data ?? {},
    warnings: init.warnings ?? [],
    ...(init.nextAction ? { nextAction: init.nextAction } : {}),
  };
}

/**
 * A success result that requires the model to stop. The message always carries
 * the standard stop wording so the model-robustness contract is explicit.
 */
export function stopResult(init: Omit<SuccessInit, "mustStop">): ToolResult {
  const stopMessage =
    "Stop now. Do not continue this CHAOS command until a decision response exists.";
  return success({
    ...init,
    mustStop: true,
    message: init.message,
    nextAction: init.nextAction ?? stopMessage,
  });
}

export function failure(
  code: string,
  message: string,
  details: unknown[] = [],
  warnings: string[] = [],
): ToolResult {
  return {
    ok: false,
    status: code,
    mustStop: true,
    message,
    data: {},
    warnings,
    error: { code, details },
  };
}
