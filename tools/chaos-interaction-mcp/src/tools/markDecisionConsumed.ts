import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { requireString } from "../protocol/validation.ts";

export const markDecisionConsumedTool: McpTool = {
  name: "chaos_mark_decision_consumed",
  title: "Mark a decision consumed",
  description:
    "Mark an answered decision as consumed after the resumed command has incorporated it into its normal CHAOS artifacts. Preserves the response artifact and appends an audit event.",
  inputShape: {
    decisionId: z.string(),
    commandRunId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  handler(ctx, args) {
    const decisionId = requireString(args, "decisionId");
    const previousState = ctx.runtime.getDecision(decisionId)?.state ?? null;
    const result = ctx.runtime.markDecisionConsumed(decisionId); // enforces answered -> consumed

    return success({
      status: result.status,
      mustStop: false,
      message: `Decision ${decisionId} marked consumed.`,
      nextAction: "Continue the command from the resume capsule's nextStep.",
      data: {
        decisionId,
        commandRunId: result.commandRunId,
        previousState,
        nextState: "consumed",
      },
    });
  },
};
