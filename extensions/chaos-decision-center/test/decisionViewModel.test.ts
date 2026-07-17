/** View model + status bar + resume instruction tests (cases 1-5, 10, 11, 14). */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProjection,
  buildResumeInstruction,
  computeExpiry,
  humanizeDuration,
  statusBarText,
} from "../src/decisionCenter/decisionViewModel.ts";
import { decisionFixture, sessionFixture, projectionInput } from "./helpers.ts";

test("computeExpiry + humanizeDuration", () => {
  const future = computeExpiry("2026-07-07T02:00:00.000Z", "2026-07-07T00:00:00.000Z");
  assert.equal(future.expired, false);
  assert.equal(future.label, "expires in 2h 0m");

  const past = computeExpiry("2026-07-06T23:00:00.000Z", "2026-07-07T00:00:00.000Z");
  assert.equal(past.expired, true);
  assert.match(past.label, /^expired /);

  assert.equal(humanizeDuration(90000), "1m");
  assert.equal(humanizeDuration(45000), "45s");
  assert.equal(humanizeDuration(3 * 86400000 + 2 * 3600000), "3d 2h");
});

test("pending decisions expose expiry; a past-expiry pending decision raises DECISION_EXPIRED", () => {
  // projectionInput now = 2026-07-07T00:00:00.000Z
  const future = buildProjection(
    projectionInput({ decisions: [decisionFixture({ decisionId: "DEC-f", expiresAt: "2026-07-07T05:00:00.000Z" })] }),
  );
  assert.ok(future.activeDecision!.expiry);
  assert.equal(future.activeDecision!.expiry!.expired, false);
  assert.ok(!future.health.some((h) => h.code === "DECISION_EXPIRED"));

  const past = buildProjection(
    projectionInput({ decisions: [decisionFixture({ decisionId: "DEC-x", expiresAt: "2026-07-06T23:00:00.000Z" })] }),
  );
  assert.equal(past.activeDecision!.expiry!.expired, true);
  assert.ok(past.health.some((h) => h.code === "DECISION_EXPIRED"));
});

test("a decision with no expiry has expiry:null and raises no expiry warning", () => {
  const p = buildProjection(projectionInput({ decisions: [decisionFixture({ expiresAt: null })] }));
  assert.equal(p.activeDecision!.expiry, null);
  assert.ok(!p.health.some((h) => h.code === "DECISION_EXPIRED"));
});

test("1. renders the no-pending-decisions state", () => {
  const p = buildProjection(projectionInput());
  assert.equal(p.activeDecision, null);
  assert.equal(p.queue.length, 0);
  assert.equal(p.status.state, "ready");
  assert.equal(p.status.text, "CHAOS: Ready");
});

test("2. renders one active decision (from active.json pointer)", () => {
  const d = decisionFixture();
  const p = buildProjection(
    projectionInput({
      decisions: [d],
      active: {
        schemaVersion: 1,
        state: "waiting-for-user-decision",
        activeDecisionId: d.decisionId,
        activeCommandRunId: d.commandRunId,
        activeChangeId: d.changeId,
        pendingDecisionIds: [d.decisionId],
        readyToResumeCommandRunIds: [],
        updatedAt: "2026-07-07T00:00:00.000Z",
        metadata: {},
      },
    }),
  );
  assert.ok(p.activeDecision);
  assert.equal(p.activeDecision!.decisionId, d.decisionId);
  assert.equal(p.status.state, "pending");
  assert.equal(p.status.text, "CHAOS: 1 decision pending");
  assert.equal(p.activeDecision!.decisionPath, `decisions/${d.decisionId}/decision.json`);
});

test("3. renders multiple pending decisions (active + queue)", () => {
  const a = decisionFixture({ decisionId: "DEC-a", commandRunId: "RUN-a" });
  const b = decisionFixture({ decisionId: "DEC-b", commandRunId: "RUN-b", changeId: "change-2" });
  const p = buildProjection(
    projectionInput({
      decisions: [a, b],
      active: {
        schemaVersion: 1,
        state: "waiting-for-user-decision",
        activeDecisionId: "DEC-a",
        activeCommandRunId: "RUN-a",
        activeChangeId: "change-1",
        pendingDecisionIds: ["DEC-a", "DEC-b"],
        readyToResumeCommandRunIds: [],
        updatedAt: "2026-07-07T00:00:00.000Z",
        metadata: {},
      },
    }),
  );
  assert.equal(p.activeDecision!.decisionId, "DEC-a");
  assert.equal(p.queue.length, 1);
  assert.equal(p.queue[0]!.decisionId, "DEC-b");
  assert.equal(p.status.state, "multiple");
  assert.equal(p.status.text, "CHAOS: 2 decisions pending");
});

