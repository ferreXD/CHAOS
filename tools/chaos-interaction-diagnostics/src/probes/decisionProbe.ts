/** Probe 4: decision lifecycle health. */

import type { Decision } from "../runtime.ts";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { hoursSince, rel, safeList, type ProbeContext } from "./probeContext.ts";
import { oldPendingDecisionCandidate } from "./todoHelpers.ts";

export function decisionProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const decisions = safeList(() => ctx.runtime.store.decisions.list());

  const pending = decisions.filter((d) => d.state === "waiting");
  ctx.counters.pendingDecisions = pending.length;

  if (pending.length > 0) {
    out.push(
      finding({
        id: "IR-DECISION-PENDING",
        severity: "WARN",
        category: "decision",
        title: `${pending.length} pending decision(s) await a human`,
        message:
          `Pending: ` +
          pending
            .map((d) => `${d.decisionId} (${d.sourceCommand}${d.changeId ? `/${d.changeId}` : ""})`)
            .join(", "),
        evidence: pending.map((d) => rel(ctx, ctx.paths.decision(d.decisionId))),
        affectedArtifacts: pending.map((d) => d.decisionId),
        recommendedActions: ["Answer in the Decision Center; then chaos:resume the owning session."],
        confidence: "HIGH",
      }),
    );
  }

  // Long-pending decisions past the staleness threshold.
  for (const d of pending) {
    const age = hoursSince(ctx.now, d.createdAt);
    if (age !== null && age >= ctx.config.staleDecisionAgeHours) {
      out.push(
        finding({
          id: `IR-DECISION-STALE-${d.decisionId}`,
          severity: "WARN",
          category: "decision",
          title: `Decision ${d.decisionId} pending ~${Math.round(age)}h`,
          message: `Decision has been waiting longer than ${ctx.config.staleDecisionAgeHours}h.`,
          evidence: [rel(ctx, ctx.paths.decision(d.decisionId)), `age≈${Math.round(age)}h`],
          affectedArtifacts: [d.decisionId],
          recommendedActions: ["Answer or cancel; long-pending decisions block the change."],
          todoCandidate: oldPendingDecisionCandidate(ctx, d.decisionId, age),
          confidence: "HIGH",
        }),
      );
    }
  }

  // Multiple concurrent pending decisions for the same run (blocks resolution).
  const byRun = new Map<string, Decision[]>();
  for (const d of pending) {
    const list = byRun.get(d.commandRunId) ?? [];
    list.push(d);
    byRun.set(d.commandRunId, list);
  }
  for (const [runId, list] of byRun) {
    if (list.length > 1) {
      out.push(
        finding({
          id: `IR-DECISION-MULTIPLE-${runId}`,
          severity: "WARN",
          category: "decision",
          title: `Run ${runId} has ${list.length} concurrent pending decisions`,
          message: "Multiple active decisions for one run must be resolved before it can proceed.",
          evidence: list.map((d) => d.decisionId),
          affectedArtifacts: [runId],
          recommendedActions: ["Answer each decision; the runtime blocks the run until all are resolved."],
        }),
      );
    }
  }

  // Structural anomalies across all decisions.
  for (const d of decisions) {
    if (!ctx.runtime.getSession(d.commandRunId)) {
      out.push(
        finding({
          id: `IR-DECISION-ORPHAN-${d.decisionId}`,
          severity: "WARN",
          category: "decision",
          title: `Decision ${d.decisionId} has no owning session`,
          message: `Its commandRunId ${d.commandRunId} has no session file.`,
          evidence: [rel(ctx, ctx.paths.decision(d.decisionId))],
          affectedArtifacts: [d.decisionId, d.commandRunId],
          recommendedActions: ["Inspect; the session may have been removed out-of-band."],
          confidence: "MEDIUM",
        }),
      );
    }
    if (d.state === "answered") {
      const session = ctx.runtime.getSession(d.commandRunId);
      if (session && session.state === "completed") {
        out.push(
          finding({
            id: `IR-DECISION-UNCONSUMED-${d.decisionId}`,
            severity: "WARN",
            category: "decision",
            title: `Answered decision ${d.decisionId} was never consumed`,
            message: "The owning command completed but this answered decision is not marked consumed.",
            evidence: [rel(ctx, ctx.paths.decision(d.decisionId))],
            affectedArtifacts: [d.decisionId],
            recommendedActions: ["Verify the command incorporated the answer; mark consumed via its contract."],
            confidence: "MEDIUM",
          }),
        );
      }
    }
    if (d.state === "consumed" && !ctx.runtime.store.decisions.readResponse(d.decisionId)) {
      out.push(
        finding({
          id: `IR-DECISION-CONSUMED-NORESP-${d.decisionId}`,
          severity: "WARN",
          category: "decision",
          title: `Consumed decision ${d.decisionId} has no response`,
          message: "A consumed decision should retain its response artifact for audit.",
          evidence: [rel(ctx, ctx.paths.response(d.decisionId))],
          affectedArtifacts: [d.decisionId],
          recommendedActions: ["Inspect the decision directory; the response should not be missing."],
          confidence: "MEDIUM",
        }),
      );
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-DECISION-OK",
        severity: "OK",
        category: "decision",
        title: "No decision anomalies",
        message: "No pending, stale, orphaned, or unconsumed decisions detected.",
      }),
    );
  }
  return out;
}
