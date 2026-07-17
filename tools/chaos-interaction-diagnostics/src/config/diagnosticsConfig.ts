/**
 * Diagnostics + enforcement configuration.
 *
 * Precedence (highest first): CLI args > environment variables > JSON config
 * file > defaults. Mirrors the resolvers in the MCP/runner packages.
 *
 * These defaults intentionally match the additive `policies.interactionRuntime`
 * block documented in `.chaos/config.yaml`. Nothing here mutates config; the YAML
 * declares intent, this resolves runtime values.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type EnforcementMode = "advisory" | "strict" | "off";

export interface DiagnosticsConfig {
  repositoryRoot: string;
  interactionsRoot: string;
  schemaDir: string;
  runnersDir: string;
  runtimeDir: string;

  /**
   * Command-side integration switch (`policies.interactionRuntime.commands.enabled`).
   * When false, the command-contract probe reports integration as disabled-by-config
   * rather than as a gap. Canonical source is `.chaos/config.yaml`; passed in via
   * CLI/env/JSON since diagnostics does not parse YAML.
   */
  commandsEnabled: boolean;

  // diagnostics.*
  enabled: boolean;
  staleDecisionAgeHours: number;
  staleLockAgeHours: number;
  expiredRunnerLeaseGraceMs: number;
  includeTodoCandidates: boolean;
  validateArtifacts: boolean;
  checkMcpPackage: boolean;
  checkDecisionCenterPackage: boolean;

  // enforcement.*
  enforcementMode: EnforcementMode;
  strictBlocksOnBlocker: boolean;
  writeHookViolations: boolean;
  blockOnPendingDecisionSameChange: boolean;
  blockOnMalformedState: boolean;

  /** Existing hook-violations stream to reuse (never duplicated). */
  hookViolationsPath: string;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return !/^(0|false|no|off)$/i.test(value.trim());
}

function parseInt10(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

interface CliArgs {
  flags: Map<string, string>;
  bools: Set<string>;
}

function parseCli(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  const bools = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) bools.add(key);
    else {
      flags.set(key, next);
      i++;
    }
  }
  return { flags, bools };
}

function readJsonConfig(configPath: string): Partial<DiagnosticsConfig> {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as Partial<DiagnosticsConfig>;
  } catch {
    return {};
  }
}

function parseMode(value: string | undefined, fallback: EnforcementMode): EnforcementMode {
  if (value === "advisory" || value === "strict" || value === "off") return value;
  return fallback;
}

export function resolveDiagnosticsConfig(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
): DiagnosticsConfig {
  const cli = parseCli(argv);
  const file: Partial<DiagnosticsConfig> = cli.flags.has("config")
    ? readJsonConfig(path.resolve(cli.flags.get("config")!))
    : {};

  const repositoryRoot = path.resolve(
    cli.flags.get("repo-root") ?? env.CHAOS_REPOSITORY_ROOT ?? file.repositoryRoot ?? process.cwd(),
  );
  const interactionsRoot = path.resolve(
    cli.flags.get("root") ??
      env.CHAOS_INTERACTIONS_ROOT ??
      file.interactionsRoot ??
      path.join(repositoryRoot, ".chaos", "interactions"),
  );
  const schemaDir = path.resolve(
    cli.flags.get("schema-dir") ??
      env.CHAOS_INTERACTIONS_SCHEMA_DIR ??
      file.schemaDir ??
      path.join(interactionsRoot, "schema"),
  );
  const runnersDir = path.resolve(file.runnersDir ?? path.join(interactionsRoot, "runners"));
  const runtimeDir = path.resolve(
    cli.flags.get("runtime-dir") ?? file.runtimeDir ?? path.join(repositoryRoot, ".chaos", "runtime"),
  );

  const enforcementMode = parseMode(
    cli.flags.get("enforcement-mode") ?? env.CHAOS_IR_ENFORCEMENT_MODE,
    (file.enforcementMode as EnforcementMode) ?? "advisory",
  );

  return {
    repositoryRoot,
    interactionsRoot,
    schemaDir,
    runnersDir,
    runtimeDir,

    commandsEnabled: cli.bools.has("no-commands-enabled")
      ? false
      : parseBool(
          cli.flags.get("commands-enabled") ?? env.CHAOS_IR_COMMANDS_ENABLED,
          file.commandsEnabled ?? true,
        ),
    enabled: parseBool(env.CHAOS_IR_DIAGNOSTICS_ENABLED, file.enabled ?? true),
    staleDecisionAgeHours: parseInt10(
      cli.flags.get("stale-decision-age-hours") ?? env.CHAOS_IR_STALE_DECISION_AGE_HOURS,
      file.staleDecisionAgeHours ?? 24,
    ),
    staleLockAgeHours: parseInt10(
      cli.flags.get("stale-lock-age-hours") ?? env.CHAOS_IR_STALE_LOCK_AGE_HOURS,
      file.staleLockAgeHours ?? 24,
    ),
    expiredRunnerLeaseGraceMs: parseInt10(
      cli.flags.get("expired-runner-lease-grace-ms") ?? env.CHAOS_IR_LEASE_GRACE_MS,
      file.expiredRunnerLeaseGraceMs ?? 30000,
    ),
    includeTodoCandidates: cli.bools.has("no-todo-candidates")
      ? false
      : file.includeTodoCandidates ?? true,
    validateArtifacts: cli.bools.has("no-validate") ? false : file.validateArtifacts ?? true,
    checkMcpPackage: file.checkMcpPackage ?? true,
    checkDecisionCenterPackage: file.checkDecisionCenterPackage ?? true,

    enforcementMode,
    strictBlocksOnBlocker: file.strictBlocksOnBlocker ?? true,
    writeHookViolations: parseBool(env.CHAOS_IR_WRITE_HOOK_VIOLATIONS, file.writeHookViolations ?? true),
    blockOnPendingDecisionSameChange: cli.bools.has("block-on-pending-decision")
      ? true
      : file.blockOnPendingDecisionSameChange ?? false,
    blockOnMalformedState: cli.bools.has("block-on-malformed")
      ? true
      : file.blockOnMalformedState ?? false,

    hookViolationsPath: path.resolve(
      file.hookViolationsPath ?? path.join(runtimeDir, "hook-violations.jsonl"),
    ),
  };
}
