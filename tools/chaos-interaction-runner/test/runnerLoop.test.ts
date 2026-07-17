/** End-to-end runner loop: auto-resume, safety stops, dead-session fallback. */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import {
  makeEnv,
  makeRunner,
  mockAdapter,
  drive,
  stepToWait,
  answerActive,
  answerActiveForChange,
  readLease,
  readAudit,
  writeStopFlag,
  PROCEED_OPTIONS,
} from "./helpers.ts";
import type { MockBeat } from "../src/runner/commandProcess.ts";

const DECIDE: MockBeat = { type: "decision", title: "Choose", options: PROCEED_OPTIONS, nextStep: "continue" };

test("4. mock reaches a decision wait and writes a waiting lease", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    await stepToWait(loop);

    assert.equal(loop.state, "waiting-for-decision");
    assert.equal(loop.isDone(), false);
    assert.equal(adapter.createdDecisionIds.length, 1);
    assert.equal(readLease(env, runner.runnerId).state, "waiting-for-decision");
  } finally {
    env.cleanup();
  }
});

test("5. runner waits for the response, then completes once answered", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    await stepToWait(loop);
    assert.equal(loop.isDone(), false); // still waiting for the human

    answerActive(env, "proceed");
    const result = await drive(loop);
    assert.equal(result.outcome, "COMPLETED");
  } finally {
    env.cleanup();
  }
});

test("6. an answered decision auto-resumes the live session and consumes it", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    const result = await drive(loop, { onWait: () => void answerActive(env, "proceed") });

    assert.equal(result.outcome, "COMPLETED");
    assert.equal(result.autoResumeCyclesUsed, 1);
    assert.deepEqual(result.consumedDecisionIds, ["DEC-test-1"]);
    assert.equal(env.runtimeClient.getDecision("DEC-test-1")!.state, "consumed");
    assert.equal(readLease(env, runner.runnerId).state, "completed");
  } finally {
    env.cleanup();
  }
});

test("7. the auto-resume cycle limit stops the runner for manual resume", async () => {
  const env = makeEnv({ maxAutoResumeCycles: 1 });
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    const result = await drive(loop, { onWait: () => void answerActive(env, "proceed") });

    assert.equal(result.outcome, "READY_FOR_MANUAL_RESUME");
    assert.equal(result.stopReason, "max-cycles-reached");
    assert.equal(result.autoResumeCyclesUsed, 1);
    assert.ok(result.manualResumeInstruction?.startsWith("chaos:resume --run"));
    // Second decision is left answered (not consumed) for chaos:resume.
    assert.equal(env.runtimeClient.getDecision("DEC-test-2")!.state, "answered");
  } finally {
    env.cleanup();
  }
});

test("8. an invalid response stops the runner and leaves it resumable", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    const result = await drive(loop, {
      onWait: () => {
        if (answerActive(env, "proceed")) {
          // Corrupt the recorded response to an option that does not exist.
          const p = env.runtimeClient.runtime.paths.response("DEC-test-1");
          const doc = JSON.parse(fs.readFileSync(p, "utf8"));
          doc.selectedOptionId = "bogus";
          fs.writeFileSync(p, JSON.stringify(doc, null, 2));
        }
      },
    });

    assert.equal(result.outcome, "READY_FOR_MANUAL_RESUME");
    assert.equal(result.stopReason, "invalid-response");
    assert.equal(result.autoResumeCyclesUsed, 0);
  } finally {
    env.cleanup();
  }
});

test("9. agent process death leaves the session ready for manual resume", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    await stepToWait(loop); // waiting for a decision, adapter alive
    adapter.kill(); // the agent process dies
    answerActive(env, "proceed"); // human answers after the death

    const result = await drive(loop);
    assert.equal(result.outcome, "READY_FOR_MANUAL_RESUME");
    assert.equal(result.stopReason, "process-dead");
    assert.equal(result.consumedDecisionIds.length, 0);
    assert.ok(result.manualResumeInstruction?.includes("chaos:resume"));
  } finally {
    env.cleanup();
  }
});

