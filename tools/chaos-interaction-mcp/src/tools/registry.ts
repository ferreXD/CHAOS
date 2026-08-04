/** The full set of MCP tools exposed by the server. */

import type { McpTool } from "../protocol/tool.ts";
import { beginCommandTool } from "./beginCommand.ts";
import { createDecisionTool } from "./createDecision.ts";
import { getActiveDecisionTool } from "./getActiveDecision.ts";
import { getDecisionResponseTool } from "./getDecisionResponse.ts";
import { answerDecisionTool } from "./answerDecision.ts";
import { markDecisionConsumedTool } from "./markDecisionConsumed.ts";
import { createResumeCapsuleTool } from "./createResumeCapsule.ts";
import { getResumeCapsuleTool } from "./getResumeCapsule.ts";
import { findResumeCandidatesTool } from "./findResumeCandidates.ts";
import { completeCommandTool } from "./completeCommand.ts";
import { cancelCommandTool } from "./cancelCommand.ts";
import { listLocksTool } from "./listLocks.ts";
import { listSessionsTool } from "./listSessions.ts";

export const ALL_TOOLS: McpTool[] = [
  beginCommandTool,
  createDecisionTool,
  getActiveDecisionTool,
  getDecisionResponseTool,
  answerDecisionTool,
  markDecisionConsumedTool,
  createResumeCapsuleTool,
  getResumeCapsuleTool,
  findResumeCandidatesTool,
  completeCommandTool,
  cancelCommandTool,
  listLocksTool,
  listSessionsTool,
];

export const TOOL_NAMES: string[] = ALL_TOOLS.map((t) => t.name);
