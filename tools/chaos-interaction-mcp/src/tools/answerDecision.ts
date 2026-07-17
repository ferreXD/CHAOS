import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalObject, optionalString, requireString } from "../protocol/validation.ts";
import { responsePath } from "../views.ts";

/**
 * MANUAL / DEV / TEST BRIDGE ONLY.
 *
 * This tool lets a human's already-chosen option be recorded through MCP while
 * the VS Code Decision Center (Iteration 3) does not yet exist. In the final
 * flow the UI writes responses — the model must NOT choose the human decision
 * itself. Only call this when the user has explicitly provided the chosen option.
 */
export const answerDecisionTool: McpTool = {
  name: "chaos_answer_decision",
  title: "Answer a decision (manual/dev bridge)",
  description:
    "MANUAL/DEV/TEST BRIDGE: record a human's chosen option for a decision. Only use when the user has explicitly provided the selected option. In production the VS Code Decision Center writes responses; the model must not decide on the human's behalf.",
  inputShape: {
    decisionId: z.string(),
    selectedOptionId: z.string(),
    selectedBy: z.string().optional(),
    rationale: z.string().optional(),
    source: z.string().optional(),
  },
  handler(ctx, args) {
    const result = ctx.runtime.answerDecision({
      decisionId: requireString(args, "decisionId"),
      selectedOptionId: requireString(args, "selectedOptionId"),
      selectedBy: optionalString(args, "selectedBy") ?? "manual",
      rationale: optionalString(args, "rationale") ?? null,
      source: optionalString(args, "source") ?? "mcp-tool",
      metadata: optionalObject(args, "metadata"),
    });

    return success({
      status: result.status,
      mustStop: false,
      message: `Decision ${result.decisionId} answered (${args["selectedOptionId"]}).`,
      warnings: [
        "chaos_answer_decision is a manual/dev/testing bridge. In production, human responses are written by the VS Code Decision Center, not the model.",
      ],
      nextAction:
        result.sessionState === "ready-to-resume"
          ? "Session is ready-to-resume. Read the resume capsule (chaos_get_resume_capsule) and continue, then chaos_mark_decision_consumed."
          : "Continue; more decisions may still be pending (chaos_get_active_decision).",
      data: {
        decisionId: result.decisionId,
        selectedOptionId: args["selectedOptionId"],
        responsePath: responsePath(ctx.runtime, result.decisionId),
        sessionState: result.sessionState,
        resumeCapsulePath: result.resumeCapsulePath ?? null,
      },
    });
  },
};
