---
name: chaos-interaction-runtime
description: Shared CHAOS Interaction Runtime command protocol. How every CHAOS command performs runtime preflight, creates material decisions through the runtime and stops on mustStop, hands off to chaos:resume, completes/releases locks, and stays coherent with the Iteration 7 diagnostics. Read-only helper; commands link here instead of repeating the protocol.
---

> Copilot agent skill. Keep this file named `SKILL.md`; supplementary material lives in `reference/`.

# CHAOS Interaction Runtime — Command Protocol (shared)

This skill is the single source of the command-side interaction-runtime protocol.
Individual CHAOS commands link here and add only their command-specific obligations
(a short `## Interaction Runtime Obligations` block). Do not paste the full protocol
into every command.

```text
The chat thread is not the source of truth. The interaction runtime is.
CHAOS commands must not rely on chat memory for material decisions.
A command that creates a pending material decision MUST stop.
Runtime behaviour must stay coherent with the Iteration 7 diagnostics.
```

## Lifecycle

```text
runtime-preflight
→ command-execution
→ material-decision-needed?
   → create-runtime-decision
   → mustStop = true
   → STOP
→ (human answers in Decision Center)
→ chaos:resume  (manual, via chaos-resume.prompt.md)
→ incorporate-decision
→ mark-decision-consumed   (only AFTER incorporation)
→ complete-command  (release locks)
→ diagnostics-clean
```

## Writing runtime state from Copilot

The interaction runtime backend (`tools/chaos-interaction-runtime/`) is provider-neutral
and already recognizes `adapter: copilot`. Copilot writes runtime state through the
**runtime CLI** with `--adapter copilot`:

```bash
node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts begin-command  --command "<sourceCommand>" --change <changeId> --adapter copilot
node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts create-decision --run <runId> --change <changeId> --title "<title>" --context "<context>" [--interaction-type <type>] --option <a> --option <b> --recommended <b>
```

The `chaos_*` MCP tools (`chaos_begin_command`, `chaos_create_decision`, …) write the exact
same file-backed state and may be used instead **if** the `chaos-interaction` MCP server is
registered in this Copilot workspace and its tools are in the prompt's `tools:` allowlist.
When MCP is not wired, use the CLI; both are equivalent, and the Decision Center reads either.

## Feature flags (`.chaos/config.yaml` → `policies.interactionRuntime`)

- `commands.enabled` (bool, default `true`) — master switch. `false` opts commands
  **out** of the runtime/Decision Center flow; they fall back to classic in-chat
  decisions. See `reference/command-preflight-protocol.md` Step 0.
- `commands.decisionBatching` (`sequential` | `batch-independent`, default
  `batch-independent`) — write one decision at a time, or all independent decisions up
  front then stop once. See `reference/decision-batching-policy.md`.
- `autoResume.enabled` (bool, default `false`) — master switch for fully-automatic
  auto-resume. Auto-resume drivers (the headless runner and the in-session Stop hook) are
  **Claude-harness capabilities and are not available in Copilot.** In Copilot, resume is
  always **manual** via `chaos-resume.prompt.md`; treat auto-resume as off regardless of
  this flag.

## Reference contracts (read the ones your command needs)

- `reference/command-preflight-protocol.md` — enablement gate + `chaos_begin_command`.
- `reference/material-decision-protocol.md` — creating decisions + `mustStop` stop rule.
- `reference/decision-batching-policy.md` — sequential vs batch-independent decisions.
- `reference/runtime-resume-handoff.md` — resume, decision consumption, auto-resume flag.
- `reference/command-completion-policy.md` — completion, lock release, administrative terminalization.
- `reference/diagnostics-integration-contract.md` — the evidence Iteration 7 expects.
- `reference/fallback-protocol.md` — runtime-unavailable behaviour and the no-silent-bypass rule.

## Runtime tool surface

`chaos_begin_command`, `chaos_create_decision`, `chaos_get_active_decision`,
`chaos_get_decision_response`, `chaos_find_resume_candidates`,
`chaos_mark_decision_consumed`, `chaos_complete_command`, `chaos_list_locks`,
`chaos_list_sessions` — available as MCP tools when the `chaos-interaction` server is
registered, otherwise via the runtime CLI (`--adapter copilot`). If a tool is missing use
the nearest equivalent; do not redesign the runtime. If neither MCP nor the CLI is
available, follow `reference/fallback-protocol.md`.

## Continuation after a decision — non-negotiable

If you are **re-entered while a decision you created has just been answered** (e.g. the
user ran `chaos-resume.prompt.md` after answering in the Decision Center), the interaction
runtime is the source of truth — **do not** rely on any chat message and **do not** restart
the command or re-ask the user. Your FIRST action is:

1. Read the freshly-answered, not-yet-consumed decision for the active run
   (`chaos_get_active_decision` / `chaos_get_decision_response`, or the CLI equivalent).
2. Incorporate the selected option into the command's work.
3. Mark the decision consumed (`chaos_mark_decision_consumed`) — only AFTER incorporation.
4. Continue the original command from its capsule `nextStep`.

If no answered decision exists for the active run, continue/stop normally.

## No silent bypass (non-negotiable)

A command must never say “I’ll just continue”, “Decision Center is unavailable so
I’ll decide”, “no runtime found, assuming approved”, or “pending decision exists but
proceeding anyway”. It must use the runtime, use the explicit fallback protocol, or
stop and ask the user.

## Relationship to other iterations

Iteration 1 runtime is the source of truth; Iteration 2 MCP is the tool surface;
Iteration 3 Decision Center is where humans answer; Iteration 4 `chaos:resume` is the
authoritative manual resume; Iteration 5 is the live auto-resume runner (Claude-harness
only — not wired for Copilot); **Iteration 7 diagnostics**
(`tools/chaos-interaction-diagnostics`, surfaced by `chaos:doctor` / `chaos:status`)
observes the evidence commands leave behind. This iteration (6) makes commands
produce/consume that state. It does not redesign any of them.
