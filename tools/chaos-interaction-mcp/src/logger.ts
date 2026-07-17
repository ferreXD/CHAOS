/**
 * Minimal stderr logger.
 *
 * CRITICAL: stdout is reserved for the MCP protocol stream. All logging MUST go
 * to stderr, never stdout, or the JSON-RPC channel is corrupted.
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
      `[chaos-interaction-mcp] ${lvl.toUpperCase()} ${message}` +
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
