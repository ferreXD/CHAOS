/** Shared probe context + read helpers. Diagnostics is strictly read-only. */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  InteractionRuntime,
  MalformedStateError,
  PathResolver,
} from "../runtime.ts";
import type { DiagnosticsConfig } from "../config/diagnosticsConfig.ts";
import type { HealthFinding } from "../model/healthFinding.ts";
import type { SummaryCounters } from "../model/healthReport.ts";

export interface ProbeContext {
  config: DiagnosticsConfig;
  paths: PathResolver;
  /** Read-only runtime handle (validation off — probes validate explicitly). */
  runtime: InteractionRuntime;
  now: Date;
  counters: SummaryCounters;
}

export type Probe = (ctx: ProbeContext) => HealthFinding[];

export function createProbeContext(
  config: DiagnosticsConfig,
  counters: SummaryCounters,
  now = new Date(),
): ProbeContext {
  const paths = new PathResolver(config.interactionsRoot, config.schemaDir);
  // validate:false — probes never write, and artifactValidationProbe validates
  // each file individually so one bad file cannot abort a bulk read.
  const runtime = new InteractionRuntime({
    root: config.interactionsRoot,
    schemaDir: config.schemaDir,
    validate: false,
  });
  return { config, paths, runtime, now, counters };
}

export function exists(p: string): boolean {
  return fs.existsSync(p);
}

export function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

export type SafeRead<T> =
  | { ok: true; value: T | undefined }
  | { ok: false; error: string };

/** Read+parse JSON, converting a MalformedStateError into a structured result. */
export function safeReadJson<T>(filePath: string): SafeRead<T> {
  try {
    if (!fs.existsSync(filePath)) return { ok: true, value: undefined };
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, "utf8")) as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof MalformedStateError ? err.message : String(err),
    };
  }
}

/** Repo-relative display path for evidence lines (best effort). */
export function rel(ctx: ProbeContext, absPath: string): string {
  const r = path.relative(ctx.config.repositoryRoot, absPath);
  return r.startsWith("..") ? absPath : r.split(path.sep).join("/");
}

/**
 * Run a runtime list()/read() that may throw MalformedStateError on a corrupt
 * file. Diagnostics tolerates corruption (the artifact-validation probe reports
 * it); other probes should not abort because one file is bad.
 */
export function safeList<T>(fn: () => T[], fallback: T[] = []): T[] {
  try {
    return fn();
  } catch (err) {
    if (err instanceof MalformedStateError) return fallback;
    throw err;
  }
}

export function hoursSince(now: Date, iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return (now.getTime() - t) / 3_600_000;
}
