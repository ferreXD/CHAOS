---
description: Resume a paused CHAOS command from interaction-runtime state and its resume capsule
argument-hint: "[--run <commandRunId>] [--change <change-id>] [--latest] [--light|--standard|--strict] [--write-report]"
allowed-tools: Read, Glob, Grep, Bash, Edit, MultiEdit, Write, Task
---

Use the `chaos-resume` skill and the `chaos-resume-orchestrator` agent to resume a
paused CHAOS command after its material human decisions were answered in the
Decision Center (or via the runtime).

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-resume/reference/resume-safety-policy.md` and
`.claude/skills/chaos-resume/reference/resume-command-contract.md`.

- **Read the interaction runtime first.** The runtime is the source of truth, not the chat thread.
- **Do not rely on chat memory.** Reconstruct context only from the resume capsule, answered decisions/responses, required artifacts, and the original source command's contract.
- **Prefer MCP tools when available** (`chaos_find_resume_candidates`, `chaos_get_resume_capsule`, `chaos_list_sessions`, `chaos_get_decision_response`, `chaos_mark_decision_consumed`, `chaos_complete_command`). Fall back to the file-backed runtime under `.chaos/interactions/` (or the runtime CLI) only if MCP is unavailable, and disclose the degraded mode.
- **Resume only from a valid resume capsule.** If the capsule is missing required fields, STOP and report the missing fields rather than inventing context.
- **If multiple resume candidates exist, present them and STOP.** Ask the user to choose one; never guess.
- **If no candidate exists, do not invent context.** Report that there is nothing to resume and suggest next actions.
- **Validate answered decisions before continuing.** Selected option IDs must exist in the decision; required rationale must be present.
- **Do not consume decisions until their content has been incorporated** into the resumed command's plan/artifacts. Consumption is `chaos_mark_decision_consumed` AFTER use, never before.
- **Do not bypass pending unresolved decisions.** If the session still has a waiting decision, stop and route the user to the Decision Center.
- **Respect same-change locks.** Do not advance a change locked by a different command run.
- **Do not modify production files** unless the resumed command's approved `nextStep` explicitly allows it.
- **If runtime state is malformed, STOP** and report repair actions (e.g. run `chaos:doctor`). Do not continue on malformed state.
- **Do not fake literal chat continuation.** Resume is *semantic*: continue the original `sourceCommand` from `nextStep`, not a restored chain-of-thought.

## What this command does

1. Resolve the resume candidate (`--run` exact, `--change`, `--latest`, or no-args auto).
2. Load and validate the resume capsule and its session/decisions/lock.
3. Reconstruct the approved context (intent, scope, constraints, selected path, open risks).
4. Continue the original `sourceCommand` from `nextStep`, delegating to that command's skill/agent when appropriate.
5. Incorporate answered decisions, then mark them consumed.
6. Write a resume report (standard/strict, or when `--write-report` is set).

## Modes

- `--light`: pick the latest ready-to-resume session, show a compact summary, ask before continuing if there is any ambiguity, minimal artifact loading.
- `--standard` (default): resolve the candidate, validate the capsule + answered decisions, load required artifacts, continue from `nextStep`, write a resume report.
- `--strict`: additionally validate session/lock/response/required-artifact existence; reject stale or malformed state; require explicit confirmation if capsule confidence is LOW or required artifacts are missing; always write a detailed resume report.

## Scope

This command does **not** implement the live auto-resume runner, `chaos:delete`,
or any production application change. It resumes only from structured runtime
state.

## Shared protocol

`chaos:resume` is the authoritative manual resume command. It is aligned with — and is
the resume-handoff target of — the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`). It consumes decisions only after
incorporation and never relies on chat memory.
