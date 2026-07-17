/** Probe 6: lock health (uses the runtime's own stale-lock analysis). */

import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { hoursSince, rel, safeList, type ProbeContext } from "./probeContext.ts";
import { staleLockCandidate } from "./todoHelpers.ts";

export function lockProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const locks = safeList(() => ctx.runtime.listLocks());
  const active = locks.filter((l) => l.state === "active");

  let stale = 0;
  for (const lock of active) {
    const age = hoursSince(ctx.now, lock.createdAt);
    const agedOut = age !== null && age >= ctx.config.staleLockAgeHours;

    if (lock.stale || agedOut) {
      stale += 1;
      const reason = lock.staleReason ?? (agedOut ? `held > ${ctx.config.staleLockAgeHours}h` : "stale");
      // A lock whose owning session is gone/terminal is more serious (it can block
      // unrelated work) than one that is merely old but still owned by live work.
      const severity = lock.stale ? "WARN" : "WARN";
      out.push(
        finding({
          id: `IR-LOCK-STALE-${lock.lockId}`,
          severity,
          category: "lock",
          title: `Stale lock for change ${lock.changeId ?? "(none)"}`,
          message: `Lock ${lock.lockId} (owned by ${lock.lockedByCommand} / ${lock.lockedByCommandRunId}) appears stale: ${reason}.`,
          evidence: [rel(ctx, ctx.paths.locks()), reason],
          affectedArtifacts: [lock.lockId],
          recommendedActions: [
            `Inspect the lock; resume via chaos:resume --run ${lock.lockedByCommandRunId} or cancel the obsolete session.`,
            "Diagnostics never deletes locks automatically.",
          ],
          todoCandidate: staleLockCandidate(ctx, lock.changeId, lock.lockedByCommandRunId, reason),
          confidence: "MEDIUM",
        }),
      );
    }
  }
  ctx.counters.staleLocks = stale;

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-LOCK-OK",
        severity: "OK",
        category: "lock",
        title: "No stale locks",
        message: `Inspected ${active.length} active lock(s); none stale.`,
      }),
    );
  }
  return out;
}
