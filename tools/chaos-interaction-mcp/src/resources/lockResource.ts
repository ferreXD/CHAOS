import type { StaticResource } from "./types.ts";

export const lockResource: StaticResource = {
  kind: "static",
  name: "chaos-locks",
  uri: "chaos://interactions/locks",
  description: "Current change locks with computed stale flags.",
  read(ctx) {
    return {
      found: true,
      json: { schemaVersion: 1, locks: ctx.runtime.listLocks() },
    };
  },
};
