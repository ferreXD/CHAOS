/** Schema validation, malformed-state safety, and atomic-write tests (cases 14-15). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { makeRuntime, REAL_SCHEMA_DIR, SAMPLE_OPTIONS } from "./helpers.ts";
import {
  validateAgainstSchema,
  SchemaValidationError,
} from "../src/store/schemaValidation.ts";
import {
  atomicWriteJson,
  readJson,
  MalformedStateError,
} from "../src/store/atomicWrite.ts";
import { SCHEMA_FILES } from "../src/validation/schemas.ts";

const EXAMPLES_DIR = path.resolve(import.meta.dirname, "../../../.chaos/interactions/examples");

function loadSchema(kind: keyof typeof SCHEMA_FILES): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(REAL_SCHEMA_DIR, SCHEMA_FILES[kind]), "utf8"));
}
function loadExample(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, name), "utf8"));
}

test("Iteration 0 example artifacts validate against their schemas (no drift)", () => {
  assert.deepEqual(
    validateAgainstSchema("decision", loadSchema("decision"), loadExample("decision.execution-profile.example.json")),
    [],
  );
  assert.deepEqual(
    validateAgainstSchema("response", loadSchema("response"), loadExample("response.execution-profile.example.json")),
    [],
  );
  assert.deepEqual(
    validateAgainstSchema("session", loadSchema("session"), loadExample("session.waiting.example.json")),
    [],
  );
  assert.deepEqual(
    validateAgainstSchema("resumeCapsule", loadSchema("resumeCapsule"), loadExample("resume-capsule.example.json")),
    [],
  );
});

test("validator rejects an artifact that violates the schema", () => {
  const bad = { ...(loadExample("decision.execution-profile.example.json") as any), options: [] };
  const errors = validateAgainstSchema("decision", loadSchema("decision"), bad);
  assert.ok(errors.length > 0);
});

test("runtime writes artifacts that validate against the real schemas", () => {
  const { runtime, root, cleanup } = makeRuntime(true);
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const dec = runtime.createDecision({
      commandRunId: begin.commandRunId!,
      title: "Pick",
      context: "ctx",
      options: SAMPLE_OPTIONS,
    });
    // Validation is enabled on write; re-validate persisted decision explicitly.
    const persisted = JSON.parse(
      fs.readFileSync(`${root}/decisions/${dec.decisionId}/decision.json`, "utf8"),
    );
    assert.deepEqual(validateAgainstSchema("decision", loadSchema("decision"), persisted), []);
  } finally {
    cleanup();
  }
});

test("14. malformed existing JSON is reported safely and the file is preserved", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    const sessionFile = `${root}/sessions/${begin.commandRunId}.json`;
    fs.writeFileSync(sessionFile, "{ this is not valid json ", "utf8");
    assert.throws(
      () => runtime.getSession(begin.commandRunId!),
      (err: unknown) => err instanceof MalformedStateError && (err as MalformedStateError).filePath === path.resolve(sessionFile),
    );
    // The corrupt file is preserved (fail-safe), not deleted/overwritten.
    assert.ok(fs.existsSync(sessionFile));
    assert.equal(fs.readFileSync(sessionFile, "utf8"), "{ this is not valid json ");
  } finally {
    cleanup();
  }
});

test("15. atomicWriteJson leaves a complete target file and no leftover temp files", () => {
  const { root, cleanup } = makeRuntime();
  try {
    const dir = path.join(root, "atomic");
    const target = path.join(dir, "value.json");
    const payload = { a: 1, nested: { b: "x".repeat(5000) }, list: Array.from({ length: 200 }, (_, i) => i) };
    atomicWriteJson(target, payload);

    // Target parses fully.
    assert.deepEqual(readJson(target), payload);
    // No leftover temp files in the directory.
    const leftovers = fs.readdirSync(dir).filter((f) => f.includes(".tmp"));
    assert.deepEqual(leftovers, []);

    // Overwriting replaces atomically (no partial content).
    atomicWriteJson(target, { a: 2 });
    assert.deepEqual(readJson(target), { a: 2 });
    assert.deepEqual(
      fs.readdirSync(dir).filter((f) => f.includes(".tmp")),
      [],
    );
  } finally {
    cleanup();
  }
});

test("SchemaValidationError surfaces field-level errors", () => {
  const errors = validateAgainstSchema("decision", loadSchema("decision"), { schemaVersion: 2 });
  const err = new SchemaValidationError("decision", errors);
  assert.match(err.message, /Schema validation failed for decision/);
  assert.ok(errors.length > 0);
});