test("4. recommended option is marked", () => {
  const p = buildProjection(projectionInput({ decisions: [decisionFixture()] }));
  const opts = p.activeDecision!.options;
  const rec = opts.filter((o) => o.recommended);
  assert.equal(rec.length, 1);
  assert.equal(rec[0]!.id, "strict-risk-compact");
});

test("5. required rationale is represented", () => {
  const withRationale = buildProjection(
    projectionInput({ decisions: [decisionFixture({ requiresRationale: true })] }),
  );
  assert.equal(withRationale.activeDecision!.requiresRationale, true);
  const without = buildProjection(projectionInput({ decisions: [decisionFixture()] }));
  assert.equal(without.activeDecision!.requiresRationale, false);
});

test("10. resume instruction is generated for run/change/latest", () => {
  const instruction = buildResumeInstruction(sessionFixture(), "capsules/RUN-test-1.json");
  assert.deepEqual(instruction.commands, [
    "chaos:resume --run RUN-test-1",
    "chaos:resume --change change-1",
    "chaos:resume --latest",
  ]);
  assert.match(instruction.planNote, /Planned Iteration 4/);
  assert.match(instruction.manualFallback, /capsules\/RUN-test-1\.json/);

  // No changeId -> only run + latest.
  const noChange = buildResumeInstruction(sessionFixture({ changeId: null }), null);
  assert.deepEqual(noChange.commands, ["chaos:resume --run RUN-test-1", "chaos:resume --latest"]);
});

test("11. status bar text for ready/pending/multiple/unavailable", () => {
  assert.equal(statusBarText("ready", 0), "CHAOS: Ready");
  assert.equal(statusBarText("pending", 1), "CHAOS: 1 decision pending");
  assert.equal(statusBarText("multiple", 3), "CHAOS: 3 decisions pending");
  assert.equal(statusBarText("unavailable", 0), "CHAOS: runtime unavailable");

  const unavailable = buildProjection(projectionInput({ rootExists: false }));
  assert.equal(unavailable.status.state, "unavailable");
  assert.equal(unavailable.health[0]!.code, "RUNTIME_ROOT_MISSING");
});

test("14. history list is capped by maxHistoryItems", () => {
  const decisions = Array.from({ length: 10 }, (_, i) =>
    decisionFixture({
      decisionId: `DEC-${i}`,
      state: "consumed",
      createdAt: `2026-07-0${(i % 9) + 1}T00:00:00.000Z`,
    }),
  );
  const p = buildProjection(projectionInput({ decisions, maxHistoryItems: 3 }));
  assert.equal(p.history.length, 3);
});

test("featured decision falls back to the latest pending when no active pointer", () => {
  const older = decisionFixture({ decisionId: "DEC-old", createdAt: "2026-07-05T00:00:00.000Z" });
  const newer = decisionFixture({ decisionId: "DEC-new", createdAt: "2026-07-06T00:00:00.000Z" });
  const p = buildProjection(projectionInput({ decisions: [older, newer] }));
  assert.equal(p.activeDecision!.decisionId, "DEC-new");
  assert.equal(p.queue.length, 1);
  assert.equal(p.queue[0]!.decisionId, "DEC-old");
  // pending = featured first, then the rest.
  assert.deepEqual(p.pending.map((d) => d.decisionId), ["DEC-new", "DEC-old"]);
});

test("changeGroups group decisions by change; pending-heavy changes first", () => {
  const a1 = decisionFixture({ decisionId: "A1", changeId: "change-a", state: "waiting", createdAt: "2026-07-06T01:00:00.000Z" });
  const a2 = decisionFixture({ decisionId: "A2", changeId: "change-a", state: "consumed", createdAt: "2026-07-06T02:00:00.000Z" });
  const b1 = decisionFixture({ decisionId: "B1", changeId: "change-b", state: "consumed", createdAt: "2026-07-06T03:00:00.000Z" });
  const p = buildProjection(projectionInput({ decisions: [b1, a1, a2] }));

  assert.equal(p.changeGroups.length, 2);
  // change-a has a pending decision, so it sorts first.
  assert.equal(p.changeGroups[0]!.changeId, "change-a");
  assert.equal(p.changeGroups[0]!.pendingCount, 1);
  assert.equal(p.changeGroups[0]!.totalCount, 2);
  // within a group, pending decisions come first.
  assert.equal(p.changeGroups[0]!.decisions[0]!.decisionId, "A1");
  assert.equal(p.changeGroups[0]!.decisions[0]!.isPending, true);
  assert.equal(p.changeGroups[1]!.changeId, "change-b");
  assert.equal(p.changeGroups[1]!.pendingCount, 0);
});

