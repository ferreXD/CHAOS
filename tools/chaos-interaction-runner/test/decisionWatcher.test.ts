/** DecisionWatcher.observe classification. */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { DecisionWatcher } from "../src/runtime/decisionWatcher.ts";
import { makeEnv, PROCEED_OPTIONS, type RunnerEnv } from "./helpers.ts";

function watcher(env: RunnerEnv): DecisionWatcher {
  return new DecisionWatcher(env.runtimeClient, env.config.interactionsRoot);
}

function begin(env: RunnerEnv, changeId = "c1"): string {
  const r = env.runtimeClient.beginCommand({ sourceCommand: "chaos:apply", changeId });
  return r.commandRunId!;
}

function createDecision(env: RunnerEnv, runId: string): string {
  const r = env.runtimeClient.runtime.createDecision({
    commandRunId: runId,
    title: "Choose",
    context: "ctx",
    options: PROCEED_OPTIONS,
    nextStep: "continue",
  });
  return r.decisionId;
}

test("no-decision for a fresh running session", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    assert.equal(watcher(env).observe(runId).kind, "no-decision");
  } finally {
    env.cleanup();
  }
});

test("waiting when a decision is pending", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    const decisionId = createDecision(env, runId);
    const obs = watcher(env).observe(runId);
    assert.equal(obs.kind, "waiting");
    assert.equal(obs.decisionId, decisionId);
  } finally {
    env.cleanup();
  }
});

test("answered when a response exists, with the response attached", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    const decisionId = createDecision(env, runId);
    env.runtimeClient.runtime.answerDecision({
      decisionId,
      selectedOptionId: "proceed",
      selectedBy: "u",
      rationale: "ok",
    });
    const obs = watcher(env).observe(runId);
    assert.equal(obs.kind, "answered");
    assert.equal(obs.decisionId, decisionId);
    assert.equal(obs.response?.selectedOptionId, "proceed");
  } finally {
    env.cleanup();
  }
});

test("ignore set hides an already-forwarded answered decision", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    const decisionId = createDecision(env, runId);
    env.runtimeClient.runtime.answerDecision({
      decisionId,
      selectedOptionId: "proceed",
      selectedBy: "u",
    });
    const obs = watcher(env).observe(runId, new Set([decisionId]));
    assert.equal(obs.kind, "no-decision");
  } finally {
    env.cleanup();
  }
});

test("session-terminal once the command completes", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    env.runtimeClient.completeCommand(runId);
    const obs = watcher(env).observe(runId);
    assert.equal(obs.kind, "session-terminal");
    assert.equal(obs.sessionState, "completed");
  } finally {
    env.cleanup();
  }
});

test("session-missing for an unknown run", () => {
  const env = makeEnv();
  try {
    assert.equal(watcher(env).observe("RUN-nope").kind, "session-missing");
  } finally {
    env.cleanup();
  }
});

test("decision-closed when a pending decision is expired but the session waits", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    const decisionId = createDecision(env, runId);
    // Force the decision to an expired state while the session stays waiting.
    const p = env.runtimeClient.runtime.paths.decision(decisionId);
    const doc = JSON.parse(fs.readFileSync(p, "utf8"));
    doc.state = "expired";
    fs.writeFileSync(p, JSON.stringify(doc, null, 2));
    const obs = watcher(env).observe(runId);
    assert.equal(obs.kind, "decision-closed");
    assert.equal(obs.closedReason, "expired");
  } finally {
    env.cleanup();
  }
});

test("malformed when a runtime file is corrupt", () => {
  const env = makeEnv();
  try {
    const runId = begin(env);
    fs.writeFileSync(env.runtimeClient.runtime.paths.session(runId), "{ not json", "utf8");
    assert.equal(watcher(env).observe(runId).kind, "malformed");
  } finally {
    env.cleanup();
  }
});
