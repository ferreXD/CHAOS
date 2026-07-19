/**
 * EA-X4 abuse suite — CI smoke gate (advances IL-RT9).
 *
 * A reduced-N slice of the kill/resume abuse suite that runs under `node --test`
 * so CI can gate on the store-corruption invariants that must ALWAYS hold under a
 * hard kill, without paying for the full 20-run driver. The full run (with the
 * headline >=95% / 0-corruption metrics) lives in `run.ts`.
 *
 * These assertions are invariants, not thresholds: a hard kill may legitimately
 * leave a run "still waiting" or "already answered" — but it must never leave
 * torn JSON, a torn audit line, a schema-invalid persisted record, or allow a
 * decision to be consumed twice.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { runIteration, CHECKPOINTS } from "./harness.ts";

const KNOWN_CLASSIFICATIONS = new Set([
  "no-session",
  "no-decision",
  "waiting-answerable",
  "ready-answer-committed",
  "consumed",
  "degraded-createdecision-window",
  "inconsistent-lost-answer",
  "inconsistent-other",
]);

/** Single-kill smoke iterations + one concurrent-writer iteration. */
for (const iteration of [1, 6, 15]) {
  test(`abuse iteration ${iteration}: no torn state, no double-consume`, async () => {
    const r = await runIteration(iteration);

    // Hard corruption must never occur — atomic writes must hold.
    assert.deepEqual(r.corruption.tornJson, [], "no torn JSON files");
    assert.deepEqual(r.corruption.tornAuditLine, [], "no torn audit.jsonl lines");
    assert.deepEqual(r.corruption.schemaInvalid, [], "no schema-invalid persisted records");
    assert.equal(r.corruptionPostResume, false, "resume must not corrupt the store");

    // Consuming a decision must have exactly-once effect (idempotent, no dup).
    assert.notEqual(r.consumeExactlyOnce, false, "consume must be exactly-once");

    // Classification must be a known shape.
    assert.ok(KNOWN_CLASSIFICATIONS.has(r.classification), `known classification (${r.classification})`);

    // The worker must not have crashed with an unexpected error.
    assert.equal(r.workerStderr, "", `worker stderr should be empty (${r.workerStderr})`);
  });
}

test("checkpoints are the documented governed sequence", () => {
  assert.deepEqual([...CHECKPOINTS], ["begin", "decision", "capsule", "answer", "post"]);
});
