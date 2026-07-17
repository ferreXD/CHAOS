/** Read-only resource abstractions (SDK-agnostic, unit-testable). */

import type { InteractionRuntime } from "../runtime.ts";

export interface ResourceContext {
  runtime: InteractionRuntime;
}

export interface ResourceReadResult {
  found: boolean;
  /** JSON body returned to the client. */
  json: unknown;
}

export interface StaticResource {
  kind: "static";
  name: string;
  uri: string;
  description: string;
  read(ctx: ResourceContext): ResourceReadResult;
}

export interface TemplateResource {
  kind: "template";
  name: string;
  /** RFC 6570 template, e.g. chaos://interactions/sessions/{commandRunId}. */
  uriTemplate: string;
  description: string;
  read(ctx: ResourceContext, params: Record<string, string>): ResourceReadResult;
}

export type Resource = StaticResource | TemplateResource;

export function notFound(message: string): ResourceReadResult {
  return { found: false, json: { status: "NOT_FOUND", message } };
}
