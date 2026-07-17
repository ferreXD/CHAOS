/** Pure stop-condition predicates + response validation. */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Decision, DecisionResponse } from "../src/runtime.ts";
import {
  validateResponse,
  checkManualStopFlag,
  checkLeaseLive,
  stopForClosedDecision,
} from "../src/runner/stopConditions.ts";
import type { RunnerLease } from "../src/runtime/sessionLease.ts";

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    decisionId: "DEC-1",
    options: [
      { id: "proceed", label: "Proceed" },
      { id: "stop", label: "Stop" },
    ],
    requiresRationale: false,
    ...overrides,
  } as Decision;
}

function response(overrides: Partial<DecisionResponse> = {}): DecisionResponse {
  return {
    decisionId: "DEC-1",
    selectedOptionId: "proceed",
    rationale: null,
    ...overrides,
  } as DecisionResponse;
}

test("validateResponse accepts a valid selection", () => {
  assert.deepEqual(validateResponse(decision(), response()), { valid: true });
});

test("validateResponse rejects an unknown option", () => {
  const r = validateResponse(decision(), response({ selectedOptionId: "bogus" }));
  assert.equal(r.valid, false);
  assert.equal(r.reason, "invalid-response");
});

test("validateResponse rejects a missing response", () => {
  const r = validateResponse(decision(), undefined);
  assert.equal(r.valid, false);
  assert.equal(r.reason, "invalid-response");
});

test("validateResponse enforces required rationale", () => {
  const r = validateResponse(decision({ requiresRationale: true }), response({ rationale: "  " }));
  assert.equal(r.valid, false);
  assert.equal(r.reason, "missing-rationale");
});

test("checkManualStopFlag maps presence to a resumable stop", () => {
  assert.equal(checkManualStopFlag(false), null);
  const cond = checkManualStopFlag(true)!;
  assert.equal(cond.reason, "manual-stop-flag");
  assert.equal(cond.outcome, "READY_FOR_MANUAL_RESUME");
});

test("checkLeaseLive flags an expired lease", () => {
  const lease = { leaseExpiresAt: "2026-07-07T09:00:05.000Z" } as RunnerLease;
  assert.equal(checkLeaseLive(lease, "2026-07-07T09:00:01.000Z"), null); // still live
  const cond = checkLeaseLive(lease, "2026-07-07T09:00:10.000Z")!;
  assert.equal(cond.reason, "lease-expired");
  assert.equal(cond.outcome, "READY_FOR_MANUAL_RESUME");
  assert.equal(checkLeaseLive(null, "2026-07-07T09:00:10.000Z"), null);
});

test("stopForClosedDecision maps each closed reason", () => {
  assert.equal(stopForClosedDecision("cancelled").reason, "decision-cancelled");
  assert.equal(stopForClosedDecision("expired").reason, "decision-expired");
  assert.equal(stopForClosedDecision("superseded").reason, "decision-superseded");
});
