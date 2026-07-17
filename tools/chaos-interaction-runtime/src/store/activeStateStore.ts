/** Persistence for the workspace-level active interaction pointer + index. */

import type { ActiveState } from "../model/activeState.ts";
import type { InteractionIndex } from "../model/activeState.ts";
import { SCHEMA_FILES } from "../validation/schemas.ts";
import { atomicWriteJson, readJsonIfExists } from "./atomicWrite.ts";
import type { PathResolver } from "./pathResolver.ts";
import { validateAgainstSchemaFile } from "./schemaValidation.ts";

export class ActiveStateStore {
  private readonly paths: PathResolver;
  private readonly validate: boolean;
  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.validate = validate;
  }

  readActive(): ActiveState | undefined {
    return readJsonIfExists<ActiveState>(this.paths.active());
  }

  writeActive(state: ActiveState): void {
    if (this.validate) {
      validateAgainstSchemaFile("active", this.paths.schema(SCHEMA_FILES.activeState), state);
    }
    atomicWriteJson(this.paths.active(), state);
  }

  readIndex(): InteractionIndex | undefined {
    return readJsonIfExists<InteractionIndex>(this.paths.index());
  }

  writeIndex(index: InteractionIndex): void {
    if (this.validate) {
      validateAgainstSchemaFile("index", this.paths.schema(SCHEMA_FILES.index), index);
    }
    atomicWriteJson(this.paths.index(), index);
  }
}
