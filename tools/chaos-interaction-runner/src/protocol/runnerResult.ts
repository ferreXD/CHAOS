/**
 * Runner result vocabulary: states, terminal outcomes, and stop reasons.
 *
 * These mirror the Iteration 0 auto-resume policy and the runner-lease contract.
 * The runner is intentionally conservative: any uncertainty resolves to
 * READY_FOR_MANUAL_RESUME so the session remains resumable via `chaos:resume`.
 */

export type RunnerState =
  | "created"
  | "starting"
  | "running"
  | "waiting-for-decision"
  | "auto-resuming"
  | "completed"
  | "cancelled"
  | "failed"
  | "abandoned"
  | "ready-for-manual-resume";

export const RUNNER_STATES: readonly RunnerState[] = [
  "created",
  "starting",
  "running",
  "waiting-for-decision",
  "auto-resuming",
  "completed",
  "cancelled",
  "failed",
  "abandoned",
  "ready-for-manual-resume",
];

export const TERMINAL_RUNNER_STATES: ReadonlySet<RunnerState> = new Set<RunnerState>([
  "completed",
  "cancelled",
  "failed",
  "abandoned",
  "ready-for-manual-resume",
]);

export function isTerminalRunnerState(state: RunnerState): boolean {
  return TERMINAL_RUNNER_STATES.has(state);
}

/** Final outcome reported to the caller. */
export type RunnerOutcome =
  | "COMPLETED"
  | "READY_FOR_MANUAL_RESUME"
  | "CANCELLED"
  | "FAILED"
  | "ABANDONED";

/**
 * Why the runner stopped auto-resuming / stopped entirely. Enumerates the stop
 * conditions from the auto-resume policy and the Iteration 5 brief.
 */
export type StopReason =
  | "max-cycles-reached"
  | "invalid-response"
  | "missing-rationale"
  | "decision-cancelled"
  | "decision-expired"
  | "decision-superseded"
  | "new-material-decision"
  | "unsafe-write-risk"
  | "malformed-state"
  | "lease-expired"
  | "process-dead"
  | "adapter-cannot-resume"
  | "auto-resume-disabled"
  | "run-mismatch"
  | "lock-conflict"
  | "pending-decision-exists"
  | "session-missing"
  | "user-cancelled"
  | "manual-stop-flag";

export interface RunnerRunResult {
  runnerId: string;
  commandRunId: string | null;
  changeId: string | null;
  sourceCommand: string;
  state: RunnerState;
  outcome: RunnerOutcome;
  autoResumeCyclesUsed: number;
  /** Present when the outcome is not a clean COMPLETED. */
  stopReason?: StopReason;
  /** Human-readable summary of the outcome. */
  message: string;
  /** Present when the caller should hand off to explicit resume. */
  manualResumeInstruction?: string;
  /** Decisions forwarded to the live agent this run. */
  forwardedDecisionIds: string[];
  /** Decisions the runner safely marked consumed (only on acknowledgement). */
  consumedDecisionIds: string[];
}
