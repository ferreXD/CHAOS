/**
 * Safe/atomic filesystem primitives.
 *
 * Writes go to a sibling temp file, are flushed with fsync, and are moved into
 * place with a single rename. On Windows, Node's `fs.renameSync` uses
 * `MoveFileEx(..., MOVEFILE_REPLACE_EXISTING)`, which replaces an existing
 * destination atomically; on POSIX, rename is atomic by definition. This avoids
 * leaving partial JSON at the target path under normal operation.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Raised when persisted JSON is unreadable/corrupt. The bad file is preserved. */
export class MalformedStateError extends Error {
  readonly filePath: string;
  override readonly cause: unknown;
  constructor(filePath: string, cause: unknown) {
    super(
      `Malformed runtime state at ${filePath}: ${cause instanceof Error ? cause.message : String(cause)}. ` +
        `The file was preserved for inspection; run chaos:doctor.`,
    );
    this.name = "MalformedStateError";
    this.filePath = filePath;
    this.cause = cause;
  }
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/** Deterministic JSON serialisation (2-space indent, trailing newline). */
export function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

/**
 * Atomically write text to `filePath`. Temp file is created in the same
 * directory to guarantee the rename stays on one filesystem/volume.
 */
export function atomicWriteFile(filePath: string, contents: string): void {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  const tmp = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`,
  );
  let fd: number | undefined;
  try {
    fd = fs.openSync(tmp, "w");
    fs.writeSync(fd, contents);
    fs.fsyncSync(fd);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  try {
    fs.renameSync(tmp, filePath);
  } catch (err) {
    // Best-effort cleanup of the temp file if the rename failed.
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export function atomicWriteJson(filePath: string, value: unknown): void {
  atomicWriteFile(filePath, serialize(value));
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/** Matches the temp files produced by {@link atomicWriteFile}: `.<name>.<pid>.<ts>.<rand>.tmp`. */
const TEMP_FILE_RE = /^\..*\.tmp$/;

/**
 * Best-effort GC of orphaned atomic-write temp files (`.*.tmp`) older than
 * `olderThanMs`, recursively under `dir`. A live atomic write holds its temp for
 * microseconds, so the age threshold avoids racing an in-flight (or just-crashed)
 * writer while still cleaning temps left behind by a hard-killed process
 * (EA-X4 orphan-temp cleanup). Returns the paths removed. Never throws.
 */
export function sweepStaleTempFiles(dir: string, olderThanMs = 30_000, nowMs = Date.now()): string[] {
  const removed: string[] = [];
  let entries: fs.Dirent[];
  try {
    if (!fs.existsSync(dir)) return removed;
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return removed;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removed.push(...sweepStaleTempFiles(full, olderThanMs, nowMs));
      continue;
    }
    if (!TEMP_FILE_RE.test(entry.name)) continue;
    try {
      const stat = fs.statSync(full);
      if (nowMs - stat.mtimeMs >= olderThanMs) {
        fs.rmSync(full, { force: true });
        removed.push(full);
      }
    } catch {
      /* ignore a temp that vanished or is locked */
    }
  }
  return removed;
}

/**
 * Read + parse JSON. Missing file returns `undefined`. Corrupt JSON throws a
 * MalformedStateError (fail-safe: the file is never deleted or overwritten).
 */
export function readJsonIfExists<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    throw new MalformedStateError(filePath, err);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new MalformedStateError(filePath, err);
  }
}

export function readJson<T>(filePath: string): T {
  const value = readJsonIfExists<T>(filePath);
  if (value === undefined) {
    throw new MalformedStateError(filePath, new Error("file does not exist"));
  }
  return value;
}

/** Append a single object as one JSON line to a `.jsonl` file. */
export function appendJsonl(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, JSON.stringify(value) + "\n", "utf8");
}

/** Read a `.jsonl` file into an array (skips blank lines). */
export function readJsonl<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const out: T[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as T);
    } catch (err) {
      throw new MalformedStateError(filePath, err);
    }
  }
  return out;
}
