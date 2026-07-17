import type { TemplateResource } from "./types.ts";
import { notFound } from "./types.ts";

export const capsuleResource: TemplateResource = {
  kind: "template",
  name: "chaos-capsule",
  uriTemplate: "chaos://interactions/capsules/{commandRunId}",
  description: "A resume capsule by commandRunId.",
  read(ctx, params) {
    const commandRunId = params["commandRunId"] ?? "";
    const capsule = ctx.runtime.store.capsules.read(commandRunId);
    if (!capsule) return notFound(`No resume capsule for ${commandRunId}.`);
    return { found: true, json: capsule };
  },
};
