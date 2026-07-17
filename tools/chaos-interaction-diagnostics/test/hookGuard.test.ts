/** Advisory runtime-contract guard (Iteration 7 tests 17–20). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { RuntimeContractGuard } from "../src/hooks/runtimeContractGuard.ts";
import { makeEnv, seedPendingDecision, seedReadyToResume, readHookViolations } from "./helpers.ts";

test("17. records continued-after-must-stop and writes it to the existing stream", () => {
  const env = makeEnv();
  try {
    const { runId } = seedPendingDecision(env, "c1");
    const guard = new RuntimeContractGuard(env.config);
    const v = guard.checkContinuedAfterMustStop({
      sourceCommand: "chaos:apply",
      commandRunId: runId,
      changeId: "c1",
      continued: true,
    });
    assert.ok(v);
    assert.equal(v!.violationType, "continued-after-must-stop");
    assert.equal(v!.severity, "BLOCKER");

    guard.record([v]);
    const lines = readHookViolations(env);
    const written = lines.find((l) => l.violationType === "continued-after-must-stop");
    assert.ok(written, "violation written to hook-violations.jsonl");
    // Superset preserves the existing base fields.
    assert.equal(written!.hook, "chaos-interaction-runtime-guard");
    assert.equal(written!.code, "CHAOS-IR-VIOLATION");
    assert.equal(written!.schemaVersion, 1);
  } finally {
    env.cleanup();
  }
});

test("18. records write-while-decision-pending for production writes", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env, "c1");
    const guard = new RuntimeContractGuard(env.config);
    const v = guard.checkWriteWhileDecisionPending({
      sourceCommand: "chaos:apply",
      changeId: "c1",
      touchedFiles: ["src/Domain/Foo.cs", ".chaos/interactions/whatever.json"],
    });
    assert.ok(v);
    assert.equal(v!.violationType, "write-while-decision-pending");
    // .chaos/ path is not counted as production; the .cs file is.
    assert.ok(v!.evidence.some((e) => e.includes("Foo.cs")));
    assert.ok(!v!.evidence.some((e) => e.includes(".chaos/")));
  } finally {
    env.cleanup();
  }
});

test("no write violation when there is no pending decision", () => {
  const env = makeEnv();
  try {
    seedReadyToResume(env, "c1"); // answered — no longer pending
    const guard = new RuntimeContractGuard(env.config);
    const v = guard.checkWriteWhileDecisionPending({
      sourceCommand: "chaos:apply",
      changeId: "c1",
      touchedFiles: ["src/Foo.cs"],
    });
    assert.equal(v, null);
  } finally {
    env.cleanup();
  }
});

test("19. advisory mode never blocks, even on a BLOCKER", () => {
  const env = makeEnv({ enforcementMode: "advisory" });
  try {
    const { runId } = seedPendingDecision(env, "c1");
    const guard = new RuntimeContractGuard(env.config);
    const v = guard.checkContinuedAfterMustStop({
      sourceCommand: "chaos:apply",
      commandRunId: runId,
      changeId: "c1",
      continued: true,
    });
    const result = guard.record([v]);
    assert.equal(result.blocked, false);
    assert.equal(result.violations.length, 1);
  } finally {
    env.cleanup();
  }
});

test("20. strict mode blocks a BLOCKER when configured", () => {
  const env = makeEnv({ enforcementMode: "strict", strictBlocksOnBlocker: true });
  try {
    const { runId } = seedPendingDecision(env, "c1");
    const guard = new RuntimeContractGuard(env.config);
    const v = guard.checkContinuedAfterMustStop({
      sourceCommand: "chaos:apply",
      commandRunId: runId,
      changeId: "c1",
      continued: true,
    });
    const result = guard.record([v]);
    assert.equal(result.blocked, true);
  } finally {
    env.cleanup();
  }
});

test("off mode does not write or block", () => {
  const env = makeEnv({ enforcementMode: "off" });
  try {
    const { runId } = seedPendingDecision(env, "c1");
    const guard = new RuntimeContractGuard(env.config);
    const v = guard.checkContinuedAfterMustStop({
      sourceCommand: "chaos:apply",
      commandRunId: runId,
      changeId: "c1",
      continued: true,
    });
    const result = guard.record([v]);
    assert.equal(result.blocked, false);
    assert.equal(readHookViolations(env).length, 0);
  } finally {
    env.cleanup();
  }
});

test("decision-not-consumed is detected after completion", () => {
  const env = makeEnv();
  try {
    const { runId, decisionId } = seedReadyToResume(env, "c1");
    // Complete the command WITHOUT consuming the answered decision.
    env.runtime.completeCommand(runId);
    const guard = new RuntimeContractGuard(env.config);
    const violations = guard.checkDecisionNotConsumed(runId);
    assert.ok(violations.some((v) => v.violationType === "decision-not-consumed"));
    assert.ok(violations.some((v) => v.message.includes(decisionId)));
  } finally {
    env.cleanup();
  }
});
