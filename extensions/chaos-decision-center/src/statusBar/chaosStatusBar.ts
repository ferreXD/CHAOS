/** Status bar item reflecting pending-decision / runtime-health state. */

import * as vscode from "vscode";
import type { StatusVM } from "../decisionCenter/decisionViewModel.ts";

export class ChaosStatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = "chaosDecisionCenter.open";
    this.item.show();
  }

  update(status: StatusVM): void {
    switch (status.state) {
      case "unavailable":
        this.item.text = `$(error) ${status.text}`;
        this.item.tooltip = "CHAOS interaction runtime is unavailable. Click to open the Decision Center.";
        this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
        break;
      case "pending":
      case "multiple":
        this.item.text = `$(bell-dot) ${status.text}`;
        this.item.tooltip = `${status.pendingCount} pending CHAOS decision(s). Click to answer.`;
        this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
        break;
      default:
        this.item.text = `$(check) ${status.text}`;
        this.item.tooltip = "No pending CHAOS decisions. Click to open the Decision Center.";
        this.item.backgroundColor = undefined;
    }
  }

  dispose(): void {
    this.item.dispose();
  }
}
