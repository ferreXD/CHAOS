import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalBool, optionalString, requireString } from "../protocol/validation.ts";

export const pruneCapsuleTool: McpTool = {
  name: "chaos_prune_capsule",
  title: "Prune a stale resume capsule",
  description:
    "Retire a resume capsule that can never be resumed (a stale/orphaned capsule for a terminal session). " +
    "Deletes only the resume payload; the session record and append-only audit log are preserved and a " +
    "'capsule-pruned' audit event is recorded. Refuses to prune a capsule whose owning session is still live " +
    "(non-terminal) unless force is set. Idempotent: a run with no capsule returns NO_CAPSULE.",
  inputShape: {
    commandRunId: z.string(),
    reason: z.string().optional(),
    actor: z.string().optional(),
    force: z.boolean().optional(),
  },
  handler(ctx, args) {
    const commandRunId = requireString(args, "commandRunId");
    const reason = optionalString(args, "reason") ?? null;
    const actor = optionalString(args, "actor") ?? null;
    const force = optionalBool(args, "force", false);

    const result = ctx.runtime.pruneCapsule(commandRunId, { reason, actor, force });

    const message =
      result.status === "CAPSULE_PRUNED"
        ? `Resume capsule pruned for ${commandRunId}.`
        : `No resume capsule to prune for ${commandRunId}.`;

    return success({
      status: result.status,
      mustStop: false,
      message,
      nextAction:
        "The session record and audit trail are preserved. Re-run chaos:doctor to confirm the stale-capsule warning is cleared.",
      data: {
        commandRunId,
        prunedPath: result.prunedPath,
        sessionState: result.sessionState,
        reason,
        forced: force,
      },
    });
  },
};
