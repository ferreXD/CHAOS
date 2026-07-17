/**
 * Aggregate store facade.
 *
 * Owns the per-entity sub-stores and derives the workspace-level `index.json`
 * and `active.json` pointers from persisted sessions, decisions, and locks.
 */

import type { ActiveState, ActiveStateValue, InteractionIndex } from "../model/activeState.ts";
import { SessionStore } from "./sessionStore.ts";
import { DecisionStore } from "./decisionStore.ts";
import { LockStore } from "./lockStore.ts";
import { CapsuleStore } from "./capsuleStore.ts";
import { AuditStore } from "./auditStore.ts";
import { ActiveStateStore } from "./activeStateStore.ts";
import type { PathResolver } from "./pathResolver.ts";

export class InteractionStore {
  readonly paths: PathResolver;
  readonly sessions: SessionStore;
  readonly decisions: DecisionStore;
  readonly locks: LockStore;
  readonly capsules: CapsuleStore;
  readonly audit: AuditStore;
  readonly activeState: ActiveStateStore;

  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.sessions = new SessionStore(paths, validate);
    this.decisions = new DecisionStore(paths, validate);
    this.locks = new LockStore(paths, validate);
    this.capsules = new CapsuleStore(paths, validate);
    this.audit = new AuditStore(paths, validate);
    this.activeState = new ActiveStateStore(paths, validate);
  }

  /** Recompute `index.json` from persisted sessions and decisions. */
  rebuildIndex(now: string): void {
    const index: InteractionIndex = {
      schemaVersion: 1,
      sessions: this.sessions.list().map((s) => ({
        commandRunId: s.commandRunId,
        path: this.paths.relative(this.paths.session(s.commandRunId)),
        state: s.state,
        changeId: s.changeId,
        sourceCommand: s.sourceCommand,
      })),
      decisions: this.decisions.list().map((d) => ({
        decisionId: d.decisionId,
        path: this.paths.relative(this.paths.decision(d.decisionId)),
        state: d.state,
        commandRunId: d.commandRunId,
        changeId: d.changeId,
      })),
      locksPath: this.paths.relative(this.paths.locks()),
      updatedAt: now,
    };
    this.activeState.writeIndex(index);
  }

  /** Recompute `active.json` from persisted decisions and sessions. */
  rebuildActiveState(now: string): void {
    const pendingDecisions = this.decisions.list().filter((d) => d.state === "waiting");
    const readyToResume = this.sessions
      .list()
      .filter((s) => s.state === "ready-to-resume")
      .map((s) => s.commandRunId);

    let state: ActiveStateValue = "ready";
    if (pendingDecisions.length > 0) state = "waiting-for-user-decision";
    else if (readyToResume.length > 0) state = "ready-to-resume";

    const first = pendingDecisions[0];
    const active: ActiveState = {
      schemaVersion: 1,
      state,
      activeDecisionId: first ? first.decisionId : null,
      activeCommandRunId: first ? first.commandRunId : null,
      activeChangeId: first ? first.changeId : null,
      pendingDecisionIds: pendingDecisions.map((d) => d.decisionId),
      readyToResumeCommandRunIds: readyToResume,
      updatedAt: now,
      metadata: {},
    };
    this.activeState.writeActive(active);
  }

  /** Recompute both derived pointers. */
  refreshDerived(now: string): void {
    this.rebuildIndex(now);
    this.rebuildActiveState(now);
  }
}
