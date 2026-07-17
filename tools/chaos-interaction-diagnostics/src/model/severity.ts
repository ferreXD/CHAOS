/** Health severity vocabulary + rollup helpers. */

export type HealthSeverity = "OK" | "INFO" | "WARN" | "ERROR" | "BLOCKER";

export const SEVERITY_ORDER: Record<HealthSeverity, number> = {
  OK: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  BLOCKER: 4,
};

export function maxSeverity(a: HealthSeverity, b: HealthSeverity): HealthSeverity {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

export type OverallStatus = "healthy" | "degraded" | "blocked" | "unknown";

/**
 * Roll a set of finding severities up into an overall status.
 * - any BLOCKER  -> blocked
 * - any ERROR/WARN -> degraded
 * - only OK/INFO -> healthy
 * - empty        -> unknown (nothing was probed)
 */
export function rollUpStatus(severities: HealthSeverity[]): OverallStatus {
  if (severities.length === 0) return "unknown";
  let worst: HealthSeverity = "OK";
  for (const s of severities) worst = maxSeverity(worst, s);
  if (worst === "BLOCKER") return "blocked";
  if (worst === "ERROR" || worst === "WARN") return "degraded";
  return "healthy";
}
