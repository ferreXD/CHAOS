/** Shared test helpers: temp runtime rooted against the real Iteration 0 schemas. */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { InteractionRuntime } from "../src/services/interactionRuntime.ts";
import type { Clock, IdFactory } from "../src/services/identifiers.ts";

/** Absolute path to the authoritative Iteration 0 schema directory. */
export const REAL_SCHEMA_DIR = path.resolve(
  import.meta.dirname,
  "../../../.chaos/interactions/schema",
);

/** Deterministic, monotonically increasing clock (1s steps). */
export function fixedClock(startIso = "2026-07-06T17:30:00.000Z"): Clock {
  let t = new Date(startIso).getTime();
  return {
    now() {
      const d = new Date(t);
      t += 1000;
      return d;
    },
  };
}

/** Deterministic counter-based id factory (all ids match the schema pattern). */
export function counterIds(): IdFactory {
  let run = 0;
  let dec = 0;
  let lock = 0;
  let evt = 0;
  return {
    runId: () => `RUN-test-${++run}`,
    decisionId: () => `DEC-test-${++dec}`,
    lockId: () => `LOCK-test-${++lock}`,
    eventId: () => `EVT-test-${++evt}`,
  };
}

export interface TestRuntime {
  runtime: InteractionRuntime;
  root: string;
  cleanup: () => void;
}

export function makeRuntime(validate = true): TestRuntime {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-runtime-"));
  const runtime = new InteractionRuntime({
    root,
    schemaDir: REAL_SCHEMA_DIR,
    validate,
    clock: fixedClock(),
    idFactory: counterIds(),
  });
  return {
    runtime,
    root,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

export const SAMPLE_OPTIONS = [
  { id: "full-strict", label: "Run full strict workflow" },
  { id: "strict-risk-compact", label: "Run strict-risk compact execution", recommended: true },
  { id: "stop", label: "Stop" },
];
