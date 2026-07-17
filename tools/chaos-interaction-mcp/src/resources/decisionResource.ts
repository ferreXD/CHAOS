import type { TemplateResource } from "./types.ts";
import { notFound } from "./types.ts";

export const decisionResource: TemplateResource = {
  kind: "template",
  name: "chaos-decision",
  uriTemplate: "chaos://interactions/decisions/{decisionId}",
  description: "A single decision (with its response, if any) by decisionId.",
  read(ctx, params) {
    const decisionId = params["decisionId"] ?? "";
    const decision = ctx.runtime.getDecision(decisionId);
    if (!decision) return notFound(`No decision ${decisionId}.`);
    const response = ctx.runtime.store.decisions.readResponse(decisionId) ?? null;
    return { found: true, json: { decision, response } };
  },
};
