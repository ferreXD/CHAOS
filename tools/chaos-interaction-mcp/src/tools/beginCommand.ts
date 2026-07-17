import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalObject, optionalString, requireString } from "../protocol/validation.ts";
import type { Adapter, RequestedMode } from "../runtime.ts";

function mapAdapter(value: string | undefined): Adapter {
  switch (value) {
    case "claude":
    case "copilot":
      return value;
    default:
      return "unknown";
  }
}

function mapMode(value: string | undefined): RequestedMode {
  switch (value) {
    case "light":
    case "standard":
    case "strict":
      return value;
    default:
      return null;
  }
}

function nextAction(status: string): string {
  switch (status) {
    case "READY":
      return "Proceed with the command.";
    case "RESUME_AVAILABLE":
      return "Resume from the resume capsule before doing unrelated work (call chaos_get_resume_capsule).";
    case "BLOCKED_BY_PENDING_DECISION":
      return "Stop now. Do not continue this CHAOS command until a decision response exists. Inspect via chaos_get_active_decision, then chaos_get_decision_response.";
    case "CONFLICTING_COMMAND_ACTIVE":
      return "Stop now. A different command holds the change lock. Inspect via chaos_list_sessions; resolve with chaos_cancel_command or wait.";
    default:
      return "Review the result.";
  }
}

export const beginCommandTool: McpTool = {
  name: "chaos_begin_command",
  title: "Begin or resume a CHAOS command",
  description:
    "Register or resume a CHAOS command session and determine whether the command may proceed. Returns READY, RESUME_AVAILABLE, BLOCKED_BY_PENDING_DECISION, or CONFLICTING_COMMAND_ACTIVE.",
  inputShape: {
    sourceCommand: z.string().describe("The CHAOS command, e.g. chaos:propose."),
    changeId: z.string().optional().describe("Change id (strongly recommended for change-scoped commands)."),
    adapter: z.enum(["claude", "copilot", "manual", "unknown"]).optional(),
    requestedMode: z.enum(["light", "standard", "strict", "unknown"]).optional(),
    commandRunId: z.string().optional().describe("Existing session id to re-enter/resume."),
    metadata: z.record(z.unknown()).optional(),
  },
  handler(ctx, args) {
    const result = ctx.runtime.beginCommand({
      sourceCommand: requireString(args, "sourceCommand"),
      changeId: optionalString(args, "changeId") ?? null,
      adapter: mapAdapter(optionalString(args, "adapter")),
      requestedMode: mapMode(optionalString(args, "requestedMode")),
      commandRunId: optionalString(args, "commandRunId"),
      metadata: optionalObject(args, "metadata"),
    });

    return success({
      status: result.status,
      mustStop: result.mustStop,
      message: result.message,
      warnings: result.warnings,
      nextAction: nextAction(result.status),
      data: {
        commandRunId: result.commandRunId ?? null,
        changeId: result.changeId ?? null,
        activeDecisionId:
          result.status === "BLOCKED_BY_PENDING_DECISION" ? result.decisionId ?? null : null,
        conflictingCommandRunId: result.conflictingCommandRunId ?? null,
        resumeCapsulePath: result.resumeCapsulePath ?? null,
        uiAction: result.uiAction ?? null,
      },
    });
  },
};
