import * as vscode from "vscode";
import type { DecisionCenterController } from "../decisionCenter/controller.ts";

export function registerOpenDecisionCenter(controller: DecisionCenterController): vscode.Disposable {
  return vscode.commands.registerCommand("chaosDecisionCenter.open", () => controller.open(true));
}
