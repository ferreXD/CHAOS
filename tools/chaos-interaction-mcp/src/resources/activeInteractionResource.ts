import type { StaticResource } from "./types.ts";

export const activeInteractionResource: StaticResource = {
  kind: "static",
  name: "chaos-active-interaction",
  uri: "chaos://interactions/active",
  description: "Workspace-level active interaction pointer (active.json).",
  read(ctx) {
    const active = ctx.runtime.store.activeState.readActive();
    return {
      found: true,
      json:
        active ?? {
          schemaVersion: 1,
          state: "ready",
          activeDecisionId: null,
          activeCommandRunId: null,
          activeChangeId: null,
          pendingDecisionIds: [],
          readyToResumeCommandRunIds: [],
          updatedAt: new Date(0).toISOString(),
          metadata: {},
        },
    };
  },
};
