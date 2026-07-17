/**
 * Command session model + state machine.
 *
 * Mirrors `.chaos/interactions/schema/session.schema.json` and the transitions
 * declared in `.chaos/interactions/contracts/state-machine-contract.md`.
 */

export type SessionState =
  | "created"
  | "running"
  | "waiting-for-decision"
  | "ready-to-resume"
  | "resumed"
  | "completed"
  | "cancelled"
  | "expired"
  | "failed";

export type Adapter = "claude" | "copilot" | "unknown";

export type RequestedMode = "light" | "standard" | "strict" | null;

export interface CommandSession {
  schemaVersion: 1;
  commandRunId: string;
  sourceCommand: string;
  changeId: string | null;
  adapter: Adapter;
  state: SessionState;
  requestedMode: RequestedMode;
  activeDecisionIds: string[];
  answeredDecisionIds: string[];
  consumedDecisionIds: string[];
  lastCompletedStep: string | null;
  nextStep: string | null;
  lockIds: string[];
  resumeCapsulePath: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

export const SESSION_TERMINAL_STATES: ReadonlySet<SessionState> = new Set([
  "completed",
  "cancelled",
  "expired",
  "failed",
]);

/**
 * Allowed session transitions.
 *
 * The contract's core graph is honoured exactly. Two additional terminal edges
 * are exposed as **administrative** transitions, NOT as the normal path for a
 * resumed command to complete:
 *   - `ready-to-resume -> completed`
 *   - `ready-to-resume -> cancelled`
 *
 * These exist for runtime cleanup, CLI smoke paths, and no-runner environments
 * (Iteration 1 has no live auto-resume runner). Normal resumed execution should
 * prefer `ready-to-resume -> resumed -> completed`; a later iteration with a
 * runner is expected to route ordinary completion through `resumed`, while these
 * administrative edges remain valid for cleanup/no-runner cases.
 *
 * Documented as an intentional, additive superset of the contract graph — not
 * schema drift. See README.md and PATCH-SUMMARY.md.
 */
export const SESSION_TRANSITIONS: Readonly<Record<SessionState, ReadonlySet<SessionState>>> = {
  created: new Set(["running", "cancelled", "failed", "expired"]),
  running: new Set(["waiting-for-decision", "completed", "failed", "cancelled"]),
  "waiting-for-decision": new Set([
    "ready-to-resume",
    "cancelled",
    "expired",
    "failed",
  ]),
  "ready-to-resume": new Set([
    "resumed",
    "completed",
    "cancelled",
    "expired",
    "failed",
  ]),
  resumed: new Set(["running", "completed", "failed", "cancelled"]),
  completed: new Set([]),
  cancelled: new Set([]),
  expired: new Set([]),
  failed: new Set([]),
};

export function isTerminalSessionState(state: SessionState): boolean {
  return SESSION_TERMINAL_STATES.has(state);
}

export function canTransitionSession(from: SessionState, to: SessionState): boolean {
  return SESSION_TRANSITIONS[from]?.has(to) ?? false;
}
