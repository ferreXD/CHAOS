import * as vscode from "vscode";
import type { DecisionCenterController } from "../decisionCenter/controller.ts";

export function registerCopyResumeInstruction(controller: DecisionCenterController): vscode.Disposable {
  return vscode.commands.registerCommand("chaosDecisionCenter.copyResumeInstruction", () =>
    controller.copyResumeInstructionInteractive(),
  );
}
