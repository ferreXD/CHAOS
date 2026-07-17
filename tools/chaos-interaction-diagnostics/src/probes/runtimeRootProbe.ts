/** Probe 1: runtime root + required directories/pointer files. */

import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, rel, safeReadJson, type ProbeContext } from "./probeContext.ts";

export function runtimeRootProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const root = ctx.config.interactionsRoot;

  if (!exists(root)) {
    out.push(
      finding({
        id: "IR-ROOT-MISSING-001",
        severity: "BLOCKER",
        category: "runtime-root",
        title: "Interaction runtime root is missing",
        message: `The interaction runtime root does not exist at ${rel(ctx, root)}.`,
        evidence: [rel(ctx, root)],
        affectedArtifacts: [rel(ctx, root)],
        recommendedActions: [
          "Confirm the repository has the Iteration 0 interaction contracts under .chaos/interactions/.",
          "If this is a fresh clone, no runtime state exists yet — this is expected until a CHAOS command runs.",
        ],
        confidence: "HIGH",
      }),
    );
    return out; // nothing else is meaningful without a root
  }

  // sessions/decisions/capsules/runners are all created lazily by the runtime on
  // first write, so their absence in an initialized-but-unused runtime is benign
  // (INFO). The schema directory is load-bearing and is BLOCKER'd by schemaProbe.
  const lazyDirs: Array<[string, string]> = [
    ["sessions", ctx.paths.sessionsDir()],
    ["decisions", ctx.paths.decisionsDir()],
    ["capsules", ctx.paths.capsulesDir()],
    ["runners", ctx.config.runnersDir],
  ];
  for (const [name, dir] of lazyDirs) {
    if (!exists(dir)) {
      out.push(
        finding({
          id: `IR-ROOT-DIR-${name.toUpperCase()}`,
          severity: "INFO",
          category: "runtime-root",
          title: `Runtime subdirectory "${name}" not yet created`,
          message: `${rel(ctx, dir)} does not exist yet; the runtime creates it lazily on first write.`,
          evidence: [rel(ctx, dir)],
          affectedArtifacts: [rel(ctx, dir)],
          recommendedActions: ["No action; created on first use."],
          confidence: "HIGH",
        }),
      );
    }
  }

  // Derived pointer files: present + parseable when they exist.
  const pointers: Array<[string, string]> = [
    ["active.json", ctx.paths.active()],
    ["index.json", ctx.paths.index()],
    ["locks.json", ctx.paths.locks()],
  ];
  for (const [name, file] of pointers) {
    const read = safeReadJson<unknown>(file);
    if (!read.ok) {
      ctx.counters.malformedArtifacts += 1;
      out.push(
        finding({
          id: `IR-ROOT-POINTER-${name.replace(/\W/g, "").toUpperCase()}`,
          severity: "ERROR",
          category: "runtime-root",
          title: `Runtime pointer ${name} is malformed`,
          message: `${rel(ctx, file)} could not be parsed: ${read.error}`,
          evidence: [rel(ctx, file)],
          affectedArtifacts: [rel(ctx, file)],
          recommendedActions: [
            "Inspect the file; do not hand-edit runtime JSON.",
            "Runtime derives this pointer on next write; a stale/corrupt pointer is non-fatal but should be reviewed.",
          ],
          confidence: "HIGH",
        }),
      );
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        id: "IR-ROOT-OK",
        severity: "OK",
        category: "runtime-root",
        title: "Interaction runtime root is present",
        message: `Runtime root and required directories exist at ${rel(ctx, root)}.`,
        evidence: [rel(ctx, root)],
      }),
    );
  }
  return out;
}
