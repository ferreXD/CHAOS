---
name: chaos-interaction-runtime
description: Shared CHAOS Interaction Runtime command protocol. How every CHAOS command performs runtime preflight, creates material decisions through the runtime and stops on mustStop, hands off to chaos:resume, completes/releases locks, and stays coherent with the Iteration 7 diagnostics. Read-only helper; commands link here instead of repeating the protocol.
---

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
→ chaos:resume  (or live runner auto-resume, Iteration 5)
→ incorporate-decision
→ mark-decision-consumed   (only AFTER incorporation)
→ complete-command  (release locks)
→ diagnostics-clean
```

## Feature flags (`.chaos/config.yaml` → `policies.interactionRuntime`)

- `commands.enabled` (bool, default `true`) — master switch. `false` opts commands
  **out** of the runtime/Decision Center flow; they fall back to classic in-chat
  decisions. See `reference/command-preflight-protocol.md` Step 0.
- `commands.decisionBatching` (`sequential` | `batch-independent`, default
  `batch-independent`) — write one decision at a time, or all independent decisions up
  front then stop once. See `reference/decision-batching-policy.md`.
- `autoResume.enabled` (bool, default `false`) — master switch for fully-automatic
  auto-resume. With it on, one of two mechanisms drives the continuation:
  - `autoResume.adapter` (`none`|`mock`|`claude-code`) — the **headless runner** path
    (`tools/chaos-interaction-runner/`); `claude-code` drives a live headless session.
  - `autoResume.inSessionResume` (bool, default `false`) — **in-session** path for a
    normal interactive chat: the `chaos-auto-resume` Stop hook waits for your Decision
    Center answer and continues the SAME session (no manual `chaos:resume`, output stays
    in the chat). See `.claude/hooks/reference/in-session-auto-resume-contract.md`.

## Reference contracts (read the ones your command needs)

- `reference/command-preflight-protocol.md` — enablement gate + `chaos_begin_command`.
- `reference/material-decision-protocol.md` — creating decisions + `mustStop` stop rule.
- `reference/decision-batching-policy.md` — sequential vs batch-independent decisions.
- `reference/runtime-resume-handoff.md` — resume, decision consumption, auto-resume flag.
- `reference/command-completion-policy.md` — completion, lock release, administrative terminalization.
- `reference/diagnostics-integration-contract.md` — the evidence Iteration 7 expects.
- `reference/fallback-protocol.md` — MCP-unavailable behaviour and the no-silent-bypass rule.

## Prefer MCP (Iteration 2)

`chaos_begin_command`, `chaos_create_decision`, `chaos_get_active_decision`,
`chaos_get_decision_response`, `chaos_find_resume_candidates`,
`chaos_mark_decision_consumed`, `chaos_complete_command`, `chaos_list_locks`,
`chaos_list_sessions`. If a tool is missing use the nearest equivalent; do not
redesign MCP. If MCP is unavailable, follow `reference/fallback-protocol.md`.

## Continuation after a decision (in-session auto-resume) — non-negotiable

If your turn is **continued after you stopped on a material decision** (e.g. in-session
auto-resume forced the session to resume, or you are otherwise re-entered while a
decision you created has just been answered), the interaction runtime is the source of
truth — **do not** rely on any hook-provided message and **do not** restart the command
or re-ask the user. Your FIRST action is:

1. Read the freshly-answered, not-yet-consumed decision for the active run
   (`chaos_get_active_decision` / `chaos_get_decision_response`).
2. Incorporate the selected option into the command's work.
3. Mark the decision consumed (`chaos_mark_decision_consumed`) — only AFTER incorporation.
4. Continue the original command from its capsule `nextStep`.

If no answered decision exists for the active run, continue/stop normally. See
`.claude/hooks/reference/in-session-auto-resume-contract.md`.

## No silent bypass (non-negotiable)

A command must never say “I’ll just continue”, “Decision Center is unavailable so
I’ll decide”, “no runtime found, assuming approved”, or “pending decision exists but
proceeding anyway”. It must use the runtime, use the explicit fallback protocol, or
stop and ask the user.

## Relationship to other iterations

Iteration 1 runtime is the source of truth; Iteration 2 MCP is the tool surface;
Iteration 3 Decision Center is where humans answer; Iteration 4 `chaos:resume` is the
authoritative manual resume; Iteration 5 is the live auto-resume runner (auto-resume
only while its lease is live — never after runner death); **Iteration 7 diagnostics**
(`tools/chaos-interaction-diagnostics`, surfaced by `chaos:doctor` / `chaos:status`)
observes the evidence commands leave behind. This iteration (6) makes commands
produce/consume that state. It does not redesign any of them.
