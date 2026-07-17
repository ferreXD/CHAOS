/**
 * Runner state machine.
 *
 * Small guard around the runner states so illegal transitions surface as errors
 * rather than silently corrupting the loop.
 */

import type { RunnerState } from "../protocol/runnerResult.ts";

const TRANSITIONS: Readonly<Record<RunnerState, ReadonlySet<RunnerState>>> = {
  created: new Set<RunnerState>(["starting", "failed", "cancelled", "ready-for-manual-resume"]),
  starting: new Set<RunnerState>(["running", "failed", "cancelled", "ready-for-manual-resume"]),
  running: new Set<RunnerState>([
    "waiting-for-decision",
    "completed",
    "failed",
    "cancelled",
    "abandoned",
    "ready-for-manual-resume",
  ]),
  "waiting-for-decision": new Set<RunnerState>([
    "auto-resuming",
    "running",
    "completed",
    "failed",
    "cancelled",
    "abandoned",
    "ready-for-manual-resume",
  ]),
  "auto-resuming": new Set<RunnerState>([
    "running",
    "completed",
    "failed",
    "cancelled",
    "abandoned",
    "ready-for-manual-resume",
  ]),
  completed: new Set<RunnerState>([]),
  cancelled: new Set<RunnerState>([]),
  failed: new Set<RunnerState>([]),
  abandoned: new Set<RunnerState>([]),
  "ready-for-manual-resume": new Set<RunnerState>([]),
};

export function canTransition(from: RunnerState, to: RunnerState): boolean {
  return TRANSITIONS[from].has(to);
}

export class RunnerStateMachine {
  private _state: RunnerState = "created";

  get state(): RunnerState {
    return this._state;
  }

  transition(to: RunnerState): RunnerState {
    if (to === this._state) return this._state;
    if (!canTransition(this._state, to)) {
      throw new Error(`Illegal runner transition ${this._state} -> ${to}`);
    }
    this._state = to;
    return this._state;
  }
}
