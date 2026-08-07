/**
 * Schema seeding for repositories that have no CHAOS checkout.
 *
 * The interaction runtime validates artifacts against JSON schema files in the
 * workspace (`.chaos/interactions/schema/`). In-repo those files are versioned
 * alongside the code; on a machine that installed the server from npm they do
 * not exist yet. This module writes the embedded copies (generated at build
 * time from the canonical files) into the schema directory.
 *
 * Existing files are never overwritten unless `force` is set — the workspace
 * copy is user-owned once seeded.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { EMBEDDED_SCHEMAS } from "./embeddedSchemas.generated.ts";

export interface SeedResult {
  written: string[];
  skipped: string[];
}

export function seedSchemas(schemaDir: string, options: { force?: boolean } = {}): SeedResult {
  const result: SeedResult = { written: [], skipped: [] };
  fs.mkdirSync(schemaDir, { recursive: true });
  for (const [fileName, schema] of Object.entries(EMBEDDED_SCHEMAS)) {
    const target = path.join(schemaDir, fileName);
    if (!options.force && fs.existsSync(target)) {
      result.skipped.push(fileName);
      continue;
    }
    fs.writeFileSync(target, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
    result.written.push(fileName);
  }
  return result;
}

/**
 * Materialise the workspace for a command that is starting: create the
 * interactions root if it does not exist and seed any missing schemas.
 *
 * This is the counterpart to `autoSeedSchemas`. Startup must not create
 * anything (the server may be running in a repository that never adopted
 * CHAOS), but by the time a command explicitly begins, the workspace is wanted
 * — and on a fresh repository nothing else will have created it, because
 * `chaos:init` writes documents, not runtime state.
 */
export function ensureWorkspace(root: string, schemaDir: string): SeedResult {
  fs.mkdirSync(root, { recursive: true });
  return seedSchemas(schemaDir);
}

/**
 * Startup auto-seed: only acts when the interactions root already exists (a
 * CHAOS workspace is in use) but the schema directory is missing or empty.
 * A repository where CHAOS was never initialized is left untouched.
 */
export function autoSeedSchemas(root: string, schemaDir: string): SeedResult | undefined {
  if (!fs.existsSync(root)) return undefined;
  const hasSchemas =
    fs.existsSync(schemaDir) &&
    fs.readdirSync(schemaDir).some((f) => f.endsWith(".schema.json"));
  if (hasSchemas) return undefined;
  return seedSchemas(schemaDir);
}