test("10. a manual stop flag stops the runner safely and resumably", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    await stepToWait(loop);
    writeStopFlag(env, runner.runnerId);

    const result = await drive(loop);
    assert.equal(result.outcome, "READY_FOR_MANUAL_RESUME");
    assert.equal(result.stopReason, "manual-stop-flag");
  } finally {
    env.cleanup();
  }
});

test("11. a lock on a different change does not block an unrelated runner", async () => {
  const env = makeEnv();
  try {
    // Pre-lock change "A" with a pending decision owned by another run.
    const other = env.runtimeClient.beginCommand({ sourceCommand: "chaos:apply", changeId: "A" });
    env.runtimeClient.runtime.createDecision({
      commandRunId: other.commandRunId!,
      title: "other",
      context: "ctx",
      options: PROCEED_OPTIONS,
    });

    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "B", adapter, adapterName: "claude" });

    const result = await drive(loop, { onWait: () => void answerActiveForChange(env, "B", "proceed") });
    assert.equal(result.outcome, "COMPLETED");
  } finally {
    env.cleanup();
  }
});

test("12. a same-change lock conflict blocks the unsafe runner (adapter never starts)", async () => {
  const env = makeEnv();
  try {
    const owner = env.runtimeClient.beginCommand({ sourceCommand: "chaos:apply", changeId: "locked" });
    env.runtimeClient.runtime.createDecision({
      commandRunId: owner.commandRunId!,
      title: "owner",
      context: "ctx",
      options: PROCEED_OPTIONS,
    });

    const runner = makeRunner(env);
    // A different, incompatible command over the same locked change.
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:verify", changeId: "locked", adapter, adapterName: "claude" });

    const result = await drive(loop);
    assert.notEqual(result.outcome, "COMPLETED");
    assert.equal(result.stopReason, "lock-conflict");
    assert.equal(adapter.createdDecisionIds.length, 0); // adapter never launched
  } finally {
    env.cleanup();
  }
});

test("13. runner audit records the full lifecycle", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    await drive(loop, { onWait: () => void answerActive(env, "proceed") });

    const types = readAudit(env, runner.runnerId).map((e) => e.eventType);
    for (const expected of [
      "runner-started",
      "command-started",
      "decision-wait-started",
      "decision-answered",
      "auto-resume-started",
      "decision-consumed",
      "runner-completed",
    ]) {
      assert.ok(types.includes(expected), `audit missing ${expected}: ${types.join(",")}`);
    }
  } finally {
    env.cleanup();
  }
});

test("14. runner does not consume a decision without an acknowledgement", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }], { supportsAck: false });
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    const result = await drive(loop, { onWait: () => void answerActive(env, "proceed") });

    assert.equal(result.outcome, "COMPLETED");
    assert.deepEqual(result.consumedDecisionIds, []);
    assert.ok(result.forwardedDecisionIds.includes("DEC-test-1"));
    // The decision stays answered — chaos:resume / the command contract owns consumption.
    assert.equal(env.runtimeClient.getDecision("DEC-test-1")!.state, "answered");
  } finally {
    env.cleanup();
  }
});

test("15. the resume message references the capsule path, not large bodies", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }]);
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    await drive(loop, { onWait: () => void answerActive(env, "proceed") });

    const msg = adapter.receivedMessages[0]!;
    assert.ok(msg.includes("capsules/"), "message should reference the capsule path");
    assert.ok(msg.length < 2000, "message should stay compact");
    assert.ok(!msg.includes("contextCapsule"), "message must not inline capsule bodies");
  } finally {
    env.cleanup();
  }
});

test("adapter-cannot-resume: process adapter without resume support falls back", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env);
    // A mock that cannot be resumed (models the generic process adapter default).
    const adapter = mockAdapter(env, [DECIDE, { type: "complete" }], { supportsResume: false });
    const loop = runner.buildLoop({ sourceCommand: "chaos:apply", changeId: "c1", adapter, adapterName: "claude" });

    const result = await drive(loop, { onWait: () => void answerActive(env, "proceed") });
    assert.equal(result.outcome, "READY_FOR_MANUAL_RESUME");
    assert.equal(result.stopReason, "adapter-cannot-resume");
    assert.equal(result.consumedDecisionIds.length, 0);
  } finally {
    env.cleanup();
  }
});
