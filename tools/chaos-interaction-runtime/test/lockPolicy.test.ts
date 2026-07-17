/** Lock policy tests (required cases 7-9). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { makeRuntime, SAMPLE_OPTIONS } from "./helpers.ts";

/** Put change `c1` into waiting-for-decision so a lock exists. */
function lockChange(runtime: ReturnType<typeof makeRuntime>["runtime"], changeId: string) {
  const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId });
  runtime.createDecision({
    commandRunId: begin.commandRunId!,
    title: "Pick",
    context: "ctx",
    options: SAMPLE_OPTIONS,
  });
  return begin.commandRunId!;
}

test("7. conflicting command for the same changeId is blocked", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    lockChange(runtime, "c1");
    const apply = runtime.beginCommand({ sourceCommand: "chaos:apply", changeId: "c1" });
    assert.equal(apply.status, "CONFLICTING_COMMAND_ACTIVE");
    assert.equal(apply.mustStop, true);
    assert.ok(apply.conflictingCommandRunId);
  } finally {
    cleanup();
  }
});

test("7b. re-invoking the same command for a locked change is BLOCKED_BY_PENDING_DECISION", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    lockChange(runtime, "c1");
    const again = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "c1" });
    assert.equal(again.status, "BLOCKED_BY_PENDING_DECISION");
    assert.equal(again.mustStop, true);
    assert.equal(again.uiAction, "focus-existing-decision");
    assert.ok(again.decisionId);
  } finally {
    cleanup();
  }
});

test("8. command for a different changeId is allowed", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    lockChange(runtime, "c1");
    const other = runtime.beginCommand({ sourceCommand: "chaos:apply", changeId: "c2" });
    assert.equal(other.status, "READY");
    assert.equal(other.mustStop, false);
  } finally {
    cleanup();
  }
});

test("9. compatible read-only command is allowed on a locked change", () => {
  const { runtime, cleanup } = makeRuntime();
  try {
    lockChange(runtime, "c1");
    for (const cmd of ["chaos:status", "chaos:doctor", "chaos:help"]) {
      const res = runtime.beginCommand({ sourceCommand: cmd, changeId: "c1" });
      assert.equal(res.status, "READY", `${cmd} should be allowed`);
    }
    // chaos:todo --dry-run is compatible; bare chaos:todo is not.
    assert.equal(
      runtime.beginCommand({ sourceCommand: "chaos:todo --dry-run", changeId: "c1" }).status,
      "READY",
    );
    assert.equal(
      runtime.beginCommand({ sourceCommand: "chaos:todo", changeId: "c1" }).status,
      "CONFLICTING_COMMAND_ACTIVE",
    );
  } finally {
    cleanup();
  }
});

test("listLocks flags a lock whose owning session no longer exists as stale (without deleting it)", () => {
  const { runtime, root, cleanup } = makeRuntime();
  try {
    const runId = lockChange(runtime, "c1");
    // Simulate the session file vanishing.
    fs.rmSync(`${root}/sessions/${runId}.json`, { force: true });
    const locks = runtime.listLocks();
    assert.equal(locks.length, 1);
    assert.equal(locks[0]!.stale, true);
    // Lock is not auto-removed.
    assert.equal(locks[0]!.state, "active");
  } finally {
    cleanup();
  }
});
