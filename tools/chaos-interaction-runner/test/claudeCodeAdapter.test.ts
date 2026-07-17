/**
 * ClaudeCodeSessionAdapter tests — driven against the fake-claude stdio stub so
 * they are deterministic and need no real `claude` CLI.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import * as os from "node:os";
import {
  ClaudeCodeSessionAdapter,
  buildClaudeArgs,
  buildLaunchPrompt,
} from "../src/runner/claudeCodeAdapter.ts";

const FAKE = path.resolve(import.meta.dirname, "../fixtures/fake-claude.mjs");

function makeAdapter(env: Record<string, string> = {}, ackTimeoutMs = 2000) {
  return new ClaudeCodeSessionAdapter({
    command: process.execPath, // node
    args: [FAKE],
    cwd: os.tmpdir(),
    env,
    ackTimeoutMs,
  });
}

const START = {
  commandRunId: "RUN-adapter-1",
  changeId: "change-adapter",
  sourceCommand: "chaos:propose",
  resumeCapsulePath: null,
};

async function waitFor(pred: () => boolean | Promise<boolean>, timeoutMs = 2000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await pred()) return true;
    await delay(10);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

test("start launches a live session and captures the session id", async () => {
  const a = makeAdapter();
  try {
    await a.start(START);
    assert.equal(await a.isAlive(), true);
    assert.ok(await waitFor(() => a.claudeSessionId === "fake-session-1"));
  } finally {
    await a.stop("test");
  }
});

test("send returns an acknowledgement when the agent's turn completes", async () => {
  const a = makeAdapter();
  try {
    await a.start(START);
    await waitFor(() => a.claudeSessionId !== null);
    const ack = await a.send({
      decisionId: "DEC-1",
      selectedOptionId: "proceed",
      message: "resume message",
    });
    assert.equal(ack.acknowledgedDecisionId, "DEC-1");
  } finally {
    await a.stop("test");
  }
});

test("send returns NO acknowledgement when the turn never completes (ack timeout)", async () => {
  // Skip results for both the launch turn and the resume turn → no turn ever
  // completes, so send must time out and return {} (runner will not consume).
  const a = makeAdapter({ FAKE_CLAUDE_SKIP_RESULT: "1,2" }, 150);
  try {
    await a.start(START);
    await waitFor(() => a.claudeSessionId !== null);
    const ack = await a.send({
      decisionId: "DEC-2",
      selectedOptionId: "proceed",
      message: "resume message",
    });
    assert.deepEqual(ack, {});
    assert.equal(await a.isAlive(), true);
  } finally {
    await a.stop("test");
  }
});

test("outcome is completed when the agent exits cleanly", async () => {
  const a = makeAdapter({ FAKE_CLAUDE_EXIT_AFTER_TURN: "1", FAKE_CLAUDE_EXIT_CODE: "0" });
  try {
    await a.start(START);
    assert.ok(await waitFor(async () => !(await a.isAlive())));
    assert.equal(a.outcome(), "completed");
  } finally {
    await a.stop("test");
  }
});

test("outcome is failed when the agent exits non-zero", async () => {
  const a = makeAdapter({ FAKE_CLAUDE_EXIT_AFTER_TURN: "1", FAKE_CLAUDE_EXIT_CODE: "3" });
  try {
    await a.start(START);
    assert.ok(await waitFor(async () => !(await a.isAlive())));
    assert.equal(a.outcome(), "failed");
  } finally {
    await a.stop("test");
  }
});

test("send returns {} once the session is dead", async () => {
  const a = makeAdapter({ FAKE_CLAUDE_EXIT_AFTER_TURN: "1", FAKE_CLAUDE_EXIT_CODE: "0" });
  await a.start(START);
  await waitFor(async () => !(await a.isAlive()));
  const ack = await a.send({ decisionId: "DEC-3", selectedOptionId: "proceed", message: "m" });
  assert.deepEqual(ack, {});
});

test("buildClaudeArgs assembles headless streaming flags with overrides last", () => {
  const args = buildClaudeArgs({ permissionMode: "acceptEdits", model: "claude-opus-4-8", extraArgs: ["--foo"] });
  assert.ok(args.includes("--input-format"));
  assert.ok(args.includes("stream-json"));
  assert.ok(args.includes("--permission-mode"));
  assert.equal(args[args.indexOf("--permission-mode") + 1], "acceptEdits");
  assert.equal(args[args.indexOf("--model") + 1], "claude-opus-4-8");
  assert.equal(args[args.length - 1], "--foo");
});

test("buildLaunchPrompt tells the agent to re-enter the run id and not self-consume", () => {
  const prompt = buildLaunchPrompt(START);
  assert.ok(prompt.includes("RUN-adapter-1"));
  assert.ok(prompt.includes("chaos_begin_command"));
  assert.match(prompt, /do NOT call chaos_mark_decision_consumed/i);
  assert.ok(prompt.includes("chaos:propose"));
});
