#!/usr/bin/env node
/**
 * A tiny fake `claude` that speaks Claude Code's stream-json protocol, so the
 * ClaudeCodeSessionAdapter can be tested deterministically without the real CLI.
 *
 * Behaviour (env-driven):
 *   FAKE_CLAUDE_SESSION_ID     session id in the init/result events (default fake-session-1)
 *   FAKE_CLAUDE_NO_INIT        if set, do not emit the init event
 *   FAKE_CLAUDE_SKIP_RESULT    comma list of 1-based turn indices to NOT emit a result for
 *                              (simulates a hung / never-acknowledged turn)
 *   FAKE_CLAUDE_EXIT_AFTER_TURN exit the process right after this turn's output
 *   FAKE_CLAUDE_EXIT_CODE       exit code to use with EXIT_AFTER_TURN (default 0)
 *
 * Each user message received on stdin = one turn. Unless skipped, a turn emits an
 * assistant event followed by a result event (turn complete).
 */

import { createInterface } from "node:readline";

const SESSION_ID = process.env.FAKE_CLAUDE_SESSION_ID ?? "fake-session-1";
const SKIP = new Set(
  (process.env.FAKE_CLAUDE_SKIP_RESULT ?? "")
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n)),
);
const EXIT_AFTER_TURN = process.env.FAKE_CLAUDE_EXIT_AFTER_TURN
  ? Number.parseInt(process.env.FAKE_CLAUDE_EXIT_AFTER_TURN, 10)
  : null;
const EXIT_CODE = process.env.FAKE_CLAUDE_EXIT_CODE
  ? Number.parseInt(process.env.FAKE_CLAUDE_EXIT_CODE, 10)
  : 0;

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

if (!process.env.FAKE_CLAUDE_NO_INIT) {
  emit({ type: "system", subtype: "init", session_id: SESSION_ID });
}

let turn = 0;
const rl = createInterface({ input: process.stdin });

rl.on("line", () => {
  turn += 1;
  if (!SKIP.has(turn)) {
    emit({
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: `ok turn ${turn}` }] },
    });
    emit({
      type: "result",
      subtype: "success",
      is_error: false,
      session_id: SESSION_ID,
      result: `done ${turn}`,
      num_turns: turn,
    });
  }
  if (EXIT_AFTER_TURN !== null && turn === EXIT_AFTER_TURN) {
    process.exit(EXIT_CODE);
  }
});

rl.on("close", () => process.exit(0));
