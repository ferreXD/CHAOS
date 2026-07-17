#!/usr/bin/env node
/**
 * CLI for the CHAOS Interaction Runner (Iteration 5).
 *
 * Commands:
 *   run       Execute a configured agent command under runner control.
 *   run-mock  Run a self-contained mock scenario (auto-answers decisions like the
 *             Decision Center would) to demonstrate the auto-resume loop.
 *
 * Examples:
 *   node src/cli/chaos-interaction-runner.ts run \
 *     --command "chaos:apply request-context-middleware" --change request-context-middleware
 *   node src/cli/chaos-interaction-runner.ts run-mock --scenario pending-decision-then-answer
 *
 * Global flags: see config/runnerConfig.ts (--root, --schema-dir, --agent-command,
 * --agent-args, --max-auto-resume-cycles, --decision-poll-ms, --session-lease-ttl-ms,
 * --allow-process-resume, --no-validate, --log-level, ...).
 */

import { resolveRunnerConfig, type RunnerConfig } from "../config/runnerConfig.ts";
import { createLogger } from "../logger.ts";
import { ChaosRunner } from "../runner/chaosRunner.ts";
import { RuntimeClient } from "../runtime/runtimeClient.ts";
import {
  MockAgentSessionAdapter,
  ProcessAgentSessionAdapter,
  type AgentSessionAdapter,
  type MockBeat,
} from "../runner/commandProcess.ts";
import { ClaudeCodeSessionAdapter, buildClaudeArgs } from "../runner/claudeCodeAdapter.ts";
import { readAutoResumeGate, claudeAdapterAllowed } from "../config/featureGate.ts";
import type { Adapter, DecisionOption } from "../runtime.ts";

function flagValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const next = argv[idx + 1];
  return next && !next.startsWith("--") ? next : undefined;
}

