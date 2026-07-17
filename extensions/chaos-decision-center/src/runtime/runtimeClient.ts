/**
 * Read/write bridge between the Decision Center and the Iteration 1 runtime.
 *
 * vscode-free (so it is unit-testable). Reads are defensive: a malformed file in
 * one category is reported as a health warning instead of crashing the UI.
 *
 * Responses are written ONLY through the runtime's `answerDecision` operation
 * (never by hand-editing JSON), with source `vscode-decision-center`.
 */

import * as fs from "node:fs";
import {
  InteractionRuntime,
  MalformedStateError,
  NotFoundError,
  type Decision,
  type CommandSession,
  type ResumeCapsule,
  type ActiveState,
  type LockView,
} from "../runtime.ts";
import {
  buildProjection,
  buildResumeInstruction,
  type Projection,
} from "../decisionCenter/decisionViewModel.ts";
import type {
  AnswerInput,
  AnswerOutcome,
  CancelOutcome,
  DecisionCenterClient,
} from "../decisionCenter/messageHandlers.ts";

export interface RuntimeClientOptions {
  root: string;
  schemaDir: string;
  validate: boolean;
  userName: string;
  maxHistoryItems: number;
}

export class RuntimeClient implements DecisionCenterClient {
  private readonly runtime: InteractionRuntime;
  private readonly options: RuntimeClientOptions;

  constructor(options: RuntimeClientOptions) {
    this.options = options;
    this.runtime = new InteractionRuntime({
      root: options.root,
      schemaDir: options.schemaDir,
      validate: options.validate,
    });
  }

  /** Build the full Decision Center projection. Never throws on malformed files. */
  getProjection(now: string = new Date().toISOString()): Projection {
    const malformedFiles: string[] = [];
    const rootExists = fs.existsSync(this.runtime.paths.root);
    const schemaDirExists = fs.existsSync(this.runtime.paths.schemaDir);

    const active = this.safe<ActiveState | null>(
      () => this.runtime.store.activeState.readActive() ?? null,
      null,
      malformedFiles,
    );
    const decisions = this.safe<Decision[]>(() => this.runtime.store.decisions.list(), [], malformedFiles);
    const sessions = this.safe<CommandSession[]>(() => this.runtime.store.sessions.list(), [], malformedFiles);
    const capsules = this.safe<ResumeCapsule[]>(() => this.listCapsules(), [], malformedFiles);
    const locks = this.safe<LockView[]>(() => this.runtime.listLocks(), [], malformedFiles);

    return buildProjection({
      active,
      decisions,
      sessions,
      capsules,
      locks,
      rootPath: this.runtime.paths.root,
      rootExists,
      schemaDirExists,
      malformedFiles,
      maxHistoryItems: this.options.maxHistoryItems,
      now,
      decisionRelPath: (id) => this.runtime.paths.relative(this.runtime.paths.decision(id)),
      capsuleRelPath: (runId) => this.runtime.paths.relative(this.runtime.paths.capsule(runId)),
      responseFor: (id) => {
        try {
          return this.runtime.getDecisionResponse(id).response ?? null;
        } catch {
          return null;
        }
      },
    });
  }

  answerDecision(input: AnswerInput): AnswerOutcome {
    const result = this.runtime.answerDecision({
      decisionId: input.decisionId,
      selectedOptionId: input.selectedOptionId ?? null,
      selectedOptionIds: input.selectedOptionIds ?? [],
      freeformValue: input.freeformValue ?? null,
      selectedBy: this.options.userName,
      rationale: input.rationale ?? null,
      source: "vscode-decision-center",
    });
    return {
      status: result.status,
      decisionId: result.decisionId,
      sessionState: result.sessionState,
      resumeCapsulePath: result.resumeCapsulePath ?? null,
    };
  }

  cancelCommandForDecision(decisionId: string): CancelOutcome {
    const decision = this.runtime.getDecision(decisionId);
    if (!decision) throw new NotFoundError("decision", decisionId);
    const result = this.runtime.cancelCommand(decision.commandRunId);
    return {
      status: result.status,
      commandRunId: result.commandRunId,
      releasedLockIds: result.releasedLockIds,
      cancelledDecisionIds: result.cancelledDecisionIds,
    };
  }

  resumeInstructionText(commandRunId: string): string | null {
    const session = this.runtime.getSession(commandRunId);
    if (!session) return null;
    const capsule = this.runtime.store.capsules.read(commandRunId);
    const capsulePath = capsule
      ? this.runtime.paths.relative(this.runtime.paths.capsule(commandRunId))
      : session.resumeCapsulePath;
    const instruction = buildResumeInstruction(session, capsulePath);
    return [
      ...instruction.commands,
      "",
      instruction.planNote,
      instruction.manualFallback,
    ].join("\n");
  }

  /** Capsule enumeration via the official Iteration 4 runtime store API. */
  private listCapsules(): ResumeCapsule[] {
    return this.runtime.store.capsules.list();
  }

  private safe<T>(fn: () => T, fallback: T, malformedFiles: string[]): T {
    try {
      return fn();
    } catch (err) {
      if (err instanceof MalformedStateError) {
        malformedFiles.push(err.filePath);
        return fallback;
      }
      throw err;
    }
  }
}
