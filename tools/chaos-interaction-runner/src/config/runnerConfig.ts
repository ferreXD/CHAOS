/**
 * Runner configuration resolution.
 *
 * Precedence (highest first): CLI args > environment variables > JSON config
 * file > defaults. Mirrors the MCP server's resolver so behaviour is consistent
 * across the runtime packages.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { LogLevel } from "../logger.ts";

export type SessionAdapterKind = "process" | "claude-code" | "mock";

const SESSION_ADAPTERS: SessionAdapterKind[] = ["process", "claude-code", "mock"];

export interface RunnerConfig {
  repositoryRoot: string;
  /** `.chaos/interactions` root. */
  interactionsRoot: string;
  schemaDir: string;
  /** `.chaos/interactions/runners` — lease/audit/stop-flag directory. */
  runnersDir: string;
  validate: boolean;

  /** Configured agent command (never a hardcoded absolute path). */
  agentCommand: string;
  agentArgs: string[];
  workingDirectory: string;

  /** Which session adapter to construct for `run`. */
  sessionAdapter: SessionAdapterKind;
  /** Model passed to the claude-code adapter (null → CLI default). */
  claudeModel: string | null;
  /** Permission mode for the headless claude-code session (default acceptEdits). */
  claudePermissionMode: string;
  /** How long the runner waits for a resumed turn to complete before falling back. */
  agentAckTimeoutMs: number;
  /** Bypass the autoResume feature gate for local development. */
  forceAdapter: boolean;

  maxAutoResumeCycles: number;
  decisionPollMs: number;
  sessionLeaseTtlMs: number;
  heartbeatIntervalMs: number;

  requireExplicitResumeForDeadSessions: boolean;
  allowAutoResumeWhenRunnerActive: boolean;
  allowAutoResumeAcrossDeadSessions: boolean;
  stopOnNewMaterialDecision: boolean;
  stopOnUnsafeWriteRisk: boolean;
  stopOnValidationFailure: boolean;
  writeRunnerAudit: boolean;

  /**
   * Whether the generic process adapter is permitted to try to resume a live
   * process by writing to its stdin. Default false: without an acknowledgement
   * mechanism the runner cannot prove the process consumed the resume message,
   * so it prefers READY_FOR_MANUAL_RESUME (see final instruction of the brief).
   */
  allowProcessResume: boolean;

  logLevel: LogLevel;
}

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "silent"];

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return !/^(0|false|no|off)$/i.test(value.trim());
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (value && (LOG_LEVELS as string[]).includes(value)) return value as LogLevel;
  return fallback;
}

function parseArgsList(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return [];
  // JSON array or whitespace-separated tokens.
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      /* fall through to whitespace split */
    }
  }
  return trimmed.split(/\s+/);
}

interface CliArgs {
  flags: Map<string, string>;
  bools: Set<string>;
}

function parseCliArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  const bools = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      bools.add(key);
    } else {
      flags.set(key, next);
      i++;
    }
  }
  return { flags, bools };
}

function readJsonConfig(configPath: string): Partial<RunnerConfig> {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw) as Partial<RunnerConfig>;
  } catch {
    return {};
  }
}

