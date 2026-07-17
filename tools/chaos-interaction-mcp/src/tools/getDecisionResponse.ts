import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { requireString } from "../protocol/validation.ts";
import { responsePath } from "../views.ts";

export const getDecisionResponseTool: McpTool = {
  name: "chaos_get_decision_response",
  title: "Inspect a decision response",
  description:
    "Return the response status for a decision: NO_RESPONSE_YET, ANSWERED, CANCELLED, EXPIRED, SUPERSEDED, or CONSUMED. Does not mark the decision consumed.",
  inputShape: {
    decisionId: z.string(),
  },
  handler(ctx, args) {
    const decisionId = requireString(args, "decisionId");
    const result = ctx.runtime.getDecisionResponse(decisionId); // throws NOT_FOUND if missing
    const decision = ctx.runtime.getDecision(decisionId);
    const changeId = decision?.changeId ?? null;

    if (result.status === "ANSWERED" || result.status === "CONSUMED") {
      const response = result.response;
      const session = response ? ctx.runtime.getSession(response.commandRunId) : undefined;
      return success({
        status: result.status,
        mustStop: false,
        message:
          result.status === "ANSWERED"
            ? "Decision answered. You may continue; incorporate the response and mark it consumed."
            : "Decision already consumed.",
        nextAction:
          result.status === "ANSWERED"
            ? "Incorporate the response, then call chaos_mark_decision_consumed."
            : "No action needed.",
        data: {
          decisionId,
          commandRunId: response?.commandRunId ?? null,
          changeId,
          selectedOptionId: response?.selectedOptionId ?? null,
          rationale: response?.rationale ?? null,
          selectedBy: response?.selectedBy ?? null,
          selectedAt: response?.selectedAt ?? null,
          source: response?.source ?? null,
          responsePath: responsePath(ctx.runtime, decisionId),
          resumeCapsulePath: session?.resumeCapsulePath ?? null,
        },
      });
    }

    if (result.status === "NO_RESPONSE_YET") {
      return success({
        status: "NO_RESPONSE_YET",
        mustStop: true,
        message:
          "No response yet. Stop now. Do not continue this CHAOS command until a decision response exists.",
        nextAction: "Wait for the user to answer in the Decision Center (or via chaos_answer_decision in dev).",
        data: { decisionId, changeId },
      });
    }

    // CANCELLED / EXPIRED / SUPERSEDED — not answerable; do not proceed as if answered.
    return success({
      status: result.status,
      mustStop: true,
      message: `Decision is ${result.status}. Stop. This decision cannot be treated as answered.`,
      warnings: [`Decision ${decisionId} is ${result.status}.`],
      nextAction: "Re-create the decision if the command still needs a human choice.",
      data: { decisionId, changeId },
    });
  },
};
