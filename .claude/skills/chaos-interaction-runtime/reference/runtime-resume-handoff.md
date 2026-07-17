# Runtime Resume Handoff

When a command stops on a material decision, control passes to the human (Decision
Center) and then back through `chaos:resume` (Iteration 4) — or the live auto-resume
runner (Iteration 5) if the command was launched through it and its lease is still
live. Auto-resume is **never** valid after runner death; those sessions stay
`ready-to-resume` for `chaos:resume`.

## Auto-resume is feature-flagged (opt-in)

Fully-automatic "answer → auto-continue" is gated by
`policies.interactionRuntime.autoResume` in `.chaos/config.yaml`:

- `autoResume.enabled: false` (default) → **manual `chaos:resume` only**. Answering a
  decision leaves the session `ready-to-resume`; the human (or nothing) drives resume.
- `autoResume.enabled: true` **and** `autoResume.adapter` can actually drive the
  session → the live runner may auto-resume. `adapter: none` disables it;
  `adapter: claude-code` (the live Claude Code session adapter) is **not built yet**,
  so it is gated here and ships opt-in. Never claim auto-resume when the flag is off or
  the adapter cannot inject the resume.

## A resumed command must

1. **Load the resume capsule** (never reconstruct from chat memory).
2. **Validate answered decisions** — the selected option must exist in the decision;
   required rationale must be present.
3. **Incorporate the selected option** into the resumed plan/artifacts.
4. **Record a Decision Event** if the command's contract requires one.
5. **Mark the decision consumed** with `chaos_mark_decision_consumed` — only *after*
   incorporation, never before.
6. **Continue from the capsule `nextStep`**, delegating to the original command's
   skill/agent as appropriate.

## Consumption ordering (consistent across all commands)

`incorporate → mark-consumed`. A decision that is answered but not yet incorporated
stays answered. Consuming before use is forbidden: it destroys the evidence a resumed
run needs and trips Iteration 7's `decision-not-consumed` / consumed-without-response
checks in the opposite direction.

## Authority

`chaos:resume` is the authoritative manual resume command. Other commands do not
re-implement resume; they hand off to it (or are continued by it). See
`.claude/commands/chaos-resume.md` and `.claude/skills/chaos-resume/`.
