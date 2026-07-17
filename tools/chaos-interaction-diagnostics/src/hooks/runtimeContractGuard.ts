/**
 * Advisory runtime-contract guard.
 *
 * Detects and REPORTS violations of the interaction-runtime contract. Default
 * behaviour is report-first: write a violation event, do not block. Strict mode
 * may block, but only on BLOCKER severity and only when configured
 * (`enforcementMode: "strict"` + `strictBlocksOnBlocker`). It never mutates
 * runtime state.
 */

import * as path from "node:path";
import { InteractionRuntime } from "../runtime.ts";
import type { DiagnosticsConfig } from "../config/diagnosticsConfig.ts";
import { HookViolationWriter } from "./hookViolationWriter.ts";

export type RuntimeViolationType =
  | "continued-after-must-stop"
  | "write-while-decision-pending"
  | "stale-lock"
  | "expired-runner-lease"
  | "missing-resume-capsule"
  | "malformed-runtime-state"
  | "decision-not-consumed"
  | "unknown";

export type ViolationSeverity = "INFO" | "WARN" | "ERROR" | "BLOCKER";

export interface RuntimeHookViolation {
  id: string;
  timestamp: string;
  severity: ViolationSeverity;
  commandRunId?: string;
  changeId?: string;
  sourceCommand?: string;
  violationType: RuntimeViolationType;
  message: string;
  evidence: string[];
  recommendedAction: string;
}

export interface GuardResult {
  violations: RuntimeHookViolation[];
  /** True only in strict mode with a BLOCKER violation and strictBlocksOnBlocker. */
  blocked: boolean;
}

export interface MustStopContext {
  sourceCommand: string;
  commandRunId?: string;
  changeId?: string | null;
  /** Whether the command proceeded to do work after mustStop was signalled. */
  continued: boolean;
}

export interface WriteContext {
  sourceCommand: string;
  changeId: string;
  /** Repo-relative paths the command wrote/intends to write. */
  touchedFiles: string[];
}

let counter = 0;
function violationId(): string {
  counter += 1;
  return `IRV-${Date.now().toString(36)}-${counter}`;
}

function isProductionPath(p: string): boolean {
  const norm = p.replace(/\\/g, "/");
  // Interaction runtime state + generated CHAOS artifacts are not "production".
  return !norm.startsWith(".chaos/") && !norm.startsWith("openspec/") && !norm.startsWith("docs/");
}

export class RuntimeContractGuard {
  private readonly config: DiagnosticsConfig;
  private readonly runtime: InteractionRuntime;
  private readonly writer: HookViolationWriter;
  private readonly now: () => Date;

  constructor(
    config: DiagnosticsConfig,
    options: { runtime?: InteractionRuntime; now?: () => Date } = {},
  ) {
    this.config = config;
    this.runtime =
      options.runtime ??
      new InteractionRuntime({
        root: config.interactionsRoot,
        schemaDir: config.schemaDir,
        validate: false,
      });
    this.writer = new HookViolationWriter(config.hookViolationsPath, config.writeHookViolations);
    this.now = options.now ?? (() => new Date());
  }

  private make(
    violationType: RuntimeViolationType,
    severity: ViolationSeverity,
    message: string,
    recommendedAction: string,
    ctx: { commandRunId?: string; changeId?: string | null; sourceCommand?: string; evidence?: string[] },
  ): RuntimeHookViolation {
    return {
      id: violationId(),
      timestamp: this.now().toISOString(),
      severity,
      ...(ctx.commandRunId ? { commandRunId: ctx.commandRunId } : {}),
      ...(ctx.changeId ? { changeId: ctx.changeId } : {}),
      ...(ctx.sourceCommand ? { sourceCommand: ctx.sourceCommand } : {}),
      violationType,
      message,
      evidence: ctx.evidence ?? [],
      recommendedAction,
    };
  }

  /** Command continued despite a pending (mustStop) decision on its change/run. */
  checkContinuedAfterMustStop(ctx: MustStopContext): RuntimeHookViolation | null {
    if (!ctx.continued) return null;
    const active = this.runtime.getActiveDecision({
      changeId: ctx.changeId ?? null,
      ...(ctx.commandRunId ? { commandRunId: ctx.commandRunId } : {}),
    });
    if (active.status === "NO_ACTIVE_DECISION") return null;
    return this.make(
      "continued-after-must-stop",
      "BLOCKER",
      `Command ${ctx.sourceCommand} continued while a decision is still pending (mustStop was signalled).`,
      "Stop and answer the pending decision in the Decision Center before continuing.",
      { commandRunId: ctx.commandRunId, changeId: ctx.changeId, sourceCommand: ctx.sourceCommand },
    );
  }

  /** Production files written while a decision blocks the same change. */
  checkWriteWhileDecisionPending(ctx: WriteContext): RuntimeHookViolation | null {
    const productionWrites = ctx.touchedFiles.filter(isProductionPath);
    if (productionWrites.length === 0) return null;
    const active = this.runtime.getActiveDecision({ changeId: ctx.changeId });
    if (active.status === "NO_ACTIVE_DECISION") return null;
    return this.make(
      "write-while-decision-pending",
      "ERROR",
      `Command ${ctx.sourceCommand} wrote production files while change "${ctx.changeId}" has a pending decision.`,
      "Revert or pause; resolve the pending decision before modifying production files for this change.",
      {
        changeId: ctx.changeId,
        sourceCommand: ctx.sourceCommand,
        evidence: productionWrites.slice(0, 10).map((p) => p.replace(/\\/g, "/")),
      },
    );
  }

  /** Answered-but-unconsumed decisions after a command run completed. */
  checkDecisionNotConsumed(commandRunId: string): RuntimeHookViolation[] {
    const session = this.runtime.getSession(commandRunId);
    if (!session || session.state !== "completed") return [];
    const violations: RuntimeHookViolation[] = [];
    for (const d of this.runtime.store.decisions.list()) {
      if (d.commandRunId === commandRunId && d.state === "answered") {
        violations.push(
          this.make(
            "decision-not-consumed",
            "WARN",
            `Decision ${d.decisionId} was answered but not consumed before ${commandRunId} completed.`,
            "Mark the decision consumed via the command contract once its answer is incorporated.",
            {
              commandRunId,
              changeId: d.changeId,
              sourceCommand: session.sourceCommand,
              evidence: [path.posix.join("decisions", d.decisionId, "decision.json")],
            },
          ),
        );
      }
    }
    return violations;
  }

  /**
   * Record a batch of detected violations (writes to the stream unless disabled)
   * and compute whether the caller should block, per enforcement mode.
   */
  record(violations: Array<RuntimeHookViolation | null>): GuardResult {
    const real = violations.filter((v): v is RuntimeHookViolation => v !== null);
    if (this.config.enforcementMode === "off") {
      return { violations: [], blocked: false };
    }
    for (const v of real) this.writer.write(v);

    const hasBlocker = real.some((v) => v.severity === "BLOCKER");
    const blocked =
      this.config.enforcementMode === "strict" && this.config.strictBlocksOnBlocker && hasBlocker;
    return { violations: real, blocked };
  }
}
