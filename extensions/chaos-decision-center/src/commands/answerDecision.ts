import * as vscode from "vscode";
import type { DecisionCenterController } from "../decisionCenter/controller.ts";

/**
 * Answering requires selecting an option, which is done in the webview. The
 * palette command opens/focuses the Decision Center so the user can answer there
 * (the model must never choose the human decision itself).
 */
export function registerAnswerDecision(controller: DecisionCenterController): vscode.Disposable {
  return vscode.commands.registerCommand("chaosDecisionCenter.answerDecision", () => {
    controller.open(true);
    vscode.window.showInformationMessage("Answer the active decision in the CHAOS Decision Center.");
  });
}
