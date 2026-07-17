# Diagnostics Integration Contract (Iteration 7 alignment)

Iteration 7 (`tools/chaos-interaction-diagnostics`, surfaced by `chaos:doctor` and
`chaos:status`) already defines the health model. Iteration 6 commands must *produce
and consume* the state that model expects — they must not redesign it.

## Evidence commands must leave

| Diagnostics expectation | Command obligation |
|---|---|
| Pending decisions | Create decisions via `chaos_create_decision`; stop on `mustStop`. |
| Ready-to-resume sessions | Answering advances the session; hand off to `chaos:resume`. |
| Stale locks | Complete/cancel sessions so locks release; never orphan a lock. |
| Expired runner leases | Launch-through-runner is Iteration 5; commands don't fake liveness. |
| Malformed runtime state | Never hand-write runtime JSON; stop and route to `chaos:doctor`. |
| Hook violations | Never continue after `mustStop`; never write production files while a decision blocks the change. |
| Todo Candidates | When a command can't safely act, emit a Todo Candidate (contract: `.claude/skills/chaos-todo/reference/todo-candidate-contract.md`). |

## Artifact/event shapes

Use the existing runtime artifact shapes (sessions, decisions, responses, locks,
capsules) and the existing hook-violations stream (`.chaos/runtime/hook-violations.jsonl`).
Do not invent parallel artifacts. If an integration genuinely needs an
event/finding Iteration 7 does not model, add a small follow-up note or a Todo
Candidate — do **not** redesign the diagnostics health model.

## Opt-out is respected, not flagged

When `policies.interactionRuntime.commands.enabled` is `false`, the command-contract
probe reports integration as **disabled by config** (INFO), not as a gap — opting out is
a valid, first-class choice. Diagnostics reads this via its `commandsEnabled` config
(CLI `--commands-enabled` / env `CHAOS_IR_COMMANDS_ENABLED` / JSON config); the
canonical source is `.chaos/config.yaml`.

## Read-only commands

`chaos:status` keeps its **compact** Interaction Runtime summary; `chaos:doctor` keeps
its **detailed** section. Neither auto-repairs. Command integration must not change
those Iteration 7 outputs beyond tiny additive notes.