/** Resolve runner config from process argv + env (+ optional JSON config file). */
export function resolveRunnerConfig(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
): RunnerConfig {
  const cli = parseCliArgs(argv);

  const file: Partial<RunnerConfig> = cli.flags.has("config")
    ? readJsonConfig(path.resolve(cli.flags.get("config")!))
    : {};

  const repositoryRoot = path.resolve(
    cli.flags.get("repo-root") ??
      env.CHAOS_REPOSITORY_ROOT ??
      file.repositoryRoot ??
      process.cwd(),
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

  const runnersDir = path.resolve(
    cli.flags.get("runners-dir") ?? file.runnersDir ?? path.join(interactionsRoot, "runners"),
  );

  const agentCommand =
    cli.flags.get("agent-command") ??
    env.CHAOS_RUNNER_AGENT_COMMAND ??
    file.agentCommand ??
    "claude";

  const agentArgs =
    parseArgsList(cli.flags.get("agent-args")) ??
    parseArgsList(env.CHAOS_RUNNER_AGENT_ARGS) ??
    file.agentArgs ??
    [];

  const workingDirectory = path.resolve(
    cli.flags.get("working-directory") ?? file.workingDirectory ?? repositoryRoot,
  );

  const sessionAdapter = parseSessionAdapter(
    cli.flags.get("session-adapter") ?? env.CHAOS_RUNNER_SESSION_ADAPTER,
    file.sessionAdapter ?? "process",
  );

  const claudeModel =
    cli.flags.get("claude-model") ?? env.CHAOS_RUNNER_CLAUDE_MODEL ?? file.claudeModel ?? null;

  const claudePermissionMode =
    cli.flags.get("claude-permission-mode") ??
    env.CHAOS_RUNNER_CLAUDE_PERMISSION_MODE ??
    file.claudePermissionMode ??
    "acceptEdits";

  const agentAckTimeoutMs = parseInteger(
    cli.flags.get("agent-ack-timeout-ms") ?? env.CHAOS_RUNNER_AGENT_ACK_TIMEOUT_MS,
    file.agentAckTimeoutMs ?? 120000,
  );

  const maxAutoResumeCycles = parseInteger(
    cli.flags.get("max-auto-resume-cycles") ?? env.CHAOS_RUNNER_MAX_AUTO_RESUME_CYCLES,
    file.maxAutoResumeCycles ?? 3,
  );

  const decisionPollMs = parseInteger(
    cli.flags.get("decision-poll-ms") ?? env.CHAOS_RUNNER_DECISION_POLL_MS,
    file.decisionPollMs ?? 1000,
  );

  const sessionLeaseTtlMs = parseInteger(
    cli.flags.get("session-lease-ttl-ms") ?? env.CHAOS_RUNNER_LEASE_TTL_MS,
    file.sessionLeaseTtlMs ?? 300000,
  );

  const heartbeatIntervalMs = parseInteger(
    cli.flags.get("heartbeat-interval-ms"),
    file.heartbeatIntervalMs ?? Math.max(1000, Math.floor(sessionLeaseTtlMs / 5)),
  );

  const validate = cli.bools.has("no-validate")
    ? false
    : parseBool(env.CHAOS_INTERACTION_VALIDATE, file.validate ?? true);

  const logLevel = parseLogLevel(
    cli.flags.get("log-level") ?? env.CHAOS_RUNNER_LOG_LEVEL,
    file.logLevel ?? "info",
  );

  return {
    repositoryRoot,
    interactionsRoot,
    schemaDir,
    runnersDir,
    validate,
    agentCommand,
    agentArgs,
    workingDirectory,
    sessionAdapter,
    claudeModel,
    claudePermissionMode,
    agentAckTimeoutMs,
    forceAdapter: boolFrom(cli, "force-adapter", file.forceAdapter ?? false),
    maxAutoResumeCycles,
    decisionPollMs,
    sessionLeaseTtlMs,
    heartbeatIntervalMs,
    requireExplicitResumeForDeadSessions: boolFrom(
      cli,
      "require-explicit-resume-for-dead-sessions",
      file.requireExplicitResumeForDeadSessions ?? true,
    ),
    allowAutoResumeWhenRunnerActive: boolFrom(
      cli,
      "allow-auto-resume-when-runner-active",
      file.allowAutoResumeWhenRunnerActive ?? true,
    ),
    allowAutoResumeAcrossDeadSessions: boolFrom(
      cli,
      "allow-auto-resume-across-dead-sessions",
      file.allowAutoResumeAcrossDeadSessions ?? false,
    ),
    stopOnNewMaterialDecision: boolFrom(
      cli,
      "stop-on-new-material-decision",
      file.stopOnNewMaterialDecision ?? false,
    ),
    stopOnUnsafeWriteRisk: boolFrom(cli, "stop-on-unsafe-write-risk", file.stopOnUnsafeWriteRisk ?? true),
    stopOnValidationFailure: boolFrom(
      cli,
      "stop-on-validation-failure",
      file.stopOnValidationFailure ?? true,
    ),
    writeRunnerAudit: boolFrom(cli, "write-runner-audit", file.writeRunnerAudit ?? true),
    allowProcessResume: boolFrom(cli, "allow-process-resume", file.allowProcessResume ?? false),
    logLevel,
  };
}

/**
 * Resolve a boolean flag that supports both `--flag` (true) and `--no-flag`
 * (false) CLI spellings, falling back to the provided default.
 */
function boolFrom(cli: CliArgs, name: string, fallback: boolean): boolean {
  if (cli.bools.has(`no-${name}`)) return false;
  if (cli.bools.has(name)) return true;
  const flagValue = cli.flags.get(name);
  if (flagValue !== undefined) return parseBool(flagValue, fallback);
  return fallback;
}

function parseSessionAdapter(
  value: string | undefined,
  fallback: SessionAdapterKind,
): SessionAdapterKind {
  if (value && (SESSION_ADAPTERS as string[]).includes(value)) return value as SessionAdapterKind;
  return fallback;
}
