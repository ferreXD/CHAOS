/**
 * High-level runner: wires config + runtime into a RunnerLoop and drives it to a
 * terminal outcome, sleeping between polls while waiting for a human decision.
 */

import { systemClock, type Adapter, type Clock } from "../runtime.ts";
import type { RunnerConfig } from "../config/runnerConfig.ts";
import { createLogger, type Logger } from "../logger.ts";
import { RuntimeClient } from "../runtime/runtimeClient.ts";
import { SessionLeaseManager } from "../runtime/sessionLease.ts";
import { DecisionWatcher } from "../runtime/decisionWatcher.ts";
import { ResumeCoordinator } from "../runtime/resumeCoordinator.ts";
import { RunnerAudit } from "../audit/runnerAudit.ts";
import type { AgentSessionAdapter } from "./commandProcess.ts";
import { RunnerLoop } from "./runnerLoop.ts";
import type { RunnerRunResult } from "../protocol/runnerResult.ts";

export interface ChaosRunnerOptions {
  clock?: Clock;
  logger?: Logger;
  runnerId?: string;
  /** Inject a runtime client (tests share one runtime with the mock adapter). */
  runtimeClient?: RuntimeClient;
  /** Override the wait between polls (tests pass a no-op). */
  sleep?: (ms: number) => Promise<void>;
}

export interface RunParams {
  sourceCommand: string;
  changeId?: string | null;
  commandRunId?: string;
  adapter: AgentSessionAdapter;
  /** Session adapter identity recorded on the runtime session. */
  adapterName?: Adapter;
}

export class ChaosRunner {
  readonly config: RunnerConfig;
  readonly runtimeClient: RuntimeClient;
  readonly runnerId: string;
  private readonly clock: Clock;
  private readonly logger: Logger;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(config: RunnerConfig, options: ChaosRunnerOptions = {}) {
    this.config = config;
    this.clock = options.clock ?? systemClock;
    this.logger = options.logger ?? createLogger(config.logLevel);
    this.runnerId = options.runnerId ?? generateRunnerId(this.clock);
    this.runtimeClient = options.runtimeClient ?? RuntimeClient.fromConfig(config);
    this.sleep = options.sleep ?? defaultSleep;
  }

  /** Build a loop for a single run (exposed for step-driven tests). */
  buildLoop(params: RunParams): RunnerLoop {
    const lease = new SessionLeaseManager({
      runnersDir: this.config.runnersDir,
      runnerId: this.runnerId,
      clock: this.clock,
      ttlMs: this.config.sessionLeaseTtlMs,
      maxAutoResumeCycles: this.config.maxAutoResumeCycles,
      validate: this.config.validate,
      schemaDir: this.config.schemaDir,
    });
    const audit = new RunnerAudit({
      auditPath: lease.auditPath(),
      runnerId: this.runnerId,
      clock: this.clock,
      enabled: this.config.writeRunnerAudit,
    });
    const watcher = new DecisionWatcher(this.runtimeClient, this.config.interactionsRoot);
    const resumeCoordinator = new ResumeCoordinator(this.runtimeClient);

    return new RunnerLoop({
      runnerId: this.runnerId,
      runtimeClient: this.runtimeClient,
      adapter: params.adapter,
      lease,
      audit,
      watcher,
      resumeCoordinator,
      clock: this.clock,
      logger: this.logger,
      config: {
        maxAutoResumeCycles: this.config.maxAutoResumeCycles,
        allowAutoResumeWhenRunnerActive: this.config.allowAutoResumeWhenRunnerActive,
        stopOnNewMaterialDecision: this.config.stopOnNewMaterialDecision,
        decisionPollMs: this.config.decisionPollMs,
      },
      start: {
        sourceCommand: params.sourceCommand,
        changeId: params.changeId ?? null,
        ...(params.commandRunId ? { commandRunId: params.commandRunId } : {}),
        adapterName: params.adapterName ?? "unknown",
      },
    });
  }

  /** Run to a terminal outcome, polling while waiting for decisions. */
  async run(params: RunParams): Promise<RunnerRunResult> {
    const loop = this.buildLoop(params);
    // A generous safety bound so a stuck adapter can never spin forever.
    const maxTicks = 100000;
    let ticks = 0;
    while (!loop.isDone() && ticks < maxTicks) {
      const result = await loop.tick();
      ticks += 1;
      if (result.needsWait && !loop.isDone()) {
        await this.sleep(this.config.decisionPollMs);
      }
    }
    return loop.result();
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Filesystem-safe, schema-valid runner id (no colons/dots — used as a filename). */
export function generateRunnerId(clock: Clock): string {
  const stamp = clock.now().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(16).slice(2, 8);
  return `RUNNER-${stamp}-${rand}`;
}
