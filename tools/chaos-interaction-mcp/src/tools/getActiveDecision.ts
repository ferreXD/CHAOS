import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalString } from "../protocol/validation.ts";
import { decisionSummary } from "../views.ts";

export const getActiveDecisionTool: McpTool = {
  name: "chaos_get_active_decision",
  title: "Inspect active/pending decisions",
  description:
    "Return the active/pending decision(s) for a workspace, changeId, or commandRunId. Returns NO_ACTIVE_DECISION, ACTIVE_DECISION, or MULTIPLE_ACTIVE_DECISIONS.",
  inputShape: {
    changeId: z.string().optional(),
    commandRunId: z.string().optional(),
  },
  handler(ctx, args) {
    const result = ctx.runtime.getActiveDecision({
      changeId: optionalString(args, "changeId") ?? null,
      commandRunId: optionalString(args, "commandRunId"),
    });

    if (result.status === "NO_ACTIVE_DECISION") {
      return success({
        status: "NO_ACTIVE_DECISION",
        mustStop: false,
        message: "No active decision.",
        nextAction: "Proceed; there is no pending human decision blocking progress.",
      });
    }

    if (result.status === "ACTIVE_DECISION") {
      return success({
        status: "ACTIVE_DECISION",
        mustStop: true,
        message:
          "An active decision is pending. Stop now. Do not continue this CHAOS command until a decision response exists.",
        nextAction: "Wait for the user to answer, then call chaos_get_decision_response.",
        data: { decision: decisionSummary(ctx.runtime, result.decision!) },
      });
    }

    return success({
      status: "MULTIPLE_ACTIVE_DECISIONS",
      mustStop: true,
      message:
        "Multiple active decisions are pending. Stop now. Resolve them before continuing.",
      nextAction: "Answer each pending decision; do not guess which one applies.",
      data: { decisions: (result.decisions ?? []).map((d) => decisionSummary(ctx.runtime, d)) },
    });
  },
};
