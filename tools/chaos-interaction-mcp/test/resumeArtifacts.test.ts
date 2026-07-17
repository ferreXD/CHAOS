/**
 * Static validation of the Claude-native chaos:resume artifacts (Iteration 4).
 *
 * Claude commands/skills/agents are Markdown contracts, so they are validated by
 * static inspection: presence of files + required safety language.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const read = (rel: string) => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(REPO_ROOT, rel));

const COMMAND = ".claude/commands/chaos-resume.md";
const AGENT = ".claude/agents/chaos-resume-orchestrator.md";
const SKILL = ".claude/skills/chaos-resume/SKILL.md";
const REFERENCES = [
  "resume-command-contract.md",
  "resume-candidate-resolution.md",
  "resume-capsule-contract.md",
  "resume-decision-consumption-policy.md",
  "resume-state-machine.md",
  "resume-mcp-tool-contract.md",
  "resume-safety-policy.md",
  "resume-examples.md",
].map((f) => `.claude/skills/chaos-resume/reference/${f}`);

test("command, agent, skill, and all reference files exist", () => {
  assert.ok(exists(COMMAND), "command missing");
  assert.ok(exists(AGENT), "agent missing");
  assert.ok(exists(SKILL), "skill missing");
  for (const ref of REFERENCES) assert.ok(exists(ref), `reference missing: ${ref}`);
});

test("agent frontmatter declares the orchestrator name", () => {
  assert.match(read(AGENT), /name:\s*chaos-resume-orchestrator/);
});

test("SKILL.md lists every reference file", () => {
  const skill = read(SKILL);
  for (const ref of REFERENCES) {
    const base = `reference/${path.basename(ref)}`;
    assert.ok(skill.includes(base), `SKILL.md does not list ${base}`);
  }
});

test("command encodes the mandatory safety language", () => {
  const cmd = read(COMMAND).toLowerCase();
  assert.ok(cmd.includes("read the interaction runtime first"), "must read runtime first");
  assert.ok(cmd.includes("do not rely on chat memory"), "must forbid chat-memory reliance");
  // Multiple candidates require user selection and STOP.
  assert.ok(/multiple resume candidates exist.*stop/s.test(cmd), "must stop on multiple candidates");
  // Consumption only after incorporation.
  assert.ok(
    cmd.includes("do not consume decisions until their content has been incorporated"),
    "must gate consumption on incorporation",
  );
  // MCP preferred, file fallback allowed.
  assert.ok(cmd.includes("prefer mcp tools"), "must prefer MCP");
  assert.ok(cmd.includes("fall back"), "must allow file fallback");
  // No candidate -> do not invent context.
  assert.ok(cmd.includes("do not invent context"), "must not invent context");
});

test("safety policy forbids consuming decisions before use and hand-writing state", () => {
  const policy = read(".claude/skills/chaos-resume/reference/resume-safety-policy.md").toLowerCase();
  assert.ok(policy.includes("only after"), "consume only after incorporation");
  assert.ok(policy.includes("never hand-write runtime json"), "forbid hand-writing state");
  assert.ok(policy.includes("same-change lock"), "respect same-change locks");
});
