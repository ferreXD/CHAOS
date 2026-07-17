/** Persistence for decisions and their responses. */

import * as fs from "node:fs";
import type { Decision } from "../model/decision.ts";
import type { DecisionResponse } from "../model/response.ts";
import { SCHEMA_FILES } from "../validation/schemas.ts";
import { atomicWriteJson, readJsonIfExists } from "./atomicWrite.ts";
import type { PathResolver } from "./pathResolver.ts";
import { validateAgainstSchemaFile } from "./schemaValidation.ts";

export class DecisionStore {
  private readonly paths: PathResolver;
  private readonly validate: boolean;
  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.validate = validate;
  }

  writeDecision(decision: Decision): void {
    if (this.validate) {
      validateAgainstSchemaFile(
        `decision ${decision.decisionId}`,
        this.paths.schema(SCHEMA_FILES.decision),
        decision,
      );
    }
    atomicWriteJson(this.paths.decision(decision.decisionId), decision);
  }

  readDecision(decisionId: string): Decision | undefined {
    return readJsonIfExists<Decision>(this.paths.decision(decisionId));
  }

  writeResponse(response: DecisionResponse): void {
    if (this.validate) {
      validateAgainstSchemaFile(
        `response ${response.decisionId}`,
        this.paths.schema(SCHEMA_FILES.response),
        response,
      );
    }
    atomicWriteJson(this.paths.response(response.decisionId), response);
  }

  readResponse(decisionId: string): DecisionResponse | undefined {
    return readJsonIfExists<DecisionResponse>(this.paths.response(decisionId));
  }

  list(): Decision[] {
    const dir = this.paths.decisionsDir();
    if (!fs.existsSync(dir)) return [];
    const out: Decision[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const decision = this.readDecision(entry.name);
      if (decision) out.push(decision);
    }
    return out;
  }
}