function print(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

const PROCEED_OPTIONS: DecisionOption[] = [
  { id: "proceed", label: "Proceed with the recommended path", recommended: true },
  { id: "stop", label: "Stop" },
];

const SCENARIOS: Record<string, MockBeat[]> = {
  "pending-decision-then-answer": [
    { type: "decision", title: "Choose execution profile", options: PROCEED_OPTIONS, nextStep: "continue" },
    { type: "complete" },
  ],
  "two-decisions": [
    { type: "decision", title: "Choose execution profile", options: PROCEED_OPTIONS, nextStep: "step-1" },
    { type: "decision", title: "Confirm risk posture", options: PROCEED_OPTIONS, nextStep: "step-2" },
    { type: "complete" },
  ],
  "no-decision": [{ type: "complete" }],
};

async function runMock(config: RunnerConfig, scenario: string): Promise<number> {
  const script = SCENARIOS[scenario];
  if (!script) {
    process.stderr.write(
      `Unknown scenario "${scenario}". Available: ${Object.keys(SCENARIOS).join(", ")}\n`,
    );
    return 2;
  }
  const logger = createLogger(config.logLevel);
  const runtimeClient = RuntimeClient.fromConfig(config);
  const adapter = new MockAgentSessionAdapter({ runtime: runtimeClient.runtime, script });
  const runner = new ChaosRunner(config, { runtimeClient, logger });

  const loop = runner.buildLoop({
    sourceCommand: "chaos:mock",
    changeId: `mock-${scenario}`,
    adapter,
    adapterName: "unknown",
  });

  // Drive the loop, simulating the Decision Center answering pending decisions.
  let ticks = 0;
  while (!loop.isDone() && ticks < 10000) {
    const t = await loop.tick();
    ticks += 1;
    if (t.needsWait && !loop.isDone()) {
      autoAnswerPending(runtimeClient);
    }
  }

  const result = loop.result();
  print(result);
  logger.info(`run-mock finished: ${result.outcome}`);
  return result.outcome === "COMPLETED" ? 0 : 1;
}

/** Simulate the human answering the current pending decision (recommended option). */
function autoAnswerPending(client: RuntimeClient): void {
  const active = client.runtime.getActiveDecision();
  if (active.status !== "ACTIVE_DECISION" || !active.decision) return;
  const decision = active.decision;
  const recommended =
    decision.options.find((o) => o.recommended) ?? decision.options.find((o) => o.id !== "stop");
  if (!recommended) return;
  client.runtime.answerDecision({
    decisionId: decision.decisionId,
    selectedOptionId: recommended.id,
    selectedBy: "run-mock",
    rationale: "Auto-answered by run-mock (simulated Decision Center).",
    source: "manual",
  });
}

async function runProcess(config: RunnerConfig, argv: string[]): Promise<number> {
  const sourceCommand = flagValue(argv, "command");
  if (!sourceCommand) {
    process.stderr.write("Missing required --command \"<chaos:command ...>\"\n");
    return 2;
  }
  const changeId = flagValue(argv, "change") ?? null;
  const logger = createLogger(config.logLevel);

  let adapter: AgentSessionAdapter;
  let adapterName: Adapter;

  if (config.sessionAdapter === "mock") {
    process.stderr.write("The mock adapter is only available via the run-mock command.\n");
    return 2;
  } else if (config.sessionAdapter === "claude-code") {
    const gate = readAutoResumeGate(config.repositoryRoot);
    const decision = claudeAdapterAllowed(gate);
    if (!decision.allowed && !config.forceAdapter) {
      process.stderr.write(`Refusing to start the claude-code adapter. ${decision.reason}\n`);
      return 2;
    }
    adapter = new ClaudeCodeSessionAdapter({
      command: config.agentCommand,
      args: buildClaudeArgs({
        permissionMode: config.claudePermissionMode,
        model: config.claudeModel,
        extraArgs: config.agentArgs,
      }),
      cwd: config.workingDirectory,
      env: {},
      ackTimeoutMs: config.agentAckTimeoutMs,
      logger,
    });
    adapterName = "claude";
    logger.info(
      `Live auto-resume via the claude-code adapter ` +
        `(permission-mode=${config.claudePermissionMode}${config.forceAdapter ? ", gate forced" : ""}).`,
    );
  } else {
    adapter = new ProcessAgentSessionAdapter({
      command: config.agentCommand,
      args: config.agentArgs,
      cwd: config.workingDirectory,
      env: {},
      allowResume: config.allowProcessResume,
      logger,
    });
    adapterName = (flagValue(argv, "adapter") as Adapter | undefined) ?? "unknown";
  }

  const runner = new ChaosRunner(config, { logger });
  let result;
  try {
    result = await runner.run({ sourceCommand, changeId, adapter, adapterName });
  } finally {
    // Always tear the live session down (the loop releases the lease, not the adapter).
    await adapter.stop("run-finished");
  }
  print(result);
  if (result.manualResumeInstruction) {
    logger.info(`Not auto-resumed. Run: ${result.manualResumeInstruction}`);
  }
  return result.outcome === "COMPLETED" ? 0 : 1;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "--help" || command === "help") {
    process.stdout.write(
      "Usage: chaos-interaction-runner <run|run-mock> [flags]\n" +
        "  run       --command \"<chaos:command>\" [--change <id>]\n" +
        "            [--session-adapter process|claude-code] (default process)\n" +
        "            claude-code: --claude-model <m> --claude-permission-mode <mode>\n" +
        "                         --agent-ack-timeout-ms <n> --force-adapter\n" +
        "            (claude-code requires autoResume.enabled + adapter: claude-code in .chaos/config.yaml)\n" +
        "  run-mock  --scenario <pending-decision-then-answer|two-decisions|no-decision>\n",
    );
    return command ? 0 : 1;
  }

  const config = resolveRunnerConfig(argv.slice(1));

  switch (command) {
    case "run":
      return await runProcess(config, argv.slice(1));
    case "run-mock":
      return await runMock(config, flagValue(argv.slice(1), "scenario") ?? "pending-decision-then-answer");
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(
      `ERROR: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}\n`,
    );
    process.exit(1);
  });
