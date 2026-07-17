/** Probe 2: required schemas exist and are valid JSON. */

import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, rel, safeReadJson, type ProbeContext } from "./probeContext.ts";

/** Iteration 0 schemas + the Iteration 5 runner lease schema. */
const REQUIRED_SCHEMAS = [
  "session.schema.json",
  "decision.schema.json",
  "response.schema.json",
  "lock.schema.json",
  "resume-capsule.schema.json",
  "active.schema.json",
  "index.schema.json",
  "audit-event.schema.json",
];

const OPTIONAL_SCHEMAS = ["runner-lease.schema.json"];

export function schemaProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const dir = ctx.paths.schemaDir;

  if (!exists(dir)) {
    out.push(
      finding({
        id: "IR-SCHEMA-DIR-MISSING",
        severity: "BLOCKER",
        category: "schema",
        title: "Schema directory is missing",
        message: `No schema directory at ${rel(ctx, dir)}; runtime artifacts cannot be validated.`,
        evidence: [rel(ctx, dir)],
        affectedArtifacts: [rel(ctx, dir)],
        recommendedActions: ["Restore .chaos/interactions/schema/ from the Iteration 0 contracts."],
      }),
    );
    return out;
  }

  const check = (file: string, required: boolean): void => {
    const p = path.join(dir, file);
    if (!exists(p)) {
      if (required) {
        out.push(
          finding({
            id: `IR-SCHEMA-MISSING-${file}`,
            severity: "ERROR",
            category: "schema",
            title: `Required schema ${file} is missing`,
            message: `Expected schema ${file} not found in ${rel(ctx, dir)}.`,
            evidence: [rel(ctx, p)],
            affectedArtifacts: [rel(ctx, p)],
            recommendedActions: ["Restore the schema from the Iteration 0 contracts."],
          }),
        );
      }
      return;
    }
    const read = safeReadJson<unknown>(p);
    if (!read.ok) {
      out.push(
        finding({
          id: `IR-SCHEMA-INVALID-${file}`,
          severity: "ERROR",
          category: "schema",
          title: `Schema ${file} is not valid JSON`,
          message: `${rel(ctx, p)} could not be parsed: ${read.error}`,
          evidence: [rel(ctx, p)],
          affectedArtifacts: [rel(ctx, p)],
          recommendedActions: ["Fix the schema JSON; do not delete it."],
        }),
      );
    }
  };

  for (const s of REQUIRED_SCHEMAS) check(s, true);
  for (const s of OPTIONAL_SCHEMAS) check(s, false);

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-SCHEMA-OK",
        severity: "OK",
        category: "schema",
        title: "Runtime schemas present and valid",
        message: `All required schemas exist and parse in ${rel(ctx, dir)}.`,
        evidence: [rel(ctx, dir)],
      }),
    );
  }
  return out;
}
