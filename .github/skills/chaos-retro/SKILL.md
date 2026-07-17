# CHAOS Retro Skill

Use this skill when the user invokes `chaos:retro` or asks to run a retrospective for a CHAOS/OpenSpec change, period, or repository slice.

## Goal

Convert lifecycle evidence into actionable workflow improvements.

## Required flow

1. Resolve scope and mode.
2. Load lifecycle evidence from CHAOS and OpenSpec reports.
3. Show a chat-first retro dashboard.
4. Infer retro depth and ask the user to confirm or adjust.
5. Detect evidence-backed learning signals.
6. Run one-by-one improvement decisions.
7. Capture human friction and agent effectiveness where useful.
8. Classify actions and avoid overfitting.
9. Produce a retro action register.
10. Produce sync handoff.
11. Write the report.

## Output

For change retros, write (v0 change-scoped layout): `.chaos/changes/<change-id>/retro.md`,
record retro actions under the change folder, and update the Retro row in
`.chaos/changes/<change-id>/lifecycle.md` with confirmation. Periodic retros remain at
`.chaos/retros/periodic-<period-or-date>-retro.md`. The legacy `.chaos/retros/<change-id>-retro.md`
location may be READ for compatibility but is no longer preferred; do not migrate it.
See `.chaos/changes/README.md`.

## Required reference files

Read the files in `reference/` before executing the command.

## Todo Candidates (optional)

`chaos:retro` MAY end its report with an optional `## Todo Candidates` section listing
material improvement actions, prompt-tuning follow-up, workflow/policy improvements, or docs
improvements, using the shared fields in
`.github/skills/chaos-todo/reference/todo-candidate-contract.md`. Apply the same
overfitting guardrails as the retro action register itself — a one-off lesson is not
automatically a todo. `chaos:retro` does not create durable todo items — only `chaos:todo`
curates `.chaos/todo/items/`.

## Hard boundary

Do not edit production code. Do not silently update durable governance files. Route durable updates to `chaos:sync`.
