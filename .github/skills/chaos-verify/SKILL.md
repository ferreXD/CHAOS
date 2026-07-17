# CHAOS Verify Skill

Use this skill when the user asks to run or design `chaos:verify`, verify an implemented OpenSpec change, assess archive readiness, or perform a post-implementation CHAOS confidence review.

## Purpose

`chaos:verify` is the post-implementation verification command in CHAOS.

It verifies the implemented result against:

- OpenSpec proposal/design/spec/tasks;
- proposal review report;
- apply report;
- actual code changes;
- test/build/OpenSpec validation evidence;
- ADRs, rules, decisions, gates, and constitution;
- decision events and sync actions.

## Canonical invocation

```text
chaos:verify <change-id> [--light|--standard|--strict] [--dry-run] [--continue]
```

## Required references

Read these references before executing:

- `reference/verification-contract.md`
- `reference/modes.md`
- `reference/evidence-confidence-model.md`
- `reference/validation-policy.md`
- `reference/runtime-remediation-loop.md`
- `reference/decision-event-audit.md`
- `reference/scope-drift-policy.md`
- `reference/traceability-matrix.md`
- `reference/archive-readiness.md`
- `reference/csharp-verification-delegation.md`
- `reference/report-template.md`

## Hard rules

```text
No production-code edits.
No confidence-less verdicts.
No unlabeled assumptions.
No inference disguised as fact.
No archive recommendation without validation/evidence classification.
No silent installation of tools.
No silent amendment of governance artifacts.
```

## Output

Read change-folder artifacts (`lifecycle.md`, `apply-report.md`, `proposal-review.md`,
`decision-events.md`, `waivers.md`) when present. Always produce (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/verification.md
```

Audit `.chaos/changes/<change-id>/decision-events.md` and `.chaos/changes/<change-id>/waivers.md`
if present. Update the lifecycle recommendation only with user confirmation. Do not edit
production code. The legacy `.chaos/verification/` folder may be READ for compatibility but is
no longer the preferred output location; do not migrate it. See `.chaos/changes/README.md`.

When verification cannot be completed, still produce a report with `BLOCKED` or `INSUFFICIENT_EVIDENCE` and concrete next actions.

## Todo Candidates (optional)

`chaos:verify` MAY end its report with an optional `## Todo Candidates` section listing
material verification gaps, failed validations, waivers, archive blockers, or low-confidence
conformance findings, using the shared fields in
`.github/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:verify` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.
