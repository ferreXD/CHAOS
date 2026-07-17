/**
 * MCP server wiring.
 *
 * Adapts the SDK-agnostic tool/resource handlers onto the official MCP
 * TypeScript SDK (`McpServer`). Tool handlers stay pure and unit-testable; this
 * module is the only place that depends on the SDK.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type { InteractionRuntime } from "./runtime.ts";
import type { Logger } from "./logger.ts";
import type { HandlerContext } from "./protocol/tool.ts";
import { invokeTool } from "./protocol/tool.ts";
import type { ToolResult } from "./protocol/toolResult.ts";
import { ALL_TOOLS } from "./tools/registry.ts";
import { STATIC_RESOURCES, TEMPLATE_RESOURCES } from "./resources/registry.ts";
import type { ResourceContext, ResourceReadResult } from "./resources/types.ts";

export const SERVER_NAME = "chaos-interaction";
export const SERVER_VERSION = "0.1.0";
export const SERVER_DESCRIPTION =
  "Local MCP server exposing CHAOS Interaction Runtime decision/session tools.";

function toCallToolResult(result: ToolResult): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    isError: !result.ok,
  };
}

function toReadResourceResult(uri: string, result: ResourceReadResult): ReadResourceResult {
  return {
    contents: [
      { uri, mimeType: "application/json", text: JSON.stringify(result.json, null, 2) },
    ],
  };
}

function coerceParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function createMcpServer(runtime: InteractionRuntime, logger: Logger): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {} } },
  );

  const ctx: HandlerContext = { runtime, logger };
  const resourceCtx: ResourceContext = { runtime };

  for (const tool of ALL_TOOLS) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: tool.inputShape },
      (args: Record<string, unknown>) => toCallToolResult(invokeTool(tool, ctx, args)),
    );
  }
  logger.debug(`Registered ${ALL_TOOLS.length} tools.`);

  for (const resource of STATIC_RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      { description: resource.description, mimeType: "application/json" },
      (uri: URL) => {
        try {
          return toReadResourceResult(uri.href, resource.read(resourceCtx));
        } catch (err) {
          logger.error(`resource ${resource.name} failed`, err);
          return toReadResourceResult(uri.href, {
            found: false,
            json: { status: "ERROR", message: "Failed to read resource." },
          });
        }
      },
    );
  }

  for (const resource of TEMPLATE_RESOURCES) {
    server.registerResource(
      resource.name,
      new ResourceTemplate(resource.uriTemplate, { list: undefined }),
      { description: resource.description, mimeType: "application/json" },
      (uri: URL, variables: Record<string, string | string[]>) => {
        const params: Record<string, string> = {};
        for (const [key, value] of Object.entries(variables)) params[key] = coerceParam(value);
        try {
          return toReadResourceResult(uri.href, resource.read(resourceCtx, params));
        } catch (err) {
          logger.error(`resource ${resource.name} failed`, err);
          return toReadResourceResult(uri.href, {
            found: false,
            json: { status: "ERROR", message: "Failed to read resource." },
          });
        }
      },
    );
  }
  logger.debug(`Registered ${STATIC_RESOURCES.length + TEMPLATE_RESOURCES.length} resources.`);

  return server;
}
