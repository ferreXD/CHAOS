/** Persistence for the aggregate change-lock file. */

import type { ChangeLock, LocksFile } from "../model/lock.ts";
import { SCHEMA_FILES } from "../validation/schemas.ts";
import { atomicWriteJson, readJsonIfExists } from "./atomicWrite.ts";
import type { PathResolver } from "./pathResolver.ts";
import { validateAgainstSchemaFile } from "./schemaValidation.ts";

export class LockStore {
  private readonly paths: PathResolver;
  private readonly validate: boolean;
  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.validate = validate;
  }

  read(): LocksFile {
    return (
      readJsonIfExists<LocksFile>(this.paths.locks()) ?? {
        schemaVersion: 1,
        locks: [],
        updatedAt: new Date(0).toISOString(),
      }
    );
  }

  write(file: LocksFile): void {
    if (this.validate) {
      for (const lock of file.locks) {
        validateAgainstSchemaFile(
          `lock ${lock.lockId}`,
          this.paths.schema(SCHEMA_FILES.lock),
          lock,
        );
      }
    }
    atomicWriteJson(this.paths.locks(), file);
  }

  activeLocks(): ChangeLock[] {
    return this.read().locks.filter((l) => l.state === "active");
  }
}
