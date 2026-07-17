# Runtime Resume Handoff

When a command stops on a material decision, control passes to the human (Decision
Center) and then back through `chaos:resume` (Iteration 4). In Copilot, resume is always
**manual**: the human answers in the Decision Center and then runs
`chaos-resume.prompt.md`. The live auto-resume runner (Iteration 5) is a Claude-harness
capability and is **not wired for Copilot**; those sessions stay `ready-to-resume` for
the manual `chaos:resume`.

## Auto-resume is feature-flagged (opt-in) — and Copilot-unavailable

Fully-automatic "answer → auto-continue" is gated by
`policies.interactionRuntime.autoResume` in `.chaos/config.yaml`. Both drivers of it —
the headless runner (`tools/chaos-interaction-runner/`) and the in-session Stop hook —
are Claude-harness mechanisms with no Copilot equivalent. In Copilot, treat auto-resume
as **off regardless of the flag**:

- Answering a decision leaves the session `ready-to-resume`; the human drives resume by
  running `chaos-resume.prompt.md`.
- Never claim auto-resume happened in Copilot; there is no adapter that can inject the
  resume.

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
`.github/prompts/chaos-resume.prompt.md` and `.github/skills/chaos-resume/`.
