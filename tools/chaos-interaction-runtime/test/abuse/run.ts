/**
 * EA-X4 abuse suite — runnable driver.
 *
 *   node test/abuse/run.ts [--runs N] [--out <abuse-run.json>]
 *
 * Runs N kill/resume abuse iterations (default 20; runs 15..N are the
 * concurrent panel+runner race variant), emits a machine-readable log and a
 * human summary, and exits non-zero iff the success thresholds are missed
 * (>=95% correct continuation AND 0 corruption). Fully self-contained: each
 * iteration uses its own temp store; the repo `.chaos/interactions/` is never
 * touched.
 */

// Import-safe: only runs when invoked as the process entry point, so `node --test`
// (which imports every file under `test/`) does not execute the whole suite.
import * as fs from "node:fs";
import * as path from "node:path";
import { runIteration, type IterationResult } from "./harness.ts";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

const RUNS = Number(arg("--runs", "20"));
const OUT = arg("--out");

async function main(): Promise<void> {
  const results: IterationResult[] = [];
  for (let i = 1; i <= RUNS; i++) {
    const r = await runIteration(i);
    results.push(r);
    const flag = r.continuedCorrectly ? "ok " : "XX ";
    const corr = r.corruptionPostKill ? " CORRUPT" : "";
    process.stdout.write(
      `[${flag}] run ${String(i).padStart(2)} ${r.variant.padEnd(10)} ` +
        `kill@${r.killAt}/${r.mechanism} landed=${r.killLanded ? "Y" : "n"} ` +
        `-> ${r.classification}${corr}\n`,
    );
    if (r.notes.length) for (const n of r.notes) process.stdout.write(`        note: ${n}\n`);
    if (r.workerStderr) process.stdout.write(`        worker-stderr: ${r.workerStderr}\n`);
  }

  const correct = results.filter((r) => r.continuedCorrectly).length;
  const corruptionCount = results.filter((r) => r.corruptionPostKill).length;
  const postResumeCorrupt = results.filter((r) => r.corruptionPostResume).length;
  const ratePct = (correct / RUNS) * 100;
  const passRate = correct >= Math.ceil(RUNS * 0.95);
  const passCorruption = corruptionCount === 0;

  const classification: Record<string, number> = {};
  for (const r of results) classification[r.classification] = (classification[r.classification] ?? 0) + 1;

  const killsLanded = results.filter((r) => r.killLanded).length;
  const anyNullCapsuleHash = results.some((r) => r.corruption.nullCapsuleHash);
  const orphanTempRuns = results.filter((r) => r.corruption.orphanTemp.length > 0).length;
  const missingNewlineRuns = results.filter((r) => r.corruption.missingTrailingNewline.length > 0).length;

  const payload = {
    meta: {
      experiment: "EA-X4 resume reliability under abuse",
      spec: "15-validation-experiments.md §15.2",
      generatedBy: "tools/chaos-interaction-runtime/test/abuse/run.ts",
      provenance: "Observed (agent-executed, deterministic; no humans)",
      runs: RUNS,
      concurrentVariantRuns: results.filter((r) => r.variant === "concurrent").map((r) => r.iteration),
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      thresholds: { correctContinuation: ">=95%", corruption: "0" },
      seedModel: "per-iteration deterministic seed = iteration index (LCG)",
    },
    aggregate: {
      correctContinuation: `${correct}/${RUNS}`,
      correctContinuationPct: Number(ratePct.toFixed(1)),
      corruptionCount,
      corruptionPostResumeCount: postResumeCorrupt,
      killsActuallyLanded: `${killsLanded}/${RUNS}`,
      classificationHistogram: classification,
      passesCorrectnessThreshold: passRate,
      passesCorruptionThreshold: passCorruption,
      overallPass: passRate && passCorruption,
      observations: {
        nullCapsuleHashGapPresent: anyNullCapsuleHash,
        orphanTempFileRuns: orphanTempRuns,
        missingTrailingNewlineRuns: missingNewlineRuns,
      },
    },
    runs: results,
  };

  const outPath = OUT ? path.resolve(OUT) : path.resolve(import.meta.dirname, "abuse-run.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  process.stdout.write("\n=== EA-X4 abuse suite summary ===\n");
  process.stdout.write(`runs:                 ${RUNS} (concurrent: ${payload.meta.concurrentVariantRuns.join(", ")})\n`);
  process.stdout.write(`kills landed:         ${killsLanded}/${RUNS}\n`);
  process.stdout.write(`correct continuation: ${correct}/${RUNS} (${ratePct.toFixed(1)}%)  threshold >=95% -> ${passRate ? "PASS" : "FAIL"}\n`);
  process.stdout.write(`corruption (post-kill): ${corruptionCount}          threshold 0     -> ${passCorruption ? "PASS" : "FAIL"}\n`);
  process.stdout.write(`corruption (post-resume): ${postResumeCorrupt}\n`);
  process.stdout.write(`classification:       ${JSON.stringify(classification)}\n`);
  process.stdout.write(`observations:         nullCapsuleHash=${anyNullCapsuleHash} orphanTempRuns=${orphanTempRuns} missingNewlineRuns=${missingNewlineRuns}\n`);
  process.stdout.write(`wrote:                ${outPath}\n`);
  process.stdout.write(`OVERALL:              ${payload.aggregate.overallPass ? "PASS" : "FAIL (routes to EA-V3)"}\n`);

  process.exit(payload.aggregate.overallPass ? 0 : 1);
}

const isMain = !!process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename;
if (isMain) void main();
