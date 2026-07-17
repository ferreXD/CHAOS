import type { StaticResource, TemplateResource } from "./types.ts";
import { notFound } from "./types.ts";
import { sessionSummary } from "../views.ts";

/** List of all session summaries. */
export const sessionsListResource: StaticResource = {
  kind: "static",
  name: "chaos-sessions",
  uri: "chaos://interactions/sessions",
  description: "All command session summaries.",
  read(ctx) {
    return {
      found: true,
      json: {
        sessions: ctx.runtime.store.sessions.list().map((s) => sessionSummary(ctx.runtime, s)),
      },
    };
  },
};

/** A single session by commandRunId. */
export const sessionResource: TemplateResource = {
  kind: "template",
  name: "chaos-session",
  uriTemplate: "chaos://interactions/sessions/{commandRunId}",
  description: "A single command session by commandRunId.",
  read(ctx, params) {
    const session = ctx.runtime.getSession(params["commandRunId"] ?? "");
    if (!session) return notFound(`No session ${params["commandRunId"]}.`);
    return { found: true, json: session };
  },
};
