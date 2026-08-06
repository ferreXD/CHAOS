/**
 * Schema embedding + seeding tests.
 *
 * 1. Parity: the generated embedded schemas must byte-equal (as parsed JSON)
 *    the canonical files in .chaos/interactions/schema — editing a schema
 *    without re-running generate-embedded-schemas.mjs fails here.
 * 2. Seeding: seedSchemas writes all schemas, never clobbers existing files
 *    without force; autoSeedSchemas only acts on an existing workspace with a
 *    missing/empty schema dir.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EMBEDDED_SCHEMAS } from "../src/embeddedSchemas.generated.ts";
import { autoSeedSchemas, seedSchemas } from "../src/schemaSeed.ts";
import { REAL_SCHEMA_DIR } from "./helpers.ts";

function tempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("embedded schemas are in parity with .chaos/interactions/schema", () => {
  const canonical = fs
    .readdirSync(REAL_SCHEMA_DIR)
    .filter((f) => f.endsWith(".schema.json"))
    .sort();
  assert.deepEqual(Object.keys(EMBEDDED_SCHEMAS).sort(), canonical);
  for (const file of canonical) {
    const onDisk = JSON.parse(fs.readFileSync(path.join(REAL_SCHEMA_DIR, file), "utf8"));
    assert.deepEqual(
      EMBEDDED_SCHEMAS[file],
      onDisk,
      `${file} drifted — run: node scripts/generate-embedded-schemas.mjs`,
    );
  }
});

test("seedSchemas writes every embedded schema into an empty dir", () => {
  const dir = path.join(tempDir("chaos-seed-"), "schema");
  const result = seedSchemas(dir);
  assert.equal(result.written.length, Object.keys(EMBEDDED_SCHEMAS).length);
  assert.equal(result.skipped.length, 0);
  for (const file of Object.keys(EMBEDDED_SCHEMAS)) {
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    assert.deepEqual(parsed, EMBEDDED_SCHEMAS[file]);
  }
});

test("seedSchemas never overwrites existing files unless forced", () => {
  const dir = path.join(tempDir("chaos-seed-"), "schema");
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, "decision.schema.json");
  fs.writeFileSync(target, `{"userEdited": true}\n`, "utf8");

  const result = seedSchemas(dir);
  assert.deepEqual(result.skipped, ["decision.schema.json"]);
  assert.deepEqual(JSON.parse(fs.readFileSync(target, "utf8")), { userEdited: true });

  const forced = seedSchemas(dir, { force: true });
  assert.equal(forced.skipped.length, 0);
  assert.deepEqual(
    JSON.parse(fs.readFileSync(target, "utf8")),
    EMBEDDED_SCHEMAS["decision.schema.json"],
  );
});

test("autoSeedSchemas leaves untouched repos alone, seeds existing workspaces", () => {
  const base = tempDir("chaos-autoseed-");
  const root = path.join(base, ".chaos", "interactions");
  const schemaDir = path.join(root, "schema");

  // No interactions root: never touch the repo.
  assert.equal(autoSeedSchemas(root, schemaDir), undefined);
  assert.equal(fs.existsSync(schemaDir), false);

  // Workspace exists, schemas missing: seed.
  fs.mkdirSync(root, { recursive: true });
  const seeded = autoSeedSchemas(root, schemaDir);
  assert.ok(seeded);
  assert.equal(seeded.written.length, Object.keys(EMBEDDED_SCHEMAS).length);

  // Schemas present: no-op.
  assert.equal(autoSeedSchemas(root, schemaDir), undefined);
});
