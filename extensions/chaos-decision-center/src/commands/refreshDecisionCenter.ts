import * as vscode from "vscode";
import type { DecisionCenterController } from "../decisionCenter/controller.ts";

export function registerRefreshDecisionCenter(controller: DecisionCenterController): vscode.Disposable {
  return vscode.commands.registerCommand("chaosDecisionCenter.refresh", () => controller.refresh());
}
