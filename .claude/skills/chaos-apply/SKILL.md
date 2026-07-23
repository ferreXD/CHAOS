---
name: chaos-apply
description: Apply an approved OpenSpec change under CHAOS governance, with C# expert delegation, scope control, decision-event capture, and confidence-aware apply reporting.
---

# CHAOS Apply Skill

Use this skill when the user invokes `chaos:apply`, `/chaos-apply`, or asks to implement an OpenSpec change under CHAOS.

## Required references

Read the reference files before acting:

- `reference/apply-contract.md`
- `reference/config-awareness.md`
- `reference/mode-reference.md`
- `reference/direct-blocker-taxonomy.md`
- `reference/controlled-amendment-policy.md`
- `reference/decision-event-register.md`
- `reference/task-delegation-contract.md`
- `reference/csharp-implementation-specialist-contract.md`
- `reference/scope-drift-policy.md`
- `reference/validation-confidence-policy.md`
- `reference/openspec-integration-contract.md`
- `reference/output-contract.md`
- `reference/report-template.md`
- `reference/question-bank.md`
- `.claude/skills/chaos-shared/reference/change-template.md` (universal change artifacts)

## Light-deliver entry (mode inferred)

Before anything else: if `.chaos/changes/<change-id>/change.md` exists with
`chaosMetadata.mode: light`, this apply is the **DELIVER** phase of the collapsed light lifecycle
— run the **Light-deliver** section of `reference/apply-contract.md` instead of the standard
stages (gate: all decisions ANSWERED, else point at the Decision Center and stop; output =
`change.md` §Delivery dashboard, no apply-report/verification; `chaos:verify` not required).

## Golden rules

- OpenSpec owns proposal/design/spec/tasks.
- CHAOS owns implementation permission, scope discipline, decision events, confidence, and audit trail.
- `chaos:apply` may implement code only after preflight and boundary construction.
- C# specialists implement tasks; they do not decide scope.
- Light/standard can continue through non-direct blockers after explicit user confirmation.
- Strict blocks unless proposal/review/evidence are approval-ready.
- Every in-apply decision must be recorded for `chaos:sync`.

## Output

Read `.chaos/changes/<change-id>/lifecycle.md` when available. Write (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/apply-report.md
```

Record apply-time decision events under `.chaos/changes/<change-id>/decision-events.md`
and update the Apply row in `.chaos/changes/<change-id>/lifecycle.md` (with confirmation).
The legacy `.chaos/apply-reports/` folder may be READ for compatibility but is no longer
the preferred output location; do not migrate it. Do not promote decisions into ADR/rules/gates
directly — route that to `chaos:sync`. See `.chaos/changes/README.md`.

Then recommend:

```text
chaos:verify <change-id>
```

## Todo Candidates (optional)

`chaos:apply` MAY end its report with an optional `## Todo Candidates` section listing
material implementation debt, out-of-scope changes deferred, or validation not run, using the
shared fields in `.claude/skills/chaos-todo/reference/todo-candidate-contract.md`.
`chaos:apply` does not create durable todo items — only `chaos:todo` curates
`.chaos/todo/items/`.

## Repository context (vNext, optional)

When easily available, `chaos:apply` may record **changed files and branch context** from the
provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`, tool profile `apply`,
read-only) in the apply report. This is additive provenance only — apply does **not** require
MCP, CLI, or provider context; local git fallback is sufficient.

## Config awareness

Before resolving OpenSpec paths, review reports, apply report output, validation commands, or C# specialist delegation, read `.chaos/config.yaml` when present and follow `reference/config-awareness.md`.

If config is missing, infer defaults and record the config status. In strict mode, require a config waiver before code mutation when missing config affects execution safety.
