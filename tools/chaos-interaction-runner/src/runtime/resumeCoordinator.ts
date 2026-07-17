/**
 * Bridges the runner to Iteration 4's explicit `chaos:resume`.
 *
 * When live auto-resume cannot (or must not) proceed, the coordinator makes sure
 * the session is left in a state a human can pick up: a resume capsule exists and
 * the caller is handed a `chaos:resume --run <id>` instruction. It never consumes
 * decisions and never mutates session/decision state beyond ensuring a capsule.
 */

import type { RuntimeClient } from "./runtimeClient.ts";

export class ResumeCoordinator {
  private readonly client: RuntimeClient;

  constructor(client: RuntimeClient) {
    this.client = client;
  }

  /** Ensure a resume capsule exists for the run; returns its path if resolvable. */
  ensureResumeCapsule(commandRunId: string): string | null {
    try {
      return this.client.ensureResumeCapsule(commandRunId);
    } catch {
      // Best effort: if the session cannot back a capsule, the instruction still
      // points the user at chaos:resume, which reports missing fields itself.
      return null;
    }
  }

  /** The explicit-resume instruction to surface to the user. */
  manualResumeInstruction(commandRunId: string | null): string {
    return commandRunId ? `chaos:resume --run ${commandRunId}` : "chaos:resume";
  }
}
