/**
 * Loop hardening: when the live agent consumes the answered decision itself, the
 * runner must NOT double-consume (which would throw answered->consumed) — it
 * treats an already-consumed decision as ack-satisfied and finishes cleanly.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeEnv, makeRunner, answerActive, drive, PROCEED_OPTIONS, readAudit } from "./helpers.ts";
import type {
  AgentAck,
  AgentOutcome,
  AgentSessionAdapter,
  RunnerStartInput,
} from "../src/runner/commandProcess.ts";
import type { AgentResumeInput } from "../src/runner/transcriptAdapter.ts";
import type { InteractionRuntime } from "../src/runtime.ts";

/** A live agent that creates one decision and consumes it itself on resume. */
class SelfConsumingAdapter implements AgentSessionAdapter {
  readonly kind = "self-consume";
  private readonly runtime: InteractionRuntime;
  private runId = "";
  private done = false;
  constructor(runtime: InteractionRuntime) {
    this.runtime = runtime;
  }
  supportsResume(): boolean {
    return true;
  }
  async start(input: RunnerStartInput): Promise<void> {
    this.runId = input.commandRunId;
    this.runtime.createDecision({
      commandRunId: this.runId,
      title: "Choose execution profile",
      context: "ctx",
      options: PROCEED_OPTIONS,
      nextStep: "continue",
    });
  }
  async send(input: AgentResumeInput): Promise<AgentAck> {
    this.runtime.markDecisionConsumed(input.decisionId); // agent consumes itself
    this.done = true;
    return { acknowledgedDecisionId: input.decisionId };
  }
  async stop(): Promise<void> {
    this.done = true;
  }
  async isAlive(): Promise<boolean> {
    return !this.done;
  }
  outcome(): AgentOutcome | null {
    return this.done ? "completed" : null;
  }
}

test("runner is idempotent when the live agent consumes the decision itself", async () => {
  const env = makeEnv();
  try {
    const runner = makeRunner(env, "RUNNER-idem-1");
    const adapter = new SelfConsumingAdapter(env.runtimeClient.runtime);
    const loop = runner.buildLoop({
      sourceCommand: "chaos:propose",
      changeId: "change-1",
      adapter,
      adapterName: "claude",
    });

    const result = await drive(loop, { onWait: () => void answerActive(env) });

    assert.equal(result.outcome, "COMPLETED");
    assert.ok(result.consumedDecisionIds.includes("DEC-test-1"));

    const audit = readAudit(env, "RUNNER-idem-1");
    assert.ok(
      audit.some((e) => e["eventType"] === "decision-consumed" && String(e["message"]).includes("idempotent")),
      "expected an idempotent decision-consumed audit event",
    );
  } finally {
    env.cleanup();
  }
});
