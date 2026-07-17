import * as vscode from "vscode";
import type { DecisionCenterController } from "../decisionCenter/controller.ts";

export function registerCancelDecision(controller: DecisionCenterController): vscode.Disposable {
  return vscode.commands.registerCommand("chaosDecisionCenter.cancelDecision", () =>
    controller.cancelActiveDecision(),
  );
}
