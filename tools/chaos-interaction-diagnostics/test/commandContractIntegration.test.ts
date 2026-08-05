/**
 * Static validation: the lean CHAOS command surface is interaction-runtime aware
 * and coherent with the diagnostics. Command contracts are Markdown, so these are
 * static-inspection tests. (Rewritten 2026-08-05 when the apparatus command suite
 * was retired — tag `apparatus-final` holds the previous suite and its tests.)
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const REPO = path.resolve(import.meta.dirname, "../../..");
const CMD = path.join(REPO, ".claude", "commands");
const SKILLS = path.join(REPO, ".claude", "skills");
const SKILL = path.join(SKILLS, "chaos-interaction-runtime");

const read = (p: string) => fs.readFileSync(p, "utf8");
const exists = (p: string) => fs.existsSync(p);
const cmd = (name: string) => read(path.join(CMD, `${name}.md`));
const skill = (name: string) => read(path.join(SKILLS, name, "SKILL.md"));

const LEAN_COMMANDS = ["chaos-init", "chaos-help", "chaos-doctor", "chaos-run", "chaos-resume"];

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

test("2. the command surface is exactly the lean set", () => {
  assert.deepEqual(ALL_COMMANDS.sort(), [...LEAN_COMMANDS].sort());
});

test("3. shared fallback protocol exists and forbids silent bypass", () => {
  const fb = read(path.join(SKILL, "reference", "fallback-protocol.md")).toLowerCase();
  assert.ok(fb.includes("no silent bypass") || fb.includes("silent bypass"));
  assert.ok(fb.includes("stop and ask"));
});

test("4. chaos:run skill carries the core loop: stop, runtime protocol, record", () => {
  const text = skill("chaos-run");
  const lower = text.toLowerCase();
  assert.ok(
    text.includes(".claude/skills/chaos-interaction-runtime/SKILL.md"),
    "chaos-run does not link the shared protocol",
  );
  assert.ok(lower.includes("chaos_begin_command"), "missing preflight/begin");
  assert.ok(lower.includes("chaos_create_decision"), "missing material-decision protocol");
  assert.ok(lower.includes("muststop"), "missing mustStop behaviour");
  assert.ok(lower.includes("chaos_resume_command"), "missing the post-answer session flip");
  assert.ok(lower.includes("chaos_complete_command"), "missing completion");
  assert.ok(lower.includes("before any code"), "the stop must be pre-code");
  assert.ok(lower.includes(".chaos/decisions/"), "missing the decision-record home");
  assert.ok(lower.includes("specgate") || lower.includes("spec gate"), "missing the OpenSpec size gate");
});

test("5. chaos:run stop is singular and folded", () => {
  const lower = skill("chaos-run").toLowerCase();
  assert.ok(lower.includes("one decision") || lower.includes("single decision"));
  assert.ok(lower.includes("folds") || lower.includes("folded"));
});

test("6. chaos:resume: no chat memory + consume only after incorporation", () => {
  const lower = cmd("chaos-resume").toLowerCase();
  assert.ok(lower.includes("do not rely on chat memory"));
  assert.ok(lower.includes("after") && lower.includes("incorporat"));
  assert.ok(lower.includes(".claude/skills/chaos-interaction-runtime/skill.md"));
});

test("7. resume protocol mandates the ready-to-resume flip", () => {
  const handoff = read(path.join(SKILL, "reference", "runtime-resume-handoff.md")).toLowerCase();
  assert.ok(handoff.includes("chaos_resume_command"));
  assert.ok(handoff.includes("invalid_state_transition"));
});

test("8. chaos:doctor preserves diagnostics integration (skill)", () => {
  const doctor = skill("chaos-doctor");
  assert.ok(/##\s+Interaction Runtime health/.test(doctor));
  assert.ok(doctor.toLowerCase().includes("read-only"));
  assert.ok(doctor.toLowerCase().includes("no auto-repair"));
});

test("9. no command instructs bypassing a pending runtime decision", () => {
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

test("10. no command claims auto-resume works after runner death", () => {
  const bad = [/auto-resume\s+works\s+after\s+runner\s+death/i, /resumes?\s+after\s+runner\s+death/i];
  for (const c of ALL_COMMANDS) {
    const text = cmd(c);
    for (const re of bad) assert.ok(!re.test(text), `${c} overclaims auto-resume: ${re}`);
  }
});

test("11. no command instructs destructive auto-repair by default", () => {
  const bad = [/(will|should|may)\s+auto-repair/i, /destructive auto-repair by default/i];
  for (const c of ALL_COMMANDS) {
    const text = cmd(c);
    for (const re of bad) assert.ok(!re.test(text), `${c} instructs auto-repair: ${re}`);
  }
});

test("12. diagnostics contract routes through chaos:doctor", () => {
  const shared = read(path.join(SKILL, "reference", "diagnostics-integration-contract.md")).toLowerCase();
  assert.ok(shared.includes("iteration 7"));
  assert.ok(shared.includes("chaos:doctor"));
  assert.ok(cmd("chaos-help").toLowerCase().includes("chaos:doctor"));
});

// --- Feature flags + decision batching (opt-out UX) ---

test("13. preflight has an enablement gate honouring commands.enabled", () => {
  const pre = read(path.join(SKILL, "reference", "command-preflight-protocol.md")).toLowerCase();
  assert.ok(pre.includes("enablement gate") || pre.includes("commands.enabled"));
  assert.ok(pre.includes("opt-out"));
  assert.ok(pre.includes("classic in-chat") || pre.includes("chat-interactive"));
});

test("14. decision-batching policy exists with both modes", () => {
  assert.ok(exists(path.join(SKILL, "reference", "decision-batching-policy.md")));
  const batch = read(path.join(SKILL, "reference", "decision-batching-policy.md")).toLowerCase();
  assert.ok(batch.includes("sequential"));
  assert.ok(batch.includes("batch-independent"));
  assert.ok(batch.includes("dependent"));
});

test("15. SKILL.md documents the boolean feature flags + auto-resume flag", () => {
  const s = read(path.join(SKILL, "SKILL.md")).toLowerCase();
  assert.ok(s.includes("commands.enabled"));
  assert.ok(s.includes("decisionbatching"));
  assert.ok(s.includes("autoresume.enabled"));
  assert.ok(s.includes("default `false`") || s.includes("opt-in"));
  assert.ok(s.includes("in-session") || s.includes("adapter"));
});

test("16. config.yaml declares the boolean flags additively", () => {
  const cfg = read(path.join(REPO, ".chaos/config.yaml"));
  assert.ok(/commands:\s/.test(cfg));
  assert.ok(/enabled:\s*true/.test(cfg));
  assert.ok(/decisionBatching:\s*(sequential|batch-independent)/.test(cfg));
  assert.ok(/autoResume:/.test(cfg));
  assert.ok(/adapter:\s*(none|mock|claude-code)/.test(cfg));
});

// --- Agent integration: the resume orchestrator runs decisions through the runtime ---

const AGENTS = path.join(REPO, ".claude", "agents");
const agent = (name: string) => read(path.join(AGENTS, `${name}.md`));

test("17. resume orchestrator allowlists the runtime decision + resume tools", () => {
  const fm = agent("chaos-resume-orchestrator").split("---")[1] ?? "";
  assert.ok(/^tools:/m.test(fm), "no tools frontmatter");
  assert.ok(fm.includes("mcp__chaos-interaction__chaos_create_decision"));
  assert.ok(fm.includes("mcp__chaos-interaction__chaos_resume_command"));
  assert.ok(fm.includes("mcp__chaos-interaction__chaos_mark_decision_consumed"));
});

test("18. shared protocol: subagents CAN use MCP (prefer), with a runtime-CLI fallback", () => {
  const flat = read(path.join(REPO, ".claude/skills/chaos-shared/reference/interactive-decision-protocol.md"))
    .replace(/\s+/g, " ")
    .toLowerCase();
  assert.ok(flat.includes("prefer"), "must prefer MCP");
  assert.ok(flat.includes("subagent"), "must name the subagent path");
  assert.ok(flat.includes("inside subagents") || flat.includes("also"), "must state subagents can use MCP");
  assert.ok(flat.includes("fall back") || flat.includes("fallback"), "must document the CLI fallback");
  assert.ok(flat.includes("chaos_create_decision"), "must name the MCP tool");
  assert.ok(flat.includes("chaos-interaction-runtime.ts create-decision"), "must give the CLI writer");
});

test("19. shared interactive-decision protocol is runtime-first (routes to the Decision Center)", () => {
  const flat = read(path.join(REPO, ".claude/skills/chaos-shared/reference/interactive-decision-protocol.md"))
    .replace(/\s+/g, " ")
    .toLowerCase();
  assert.ok(flat.includes("interaction runtime first") || flat.includes("runtime first"));
  assert.ok(flat.includes("chaos_create_decision"), "must create decisions through the runtime");
  assert.ok(flat.includes("decision center"), "must route to the Decision Center");
  assert.ok(flat.includes("commands.enabled"), "must honour the enablement flag");
  assert.ok(flat.includes("fallback"), "chat must be labelled the fallback");
});