test("decisions without a change id land in the no-change group", () => {
  const d = decisionFixture({ decisionId: "N1", changeId: null, state: "waiting" });
  const p = buildProjection(projectionInput({ decisions: [d] }));
  assert.equal(p.changeGroups.length, 1);
  assert.equal(p.changeGroups[0]!.changeId, null);
  assert.equal(p.changeGroups[0]!.key, "__no-change__");
  assert.equal(p.changeGroups[0]!.label, "(no change)");
});

function responseFixture(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1 as const,
    decisionId: "DEC-test-1",
    commandRunId: "RUN-test-1",
    selectedOptionId: "strict-risk-compact" as string | null,
    selectedOptionIds: [] as string[],
    freeformValue: null as string | null,
    rationale: "good reason" as string | null,
    selectedBy: "ferrexd",
    selectedAt: "2026-07-08T10:00:00.000Z",
    source: "vscode-decision-center" as const,
    validatesAgainstDecisionHash: null,
    metadata: {},
    ...overrides,
  };
}

test("history surfaces the recorded answer (who / label / rationale)", () => {
  const d = decisionFixture({ decisionId: "DEC-h", state: "consumed" });
  const resp = responseFixture({ decisionId: "DEC-h", selectedOptionId: "strict-risk-compact" });
  const p = buildProjection(
    projectionInput({ decisions: [d], responseFor: (id) => (id === "DEC-h" ? resp : null) }),
  );
  assert.equal(p.history.length, 1);
  const a = p.history[0]!.answer;
  assert.ok(a);
  assert.equal(a!.selectedBy, "ferrexd");
  assert.deepEqual(a!.selectedLabels, ["Strict-risk compact"]);
  assert.equal(a!.rationale, "good reason");
  assert.equal(a!.selectedAt, "2026-07-08T10:00:00.000Z");
});

test("history answer resolves multi-select labels and freeform", () => {
  const dm = decisionFixture({ decisionId: "DEC-m", state: "consumed" });
  const pm = buildProjection(
    projectionInput({
      decisions: [dm],
      responseFor: () => responseFixture({ selectedOptionId: null, selectedOptionIds: ["full-strict", "stop"] }),
    }),
  );
  assert.deepEqual(pm.history[0]!.answer!.selectedLabels, ["Full strict", "Stop"]);

  const df = decisionFixture({ decisionId: "DEC-f", state: "consumed" });
  const pf = buildProjection(
    projectionInput({
      decisions: [df],
      responseFor: () => responseFixture({ selectedOptionId: null, freeformValue: "Server=db;Database=app;" }),
    }),
  );
  assert.equal(pf.history[0]!.answer!.freeformValue, "Server=db;Database=app;");
});

test("history answer is null when there is no response", () => {
  const d = decisionFixture({ decisionId: "DEC-n", state: "cancelled" });
  const p = buildProjection(projectionInput({ decisions: [d], responseFor: () => null }));
  assert.equal(p.history[0]!.answer, null);
});

test("ready-to-resume sessions are surfaced with capsule paths", () => {
  const p = buildProjection(
    projectionInput({
      sessions: [sessionFixture()],
      capsules: [
        {
          schemaVersion: 1,
          commandRunId: "RUN-test-1",
          sourceCommand: "chaos:propose",
          changeId: "change-1",
          state: "ready-to-resume",
          lastCompletedStep: null,
          nextStep: "continue",
          answeredDecisionIds: ["DEC-test-1"],
          consumedDecisionIds: [],
          requiredArtifacts: [],
          contextCapsule: { intent: "x", approvedScope: [], constraints: [], openRisks: [] },
          confidence: "MEDIUM",
          knowledgeType: "INFERENCE",
          createdAt: "2026-07-06T17:30:00.000Z",
          updatedAt: "2026-07-06T17:35:00.000Z",
          metadata: {},
        },
      ],
    }),
  );
  assert.equal(p.readyToResume.length, 1);
  assert.equal(p.readyToResume[0]!.capsulePath, "capsules/RUN-test-1.json");
});
