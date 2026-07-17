/**
 * Minimal stderr logger for the runner.
 *
 * The runner is a user-started local process (not an MCP stdio server), so it may
 * use stdout for human-facing status. Diagnostics still go to stderr to keep them
 * separable from machine-readable stdout output.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export interface Logger {
  level: LogLevel;
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export function createLogger(level: LogLevel = "info"): Logger {
  const write = (lvl: LogLevel, message: string, data?: unknown): void => {
    if (ORDER[lvl] < ORDER[level]) return;
    const line =
      `[chaos-interaction-runner] ${lvl.toUpperCase()} ${message}` +
      (data !== undefined ? ` ${safe(data)}` : "");
    process.stderr.write(line + "\n");
  };
  return {
    level,
    debug: (m, d) => write("debug", m, d),
    info: (m, d) => write("info", m, d),
    warn: (m, d) => write("warn", m, d),
    error: (m, d) => write("error", m, d),
  };
}

function safe(data: unknown): string {
  if (data instanceof Error) return `${data.name}: ${data.message}`;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}
