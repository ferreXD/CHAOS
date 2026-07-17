/** Probe 8: runner lease liveness (Iteration 5 artifacts). */

import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, listJsonFiles, rel, safeReadJson, type ProbeContext } from "./probeContext.ts";
import { expiredLeaseCandidate } from "./todoHelpers.ts";

interface RunnerLease {
  runnerId: string;
  commandRunId: string | null;
  changeId: string | null;
  state: string;
  leaseExpiresAt: string;
  lastHeartbeatAt: string;
}

const ACTIVE_RUNNER_STATES = new Set([
  "created",
  "starting",
  "running",
  "waiting-for-decision",
  "auto-resuming",
]);

export function runnerLeaseProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const dir = ctx.config.runnersDir;
  if (!exists(dir)) {
    // No runner has ever run; nothing to check (Iteration 5 may be unused here).
    return [
      finding({
        id: "IR-RUNNER-NONE",
        severity: "INFO",
        category: "runner",
        title: "No runner leases present",
        message: "No live-runner leases directory; the live auto-resume runner has not been used.",
      }),
    ];
  }

  const leaseFiles = listJsonFiles(dir);
  let expired = 0;

  for (const file of leaseFiles) {
    const read = safeReadJson<RunnerLease>(file);
    if (!read.ok || !read.value) {
      ctx.counters.malformedArtifacts += 1;
      out.push(
        finding({
          id: `IR-RUNNER-MALFORMED-${path.basename(file)}`,
          severity: "ERROR",
          category: "runner",
          title: "Malformed runner lease",
          message: `${rel(ctx, file)} could not be parsed: ${read.ok ? "empty" : read.error}.`,
          evidence: [rel(ctx, file)],
          affectedArtifacts: [rel(ctx, file)],
          recommendedActions: ["Inspect the lease file; do not hand-edit."],
        }),
      );
      continue;
    }

    const lease = read.value;
    const expiresAt = new Date(lease.leaseExpiresAt).getTime();
    const pastGrace = ctx.now.getTime() > expiresAt + ctx.config.expiredRunnerLeaseGraceMs;
    const isActiveState = ACTIVE_RUNNER_STATES.has(lease.state);

    if (isActiveState && pastGrace) {
      // A runner that claims to be live but whose heartbeat lease has expired.
      expired += 1;
      const session = lease.commandRunId ? ctx.runtime.getSession(lease.commandRunId) : undefined;
      const sessionReady = session?.state === "ready-to-resume";
      out.push(
        finding({
          id: `IR-RUNNER-EXPIRED-${lease.runnerId}`,
          severity: "WARN",
          category: "runner",
          title: `Runner ${lease.runnerId} lease expired while "${lease.state}"`,
          message:
            `The lease heartbeat expired (last ${lease.lastHeartbeatAt}); the runner is not live. ` +
            (sessionReady
              ? "Its session is ready-to-resume — use chaos:resume."
              : "Auto-resume is not possible; the session must be resumed explicitly."),
          evidence: [rel(ctx, file), `leaseExpiresAt=${lease.leaseExpiresAt}`],
          affectedArtifacts: [lease.runnerId, ...(lease.commandRunId ? [lease.commandRunId] : [])],
          recommendedActions: [
            lease.commandRunId
              ? `Resume explicitly: chaos:resume --run ${lease.commandRunId}.`
              : "Review the expired lease.",
            "Diagnostics does not delete lease files or mutate runtime state.",
          ],
          todoCandidate: expiredLeaseCandidate(ctx, file, lease.commandRunId),
          confidence: "HIGH",
        }),
      );
    } else if (isActiveState) {
      out.push(
        finding({
          id: `IR-RUNNER-LIVE-${lease.runnerId}`,
          severity: "INFO",
          category: "runner",
          title: `Runner ${lease.runnerId} lease is live`,
          message: `Runner is live (state ${lease.state}); auto-resume is available for its session.`,
          evidence: [rel(ctx, file)],
          affectedArtifacts: [lease.runnerId],
        }),
      );
    }

    // Lease points to a missing session.
    if (lease.commandRunId && !ctx.runtime.getSession(lease.commandRunId)) {
      out.push(
        finding({
          id: `IR-RUNNER-NOSESSION-${lease.runnerId}`,
          severity: "WARN",
          category: "runner",
          title: `Runner ${lease.runnerId} references a missing session`,
          message: `Lease commandRunId ${lease.commandRunId} has no session file.`,
          evidence: [rel(ctx, file)],
          affectedArtifacts: [lease.runnerId, lease.commandRunId],
          recommendedActions: ["Inspect; the session may have been removed out-of-band."],
          confidence: "MEDIUM",
        }),
      );
    }
  }
  ctx.counters.expiredRunnerLeases = expired;

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-RUNNER-OK",
        severity: "OK",
        category: "runner",
        title: "Runner leases healthy",
        message: `Inspected ${leaseFiles.length} lease(s); no expired live runners.`,
      }),
    );
  }
  return out;
}
