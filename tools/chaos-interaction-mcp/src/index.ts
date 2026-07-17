/**
 * CHAOS Interaction MCP — public API (Iteration 2).
 *
 * Local MCP server adapter over the Iteration 1 file-backed runtime.
 */

export { createMcpServer, SERVER_NAME, SERVER_VERSION, SERVER_DESCRIPTION } from "./server.ts";
export { resolveConfig, type ServerConfig } from "./config.ts";
export { createRuntime } from "./runtimeFactory.ts";
export { createLogger, type Logger, type LogLevel } from "./logger.ts";

export { ALL_TOOLS, TOOL_NAMES } from "./tools/registry.ts";
export { ALL_RESOURCES, STATIC_RESOURCES, TEMPLATE_RESOURCES } from "./resources/registry.ts";

export { invokeTool, type McpTool, type HandlerContext } from "./protocol/tool.ts";
export {
  success,
  stopResult,
  failure,
  type ToolResult,
} from "./protocol/toolResult.ts";
export { toErrorResult, ToolInputError } from "./protocol/errors.ts";
export type { Resource, ResourceContext, ResourceReadResult } from "./resources/types.ts";
