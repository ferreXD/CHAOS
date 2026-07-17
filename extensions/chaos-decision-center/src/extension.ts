/**
 * CHAOS Decision Center — VS Code extension entrypoint.
 *
 * Wires configuration, the file-backed RuntimeClient, the status bar, the file
 * watcher (+ polling fallback), the persistent webview panel, and the commands.
 *
 * The extension is the human-facing side of the same file-backed runtime the
 * MCP server exposes to agents. It does NOT require the MCP server to run.
 */

import * as vscode from "vscode";
import * as path from "node:path";
import { DEFAULT_CONFIG, resolveConfig, type ExtensionConfig } from "./config/extensionConfig.ts";
import { findInteractionPaths } from "./runtime/workspaceResolver.ts";
import { RuntimeClient } from "./runtime/runtimeClient.ts";
import { InteractionWatcher } from "./runtime/interactionWatcher.ts";
import { ChaosStatusBar } from "./statusBar/chaosStatusBar.ts";
import { DecisionCenterPanel, type PanelDeps } from "./decisionCenter/decisionCenterPanel.ts";
import type { DecisionCenterController } from "./decisionCenter/controller.ts";
import type { Projection } from "./decisionCenter/decisionViewModel.ts";
import { createLogger, type Logger } from "./logging/logger.ts";
import { registerOpenDecisionCenter } from "./commands/openDecisionCenter.ts";
import { registerRefreshDecisionCenter } from "./commands/refreshDecisionCenter.ts";
import { registerAnswerDecision } from "./commands/answerDecision.ts";
import { registerCancelDecision } from "./commands/cancelDecision.ts";
import { registerCopyResumeInstruction } from "./commands/copyResumeInstruction.ts";

class ExtensionController implements DecisionCenterController {
  private config: ExtensionConfig = DEFAULT_CONFIG;
  private client!: RuntimeClient;
  private watcher: InteractionWatcher | undefined;
  private lastProjection: Projection | undefined;
  private previousActiveDecisionId: string | null = null;
  private interactionsRoot = "";
  private workspaceFolder: string | undefined;

  constructor(
    private readonly statusBar: ChaosStatusBar,
    private readonly logger: Logger,
  ) {
    this.reload();
  }

  /** (Re)read config, re-resolve paths, and (re)create the client + watcher. */
  reload(): void {
    const raw = readRawConfig();
    this.config = resolveConfig(raw);
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const { root, schemaDir } = findInteractionPaths(
      workspaceFolder,
      this.config.interactionsRoot,
      this.config.schemaDir,
    );
    this.interactionsRoot = root;
    this.workspaceFolder = workspaceFolder;
    this.client = new RuntimeClient({
      root,
      schemaDir,
      validate: this.config.validateResponses,
      userName: this.config.userName,
      maxHistoryItems: this.config.maxHistoryItems,
    });

    this.watcher?.dispose();
    this.watcher = new InteractionWatcher(root, this.config.pollingFallbackMs, () => this.refresh(), this.logger);
    this.watcher.start();
    this.logger.info(`Watching interaction runtime at ${root}`);
    this.refresh();
  }

  refresh(): void {
    let projection: Projection;
    try {
      projection = this.client.getProjection();
    } catch (err) {
      this.logger.error("Failed to compute projection", err);
      return;
    }
    this.lastProjection = projection;
    this.statusBar.update(projection.status);
    DecisionCenterPanel.current?.update(projection);
    this.handlePendingTransition(projection);
  }

  private handlePendingTransition(projection: Projection): void {
    const activeId = projection.activeDecision?.decisionId ?? null;
    const isNew = activeId !== null && activeId !== this.previousActiveDecisionId;
    this.previousActiveDecisionId = activeId;
    if (!isNew) return;

    if (this.config.openOnPendingDecision) {
      this.open(this.config.focusOnPendingDecision);
    }
    if (this.config.showNotificationOnPendingDecision) {
      vscode.window
        .showInformationMessage("CHAOS: a decision is waiting for your input.", "Open Decision Center")
        .then((choice) => {
          if (choice === "Open Decision Center") this.open(true);
        });
    }
  }

  open(focus: boolean): void {
    const projection = this.lastProjection ?? this.client.getProjection();
    DecisionCenterPanel.createOrShow(this.panelDeps(), projection, focus);
  }

