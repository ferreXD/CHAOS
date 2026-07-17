/** The full set of read-only MCP resources. */

import type { Resource, StaticResource, TemplateResource } from "./types.ts";
import { activeInteractionResource } from "./activeInteractionResource.ts";
import { lockResource } from "./lockResource.ts";
import { sessionsListResource, sessionResource } from "./sessionResource.ts";
import { decisionResource } from "./decisionResource.ts";
import { capsuleResource } from "./capsuleResource.ts";

export const ALL_RESOURCES: Resource[] = [
  activeInteractionResource,
  lockResource,
  sessionsListResource,
  sessionResource,
  decisionResource,
  capsuleResource,
];

export const STATIC_RESOURCES: StaticResource[] = ALL_RESOURCES.filter(
  (r): r is StaticResource => r.kind === "static",
);

export const TEMPLATE_RESOURCES: TemplateResource[] = ALL_RESOURCES.filter(
  (r): r is TemplateResource => r.kind === "template",
);
