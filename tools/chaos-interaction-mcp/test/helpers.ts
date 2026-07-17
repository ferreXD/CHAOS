/** Shared MCP test helpers: temp runtime + silent logger + tool invocation. */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { InteractionRuntime } from "../src/runtime.ts";
import { createLogger } from "../src/logger.ts";
import { invokeTool, type HandlerContext, type McpTool } from "../src/protocol/tool.ts";
import type { ToolResult } from "../src/protocol/toolResult.ts";

export const REAL_SCHEMA_DIR = path.resolve(
  import.meta.dirname,
  "../../../.chaos/interactions/schema",
);

export interface TestCtx {
  ctx: HandlerContext;
  root: string;
  run: (tool: McpTool, args: Record<string, unknown>) => ToolResult;
  cleanup: () => void;
}

export function makeCtx(): TestCtx {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-mcp-"));
  const runtime = new InteractionRuntime({ root, schemaDir: REAL_SCHEMA_DIR, validate: true });
  const ctx: HandlerContext = { runtime, logger: createLogger("silent") };
  return {
    ctx,
    root,
    run: (tool, args) => invokeTool(tool, ctx, args),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

export const OPTIONS = [
  { id: "full-strict", label: "Run full strict workflow" },
  { id: "strict-risk-compact", label: "Run strict-risk compact", recommended: true },
  { id: "stop", label: "Stop" },
];
