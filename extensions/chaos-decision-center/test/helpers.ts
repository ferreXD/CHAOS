/** Shared test fixtures + a real temp runtime for the extension unit tests. */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { InteractionRuntime, type Decision, type CommandSession } from "../src/runtime.ts";
import { RuntimeClient } from "../src/runtime/runtimeClient.ts";
import type { ProjectionInput } from "../src/decisionCenter/decisionViewModel.ts";

export const REAL_SCHEMA_DIR = path.resolve(
  import.meta.dirname,
  "../../../.chaos/interactions/schema",
);

export function decisionFixture(overrides: Partial<Decision> = {}): Decision {
  return {
    schemaVersion: 1,
    decisionId: "DEC-test-1",
    commandRunId: "RUN-test-1",
    changeId: "change-1",
    sourceCommand: "chaos:propose",
    interactionType: "single-choice-decision",
    state: "waiting",
    title: "Choose execution profile",
    context: "A strict-risk change.",
    recommendation: null,
    recommendedOptionId: "strict-risk-compact",
    options: [
      { id: "full-strict", label: "Full strict", description: null, consequence: null, risk: null, recommended: false },
      { id: "strict-risk-compact", label: "Strict-risk compact", description: null, consequence: null, risk: null, recommended: true },
      { id: "stop", label: "Stop", description: null, consequence: null, risk: null, recommended: false },
    ],
    requiresRationale: false,
    independent: false,
    blocks: [],
    unlocksOn: {},
    createdAt: "2026-07-06T17:30:00.000Z",
    expiresAt: null,
    createdBy: "chaos:propose",
    metadata: {},
    ...overrides,
  };
}

export function sessionFixture(overrides: Partial<CommandSession> = {}): CommandSession {
  return {
    schemaVersion: 1,
    commandRunId: "RUN-test-1",
    sourceCommand: "chaos:propose",
    changeId: "change-1",
    adapter: "claude",
    state: "ready-to-resume",
    requestedMode: "strict",
    activeDecisionIds: [],
    answeredDecisionIds: ["DEC-test-1"],
    consumedDecisionIds: [],
    lastCompletedStep: null,
    nextStep: "continue",
    lockIds: [],
    resumeCapsulePath: "capsules/RUN-test-1.json",
    createdAt: "2026-07-06T17:30:00.000Z",
    lastSeenAt: "2026-07-06T17:35:00.000Z",
    expiresAt: null,
    metadata: {},
    ...overrides,
  };
}

/** Minimal ProjectionInput with sensible defaults; override per test. */
export function projectionInput(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
  return {
    active: null,
    decisions: [],
    sessions: [],
    capsules: [],
    locks: [],
    rootPath: "/repo/.chaos/interactions",
    rootExists: true,
    schemaDirExists: true,
    malformedFiles: [],
    maxHistoryItems: 50,
    now: "2026-07-07T00:00:00.000Z",
    decisionRelPath: (id) => `decisions/${id}/decision.json`,
    capsuleRelPath: (runId) => `capsules/${runId}.json`,
    responseFor: () => null,
    ...overrides,
  };
}

export interface TempRuntime {
  root: string;
  runtime: InteractionRuntime;
  client: RuntimeClient;
  cleanup: () => void;
}

/** A real runtime on a temp dir + a RuntimeClient pointing at the same root. */
export function makeTempRuntime(): TempRuntime {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-dc-"));
  const runtime = new InteractionRuntime({ root, schemaDir: REAL_SCHEMA_DIR, validate: true });
  const client = new RuntimeClient({
    root,
    schemaDir: REAL_SCHEMA_DIR,
    validate: true,
    userName: "vscode-user",
    maxHistoryItems: 50,
  });
  return { root, runtime, client, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

/** Seed a pending decision via the real runtime; returns ids. */
export function seedPendingDecision(
  runtime: InteractionRuntime,
  opts: { changeId?: string; requiresRationale?: boolean } = {},
): { commandRunId: string; decisionId: string } {
  const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: opts.changeId ?? "change-1" });
  const dec = runtime.createDecision({
    commandRunId: begin.commandRunId!,
    title: "Choose execution profile",
    context: "A strict-risk change.",
    options: [
      { id: "full-strict", label: "Full strict" },
      { id: "strict-risk-compact", label: "Strict-risk compact", recommended: true },
      { id: "stop", label: "Stop" },
    ],
    requiresRationale: opts.requiresRationale ?? false,
  });
  return { commandRunId: begin.commandRunId!, decisionId: dec.decisionId };
}
