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

## `change.md` entry (mode inferred)

Before anything else: if `.chaos/changes/<change-id>/change.md` exists, this apply is the
**DELIVER** phase of the universal change lifecycle — infer the mode from `chaosMetadata.mode`
(light | standard | strict) and run the **Deliver** section of `reference/apply-contract.md`
(gate: all decisions ANSWERED, else point at the Decision Center and stop; output = `change.md`
§Delivery dashboard at mode depth, no apply-report/verification.md). Light runs it as the
collapsed lifecycle instead of the standard stages and does not require `chaos:verify`;
standard/strict keep the standard-stage rigor inside the Deliver shell and still recommend
`chaos:verify`. Only when `change.md` is absent (legacy change) use the legacy stages and the
legacy output below.

## Golden rules

- OpenSpec owns proposal/design/spec/tasks.
- CHAOS owns implementation permission, scope discipline, decision events, confidence, and audit trail.
- `chaos:apply` may implement code only after preflight and boundary construction.
- C# specialists implement tasks; they do not decide scope.
- Light/standard can continue through non-direct blockers after explicit user confirmation.
- Strict blocks unless proposal/review/evidence are approval-ready.
- Every in-apply decision must be recorded for `chaos:sync`.

## Output

Read `.chaos/changes/<change-id>/change.md` and `lifecycle.md` when available. On a `change.md`
change (any mode) the output is the **deliver phase record** — **no `apply-report.md` is
written** and `change.md` §Delivery is rendered, never hand-written. Emit
`records/deliver.pass-NN.facts.json` per `chaos-shared/reference/record-emission.md`: envelope
`verdict` (`APPLIED | PARTIALLY_APPLIED`), the completing run id, `mode`, `assessment`, and
`facts`: `build`, `tests`, `coverage` (**one row per contract statement id**, evidence
`test | code | doc`; non-test evidence carries `whyNotTest` — that renders the Coverage-honesty
table), `rules` (R-ids + evidence), `files` (path + added/modified/deleted), `deviations`
(one line per deviation, each with its backing `APPLY-DEC-*` ref — the detail lives in the
ledger entry), `scopeDrift`, and `approvalConditions` status. Deferred debt goes in
`todoCandidates`.

Then render: `python tools/chaos-render/render.py <change-id> --write`. The renderer writes the
`### Delivery — pass N` snapshot, sets `phases.deliver`, advances `lifecycle.status`, reconciles
`lifecycle.current` (tests/contract/decisions are **derived**, never copied), and re-renders
`lifecycle.md`. A `--continue` emits the next pass file; a pass record is never rewritten.

Legacy fallback — only when `change.md` is absent (old change), write (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/apply-report.md
```

Record apply-time decision events under `.chaos/changes/<change-id>/decision-events.md`
and update the Apply/Deliver row in `.chaos/changes/<change-id>/lifecycle.md` (with confirmation).
The legacy `.chaos/apply-reports/` folder may be READ for compatibility but is no longer
the preferred output location; do not migrate it. Do not promote decisions into ADR/rules/gates
directly — route that to `chaos:sync`. See `.chaos/changes/README.md`.

Then recommend (post-hoc optional on light; recommended on standard/strict):

```text
chaos:verify <change-id>
```

## Todo Candidates (optional)

`chaos:apply` MAY end its delivery record with an optional `## Todo Candidates` section (after
`change.md` §Delivery — strict: `appendix/` when long — or at the end of the legacy apply report
on a legacy change) listing material implementation debt, out-of-scope changes deferred, or
validation not run, using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`.
`chaos:apply` does not create durable todo items — only `chaos:todo` curates
`.chaos/todo/items/`.

## Repository context (vNext, optional)

When easily available, `chaos:apply` may record **changed files and branch context** from the
provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`, tool profile `apply`,
read-only) in the delivery record (`change.md` §Delivery on change.md changes; the legacy apply
report otherwise). This is additive provenance only — apply does **not** require
MCP, CLI, or provider context; local git fallback is sufficient.

## Config awareness

Before resolving OpenSpec paths, review reports, apply report output, validation commands, or C# specialist delegation, read `.chaos/config.yaml` when present and follow `reference/config-awareness.md`.

If config is missing, infer defaults and record the config status. In strict mode, require a config waiver before code mutation when missing config affects execution safety.
