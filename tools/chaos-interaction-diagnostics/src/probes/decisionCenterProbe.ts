/** Probe 10: Decision Center extension presence (never launches VS Code). */

import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, rel, type ProbeContext } from "./probeContext.ts";

export function decisionCenterProbe(ctx: ProbeContext): HealthFinding[] {
  if (!ctx.config.checkDecisionCenterPackage) return [];
  const out: HealthFinding[] = [];
  const extDir = path.join(ctx.config.repositoryRoot, "extensions", "chaos-decision-center");

  if (!exists(extDir)) {
    return [
      finding({
        id: "IR-DC-ABSENT",
        severity: "INFO",
        category: "decision-center",
        title: "Decision Center extension not present",
        message: "The Decision Center extension is absent; humans can still answer via MCP/CLI.",
        evidence: [rel(ctx, extDir)],
      }),
    ];
  }

  const expected: Array<[string, string, "WARN" | "INFO"]> = [
    ["package.json", path.join(extDir, "package.json"), "WARN"],
    ["README.md", path.join(extDir, "README.md"), "INFO"],
    ["MANUAL-SMOKE-TEST.md", path.join(extDir, "MANUAL-SMOKE-TEST.md"), "INFO"],
  ];
  for (const [name, file, sev] of expected) {
    if (!exists(file)) {
      out.push(
        finding({
          id: `IR-DC-MISSING-${name.replace(/\W/g, "")}`,
          severity: sev,
          category: "decision-center",
          title: `Decision Center ${name} missing`,
          message: `Expected ${name} at ${rel(ctx, file)}.`,
          evidence: [rel(ctx, file)],
          affectedArtifacts: [rel(ctx, file)],
          confidence: "HIGH",
        }),
      );
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-DC-OK",
        severity: "OK",
        category: "decision-center",
        title: "Decision Center extension present",
        message: "Extension package, README, and manual smoke doc are present (VS Code host not launched).",
        evidence: [rel(ctx, extDir)],
      }),
    );
  }
  return out;
}
