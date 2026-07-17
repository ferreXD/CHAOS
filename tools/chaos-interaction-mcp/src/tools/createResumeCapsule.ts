import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import {
  optionalObject,
  optionalString,
  optionalStringArray,
  requireString,
} from "../protocol/validation.ts";
import { capsuleSummary } from "../views.ts";

export const createResumeCapsuleTool: McpTool = {
  name: "chaos_create_resume_capsule",
  title: "Create or update a resume capsule",
  description:
    "Create/update a compact resume capsule for a command session. Capsules reference artifacts by path and must not embed large report bodies. Validated against the resume-capsule schema.",
  inputShape: {
    commandRunId: z.string(),
    lastCompletedStep: z.string().optional(),
    nextStep: z.string().optional(),
    intent: z.string().optional(),
    approvedScope: z.union([z.string(), z.array(z.string())]).optional(),
    constraints: z.union([z.string(), z.array(z.string())]).optional(),
    requiredArtifacts: z.union([z.string(), z.array(z.string())]).optional(),
    selectedPath: z.string().optional(),
    openRisks: z.union([z.string(), z.array(z.string())]).optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  handler(ctx, args) {
    const commandRunId = requireString(args, "commandRunId");
    // Structurally typed against the runtime's CapsuleOverrides (not exported
    // from the Iteration 1 index — see PATCH-SUMMARY follow-up finding).
    const overrides = {
      lastCompletedStep: optionalString(args, "lastCompletedStep") ?? null,
      nextStep: optionalString(args, "nextStep"),
      intent: optionalString(args, "intent"),
      selectedPath: optionalString(args, "selectedPath") ?? null,
      approvedScope: optionalStringArray(args, "approvedScope"),
      constraints: optionalStringArray(args, "constraints"),
      requiredArtifacts: optionalStringArray(args, "requiredArtifacts"),
      openRisks: optionalStringArray(args, "openRisks"),
      metadata: optionalObject(args, "metadata"),
    };

    const result = ctx.runtime.createResumeCapsule(commandRunId, overrides);
    return success({
      status: result.status,
      mustStop: false,
      message: `Resume capsule written for ${commandRunId}.`,
      nextAction: "Use chaos_get_resume_capsule to read it back when resuming.",
      data: {
        commandRunId,
        capsulePath: result.path,
        capsule: capsuleSummary(result.capsule),
      },
    });
  },
};
