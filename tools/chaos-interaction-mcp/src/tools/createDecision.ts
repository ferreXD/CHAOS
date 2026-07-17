import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { stopResult } from "../protocol/toolResult.ts";
import { ToolInputError } from "../protocol/errors.ts";
import {
  INTERACTION_TYPES,
  optionalBool,
  optionalInteractionType,
  optionalObject,
  optionalOptions,
  optionalString,
  requireString,
} from "../protocol/validation.ts";
import { decisionPath } from "../views.ts";

const UI_HINT = "Decision Center can open this decision when Iteration 3 is installed.";

export const createDecisionTool: McpTool = {
  name: "chaos_create_decision",
  title: "Create a material human decision",
  description:
    "Create a material human decision for an active command session and STOP. This tool never blocks waiting for a human; it records runtime state and returns mustStop:true. " +
    "Set interactionType to match the decision: single-choice-decision (default; pick one option), " +
    "multi-choice-decision (pick one or more), confirmation (a yes/no gate — two options such as confirm/deny), " +
    "or freeform-input (the human types a value; options may be omitted). " +
    "If an equivalent pending decision already exists it is returned instead of creating a duplicate.",
  inputShape: {
    commandRunId: z.string(),
    sourceCommand: z.string().optional(),
    changeId: z.string().optional(),
    title: z.string(),
    context: z.string(),
    interactionType: z.enum(INTERACTION_TYPES).optional(),
    // Required (>=1) for every type except freeform-input, where they may be omitted.
    options: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          description: z.string().optional(),
          consequence: z.string().optional(),
          risk: z.string().optional(),
          recommended: z.boolean().optional(),
        }),
      )
      .optional(),
    recommendedOptionId: z.string().optional(),
    requiresRationale: z.boolean().optional(),
    independent: z.boolean().optional(),
    expiresAt: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  handler(ctx, args) {
    const commandRunId = requireString(args, "commandRunId");
    const interactionType = optionalInteractionType(args);
    const options = optionalOptions(args);
    if (interactionType !== "freeform-input" && (!options || options.length === 0)) {
      throw new ToolInputError(
        `"options" must contain at least one option for a ${interactionType ?? "single-choice-decision"} decision.`,
      );
    }
    const result = ctx.runtime.createDecision({
      commandRunId,
      sourceCommand: optionalString(args, "sourceCommand"),
      changeId: optionalString(args, "changeId") ?? null,
      title: requireString(args, "title"),
      context: requireString(args, "context"),
      interactionType,
      options: options ?? [],
      recommendedOptionId: optionalString(args, "recommendedOptionId") ?? null,
      requiresRationale: optionalBool(args, "requiresRationale", false),
      independent: optionalBool(args, "independent", false),
      expiresAt: optionalString(args, "expiresAt") ?? null,
      metadata: optionalObject(args, "metadata"),
    });

    const isDuplicate = result.status === "PENDING_DECISION_EXISTS";
    return stopResult({
      status: result.status,
      message: isDuplicate
        ? `An equivalent pending decision already exists (${result.decisionId}). Stop and wait for the human response.`
        : `Decision created. Stop now and wait for the human response.`,
      warnings: result.warnings,
      data: {
        decisionId: result.decisionId,
        commandRunId: result.commandRunId,
        changeId: result.changeId ?? null,
        decisionPath: decisionPath(ctx.runtime, result.decisionId),
        resumeInstruction:
          "After the user answers, call chaos_get_decision_response with this decisionId; when ANSWERED, incorporate it and call chaos_mark_decision_consumed.",
        uiHint: UI_HINT,
      },
    });
  },
};
