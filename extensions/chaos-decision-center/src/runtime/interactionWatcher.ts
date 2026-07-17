/**
 * Watches `.chaos/interactions/**` for changes and fires a debounced callback.
 *
 * Uses a VS Code FileSystemWatcher plus a polling fallback, because file
 * watching can miss events on some platforms/network filesystems. Only the
 * interactions root is watched — never the whole repository.
 */

import * as vscode from "vscode";
import type { Logger } from "../logging/logger.ts";

export class InteractionWatcher {
  private readonly disposables: vscode.Disposable[] = [];
  private pollTimer: ReturnType<typeof setInterval> | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  constructor(
    private readonly root: string,
    private readonly pollMs: number,
    private readonly onChange: () => void,
    private readonly logger: Logger,
  ) {}

  start(): void {
    try {
      const pattern = new vscode.RelativePattern(this.root, "**/*.{json,jsonl}");
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      watcher.onDidCreate(() => this.trigger(), undefined, this.disposables);
      watcher.onDidChange(() => this.trigger(), undefined, this.disposables);
      watcher.onDidDelete(() => this.trigger(), undefined, this.disposables);
      this.disposables.push(watcher);
    } catch (err) {
      this.logger.error("Failed to create file watcher; relying on polling", err);
    }

    if (this.pollMs > 0) {
      this.pollTimer = setInterval(() => this.trigger(), this.pollMs);
    }
  }

  /** Debounced fire, so a burst of file events causes a single refresh. */
  private trigger(): void {
    if (this.disposed) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.disposed) return;
      try {
        this.onChange();
      } catch (err) {
        this.logger.error("Watcher refresh failed", err);
      }
    }, 150);
  }

  dispose(): void {
    this.disposed = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const d of this.disposables) d.dispose();
  }
}
