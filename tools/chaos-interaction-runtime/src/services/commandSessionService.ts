/** Pure helpers for command session construction + transitions. */

import type { Adapter, CommandSession, RequestedMode, SessionState } from "../model/commandSession.ts";
import { canTransitionSession } from "../model/commandSession.ts";
import { InvalidStateTransitionError } from "./errors.ts";

export interface NewSessionInput {
  commandRunId: string;
  sourceCommand: string;
  changeId: string | null;
  adapter: Adapter;
  requestedMode: RequestedMode;
  now: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export function buildSession(input: NewSessionInput): CommandSession {
  return {
    schemaVersion: 1,
    commandRunId: input.commandRunId,
    sourceCommand: input.sourceCommand,
    changeId: input.changeId,
    adapter: input.adapter,
    state: "created",
    requestedMode: input.requestedMode,
    activeDecisionIds: [],
    answeredDecisionIds: [],
    consumedDecisionIds: [],
    lastCompletedStep: null,
    nextStep: null,
    lockIds: [],
    resumeCapsulePath: null,
    createdAt: input.now,
    lastSeenAt: input.now,
    expiresAt: input.expiresAt ?? null,
    metadata: input.metadata ?? {},
  };
}

/** Apply a validated state transition, updating `lastSeenAt`. Throws if invalid. */
export function transitionSession(
  session: CommandSession,
  to: SessionState,
  now: string,
): CommandSession {
  if (session.state === to) {
    return { ...session, lastSeenAt: now };
  }
  if (!canTransitionSession(session.state, to)) {
    throw new InvalidStateTransitionError("session", session.state, to);
  }
  return { ...session, state: to, lastSeenAt: now };
}

export function addUnique(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value];
}

export function removeValue(list: string[], value: string): string[] {
  return list.filter((v) => v !== value);
}
