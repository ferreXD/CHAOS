import { z } from "zod";
import type { McpTool } from "../protocol/tool.ts";
import { success } from "../protocol/toolResult.ts";
import { optionalBool, optionalString } from "../protocol/validation.ts";
import { sessionSummary } from "../views.ts";
import { normalizeCommand } from "../runtime.ts";

export const listSessionsTool: McpTool = {
  name: "chaos_list_sessions",
  title: "List command sessions",
  description:
    "List command sessions (summaries only). Supports filtering by changeId, state, sourceCommand, and readyToResumeOnly.",
  inputShape: {
    changeId: z.string().optional(),
    state: z.string().optional(),
    sourceCommand: z.string().optional(),
    readyToResumeOnly: z.boolean().optional(),
  },
  handler(ctx, args) {
    const changeId = optionalString(args, "changeId");
    const state = optionalString(args, "state");
    const sourceCommand = optionalString(args, "sourceCommand");
    const readyOnly = optionalBool(args, "readyToResumeOnly", false);

    let sessions = ctx.runtime.store.sessions.list();
    if (changeId) sessions = sessions.filter((s) => s.changeId === changeId);
    if (state) sessions = sessions.filter((s) => s.state === state);
    if (sourceCommand) {
      sessions = sessions.filter(
        (s) => normalizeCommand(s.sourceCommand) === normalizeCommand(sourceCommand),
      );
    }
    if (readyOnly) sessions = sessions.filter((s) => s.state === "ready-to-resume");

    const summaries = sessions.map((s) => sessionSummary(ctx.runtime, s));
    const readyToResume = summaries.filter((s) => s["state"] === "ready-to-resume");
    const pending = summaries.filter((s) => s["state"] === "waiting-for-decision");
    const latest = [...sessions].sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : -1))[0];

    return success({
      status: sessions.length === 0 ? "NO_SESSIONS" : "SESSIONS",
      mustStop: false,
      message: `${sessions.length} session(s).`,
      data: {
        sessions: summaries,
        readyToResume,
        pending,
        latest: latest ? sessionSummary(ctx.runtime, latest) : null,
      },
    });
  },
};
