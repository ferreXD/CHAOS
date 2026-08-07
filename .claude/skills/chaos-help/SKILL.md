---
name: chaos-help
description: "Explain the CHAOS lean core in-repo: the chaos:run loop (one pre-code stop, build, verify, decision record), chaos:resume, chaos:init, chaos:doctor, the size-gated OpenSpec rule, and where the moving parts live. Read-only; answers in chat."
---

# CHAOS Help Skill

Use this skill when the user invokes `chaos:help` or asks how to use the CHAOS workflow in
the current repository. Answer directly in chat — no agent, no report file.

## What CHAOS is (lean core, since 2026-08)

CHAOS is a thin discipline around AI-driven changes, built on the three mechanisms the
2026 validation program showed carry the value (summary and caveats: `docs/evidence.md`):

1. **One pre-code stop** — every open question, doubt, assumption, and
   architecture/contract crossing folded into a single human decision, answered through
   the Decision Center before implementation starts.
2. **Honest verification** — checks actually run; delegated work independently reviewed;
   unverifiable claims labeled, never ticked.
3. **A decision record** — one per change in `.chaos/decisions/`, so future stops can catch
   crossings against what was decided. No length limit: it carries what a future reader needs.

## Commands

| Command | What it does |
|---|---|
| `chaos:init` | Bootstrap a repo: `AGENTS.md`, `.chaos/` workspace (architecture, decisions index, config). One-time. |
| `chaos:run "<intent>"` | The core loop: targeted read → pre-code stop → size-gated OpenSpec → build → verify → record. |
| `chaos:resume` | Continue an interrupted run from runtime state + answered decisions (never from chat memory). |
| `chaos:doctor` | Diagnose runtime/MCP/hooks/tooling health. Read-only. |
| `chaos:help` | This. |

OpenSpec (`/opsx:*`) is invoked by `chaos:run` when the spec gate says a change is large
enough (defaults: ≥5 files or ≥250 LOC or any posture crossing; override in
`.chaos/config.yaml` under `specGate:`).

## The moving parts

- **Interaction runtime** (`tools/chaos-interaction-runtime`) + **MCP server**
  (`tools/chaos-interaction-mcp`): sessions, decisions, resume capsules, locks.
- **Decision Center** (VS Code): where the human answers stops.
- **Hooks** (`.claude/hooks`): session context, active-command detection, artifact
  metadata, runtime observability.
- **chaos-stopwatch** (`tools/chaos-stopwatch`): wall-clock measurement of runs from
  transcripts (the validated instrument).

Model-robustness and decision-protocol rules remain canonical in
`.claude/skills/chaos-shared/reference/` (`model-robustness-policy.md`,
`interactive-decision-protocol.md`): a command always stops after asking a material
decision, prefers the Decision Center, and never silently bypasses one.

## History

The heavier lifecycle (propose/review/apply/verify/archive/sync/retro, classification
machinery, phase records) was measured 2026-06→08 and retired: see the tag
`apparatus-final` for the code, and `docs/evidence.md` for the numbers that retired it.
