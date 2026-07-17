import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalBool, optionalString } from "../protocol/validation.ts";

export const listLocksTool: McpTool = {
  name: "chaos_list_locks",
  title: "List change locks",
  description:
    "List current change locks and flag stale ones. This tool never deletes or repairs state; it only reports.",
  inputShape: {
    changeId: z.string().optional(),
    includeStale: z.boolean().optional(),
  },
  handler(ctx, args) {
    const changeId = optionalString(args, "changeId");
    const includeStale = optionalBool(args, "includeStale", true);

    let locks = ctx.runtime.listLocks();
    if (changeId) locks = locks.filter((l) => l.changeId === changeId);

    const stale = locks.filter((l) => l.stale);
    const visible = includeStale ? locks : locks.filter((l) => !l.stale);

    const warnings = stale.map(
      (l) => `Lock ${l.lockId} (change ${l.changeId}) is stale: ${l.staleReason ?? "unknown"}.`,
    );
    const suggestedActions = stale.length
      ? [
          "Stale locks are NOT auto-removed. Investigate the owning session, then complete/cancel it, or release the lock via a future repair operation.",
        ]
      : [];

    return success({
      status: locks.length === 0 ? "NO_LOCKS" : "LOCKS",
      mustStop: false,
      message: `${visible.length} lock(s) reported${stale.length ? `, ${stale.length} stale` : ""}.`,
      warnings,
      data: {
        locks: visible,
        staleLocks: stale,
        suggestedActions,
      },
    });
  },
};
