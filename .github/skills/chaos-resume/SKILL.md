---
name: chaos-resume
description: Resume a paused CHAOS command from interaction-runtime state and resume capsules after human decisions were answered. Resolves candidates, validates capsules/decisions/locks, incorporates answered decisions, and continues the original source command from nextStep. Never resumes from chat memory. Supports --run/--change/--latest and --light/--standard/--strict.
---

# CHAOS Resume Skill

Use this skill when the user invokes `chaos:resume`, `/chaos-resume`, or says
things like "decisions accepted, continue where you left off", "resume the latest
CHAOS run", or "continue chaos:apply for <change>".

Delegate execution to the `chaos-resume-orchestrator` agent.

## Core principle

The chat thread is not the source of truth. The interaction runtime is. Resume
capsules are the compact handoff that lets CHAOS continue **without relying on
chat memory**. `chaos:resume` is not a "reread the whole chat and continue"
command — it resumes only from structured runtime state.

## Required references

Read the reference files before acting:

- `reference/resume-command-contract.md`
- `reference/resume-candidate-resolution.md`
- `reference/resume-capsule-contract.md`
- `reference/resume-decision-consumption-policy.md`
- `reference/resume-state-machine.md`
- `reference/resume-mcp-tool-contract.md`
- `reference/resume-safety-policy.md`
- `reference/resume-examples.md`

## Non-negotiable summary

- Read the interaction runtime first; prefer MCP tools, fall back to
  `.chaos/interactions/` files only if MCP is unavailable (disclose degraded mode).
- Resume only from a valid resume capsule; if fields are missing, STOP and report them.
- If multiple candidates exist, ask the user to choose and **STOP**.
- If no candidate exists, do not invent context.
- Validate answered decisions before continuing.
- Mark decisions consumed **only after** they are incorporated.
- Do not bypass pending unresolved decisions; respect same-change locks.
- Do not modify production files unless the resumed command's `nextStep` allows it.
- If runtime state is malformed, STOP and report repair actions.
- Do not fake literal chat continuation — continue semantically from `nextStep`.
- **Light lifecycle:** resuming an answered light FRAME run (`sourceCommand: chaos:propose`,
  `mode: light`, `capsule.nextStep: deliver`) is an **administrative terminalization only** —
  consume the answered decisions, close the run, release the lock, and point at `chaos:apply`
  (which infers light from `change.md` and owns DELIVER). Resume never implements on a light
  run; apply's preflight can perform this same close if invoked directly.

## Relationship to other iterations

- Iteration 1 runtime (`tools/chaos-interaction-runtime`) exposes the read-only
  discovery API: `getResumeCapsule`, `listCapsules`, `findResumeCandidates`.
- Iteration 2 MCP server (`tools/chaos-interaction-mcp`) exposes those plus
  `chaos_find_resume_candidates` and the consume/complete tools.
- Iteration 3 Decision Center (`extensions/chaos-decision-center`) is where the
  human answers decisions and copies the resume instruction that triggers this
  command.

## Non-goals

No live auto-resume runner, no `chaos:delete`/discard, no production application
changes, no broad rewrites of other CHAOS commands.
