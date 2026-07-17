/**
 * Server configuration resolution.
 *
 * Precedence (highest first): CLI args > environment variables > JSON config
 * file > defaults.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { LogLevel } from "./logger.ts";

export interface ServerConfig {
  repositoryRoot: string;
  root: string;
  schemaDir: string;
  validate: boolean;
  logLevel: LogLevel;
  transport: "stdio";
}

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "silent"];

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return !/^(0|false|no|off)$/i.test(value.trim());
}

function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (value && (LOG_LEVELS as string[]).includes(value)) return value as LogLevel;
  return fallback;
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

function readJsonConfig(configPath: string): Partial<ServerConfig> {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw) as Partial<ServerConfig>;
  } catch {
    return {};
  }
}

/** Resolve config from process argv + env (+ optional JSON config file). */
export function resolveConfig(argv: string[], env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const cli = parseCliArgs(argv);

  const fileConfig: Partial<ServerConfig> = cli.flags.has("config")
    ? readJsonConfig(path.resolve(cli.flags.get("config")!))
    : {};

  const repositoryRoot = path.resolve(
    cli.flags.get("repo-root") ??
      env.CHAOS_REPOSITORY_ROOT ??
      fileConfig.repositoryRoot ??
      process.cwd(),
  );

  const root = path.resolve(
    cli.flags.get("root") ??
      env.CHAOS_INTERACTIONS_ROOT ??
      fileConfig.root ??
      path.join(repositoryRoot, ".chaos", "interactions"),
  );

  const schemaDir = path.resolve(
    cli.flags.get("schema-dir") ??
      env.CHAOS_INTERACTIONS_SCHEMA_DIR ??
      fileConfig.schemaDir ??
      path.join(root, "schema"),
  );

  let validate: boolean;
  if (cli.bools.has("no-validate")) validate = false;
  else if (cli.bools.has("validate")) validate = true;
  else validate = parseBool(env.CHAOS_INTERACTION_VALIDATE, fileConfig.validate ?? true);

  const logLevel = parseLogLevel(
    cli.flags.get("log-level") ?? env.CHAOS_INTERACTION_LOG_LEVEL,
    fileConfig.logLevel ?? "info",
  );

  return { repositoryRoot, root, schemaDir, validate, logLevel, transport: "stdio" };
}