  async cancelActiveDecision(): Promise<void> {
    const active = this.lastProjection?.activeDecision;
    if (!active) {
      vscode.window.showInformationMessage("CHAOS: no active decision to cancel.");
      return;
    }
    const choice = await vscode.window.showWarningMessage(
      `Cancel the command session for "${active.title}"? Pending decisions are cancelled and locks released. Artifacts are preserved.`,
      { modal: true },
      "Cancel session",
    );
    if (choice !== "Cancel session") return;
    try {
      const result = this.client.cancelCommandForDecision(active.decisionId);
      vscode.window.showInformationMessage(`CHAOS: session ${result.commandRunId} cancelled.`);
      this.refresh();
    } catch (err) {
      this.logger.error("Cancel failed", err);
      vscode.window.showErrorMessage("CHAOS: failed to cancel the command session.");
    }
  }

  async copyResumeInstructionInteractive(): Promise<void> {
    const ready = this.lastProjection?.readyToResume ?? [];
    if (ready.length === 0) {
      vscode.window.showInformationMessage("CHAOS: no ready-to-resume sessions.");
      return;
    }
    const pick = await vscode.window.showQuickPick(
      ready.map((r) => ({
        label: r.commandRunId,
        description: r.changeId ?? "",
        detail: r.resume.commands[0],
        runId: r.commandRunId,
      })),
      { title: "Copy resume instruction" },
    );
    if (!pick) return;
    const text = this.client.resumeInstructionText(pick.runId);
    if (text === null) {
      vscode.window.showErrorMessage("CHAOS: could not build a resume instruction.");
      return;
    }
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage("Resume instruction copied to clipboard.");
  }

  /** In-context answering: open the decision file or reveal the change folder. */
  private async openArtifact(req: {
    kind: string;
    decisionId?: string;
    changeId?: string;
  }): Promise<void> {
    const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
    try {
      if (req.kind === "decision" && req.decisionId && SAFE_ID.test(req.decisionId)) {
        const file = path.join(this.interactionsRoot, "decisions", req.decisionId, "decision.json");
        await vscode.window.showTextDocument(vscode.Uri.file(file), { preview: true });
        return;
      }
      if (req.kind === "change" && req.changeId && SAFE_ID.test(req.changeId) && this.workspaceFolder) {
        const folder = path.join(this.workspaceFolder, ".chaos", "changes", req.changeId);
        await vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(folder));
        return;
      }
      vscode.window.showWarningMessage("CHAOS: nothing to open for that artifact.");
    } catch (err) {
      this.logger.error("openArtifact failed", err);
      vscode.window.showErrorMessage("CHAOS: could not open the artifact (it may not exist yet).");
    }
  }

  private panelDeps(): PanelDeps {
    return {
      client: this.client,
      requestRefresh: () => this.refresh(),
      afterSubmit: () => this.config.afterSubmit,
      openArtifact: (req) => this.openArtifact(req),
      logger: this.logger,
    };
  }

  dispose(): void {
    this.watcher?.dispose();
  }
}

function readRawConfig(): Partial<ExtensionConfig> {
  const c = vscode.workspace.getConfiguration("chaosDecisionCenter");
  return {
    interactionsRoot: c.get<string>("interactionsRoot"),
    schemaDir: c.get<string>("schemaDir"),
    openOnPendingDecision: c.get<boolean>("openOnPendingDecision"),
    focusOnPendingDecision: c.get<boolean>("focusOnPendingDecision"),
    showNotificationOnPendingDecision: c.get<boolean>("showNotificationOnPendingDecision"),
    afterSubmit: c.get<ExtensionConfig["afterSubmit"]>("afterSubmit"),
    validateResponses: c.get<boolean>("validateResponses"),
    pollingFallbackMs: c.get<number>("pollingFallbackMs"),
    maxHistoryItems: c.get<number>("maxHistoryItems"),
    userName: c.get<string>("userName"),
  };
}

export function activate(context: vscode.ExtensionContext): void {
  const logger = createLogger();
  const statusBar = new ChaosStatusBar();
  const controller = new ExtensionController(statusBar, logger);

  context.subscriptions.push(
    statusBar,
    { dispose: () => controller.dispose() },
    logger,
    registerOpenDecisionCenter(controller),
    registerRefreshDecisionCenter(controller),
    registerAnswerDecision(controller),
    registerCancelDecision(controller),
    registerCopyResumeInstruction(controller),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("chaosDecisionCenter")) controller.reload();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => controller.reload()),
  );

  logger.info("CHAOS Decision Center activated.");
}

export function deactivate(): void {
  DecisionCenterPanel.current?.dispose();
}
