/** Builds an Iteration 1 InteractionRuntime from server config. */

import { InteractionRuntime } from "./runtime.ts";
import type { ServerConfig } from "./config.ts";

export function createRuntime(config: ServerConfig): InteractionRuntime {
  return new InteractionRuntime({
    root: config.root,
    schemaDir: config.schemaDir,
    validate: config.validate,
  });
}
