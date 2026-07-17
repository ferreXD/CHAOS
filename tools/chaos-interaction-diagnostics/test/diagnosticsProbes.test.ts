/** Probe behaviour + read-only guarantees (Iteration 7 tests 1–13, 21–22). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { generateHealthReport } from "../src/probes/registry.ts";
import { planRepairs } from "../src/repair/repairPlanner.ts";
import {
  makeEnv,
  nowPlusHours,
  seedPendingDecision,
  seedReadyToResume,
  writeRunnerLease,
  type DiagEnv,
} from "./helpers.ts";

const gen = (env: DiagEnv, hours = 1) => generateHealthReport(env.config, { now: nowPlusHours(hours) });
const has = (report: { findings: Array<{ id: string }> }, prefix: string) =>
  report.findings.some((f) => f.id.startsWith(prefix));

test("1. healthy empty runtime is healthy", () => {
  const env = makeEnv();
  try {
    const report = gen(env);
    assert.equal(report.overallStatus, "healthy");
    assert.equal(report.summary.blockingFindings, 0);
    assert.equal(report.summary.pendingDecisions, 0);
  } finally {
    env.cleanup();
  }
});

test("2. missing runtime root is a BLOCKER", () => {
  const env = makeEnv();
  try {
    env.config.interactionsRoot = path.join(env.repoRoot, "nope", "interactions");
    const report = gen(env);
    assert.equal(report.overallStatus, "blocked");
    assert.ok(has(report, "IR-ROOT-MISSING"));
  } finally {
    env.cleanup();
  }
});

test("3. missing schema directory is reported", () => {
  const env = makeEnv();
  try {
    env.config.schemaDir = path.join(env.repoRoot, "no-schema");
    const report = gen(env);
    assert.ok(has(report, "IR-SCHEMA-DIR-MISSING"));
  } finally {
    env.cleanup();
  }
});

test("4. malformed session JSON is reported, not crashed", () => {
  const env = makeEnv();
  try {
    const { runId } = seedPendingDecision(env);
    fs.writeFileSync(env.runtime.paths.session(runId), "{ not json", "utf8");
    const report = gen(env);
    assert.ok(report.summary.malformedArtifacts >= 1);
    assert.ok(has(report, "IR-ARTIFACT-MALFORMED"));
  } finally {
    env.cleanup();
  }
});

test("5. pending decision is counted", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = gen(env);
    assert.equal(report.summary.pendingDecisions, 1);
    assert.ok(has(report, "IR-DECISION-PENDING"));
  } finally {
    env.cleanup();
  }
});

test("6. ready-to-resume session is counted", () => {
  const env = makeEnv();
  try {
    seedReadyToResume(env);
    const report = gen(env);
    assert.equal(report.summary.readyToResumeSessions, 1);
    assert.ok(has(report, "IR-SESSION-READY"));
  } finally {
    env.cleanup();
  }
});

test("7. aged lock is detected as stale", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env); // creates an active lock at START
    const report = gen(env, 48); // 48h later, past 24h threshold
    assert.ok(report.summary.staleLocks >= 1);
    assert.ok(has(report, "IR-LOCK-STALE"));
  } finally {
    env.cleanup();
  }
});

test("8. completed session with a lingering lock is detected", () => {
  const env = makeEnv();
  try {
    const begin = env.runtime.beginCommand({ sourceCommand: "chaos:apply", changeId: "c1" });
    env.runtime.completeCommand(begin.commandRunId!);
    // Manually re-introduce an active lock owned by the completed session.
    const locksPath = env.runtime.paths.locks();
    fs.writeFileSync(
      locksPath,
      JSON.stringify(
        {
          schemaVersion: 1,
          locks: [
            {
              schemaVersion: 1,
              lockId: "LOCK-lingering",
              changeId: "c1",
              lockedByCommandRunId: begin.commandRunId,
              lockedByCommand: "chaos:apply",
              reason: "waiting-for-user-decision",
              state: "active",
              blockingDecisionIds: [],
              compatibleCommands: [],
              createdAt: "2026-07-07T09:00:00.000Z",
              expiresAt: null,
              releasedAt: null,
              metadata: {},
            },
          ],
          updatedAt: "2026-07-07T09:00:00.000Z",
        },
        null,
        2,
      ),
      "utf8",
    );
    const report = gen(env);
    assert.ok(has(report, "IR-SESSION-TERMINAL-LOCK") || has(report, "IR-LOCK-STALE"));
  } finally {
    env.cleanup();
  }
});

test("9. missing capsule for a ready session is detected", () => {
  const env = makeEnv();
  try {
    const { runId } = seedReadyToResume(env);
    fs.rmSync(env.runtime.paths.capsule(runId), { force: true });
    const report = gen(env);
    assert.ok(has(report, "IR-SESSION-READY-NOCAPSULE"));
    assert.ok(report.todoCandidates.some((c) => c.title.includes("resume capsule")));
  } finally {
    env.cleanup();
  }
});

test("10. capsule with a missing required artifact is detected", () => {
  const env = makeEnv();
  try {
    const { runId } = seedReadyToResume(env);
    const capsulePath = env.runtime.paths.capsule(runId);
    const capsule = JSON.parse(fs.readFileSync(capsulePath, "utf8"));
    capsule.requiredArtifacts = ["does/not/exist.md"];
    fs.writeFileSync(capsulePath, JSON.stringify(capsule, null, 2), "utf8");
    const report = gen(env);
    assert.ok(has(report, "IR-CAPSULE-ARTIFACT-MISSING"));
  } finally {
    env.cleanup();
  }
});

test("11. expired runner lease is detected", () => {
  const env = makeEnv();
  try {
    const { runId } = seedReadyToResume(env);
    writeRunnerLease(env, {
      schemaVersion: 1,
      runnerId: "RUNNER-dead",
      commandRunId: runId,
      changeId: "c1",
      sourceCommand: "chaos:apply",
      processId: 999,
      state: "running",
      startedAt: "2026-07-07T09:00:00.000Z",
      lastHeartbeatAt: "2026-07-07T09:00:00.000Z",
      leaseExpiresAt: "2026-07-07T09:05:00.000Z",
      autoResumeCyclesUsed: 0,
      maxAutoResumeCycles: 3,
      metadata: {},
    });
    const report = gen(env, 2); // 2h later — well past lease expiry + grace
    assert.equal(report.summary.expiredRunnerLeases, 1);
    assert.ok(has(report, "IR-RUNNER-EXPIRED"));
  } finally {
    env.cleanup();
  }
});

test("12. long-pending decision past threshold warns + emits a candidate", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = gen(env, 25); // 25h > 24h threshold
    assert.ok(has(report, "IR-DECISION-STALE"));
    assert.ok(report.todoCandidates.some((c) => c.sourceKind === "unresolved-decision"));
  } finally {
    env.cleanup();
  }
});

test("13. Todo Candidates are emitted for runtime issues", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = gen(env, 48); // stale lock + stale decision
    assert.ok(report.todoCandidates.length >= 1);
    // Every candidate is promotable: has a source artifact + next action.
    for (const c of report.todoCandidates) {
      assert.ok(c.sourceArtifactPath.length > 0);
      assert.ok(c.nextAction.length > 0);
    }
  } finally {
    env.cleanup();
  }
});

test("21. no destructive repair occurs by default (recommendations only)", () => {
  const env = makeEnv();
  try {
    seedPendingDecision(env);
    const report = gen(env, 48);
    const repairs = planRepairs(report);
    assert.ok(repairs.length >= 1);
    for (const r of repairs) assert.equal(r.destructive, false);
  } finally {
    env.cleanup();
  }
});

test("command-contract probe reports disabled-by-config when commands.enabled is false", () => {
  const env = makeEnv({ commandsEnabled: false });
  try {
    const report = gen(env);
    assert.ok(has(report, "IR-CMD-INTEGRATION-DISABLED"));
    // Opt-out is INFO (not a gap) and does not degrade overall health on its own.
    const disabled = report.findings.find((f) => f.id === "IR-CMD-INTEGRATION-DISABLED");
    assert.equal(disabled?.severity, "INFO");
    assert.ok(!has(report, "IR-CMD-INTEGRATION-PARTIAL"));
    assert.ok(!has(report, "IR-CMD-INTEGRATION-OK"));
  } finally {
    env.cleanup();
  }
});

test("22. existing valid artifacts are not modified by a diagnostics run", () => {
  const env = makeEnv();
  try {
    const { runId } = seedReadyToResume(env);
    const sessionPath = env.runtime.paths.session(runId);
    const before = fs.readFileSync(sessionPath, "utf8");
    const snapshot = fs.readdirSync(env.interactionsRoot, { recursive: true }).toString();

    gen(env);
    gen(env, 2);

    assert.equal(fs.readFileSync(sessionPath, "utf8"), before);
    assert.equal(fs.readdirSync(env.interactionsRoot, { recursive: true }).toString(), snapshot);
  } finally {
    env.cleanup();
  }
});
