/**
 * Persistent Decision Center webview panel (a singleton — one panel per
 * workspace, not one per decision).
 *
 * All webview messages are validated before any action. The panel renders from
 * a projection supplied by the controller and asks the controller to refresh
 * after any state mutation.
 */

import * as vscode from "vscode";
import * as crypto from "node:crypto";
import { renderDecisionCenter, type DashboardView } from "./decisionCenterHtml.ts";
import type { Projection } from "./decisionViewModel.ts";
import { handleMessage, validateMessage } from "./messageHandlers.ts";
import type { DecisionCenterClient } from "./messageHandlers.ts";
import type { AfterSubmit } from "../config/extensionConfig.ts";
import type { Logger } from "../logging/logger.ts";

export interface OpenArtifactRequest {
  kind: string;
  decisionId?: string;
  changeId?: string;
}

export interface PanelDeps {
  client: DecisionCenterClient;
  requestRefresh: () => void;
  afterSubmit: () => AfterSubmit;
  /** Open a decision file / change folder in the editor (in-context answering). */
  openArtifact: (req: OpenArtifactRequest) => void | Promise<void>;
  logger: Logger;
}

export class DecisionCenterPanel {
  static current: DecisionCenterPanel | undefined;
  private static readonly viewType = "chaosDecisionCenter";

  private readonly panel: vscode.WebviewPanel;
  private readonly deps: PanelDeps;
  private readonly disposables: vscode.Disposable[] = [];
  private projection: Projection;
  /** Non-null when the change-detail view is shown (holds the change group key). */
  private selectedChangeKey: string | undefined;
  /** Signature of the last rendered projection, so idle refreshes don't reflow. */
  private lastSignature = "";

  private constructor(panel: vscode.WebviewPanel, deps: PanelDeps, projection: Projection) {
    this.panel = panel;
    this.deps = deps;
    this.projection = projection;
    this.panel.webview.options = { enableScripts: true };
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (raw) => this.onMessage(raw),
      null,
      this.disposables,
    );
    this.render();
  }

  static createOrShow(deps: PanelDeps, projection: Projection, focus: boolean): DecisionCenterPanel {
    if (DecisionCenterPanel.current) {
      DecisionCenterPanel.current.projection = projection;
      DecisionCenterPanel.current.panel.reveal(vscode.ViewColumn.Active, !focus);
      DecisionCenterPanel.current.render();
      return DecisionCenterPanel.current;
    }
    const panel = vscode.window.createWebviewPanel(
      DecisionCenterPanel.viewType,
      "CHAOS Decision Center",
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: !focus },
      { enableScripts: true, retainContextWhenHidden: true },
    );
    DecisionCenterPanel.current = new DecisionCenterPanel(panel, deps, projection);
    return DecisionCenterPanel.current;
  }

  /** Update the panel with a freshly computed projection. */
  update(projection: Projection): void {
    this.projection = projection;
    // Drop the change route if that change no longer has any decisions.
    let routeChanged = false;
    if (
      this.selectedChangeKey &&
      !projection.changeGroups.some((g) => g.key === this.selectedChangeKey)
    ) {
      this.selectedChangeKey = undefined;
      routeChanged = true;
    }
    // Skip re-rendering when nothing material changed: a full webview.html swap
    // would otherwise reset scroll and (without the draft restore) disturb any
    // answer the human is typing. The client script also guards this, but not
    // reflowing at all is strictly better.
    const sig = signature(projection);
    if (!routeChanged && sig === this.lastSignature) return;
    this.render();
  }

  reveal(focus: boolean): void {
    this.panel.reveal(vscode.ViewColumn.Active, !focus);
  }

  private render(): void {
    const nonce = crypto.randomBytes(16).toString("base64").replace(/[^A-Za-z0-9]/g, "");
    const view: DashboardView = this.selectedChangeKey
      ? { kind: "change", changeKey: this.selectedChangeKey }
      : { kind: "dashboard" };
    this.lastSignature = signature(this.projection);
    this.panel.webview.html = renderDecisionCenter(this.projection, { nonce, view });
  }

  private async onMessage(raw: unknown): Promise<void> {
    // UI-routing messages are handled here directly (no runtime mutation) and
    // are not part of the validated runtime-action protocol.
    const routing = raw as { type?: unknown; changeKey?: unknown };
    if (routing?.type === "selectChange") {
      if (typeof routing.changeKey === "string") {
        this.selectedChangeKey = routing.changeKey;
        this.render();
      }
      return;
    }
    if (routing?.type === "backToDashboard") {
      this.selectedChangeKey = undefined;
      this.render();
      return;
    }
    if (routing?.type === "openArtifact") {
      const req = raw as { kind?: unknown; decisionId?: unknown; changeId?: unknown };
      if (typeof req.kind === "string") {
        void this.deps.openArtifact({
          kind: req.kind,
          decisionId: typeof req.decisionId === "string" ? req.decisionId : undefined,
          changeId: typeof req.changeId === "string" ? req.changeId : undefined,
        });
      }
      return;
    }

    let type: string;
    try {
      type = validateMessage(raw).type;
    } catch {
      vscode.window.showErrorMessage("CHAOS Decision Center received an invalid message.");
      return;
    }

    if (type === "refresh") {
      this.deps.requestRefresh();
      return;
    }
    if (type === "cancelDecision") {
      const confirmed = await vscode.window.showWarningMessage(
        "Cancel the command session for this decision? This cancels its pending decisions and releases locks. Artifacts are preserved.",
        { modal: true },
        "Cancel session",
      );
      if (confirmed !== "Cancel session") return;
    }

    const outcome = handleMessage(raw, this.deps.client);

    if (!outcome.ok) {
      this.deps.logger.error(`Decision Center action failed: ${outcome.status}`);
      vscode.window.showErrorMessage(`CHAOS: ${outcome.message}`);
      return;
    }

    switch (outcome.action) {
      case "answerDecision": {
        vscode.window.showInformationMessage("Decision answered. Session is ready to resume.");
        const after = this.deps.afterSubmit();
        if (after === "closePanel") {
          this.panel.dispose();
          return;
        }
        if (after === "switchToDashboard") this.selectedChangeKey = undefined;
        this.deps.requestRefresh();
        return;
      }
      case "cancelDecision": {
        vscode.window.showInformationMessage(outcome.message);
        this.deps.requestRefresh();
        return;
      }
      case "copyResumeInstruction": {
        const text = String(outcome.data["text"] ?? "");
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage("Resume instruction copied to clipboard.");
        return;
      }
      default:
        this.deps.requestRefresh();
    }
  }

  dispose(): void {
    DecisionCenterPanel.current = undefined;
    this.panel.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

/**
 * A cheap content signature of a projection, excluding `generatedAt` (which
 * changes on every poll even when nothing else did). Used to skip no-op renders.
 */
function signature(projection: Projection): string {
  return JSON.stringify({ ...projection, generatedAt: "" });
}
