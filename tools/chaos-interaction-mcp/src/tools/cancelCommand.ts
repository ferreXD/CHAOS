import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalObject, optionalString, requireString } from "../protocol/validation.ts";

export const cancelCommandTool: McpTool = {
  name: "chaos_cancel_command",
  title: "Cancel a command session",
  description:
    "Cancel a command session, cancel its pending decisions, and release locks. Artifacts are preserved (never deleted).",
  inputShape: {
    commandRunId: z.string(),
    reason: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  handler(ctx, args) {
    const commandRunId = requireString(args, "commandRunId");
    optionalObject(args, "metadata");
    const result = ctx.runtime.cancelCommand(commandRunId);

    return success({
      status: result.status,
      mustStop: false,
      message: `Command ${commandRunId} cancelled.`,
      nextAction: "Locks released and pending decisions cancelled. Decision artifacts are preserved.",
      data: {
        commandRunId,
        reason: optionalString(args, "reason") ?? null,
        releasedLocks: result.releasedLockIds,
        cancelledDecisionIds: result.cancelledDecisionIds,
      },
    });
  },
};
