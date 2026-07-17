import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalBool, optionalString } from "../protocol/validation.ts";

export const findResumeCandidatesTool: McpTool = {
  name: "chaos_find_resume_candidates",
  title: "Find resumable sessions",
  description:
    "Find ready-to-resume sessions (joined with their capsules) for chaos:resume. Returns NOT_FOUND, FOUND (one), or MULTIPLE_FOUND (ambiguous — the caller must ask the user to choose). With latest:true the newest candidate is selected.",
  inputShape: {
    changeId: z.string().optional(),
    commandRunId: z.string().optional(),
    sourceCommand: z.string().optional(),
    latest: z.boolean().optional(),
  },
  handler(ctx, args) {
    const changeId = optionalString(args, "changeId");
    const commandRunId = optionalString(args, "commandRunId");
    const sourceCommand = optionalString(args, "sourceCommand");
    const latest = optionalBool(args, "latest", false);

    const candidates = ctx.runtime.findResumeCandidates({
      ...(changeId ? { changeId } : {}),
      ...(commandRunId ? { commandRunId } : {}),
      ...(sourceCommand ? { sourceCommand } : {}),
      latest,
    });

    if (candidates.length === 0) {
      return success({
        status: "NOT_FOUND",
        mustStop: false,
        message: "No ready-to-resume sessions match the query.",
        nextAction:
          "There is nothing to resume. Do not invent context. Start the command fresh if needed.",
        data: { candidates: [] },
      });
    }

    if (candidates.length === 1) {
      const c = candidates[0]!;
      return success({
        status: "FOUND",
        mustStop: false,
        message: `One resumable session: ${c.commandRunId} (${c.sourceCommand}).`,
        nextAction: `Resume ${c.sourceCommand}${c.changeId ? ` for ${c.changeId}` : ""} from nextStep "${c.nextStep ?? "?"}". Read its capsule with chaos_get_resume_capsule.`,
        data: { candidates },
      });
    }

    return success({
      status: "MULTIPLE_FOUND",
      mustStop: true,
      message: `${candidates.length} resumable sessions match. Ask the user to choose and STOP.`,
      nextAction: "Present the candidates to the user and stop; do not guess which to resume.",
      data: { candidates },
    });
  },
};
