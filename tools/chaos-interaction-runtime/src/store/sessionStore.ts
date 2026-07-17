/** Persistence for command sessions. */

import * as fs from "node:fs";
import type { CommandSession } from "../model/commandSession.ts";
import { SCHEMA_FILES } from "../validation/schemas.ts";
import { atomicWriteJson, readJsonIfExists } from "./atomicWrite.ts";
import type { PathResolver } from "./pathResolver.ts";
import { validateAgainstSchemaFile } from "./schemaValidation.ts";

export class SessionStore {
  private readonly paths: PathResolver;
  private readonly validate: boolean;
  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.validate = validate;
  }

  write(session: CommandSession): void {
    if (this.validate) {
      validateAgainstSchemaFile(
        `session ${session.commandRunId}`,
        this.paths.schema(SCHEMA_FILES.session),
        session,
      );
    }
    atomicWriteJson(this.paths.session(session.commandRunId), session);
  }

  read(commandRunId: string): CommandSession | undefined {
    return readJsonIfExists<CommandSession>(this.paths.session(commandRunId));
  }

  list(): CommandSession[] {
    const dir = this.paths.sessionsDir();
    if (!fs.existsSync(dir)) return [];
    const out: CommandSession[] = [];
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const session = readJsonIfExists<CommandSession>(this.paths.session(file.replace(/\.json$/, "")));
      if (session) out.push(session);
    }
    return out;
  }
}
