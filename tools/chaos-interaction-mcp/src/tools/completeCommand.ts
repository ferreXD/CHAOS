import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalObject, optionalString, requireString } from "../protocol/validation.ts";

type CompletionMode = "normal-resumed-execution" | "administrative-terminalization" | "manual";

export const completeCommandTool: McpTool = {
  name: "chaos_complete_command",
  title: "Complete a command session",
  description:
    "Complete a command session and release its locks. Completing directly from ready-to-resume is administrative terminalization (valid for cleanup / no-runner environments) and is distinct from normal resumed execution (ready-to-resume -> resumed -> completed).",
  inputShape: {
    commandRunId: z.string(),
    completionMode: z
      .enum(["normal-resumed-execution", "administrative-terminalization", "manual"])
      .optional(),
    reason: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  handler(ctx, args) {
    const commandRunId = requireString(args, "commandRunId");
    const requestedMode = optionalString(args, "completionMode") as CompletionMode | undefined;
    optionalObject(args, "metadata"); // validated for shape only

    const before = ctx.runtime.getSession(commandRunId);
    const warnings: string[] = [];
    let effectiveMode: CompletionMode = requestedMode ?? "normal-resumed-execution";

    if (before?.state === "ready-to-resume" && requestedMode !== "manual") {
      effectiveMode = "administrative-terminalization";
      warnings.push(
        "Completing directly from ready-to-resume is administrative terminalization, not normal resumed execution (ready-to-resume -> resumed -> completed).",
      );
    }

    const result = ctx.runtime.completeCommand(commandRunId); // enforces valid source state

    return success({
      status: result.status,
      mustStop: false,
      message: `Command ${commandRunId} completed (${effectiveMode}).`,
      warnings,
      nextAction: "Locks are released. No further action required for this session.",
      data: {
        commandRunId,
        completionMode: effectiveMode,
        reason: optionalString(args, "reason") ?? null,
        releasedLocks: result.releasedLockIds,
      },
    });
  },
};
