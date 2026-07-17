/** Probe 3: validate persisted artifacts against their schemas (read-only). */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  SCHEMA_FILES,
  SchemaValidationError,
  validateAgainstSchemaFile,
} from "../runtime.ts";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { listJsonFiles, rel, safeReadJson, type ProbeContext } from "./probeContext.ts";
import { malformedArtifactCandidate } from "./todoHelpers.ts";

export function artifactValidationProbe(ctx: ProbeContext): HealthFinding[] {
  if (!ctx.config.validateArtifacts) return [];
  const out: HealthFinding[] = [];
  let validated = 0;

  const validateFile = (
    filePath: string,
    schemaFile: string,
    kind: string,
  ): void => {
    const read = safeReadJson<unknown>(filePath);
    if (!read.ok) {
      ctx.counters.malformedArtifacts += 1;
      out.push(
        finding({
          id: `IR-ARTIFACT-MALFORMED-${path.basename(filePath)}`,
          severity: "ERROR",
          category: "artifact-validation",
          title: `Malformed ${kind} artifact`,
          message: `${rel(ctx, filePath)} is not readable/parseable: ${read.error}. It was NOT modified.`,
          evidence: [rel(ctx, filePath)],
          affectedArtifacts: [rel(ctx, filePath)],
          recommendedActions: [
            "Inspect the file manually; run chaos:doctor. Do not auto-overwrite runtime state.",
          ],
          todoCandidate: malformedArtifactCandidate(ctx, filePath, kind),
          confidence: "HIGH",
        }),
      );
      return;
    }
    if (read.value === undefined) return;
    validated += 1;
    try {
      validateAgainstSchemaFile(
        `${kind}:${path.basename(filePath)}`,
        ctx.paths.schema(schemaFile),
        read.value,
      );
    } catch (err) {
      if (err instanceof SchemaValidationError) {
        ctx.counters.malformedArtifacts += 1;
        out.push(
          finding({
            id: `IR-ARTIFACT-INVALID-${path.basename(filePath)}`,
            severity: "ERROR",
            category: "artifact-validation",
            title: `${kind} artifact fails schema validation`,
            message: `${rel(ctx, filePath)}: ${err.errors.map((e) => `${e.path || "<root>"} ${e.message}`).join("; ")}`,
            evidence: [rel(ctx, filePath)],
            affectedArtifacts: [rel(ctx, filePath)],
            recommendedActions: ["Inspect and repair via the owning command; do not hand-edit."],
            todoCandidate: malformedArtifactCandidate(ctx, filePath, kind),
            confidence: "HIGH",
          }),
        );
      } else {
        throw err;
      }
    }
  };

  for (const f of listJsonFiles(ctx.paths.sessionsDir())) validateFile(f, SCHEMA_FILES.session, "session");
  for (const f of listJsonFiles(ctx.paths.capsulesDir())) validateFile(f, SCHEMA_FILES.resumeCapsule, "capsule");

  // decisions/<id>/{decision,response}.json
  const decisionsDir = ctx.paths.decisionsDir();
  if (fs.existsSync(decisionsDir)) {
    for (const entry of fs.readdirSync(decisionsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(decisionsDir, entry.name);
      const decisionFile = path.join(dir, "decision.json");
      const responseFile = path.join(dir, "response.json");
      if (fs.existsSync(decisionFile)) validateFile(decisionFile, SCHEMA_FILES.decision, "decision");
      if (fs.existsSync(responseFile)) validateFile(responseFile, SCHEMA_FILES.response, "response");
    }
  }

  // locks.json is an aggregate wrapper { schemaVersion, locks: [...] }.
  const locksRead = safeReadJson<{ locks?: unknown }>(ctx.paths.locks());
  if (!locksRead.ok) {
    ctx.counters.malformedArtifacts += 1;
    out.push(
      finding({
        id: "IR-ARTIFACT-MALFORMED-locks.json",
        severity: "ERROR",
        category: "artifact-validation",
        title: "Malformed locks.json",
        message: `${rel(ctx, ctx.paths.locks())} is not parseable: ${locksRead.error}. It was NOT modified.`,
        evidence: [rel(ctx, ctx.paths.locks())],
        affectedArtifacts: [rel(ctx, ctx.paths.locks())],
        recommendedActions: ["Inspect manually; do not auto-overwrite."],
        todoCandidate: malformedArtifactCandidate(ctx, ctx.paths.locks(), "lock-file"),
      }),
    );
  } else if (locksRead.value && !Array.isArray(locksRead.value.locks)) {
    out.push(
      finding({
        id: "IR-ARTIFACT-LOCKS-SHAPE",
        severity: "WARN",
        category: "artifact-validation",
        title: "locks.json missing a locks array",
        message: `${rel(ctx, ctx.paths.locks())} exists but has no "locks" array.`,
        evidence: [rel(ctx, ctx.paths.locks())],
        affectedArtifacts: [rel(ctx, ctx.paths.locks())],
      }),
    );
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-ARTIFACT-OK",
        severity: "OK",
        category: "artifact-validation",
        title: "Runtime artifacts validate",
        message: `Validated ${validated} artifact(s) against their schemas; no malformed/invalid files.`,
        evidence: [rel(ctx, ctx.config.interactionsRoot)],
      }),
    );
  }
  return out;
}
