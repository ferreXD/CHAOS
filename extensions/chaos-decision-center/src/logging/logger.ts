/** Thin logger over a VS Code output channel. Never logs full artifact bodies. */

import * as vscode from "vscode";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, err?: unknown): void;
  dispose(): void;
}

export function createLogger(): Logger {
  const channel = vscode.window.createOutputChannel("CHAOS Decision Center");
  const stamp = () => new Date().toISOString();
  return {
    info: (m) => channel.appendLine(`${stamp()} INFO  ${m}`),
    warn: (m) => channel.appendLine(`${stamp()} WARN  ${m}`),
    error: (m, err) =>
      channel.appendLine(
        `${stamp()} ERROR ${m}${err instanceof Error ? `: ${err.name}: ${err.message}` : ""}`,
      ),
    dispose: () => channel.dispose(),
  };
}
