/**
 * Iteration 6 static validation: CHAOS command contracts are interaction-runtime
 * aware and coherent with Iteration 7 diagnostics. Command contracts are Markdown,
 * so these are static-inspection tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const REPO = path.resolve(import.meta.dirname, "../../..");
const CMD = path.join(REPO, ".claude", "commands");
const SKILL = path.join(REPO, ".claude", "skills", "chaos-interaction-runtime");

const read = (p: string) => fs.readFileSync(p, "utf8");
const exists = (p: string) => fs.existsSync(p);
const cmd = (name: string) => read(path.join(CMD, `${name}.md`));

const MUTATING = [
  "chaos-apply",
  "chaos-propose",
  "chaos-review",
  "chaos-archive",
  "chaos-verify",
  "chaos-sync",
  "chaos-todo",
  "chaos-retro",
  "chaos-code-review",
];

const ALL_COMMANDS = fs
  .readdirSync(CMD)
  .filter((f) => f.startsWith("chaos-") && f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

test("1. shared interaction-runtime command protocol exists", () => {
  assert.ok(exists(path.join(SKILL, "SKILL.md")), "SKILL.md missing");
  for (const ref of [
    "command-preflight-protocol.md",
    "material-decision-protocol.md",
    "runtime-resume-handoff.md",
    "command-completion-policy.md",
    "diagnostics-integration-contract.md",
    "fallback-protocol.md",
  ]) {
    assert.ok(exists(path.join(SKILL, "reference", ref)), `reference missing: ${ref}`);
  }
});

test("17. shared fallback protocol exists and forbids silent bypass", () => {
  const fb = read(path.join(SKILL, "reference", "fallback-protocol.md")).toLowerCase();
  assert.ok(fb.includes("no silent bypass") || fb.includes("silent bypass"));
  assert.ok(fb.includes("stop and ask"));
});

test("mutating commands link the shared protocol + include preflight/decision/mustStop", () => {
  for (const c of MUTATING) {
    const text = cmd(c);
    const lower = text.toLowerCase();
    assert.ok(
      text.includes(".claude/skills/chaos-interaction-runtime/SKILL.md"),
      `${c} does not link the shared protocol`,
    );
    assert.ok(lower.includes("preflight"), `${c} missing preflight`);
    assert.ok(lower.includes("chaos_create_decision"), `${c} missing material-decision protocol`);
    assert.ok(lower.includes("muststop"), `${c} missing mustStop behaviour`);
  }
});

test("2/4. chaos:apply has preflight + material decisions that stop", () => {
  const text = cmd("chaos-apply");
  assert.ok(text.includes("chaos_begin_command"));
  assert.ok(text.toLowerCase().includes("preflight"));
  assert.ok(text.includes("chaos_create_decision"));
  assert.ok(/mustStop/i.test(text) && /STOP/.test(text));
});

test("3. chaos:apply says a pending same-change decision blocks apply", () => {
  const lower = cmd("chaos-apply").toLowerCase();
  assert.ok(lower.includes("compatiblewithpendingdecision: **false**"));
  assert.ok(lower.includes("pending same-change decision"));
  assert.ok(lower.includes("blocks apply"));
});

test("5. chaos:propose includes proposal approval / material decision protocol", () => {
  const lower = cmd("chaos-propose").toLowerCase();
  assert.ok(lower.includes("proposal approval"));
  assert.ok(lower.includes("chaos_create_decision"));
  assert.ok(lower.includes("do not proceed into apply"));
});

test("6. chaos:review includes accept/reject/rework/waive material decisions", () => {
  const lower = cmd("chaos-review").toLowerCase();
  assert.ok(lower.includes("accept") && lower.includes("reject"));
  assert.ok(lower.includes("rework") && lower.includes("waive"));
  assert.ok(lower.includes("chaos_create_decision"));
});

test("7. chaos:archive refuses unresolved pending decisions", () => {
  const lower = cmd("chaos-archive").toLowerCase();
  assert.ok(lower.includes("do not archive") || lower.includes("do not archive a change"));
  assert.ok(lower.includes("pending decision"));
});

test("8. chaos:sync respects locks and pending decisions", () => {
  const lower = cmd("chaos-sync").toLowerCase();
  assert.ok(lower.includes("pending decision"));
  assert.ok(lower.includes("not bypass locks"));
});

test("9. chaos:todo references diagnostic Todo Candidates + runtime decisions for durable writes", () => {
  const lower = cmd("chaos-todo").toLowerCase();
  assert.ok(lower.includes("todo candidate"));
  assert.ok(lower.includes("diagnostics") || lower.includes("chaos:doctor"));
  assert.ok(lower.includes("do not write durable todo"));
  assert.ok(lower.includes("chaos_create_decision"));
});

test("10/11. chaos:resume: no chat memory + consume only after incorporation", () => {
  const lower = cmd("chaos-resume").toLowerCase();
  assert.ok(lower.includes("do not rely on chat memory"));
  assert.ok(lower.includes("after") && lower.includes("incorporat"));
  assert.ok(lower.includes(".claude/skills/chaos-interaction-runtime/skill.md"));
});

test("12. chaos:doctor preserves Iteration 7 diagnostics integration (skill)", () => {
  const doctor = read(path.join(REPO, ".claude/skills/chaos-doctor/SKILL.md"));
  assert.ok(/##\s+Interaction Runtime health/.test(doctor));
  assert.ok(doctor.toLowerCase().includes("read-only"));
  assert.ok(doctor.toLowerCase().includes("no auto-repair"));
});

test("13. chaos:status preserves Iteration 7 compact runtime summary", () => {
  const skill = read(path.join(REPO, ".claude/skills/chaos-status/SKILL.md"));
  assert.ok(/##\s+Interaction Runtime summary/.test(skill));
  const cmdLower = cmd("chaos-status").toLowerCase();
  assert.ok(cmdLower.includes("compact"));
  assert.ok(cmdLower.includes("read-only"));
});

test("14. no command instructs bypassing a pending runtime decision", () => {
  const bypass = [
    /ignore (the )?pending decision/i,
    /bypass (the )?(pending )?decision/i,
    /proceed despite (a )?pending decision/i,
    /proceeding anyway/i,
    /assuming approved/i,
  ];
  for (const c of ALL_COMMANDS) {
    const text = cmd(c);
    for (const re of bypass) {
      assert.ok(!re.test(text), `${c} contains bypass language: ${re}`);
    }
  }
});

test("15. no command claims auto-resume works after runner death", () => {
  const bad = [/auto-resume\s+works\s+after\s+runner\s+death/i, /resumes?\s+after\s+runner\s+death/i];
  for (const c of ALL_COMMANDS) {
    const text = cmd(c);
    for (const re of bad) assert.ok(!re.test(text), `${c} overclaims auto-resume: ${re}`);
  }
});

test("16. no command instructs destructive auto-repair by default", () => {
  const bad = [/(will|should|may)\s+auto-repair/i, /destructive auto-repair by default/i];
  for (const c of ALL_COMMANDS) {
    const text = cmd(c);
    for (const re of bad) assert.ok(!re.test(text), `${c} instructs auto-repair: ${re}`);
  }
});

test("18. command integration references Iteration 7 diagnostics where appropriate", () => {
  // The shared skill + read-only commands reference doctor/status/diagnostics.
  const shared = read(path.join(SKILL, "reference", "diagnostics-integration-contract.md")).toLowerCase();
  assert.ok(shared.includes("iteration 7"));
  assert.ok(shared.includes("chaos:doctor") && shared.includes("chaos:status"));
  assert.ok(cmd("chaos-help").toLowerCase().includes("chaos:doctor"));
});

// --- Feature flags + decision batching (opt-out UX) ---

test("preflight has an enablement gate honouring commands.enabled", () => {
  const pre = read(path.join(SKILL, "reference", "command-preflight-protocol.md")).toLowerCase();
  assert.ok(pre.includes("enablement gate") || pre.includes("commands.enabled"));
  assert.ok(pre.includes("opt-out"));
  assert.ok(pre.includes("classic in-chat") || pre.includes("chat-interactive"));
});

test("decision-batching policy exists with both modes", () => {
  assert.ok(exists(path.join(SKILL, "reference", "decision-batching-policy.md")));
  const batch = read(path.join(SKILL, "reference", "decision-batching-policy.md")).toLowerCase();
  assert.ok(batch.includes("sequential"));
  assert.ok(batch.includes("batch-independent"));
  assert.ok(batch.includes("independent"));
  // Dependent decisions still require a later round (no overclaim).
  assert.ok(batch.includes("dependent"));
});

test("SKILL.md documents the boolean feature flags + auto-resume flag", () => {
  const skill = read(path.join(SKILL, "SKILL.md")).toLowerCase();
  assert.ok(skill.includes("commands.enabled"));
  assert.ok(skill.includes("decisionbatching") || skill.includes("decisionBatching".toLowerCase()));
  assert.ok(skill.includes("autoresume.enabled"));
  // Auto-resume is off by default; both mechanisms (headless adapter + in-session hook)
  // are documented.
  assert.ok(skill.includes("default `false`") || skill.includes("opt-in"));
  assert.ok(skill.includes("in-session") || skill.includes("adapter"));
});

test("config.yaml declares the boolean flags additively", () => {
  const cfg = read(path.join(REPO, ".chaos/config.yaml"));
  assert.ok(/commands:\s/.test(cfg));
  assert.ok(/enabled:\s*true/.test(cfg));
  assert.ok(/decisionBatching:\s*(sequential|batch-independent)/.test(cfg));
  assert.ok(/autoResume:/.test(cfg));
  assert.ok(/adapter:\s*(none|mock|claude-code)/.test(cfg));
});

test("chaos:apply references the enablement + batching flags", () => {
  const lower = cmd("chaos-apply").toLowerCase();
  assert.ok(lower.includes("commands.enabled"));
  assert.ok(lower.includes("decisionbatching") || lower.includes("batch-independent"));
});

// --- Executor (agent) integration: agents run material decisions through the runtime ---

const AGENTS = path.join(REPO, ".claude", "agents");
const agent = (name: string) => read(path.join(AGENTS, `${name}.md`));

const MUTATING_AGENTS = [
  "chaos-apply-orchestrator",
  "chaos-sync-orchestrator",
  "chaos-proposal-architect",
  "chaos-proposal-reviewer",
  "chaos-archive-orchestrator",
  "chaos-verify-orchestrator",
  "chaos-retro-orchestrator",
  "chaos-todo-curator",
];

test("mutating orchestrator agents prefer MCP with a runtime-CLI fallback, governing chat", () => {
  for (const a of MUTATING_AGENTS) {
    const flat = agent(a).replace(/\s+/g, " ").toLowerCase();
    assert.ok(flat.includes("interaction runtime"), `${a}: no runtime section`);
    assert.ok(flat.includes("decision center"), `${a}: no Decision Center handoff`);
    assert.ok(flat.includes("prefer") && flat.includes("mcp"), `${a}: must prefer the MCP tools`);
    assert.ok(
      flat.includes("fall back") && (flat.includes("cli") || flat.includes("create-decision")),
      `${a}: must document the runtime CLI fallback`,
    );
    assert.ok(flat.includes("muststop"), `${a}: no mustStop stop rule`);
    // The chat framing must be demoted to fallback, not the primary path.
    assert.ok(flat.includes("govern") && flat.includes("fallback"), `${a}: chat must be the fallback`);
  }
});

test("explicit-allowlist mutating agents grant the chaos-interaction MCP decision tools", () => {
  // All-tools agents (sync/archive/verify/retro) inherit MCP; explicit-list ones must name it.
  for (const a of [
    "chaos-apply-orchestrator",
    "chaos-proposal-architect",
    "chaos-proposal-reviewer",
    "chaos-todo-curator",
  ]) {
    const fm = agent(a).split("---")[1] ?? "";
    assert.ok(/^tools:/m.test(fm), `${a}: no tools frontmatter`);
    assert.ok(
      fm.includes("mcp__chaos-interaction__chaos_create_decision"),
      `${a}: tools allowlist must include chaos_create_decision`,
    );
  }
});

test("shared protocol: subagents CAN use MCP (prefer), with a runtime-CLI fallback", () => {
  const flat = read(path.join(REPO, ".claude/skills/chaos-shared/reference/interactive-decision-protocol.md"))
    .replace(/\s+/g, " ")
    .toLowerCase();
  assert.ok(flat.includes("prefer"), "must prefer MCP");
  assert.ok(flat.includes("subagent"), "must name the subagent path");
  // Corrected: subagents CAN reach MCP when the server is connected + tools are allowlisted.
  assert.ok(flat.includes("inside subagents") || flat.includes("also"), "must state subagents can use MCP");
  assert.ok(flat.includes("fall back") || flat.includes("fallback"), "must document the CLI fallback");
  assert.ok(flat.includes("chaos_create_decision"), "must name the MCP tool");
  assert.ok(flat.includes("chaos-interaction-runtime.ts create-decision"), "must give the CLI writer");
});

test("shared interactive-decision protocol is runtime-first (routes to the Decision Center)", () => {
  const flat = read(path.join(REPO, ".claude/skills/chaos-shared/reference/interactive-decision-protocol.md"))
    .replace(/\s+/g, " ")
    .toLowerCase();
  assert.ok(flat.includes("interaction runtime first") || flat.includes("runtime first"));
  assert.ok(flat.includes("chaos_create_decision"), "must create decisions through the runtime");
  assert.ok(flat.includes("decision center"), "must route to the Decision Center");
  assert.ok(flat.includes("commands.enabled"), "must honour the enablement flag");
  assert.ok(flat.includes("fallback"), "chat must be labelled the fallback");
});

test("chaos:sync routes the --all owner/maintainer confirmation through the runtime, not chat", () => {
  // Collapse whitespace so line-wrapping in the doc doesn't break substring checks.
  const flat = read(path.join(REPO, ".claude/skills/chaos-sync/SKILL.md"))
    .replace(/\s+/g, " ")
    .toLowerCase();
  assert.ok(flat.includes("chaos_create_decision"), "sync must create a runtime decision");
  assert.ok(flat.includes("material decision"), "sync confirmation must be labelled material");
  assert.ok(flat.includes("muststop"), "sync must stop on the decision");
  assert.ok(flat.includes("ordinary chat question"), "sync must forbid the in-chat prompt when enabled");
});
