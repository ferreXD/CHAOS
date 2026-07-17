/** Probe 9: MCP package presence (never requires the server to be running). */

import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, rel, type ProbeContext } from "./probeContext.ts";

export function mcpProbe(ctx: ProbeContext): HealthFinding[] {
  if (!ctx.config.checkMcpPackage) return [];
  const out: HealthFinding[] = [];
  const pkgDir = path.join(ctx.config.repositoryRoot, "tools", "chaos-interaction-mcp");

  if (!exists(pkgDir)) {
    return [
      finding({
        id: "IR-MCP-ABSENT",
        severity: "INFO",
        category: "mcp",
        title: "MCP package not present",
        message: "The interaction MCP server package is absent; MCP is optional for diagnostics.",
        evidence: [rel(ctx, pkgDir)],
      }),
    ];
  }

  const expectedFiles: Array<[string, string, "WARN" | "INFO"]> = [
    ["package.json", path.join(pkgDir, "package.json"), "WARN"],
    ["README.md", path.join(pkgDir, "README.md"), "INFO"],
    ["CLI entry", path.join(pkgDir, "src", "cli", "chaos-interaction-mcp.ts"), "WARN"],
    ["config example", path.join(pkgDir, "examples", "mcp.example.json"), "INFO"],
  ];
  for (const [name, file, sev] of expectedFiles) {
    if (!exists(file)) {
      out.push(
        finding({
          id: `IR-MCP-MISSING-${name.replace(/\W/g, "")}`,
          severity: sev,
          category: "mcp",
          title: `MCP ${name} missing`,
          message: `Expected ${name} at ${rel(ctx, file)}.`,
          evidence: [rel(ctx, file)],
          affectedArtifacts: [rel(ctx, file)],
          recommendedActions: ["Confirm the Iteration 2 MCP package is intact."],
          confidence: "HIGH",
        }),
      );
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-MCP-OK",
        severity: "OK",
        category: "mcp",
        title: "MCP package looks usable",
        message: "MCP package, CLI entry, README, and config example are present (server not started).",
        evidence: [rel(ctx, pkgDir)],
      }),
    );
  }
  return out;
}
