/**
 * Runner liveness lease.
 *
 * A live runner writes and refreshes `.chaos/interactions/runners/<runnerId>.json`.
 * The presence of a *non-expired* lease is what distinguishes a live,
 * auto-resumable session from a dead one that must fall back to `chaos:resume`.
 *
 * Liveness is heartbeat-based, not pid-based: a crashed runner cannot refresh its
 * lease, and an expired lease never deletes or rewrites runtime state.
 *
 * See `.chaos/interactions/contracts/runner-lease-contract.md`.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  atomicWriteJson,
  readJsonIfExists,
  validateAgainstSchemaFile,
  type Clock,
} from "../runtime.ts";
import type { RunnerState } from "../protocol/runnerResult.ts";

export interface RunnerLease {
  schemaVersion: 1;
  runnerId: string;
  commandRunId: string | null;
  changeId: string | null;
  sourceCommand: string;
  processId: number | null;
  state: RunnerState;
  startedAt: string;
  lastHeartbeatAt: string;
  leaseExpiresAt: string;
  autoResumeCyclesUsed: number;
  maxAutoResumeCycles: number;
  metadata: Record<string, unknown>;
}

export interface SessionLeaseOptions {
  runnersDir: string;
  runnerId: string;
  clock: Clock;
  ttlMs: number;
  maxAutoResumeCycles: number;
  validate?: boolean;
  schemaDir?: string;
}

const SCHEMA_FILE = "runner-lease.schema.json";

export class SessionLeaseManager {
  readonly runnerId: string;
  private readonly runnersDir: string;
  private readonly clock: Clock;
  private readonly ttlMs: number;
  private readonly maxAutoResumeCycles: number;
  private readonly validate: boolean;
  private readonly schemaDir: string | undefined;
  private lease: RunnerLease | null = null;

  constructor(options: SessionLeaseOptions) {
    this.runnerId = options.runnerId;
    this.runnersDir = options.runnersDir;
    this.clock = options.clock;
    this.ttlMs = options.ttlMs;
    this.maxAutoResumeCycles = options.maxAutoResumeCycles;
    this.validate = options.validate ?? true;
    this.schemaDir = options.schemaDir;
  }

  leasePath(): string {
    return path.join(this.runnersDir, `${this.runnerId}.json`);
  }

  stopFlagPath(): string {
    return path.join(this.runnersDir, `${this.runnerId}.stop`);
  }

  auditPath(): string {
    return path.join(this.runnersDir, `${this.runnerId}.audit.jsonl`);
  }

  /** True if a manual stop flag file exists for this runner. */
  hasStopFlag(): boolean {
    return fs.existsSync(this.stopFlagPath());
  }

  private now(): string {
    return this.clock.now().toISOString();
  }

  private expiry(fromIso: string): string {
    return new Date(new Date(fromIso).getTime() + this.ttlMs).toISOString();
  }

  private persist(lease: RunnerLease): void {
    if (this.validate && this.schemaDir) {
      validateAgainstSchemaFile(
        `runner-lease:${lease.runnerId}`,
        path.join(this.schemaDir, SCHEMA_FILE),
        lease,
      );
    }
    atomicWriteJson(this.leasePath(), lease);
    this.lease = lease;
  }

  /** Create the initial lease for a runner (state `created`). */
  register(input: {
    commandRunId: string | null;
    changeId: string | null;
    sourceCommand: string;
    processId?: number | null;
    state?: RunnerState;
    metadata?: Record<string, unknown>;
  }): RunnerLease {
    const now = this.now();
    const lease: RunnerLease = {
      schemaVersion: 1,
      runnerId: this.runnerId,
      commandRunId: input.commandRunId,
      changeId: input.changeId,
      sourceCommand: input.sourceCommand,
      processId: input.processId ?? null,
      state: input.state ?? "created",
      startedAt: now,
      lastHeartbeatAt: now,
      leaseExpiresAt: this.expiry(now),
      autoResumeCyclesUsed: 0,
      maxAutoResumeCycles: this.maxAutoResumeCycles,
      metadata: input.metadata ?? {},
    };
    this.persist(lease);
    return lease;
  }

  /** Refresh the heartbeat/expiry and optionally advance mutable fields. */
  heartbeat(patch: Partial<
    Pick<RunnerLease, "state" | "commandRunId" | "changeId" | "autoResumeCyclesUsed" | "processId">
  > = {}): RunnerLease {
    const current = this.lease;
    if (!current) {
      throw new Error("Cannot heartbeat before register().");
    }
    const now = this.now();
    const lease: RunnerLease = {
      ...current,
      ...patch,
      lastHeartbeatAt: now,
      leaseExpiresAt: this.expiry(now),
    };
    this.persist(lease);
    return lease;
  }

  /** Write a terminal state without extending the lease (keeps file for audit). */
  release(state: RunnerState): RunnerLease {
    const current = this.lease;
    if (!current) {
      throw new Error("Cannot release before register().");
    }
    const now = this.now();
    const lease: RunnerLease = { ...current, state, lastHeartbeatAt: now };
    // Do NOT extend leaseExpiresAt: a released runner is no longer live.
    this.persist(lease);
    return lease;
  }

  current(): RunnerLease | null {
    return this.lease;
  }

  /** Read the lease file from disk (may throw MalformedStateError on corruption). */
  read(): RunnerLease | null {
    return readJsonIfExists<RunnerLease>(this.leasePath()) ?? null;
  }

  isExpired(lease: RunnerLease, nowIso: string = this.now()): boolean {
    return new Date(nowIso).getTime() > new Date(lease.leaseExpiresAt).getTime();
  }

  isLive(lease: RunnerLease, nowIso: string = this.now()): boolean {
    return !this.isExpired(lease, nowIso);
  }
}

/** Pure liveness check usable without a manager instance (e.g. from the watcher). */
export function isLeaseLive(lease: RunnerLease, nowIso: string): boolean {
  return new Date(nowIso).getTime() <= new Date(lease.leaseExpiresAt).getTime();
}
