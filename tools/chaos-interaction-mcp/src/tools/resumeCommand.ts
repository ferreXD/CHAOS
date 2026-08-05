import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { requireString } from "../protocol/validation.ts";

export const resumeCommandTool: McpTool = {
  name: "chaos_resume_command",
  title: "Resume a ready-to-resume session",
  description:
    "Move a ready-to-resume session back into active execution (ready-to-resume -> resumed -> running). " +
    "Call this after incorporating the answered decisions of a resumed command and BEFORE creating any " +
    "further decision on it — a session left at ready-to-resume rejects chaos_create_decision with " +
    "INVALID_STATE_TRANSITION. Idempotent when the session is already running.",
  inputShape: {
    commandRunId: z.string(),
  },
  handler(ctx, args) {
    const commandRunId = requireString(args, "commandRunId");
    const result = ctx.runtime.resumeCommand(commandRunId);
    return success({
      status: result.status,
      mustStop: false,
      message: `Session ${result.commandRunId} is ${result.sessionState}. Continue the command; further decisions may now be created on it.`,
      data: {
        commandRunId: result.commandRunId,
        sessionState: result.sessionState,
      },
    });
  },
};
