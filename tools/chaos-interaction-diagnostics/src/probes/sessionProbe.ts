/** Probe 5: session-state health. */

import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { rel, safeList, type ProbeContext } from "./probeContext.ts";
import { missingCapsuleCandidate } from "./todoHelpers.ts";

const TERMINAL = new Set(["completed", "cancelled", "expired", "failed"]);

export function sessionProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const sessions = safeList(() => ctx.runtime.store.sessions.list());

  const readyToResume = sessions.filter((s) => s.state === "ready-to-resume");
  ctx.counters.readyToResumeSessions = readyToResume.length;

  if (readyToResume.length > 0) {
    out.push(
      finding({
        id: "IR-SESSION-READY",
        severity: "INFO",
        category: "session",
        title: `${readyToResume.length} session(s) ready to resume`,
        message: readyToResume
          .map((s) => `${s.commandRunId} (${s.sourceCommand})`)
          .join(", "),
        evidence: readyToResume.map((s) => rel(ctx, ctx.paths.session(s.commandRunId))),
        affectedArtifacts: readyToResume.map((s) => s.commandRunId),
        recommendedActions: readyToResume.map((s) => `chaos:resume --run ${s.commandRunId}`),
        confidence: "HIGH",
      }),
    );
  }

  for (const s of sessions) {
    // waiting-for-decision without an active decision.
    if (s.state === "waiting-for-decision" && s.activeDecisionIds.length === 0) {
      out.push(
        finding({
          id: `IR-SESSION-WAITING-NODEC-${s.commandRunId}`,
          severity: "WARN",
          category: "session",
          title: `Session ${s.commandRunId} waits but has no active decision`,
          message: "State is waiting-for-decision yet activeDecisionIds is empty.",
          evidence: [rel(ctx, ctx.paths.session(s.commandRunId))],
          affectedArtifacts: [s.commandRunId],
          recommendedActions: ["Inspect; the session may be wedged. chaos:resume or cancel."],
          confidence: "MEDIUM",
        }),
      );
    }
    // ready-to-resume without a capsule.
    if (s.state === "ready-to-resume") {
      const capsule = ctx.runtime.getResumeCapsule(s.commandRunId);
      if (!capsule) {
        out.push(
          finding({
            id: `IR-SESSION-READY-NOCAPSULE-${s.commandRunId}`,
            severity: "WARN",
            category: "session",
            title: `Ready-to-resume session ${s.commandRunId} has no capsule`,
            message: "Resume relies on a capsule; none exists for this session.",
            evidence: [rel(ctx, ctx.paths.session(s.commandRunId))],
            affectedArtifacts: [s.commandRunId],
            recommendedActions: ["Recreate the capsule, or inspect why it is missing."],
            todoCandidate: missingCapsuleCandidate(ctx, s.commandRunId),
            confidence: "HIGH",
          }),
        );
      }
    }
    // terminal session still holding an active lock.
    if (TERMINAL.has(s.state) && s.lockIds.length > 0) {
      const activeLocks = safeList(() => ctx.runtime.listLocks()).filter(
        (l) => l.state === "active" && l.lockedByCommandRunId === s.commandRunId,
      );
      if (activeLocks.length > 0) {
        out.push(
          finding({
            id: `IR-SESSION-TERMINAL-LOCK-${s.commandRunId}`,
            severity: "WARN",
            category: "session",
            title: `Terminal session ${s.commandRunId} still holds a lock`,
            message: `Session is ${s.state} but still owns active lock(s): ${activeLocks.map((l) => l.lockId).join(", ")}.`,
            evidence: [rel(ctx, ctx.paths.locks())],
            affectedArtifacts: activeLocks.map((l) => l.lockId),
            recommendedActions: ["The lock should have been released; inspect. Do not auto-delete."],
            confidence: "MEDIUM",
          }),
        );
      }
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-SESSION-OK",
        severity: "OK",
        category: "session",
        title: "No session anomalies",
        message: `Inspected ${sessions.length} session(s); no wedged/ready-without-capsule/terminal-lock issues.`,
      }),
    );
  }
  return out;
}
