/** Probe 11: hook contracts + runtime hook-violation stream. */

import * as fs from "node:fs";
import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, rel, type ProbeContext } from "./probeContext.ts";

interface ViolationLine {
  timestamp?: string;
  severity?: string;
  hook?: string;
  violationType?: string;
  message?: string;
}

/** Our runtime-contract guard tags violations with a violationType + this hook. */
const IR_GUARD_HOOK = "chaos-interaction-runtime-guard";

export function hooksProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const violationsPath = ctx.config.hookViolationsPath;

  // Optional hook policy contract (advisory tooling; absence is not a failure).
  const policyDoc = path.join(
    ctx.config.repositoryRoot,
    ".claude",
    "hooks",
    "reference",
    "hook-runtime-policy.md",
  );
  if (!exists(policyDoc)) {
    out.push(
      finding({
        id: "IR-HOOK-POLICY-ABSENT",
        severity: "INFO",
        category: "hook",
        title: "Runtime hook policy doc not found",
        message: `No hook policy at ${rel(ctx, policyDoc)}; hooks are optional/advisory.`,
        evidence: [rel(ctx, policyDoc)],
      }),
    );
  }

  if (!exists(violationsPath)) {
    out.push(
      finding({
        id: "IR-HOOK-NOSTREAM",
        severity: "INFO",
        category: "hook",
        title: "No hook-violations stream",
        message: `No violations file at ${rel(ctx, violationsPath)}; nothing logged yet.`,
        evidence: [rel(ctx, violationsPath)],
      }),
    );
    return out;
  }

  let irGuard = 0;
  let irRecent = 0;
  let unparseable = 0;
  const recentCutoff = ctx.now.getTime() - ctx.config.staleDecisionAgeHours * 3_600_000;
  const raw = fs.readFileSync(violationsPath, "utf8").split(/\r?\n/).filter((l) => l.trim());
  for (const line of raw) {
    let v: ViolationLine;
    try {
      v = JSON.parse(line) as ViolationLine;
    } catch {
      unparseable += 1;
      continue;
    }
    const isGuard = v.hook === IR_GUARD_HOOK || typeof v.violationType === "string";
    if (!isGuard) continue;
    irGuard += 1;
    const t = v.timestamp ? new Date(v.timestamp).getTime() : NaN;
    if (Number.isFinite(t) && t >= recentCutoff) irRecent += 1;
  }

  if (unparseable > 0) {
    out.push(
      finding({
        id: "IR-HOOK-UNPARSEABLE",
        severity: "WARN",
        category: "hook",
        title: `${unparseable} unparseable hook-violation line(s)`,
        message: `${rel(ctx, violationsPath)} has lines that are not valid JSON.`,
        evidence: [rel(ctx, violationsPath)],
        affectedArtifacts: [rel(ctx, violationsPath)],
        recommendedActions: ["Inspect the stream; a writer may be emitting malformed lines."],
      }),
    );
  }

  if (irRecent > 0) {
    out.push(
      finding({
        id: "IR-HOOK-RECENT-VIOLATIONS",
        severity: "WARN",
        category: "hook",
        title: `${irRecent} recent interaction-runtime hook violation(s)`,
        message:
          `Interaction-runtime contract guard logged ${irRecent} violation(s) in the last ` +
          `${ctx.config.staleDecisionAgeHours}h (of ${irGuard} total).`,
        evidence: [rel(ctx, violationsPath)],
        affectedArtifacts: [rel(ctx, violationsPath)],
        recommendedActions: [
          "Review the violations; advisory mode only reports — it does not block.",
          "Recurring violations suggest a command is not honouring the runtime contract.",
        ],
        confidence: "HIGH",
      }),
    );
  } else {
    out.push(
      finding({
        id: "IR-HOOK-OK",
        severity: "OK",
        category: "hook",
        title: "No recent runtime hook violations",
        message: `Hook-violation stream present; ${irGuard} runtime-guard violation(s) total, none recent.`,
        evidence: [rel(ctx, violationsPath)],
      }),
    );
  }
  return out;
}
