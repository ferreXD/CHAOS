/**
 * CHAOS Interaction Runner — public API (Iteration 5).
 *
 * A local live auto-resume orchestrator over the Iteration 1 runtime. It executes
 * a CHAOS command through a configured agent adapter, pauses on material
 * decisions, and auto-resumes the same live session while the runner lease is
 * alive. Dead/closed/unknown sessions fall back to Iteration 4's `chaos:resume`.
 */

export { ChaosRunner, generateRunnerId } from "./runner/chaosRunner.ts";
export type { ChaosRunnerOptions, RunParams } from "./runner/chaosRunner.ts";

export { RunnerLoop } from "./runner/runnerLoop.ts";
export type {
  RunnerLoopConfig,
  RunnerLoopDeps,
  RunnerStartInfo,
  TickResult,
} from "./runner/runnerLoop.ts";

export { resolveRunnerConfig } from "./config/runnerConfig.ts";
export type { RunnerConfig } from "./config/runnerConfig.ts";

export { createLogger } from "./logger.ts";
export type { Logger, LogLevel } from "./logger.ts";

export { RuntimeClient } from "./runtime/runtimeClient.ts";
export { SessionLeaseManager, isLeaseLive } from "./runtime/sessionLease.ts";
export type { RunnerLease, SessionLeaseOptions } from "./runtime/sessionLease.ts";
export { DecisionWatcher } from "./runtime/decisionWatcher.ts";
export type { DecisionObservation, ObservationKind } from "./runtime/decisionWatcher.ts";
export { ResumeCoordinator } from "./runtime/resumeCoordinator.ts";
export { agentMcpEnv, AGENT_MCP_TOOLS } from "./runtime/mcpClient.ts";

export { RunnerAudit } from "./audit/runnerAudit.ts";
export type { RunnerAuditEvent, RunnerAuditEventType } from "./audit/runnerAudit.ts";

export {
  MockAgentSessionAdapter,
  ProcessAgentSessionAdapter,
} from "./runner/commandProcess.ts";
export type {
  AgentSessionAdapter,
  AgentAck,
  AgentOutcome,
  MockBeat,
  RunnerStartInput,
} from "./runner/commandProcess.ts";

export { evaluateAutoResume } from "./runner/autoResumePolicy.ts";
export type { AutoResumeDecision, AutoResumePolicyInput } from "./runner/autoResumePolicy.ts";
export {
  validateResponse,
  checkManualStopFlag,
  checkLeaseLive,
  stopForClosedDecision,
  stopForInvalidResponse,
} from "./runner/stopConditions.ts";
export type { StopCondition, ResponseValidation } from "./runner/stopConditions.ts";
export { RunnerStateMachine, canTransition } from "./runner/runnerState.ts";
export { buildResumeMessage, buildAgentResumeInput } from "./runner/transcriptAdapter.ts";
export type { ResumeMessageInput, AgentResumeInput } from "./runner/transcriptAdapter.ts";

export {
  RUNNER_STATES,
  TERMINAL_RUNNER_STATES,
  isTerminalRunnerState,
} from "./protocol/runnerResult.ts";
export type {
  RunnerState,
  RunnerOutcome,
  StopReason,
  RunnerRunResult,
} from "./protocol/runnerResult.ts";
export { RunnerError, AdapterError, RunnerConfigError } from "./protocol/errors.ts";
