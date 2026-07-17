/** Tool type + safe invocation wrapper. */

import type { z } from "zod";
import type { InteractionRuntime } from "../runtime.ts";
import type { Logger } from "../logger.ts";
import type { ToolResult } from "./toolResult.ts";
import { toErrorResult } from "./errors.ts";

export interface HandlerContext {
  runtime: InteractionRuntime;
  logger: Logger;
}

export type ToolInputShape = Record<string, z.ZodTypeAny>;

export interface McpTool {
  name: string;
  title: string;
  description: string;
  inputShape: ToolInputShape;
  handler: (ctx: HandlerContext, args: Record<string, unknown>) => ToolResult;
}

/**
 * Invoke a tool handler, converting any thrown error into a structured error
 * result. Full detail is logged to stderr; the model never sees a stack trace.
 */
export function invokeTool(
  tool: McpTool,
  ctx: HandlerContext,
  args: Record<string, unknown>,
): ToolResult {
  try {
    return tool.handler(ctx, args);
  } catch (err) {
    ctx.logger.error(`tool ${tool.name} failed`, err);
    return toErrorResult(err);
  }
}
