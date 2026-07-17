import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalBool, optionalString } from "../protocol/validation.ts";
import type { ResumeCapsule } from "../runtime.ts";

function resumeInstruction(c: ResumeCapsule): string {
  return `Resume ${c.sourceCommand}${c.changeId ? ` for ${c.changeId}` : ""} from nextStep "${c.nextStep}". Read the referenced required artifacts before writing anything.`;
}

export const getResumeCapsuleTool: McpTool = {
  name: "chaos_get_resume_capsule",
  title: "Read a resume capsule",
  description:
    "Read a resume capsule by commandRunId, changeId, or --latest. If multiple candidates match and no unambiguous selector is given, returns MULTIPLE_FOUND with summaries and does not guess. Backed by the runtime's capsule discovery API.",
  inputShape: {
    commandRunId: z.string().optional(),
    changeId: z.string().optional(),
    latest: z.boolean().optional(),
  },
  handler(ctx, args) {
    const commandRunId = optionalString(args, "commandRunId");
    const changeId = optionalString(args, "changeId");
    const latest = optionalBool(args, "latest", false);

    const found = (c: ResumeCapsule) =>
      success({
        status: "FOUND",
        mustStop: false,
        message: `Resume capsule found for ${c.commandRunId}.`,
        nextAction: resumeInstruction(c),
        data: {
          capsulePath: ctx.runtime.paths.relative(ctx.runtime.paths.capsule(c.commandRunId)),
          capsule: c,
        },
      });

    const notFound = (msg: string) =>
      success({ status: "NOT_FOUND", mustStop: false, message: msg, data: {} });

    // Direct lookup by commandRunId.
    if (commandRunId) {
      const capsule = ctx.runtime.getResumeCapsule(commandRunId);
      return capsule ? found(capsule) : notFound(`No resume capsule for commandRunId ${commandRunId}.`);
    }

    // Enumerate via the official runtime discovery API.
    const summaries = ctx.runtime.listCapsules(changeId ? { changeId } : {});
    if (summaries.length === 0) return notFound("No resume capsules match the query.");

    if (summaries.length === 1 || latest) {
      const capsule = ctx.runtime.getResumeCapsule(summaries[0]!.commandRunId);
      return capsule ? found(capsule) : notFound("Capsule vanished during read.");
    }

    // Ambiguous: do not guess.
    return success({
      status: "MULTIPLE_FOUND",
      mustStop: false,
      message: "Multiple resume capsules match. Choose one explicitly (by commandRunId) or pass latest:true.",
      nextAction: "Ask the user which session to resume; do not guess.",
      data: { capsules: summaries },
    });
  },
};
