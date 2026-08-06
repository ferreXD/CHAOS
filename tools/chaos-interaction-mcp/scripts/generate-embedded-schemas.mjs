#!/usr/bin/env node
/**
 * Regenerates src/embeddedSchemas.generated.ts from the canonical schema files
 * at <repo>/.chaos/interactions/schema/*.json.
 *
 * The canonical schemas stay in the workspace (user-visible, versioned); the
 * generated module is what lets the published npm bundle seed a fresh
 * repository without a CHAOS checkout. A test asserts parity between the two,
 * so editing a schema without re-running this script fails CI.
 *
 * Usage: node scripts/generate-embedded-schemas.mjs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");
const schemaDir = path.join(repoRoot, ".chaos", "interactions", "schema");
const outFile = path.join(packageRoot, "src", "embeddedSchemas.generated.ts");

const files = fs
  .readdirSync(schemaDir)
  .filter((f) => f.endsWith(".schema.json"))
  .sort();

if (files.length === 0) {
  console.error(`No *.schema.json files found in ${schemaDir}`);
  process.exit(1);
}

const entries = files.map((file) => {
  const raw = fs.readFileSync(path.join(schemaDir, file), "utf8");
  const parsed = JSON.parse(raw); // validate + normalize formatting
  return `  ${JSON.stringify(file)}: ${JSON.stringify(parsed, null, 2).replace(/\n/g, "\n  ")},`;
});

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Canonical source: .chaos/interactions/schema/*.json (repo root).
 * Regenerate with: node scripts/generate-embedded-schemas.mjs
 *
 * Embedded so the published bundle can seed schemas into a repository that
 * has no CHAOS checkout (see schemaSeed.ts). Parity with the canonical files
 * is enforced by test/embeddedSchemaParity.test.ts.
 */

export const EMBEDDED_SCHEMAS: Readonly<Record<string, unknown>> = {
`;

fs.writeFileSync(outFile, `${banner}${entries.join("\n")}\n};\n`, "utf8");
console.log(`Wrote ${path.relative(packageRoot, outFile)} (${files.length} schemas).`);
