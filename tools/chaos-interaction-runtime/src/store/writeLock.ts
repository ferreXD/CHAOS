/**
 * Cross-process write serialization for the file-backed runtime store.
 *
 * The runtime performs multi-file mutations (session + decision + lock + capsule
 * + derived pointers) that are individually atomic but not atomic as a group. If
 * two processes mutate the same store concurrently (the EA-X4 panel+runner race),
 * a read-modify-write can lose an update. A single coarse advisory lock around
 * each mutating operation makes writers serialize, so at most one mutation is in
 * flight at a time. Combined with `InteractionRuntime.reconcile()` (which heals a
 * crash that lands mid-mutation), this closes the lost-update window.
 *
 * The lock is a lock FILE created with O_EXCL. A crashed holder is detected and
 * broken by (a) its pid no longer being alive, or (b) an age fallback — so a hard
 * kill mid-hold never wedges the store.
 */

import * as fs from "node:fs";

export interface LockOptions {
  /** Max time to wait to acquire before throwing (ms). */
  timeoutMs?: number;
  /** Break a held lock whose holder pid is dead OR that is older than this (ms). */
  staleMs?: number;
}

/** Synchronous sleep without busy-spinning the CPU (via Atomics.wait). */
function sleepSync(ms: number): void {
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, Math.max(1, ms));
}

/** True if a process with `pid` appears to be alive. */
function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0); // signal 0 = existence probe
    return true;
  } catch (err) {
    // EPERM => exists but not permitted to signal (still alive); ESRCH => gone.
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

interface LockRecord {
  pid: number;
  at: number;
}

function readHolder(lockPath: string): LockRecord | null {
  try {
    const raw = fs.readFileSync(lockPath, "utf8");
    const rec = JSON.parse(raw) as Partial<LockRecord>;
    if (typeof rec.pid === "number" && typeof rec.at === "number") return { pid: rec.pid, at: rec.at };
  } catch {
    /* unreadable/torn lock record — treat as breakable */
  }
  return null;
}

/**
 * Acquire the lock file, run `fn`, and always release it. Blocks (synchronously)
 * until the lock is free, a stale holder is broken, or the timeout elapses.
 */
export function withFileLock<T>(lockPath: string, fn: () => T, opts: LockOptions = {}): T {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const staleMs = opts.staleMs ?? 15_000;
  const nowMs = () => Number(process.hrtime.bigint() / 1_000_000n);
  const deadline = nowMs() + timeoutMs;

  for (;;) {
    try {
      const fd = fs.openSync(lockPath, "wx"); // O_CREAT | O_EXCL | O_WRONLY
      try {
        fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: Date.now() }));
      } finally {
        fs.closeSync(fd);
      }
      break; // acquired
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      // Someone holds it. Break it if the holder is dead or the lock is stale.
      const holder = readHolder(lockPath);
      const dead = holder ? !isProcessAlive(holder.pid) : true;
      const old = holder ? Date.now() - holder.at >= staleMs : true;
      if (dead || old) {
        try {
          fs.rmSync(lockPath, { force: true });
        } catch {
          /* another waiter may have broken it first — retry */
        }
        continue;
      }
      if (nowMs() >= deadline) {
        throw new Error(`runtime write-lock timeout after ${timeoutMs}ms (held by pid ${holder?.pid ?? "unknown"})`);
      }
      sleepSync(3);
    }
  }

  try {
    return fn();
  } finally {
    try {
      fs.rmSync(lockPath, { force: true });
    } catch {
      /* best-effort release */
    }
  }
}
