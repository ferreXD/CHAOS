/**
 * Observes the runtime for the decision lifecycle of a single command run.
 *
 * The core is a pure `observe()` poll: it reads the current session + decisions
 * and classifies them. An optional `startWatching()` uses `fs.watch` on the
 * interactions root to trigger an immediate re-check between polls; it is only a
 * latency optimisation and always has the poll as a fallback (never a busy loop).
 */

import * as fs from "node:fs";
import { MalformedStateError, type DecisionResponse } from "../runtime.ts";
import type { RuntimeClient } from "./runtimeClient.ts";

export type ObservationKind =
  | "no-decision"
  | "waiting"
  | "answered"
  | "decision-closed"
  | "session-terminal"
  | "session-missing"
  | "malformed";

export interface DecisionObservation {
  kind: ObservationKind;
  decisionId?: string;
  response?: DecisionResponse;
  decisionState?: string;
  sessionState?: string;
  closedReason?: "cancelled" | "expired" | "superseded";
}

const SESSION_TERMINAL = new Set(["completed", "cancelled", "expired", "failed"]);
const DECISION_CLOSED: Record<string, "cancelled" | "expired" | "superseded"> = {
  cancelled: "cancelled",
  expired: "expired",
  superseded: "superseded",
};

export class DecisionWatcher {
  private readonly client: RuntimeClient;
  private readonly interactionsRoot: string;
  private fsWatcher: fs.FSWatcher | undefined;

  constructor(client: RuntimeClient, interactionsRoot: string) {
    this.client = client;
    this.interactionsRoot = interactionsRoot;
  }

  /**
   * Classify the current decision state for a run. `ignore` holds decision ids the
   * runner has already forwarded to the live agent, so they are not re-surfaced as
   * fresh "answered" work.
   */
  observe(commandRunId: string, ignore: ReadonlySet<string> = new Set()): DecisionObservation {
    try {
      const session = this.client.getSession(commandRunId);
      if (!session) return { kind: "session-missing" };
      const sessionState = session.state;

      if (SESSION_TERMINAL.has(sessionState)) {
        return { kind: "session-terminal", sessionState };
      }

      const decisions = this.client
        .listDecisionsForRun(commandRunId)
        .filter((d) => !ignore.has(d.decisionId));

      const waiting = decisions.find((d) => d.state === "waiting");
      if (waiting) {
        return { kind: "waiting", decisionId: waiting.decisionId, decisionState: "waiting", sessionState };
      }

      const answered = decisions.find((d) => d.state === "answered");
      if (answered) {
        const response = this.client.getResponse(answered.decisionId);
        return {
          kind: "answered",
          decisionId: answered.decisionId,
          decisionState: "answered",
          sessionState,
          ...(response ? { response } : {}),
        };
      }

      if (sessionState === "waiting-for-decision") {
        const closed = decisions.find((d) => d.state in DECISION_CLOSED);
        if (closed) {
          return {
            kind: "decision-closed",
            decisionId: closed.decisionId,
            decisionState: closed.state,
            closedReason: DECISION_CLOSED[closed.state]!,
            sessionState,
          };
        }
      }

      return { kind: "no-decision", sessionState };
    } catch (err) {
      if (err instanceof MalformedStateError) return { kind: "malformed" };
      throw err;
    }
  }

  /**
   * Start an fs.watch that calls `onChange` when interaction files change. Best
   * effort: if fs.watch is unavailable/errors, the caller's polling still drives
   * progress. Returns a disposer.
   */
  startWatching(onChange: () => void): () => void {
    try {
      this.fsWatcher = fs.watch(this.interactionsRoot, { recursive: true }, () => onChange());
      this.fsWatcher.on("error", () => this.stopWatching());
    } catch {
      // Recursive watch not supported on this platform — polling is the fallback.
      this.fsWatcher = undefined;
    }
    return () => this.stopWatching();
  }

  stopWatching(): void {
    if (this.fsWatcher) {
      try {
        this.fsWatcher.close();
      } catch {
        /* ignore */
      }
      this.fsWatcher = undefined;
    }
  }
}
