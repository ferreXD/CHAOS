/** Persistence for resume capsules. */

import * as fs from "node:fs";
import type { ResumeCapsule } from "../model/resumeCapsule.ts";
import { SCHEMA_FILES } from "../validation/schemas.ts";
import { atomicWriteJson, MalformedStateError, readJsonIfExists } from "./atomicWrite.ts";
import type { PathResolver } from "./pathResolver.ts";
import { validateAgainstSchemaFile } from "./schemaValidation.ts";

export class CapsuleStore {
  private readonly paths: PathResolver;
  private readonly validate: boolean;
  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.validate = validate;
  }

  write(capsule: ResumeCapsule): void {
    if (this.validate) {
      validateAgainstSchemaFile(
        `resume-capsule ${capsule.commandRunId}`,
        this.paths.schema(SCHEMA_FILES.resumeCapsule),
        capsule,
      );
    }
    atomicWriteJson(this.paths.capsule(capsule.commandRunId), capsule);
  }

  read(commandRunId: string): ResumeCapsule | undefined {
    return readJsonIfExists<ResumeCapsule>(this.paths.capsule(commandRunId));
  }

  /**
   * Enumerate all resume capsules. Read-only. Malformed capsule files are
   * skipped (not thrown) so discovery never crashes on a single bad file.
   */
  list(): ResumeCapsule[] {
    const dir = this.paths.capsulesDir();
    if (!fs.existsSync(dir)) return [];
    const out: ResumeCapsule[] = [];
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const capsule = this.read(file.replace(/\.json$/, ""));
        if (capsule) out.push(capsule);
      } catch (err) {
        if (err instanceof MalformedStateError) continue;
        throw err;
      }
    }
    return out;
  }
}
