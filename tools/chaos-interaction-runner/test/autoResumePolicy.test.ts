/** Pure auto-resume policy decisions. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateAutoResume, type AutoResumePolicyInput } from "../src/runner/autoResumePolicy.ts";

const base: AutoResumePolicyInput = {
  cyclesUsed: 0,
  maxCycles: 3,
  responseValid: true,
  rationaleSatisfied: true,
  allowAutoResumeWhenRunnerActive: true,
  runnerAlive: true,
  adapterSupportsResume: true,
};

test("auto-resumes when all conditions hold", () => {
  assert.deepEqual(evaluateAutoResume(base), { action: "auto-resume" });
});

test("stops at the cycle limit", () => {
  const r = evaluateAutoResume({ ...base, cyclesUsed: 3, maxCycles: 3 });
  assert.deepEqual(r, { action: "stop-manual", reason: "max-cycles-reached" });
});

test("stops on invalid response", () => {
  const r = evaluateAutoResume({ ...base, responseValid: false });
  assert.deepEqual(r, { action: "stop-manual", reason: "invalid-response" });
});

test("stops on missing rationale", () => {
  const r = evaluateAutoResume({ ...base, rationaleSatisfied: false });
  assert.deepEqual(r, { action: "stop-manual", reason: "missing-rationale" });
});

test("stops when the runner is not alive", () => {
  const r = evaluateAutoResume({ ...base, runnerAlive: false });
  assert.deepEqual(r, { action: "stop-manual", reason: "process-dead" });
});

test("stops when the adapter cannot resume", () => {
  const r = evaluateAutoResume({ ...base, adapterSupportsResume: false });
  assert.deepEqual(r, { action: "stop-manual", reason: "adapter-cannot-resume" });
});

test("stops when auto-resume is disabled", () => {
  const r = evaluateAutoResume({ ...base, allowAutoResumeWhenRunnerActive: false });
  assert.deepEqual(r, { action: "stop-manual", reason: "auto-resume-disabled" });
});

test("liveness/adapter checks take precedence over cycle limit", () => {
  const r = evaluateAutoResume({ ...base, runnerAlive: false, cyclesUsed: 99, maxCycles: 3 });
  assert.equal(r.action, "stop-manual");
  assert.equal((r as { reason: string }).reason, "process-dead");
});
