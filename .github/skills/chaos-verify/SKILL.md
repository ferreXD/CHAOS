# CHAOS Verify Skill

Use this skill when the user asks to run or design `chaos:verify`, verify an implemented OpenSpec change, assess archive readiness, or perform a post-implementation CHAOS confidence review.

## Purpose

`chaos:verify` is the post-implementation verification command in CHAOS.

It verifies the implemented result against:

- OpenSpec proposal/design/spec/tasks;
- `change.md` (§Contract + §Delivery + §Review) when present — any mode;
- legacy proposal-review / apply reports (read-fallback when `change.md` is absent);
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

## Repository context (vNext)

`chaos:verify` may enrich the verification output with the provider-neutral repository context
(`.github/skills/chaos-shared/reference/repository-context-contract.md`), tool profile
`verify` (least privilege, read-only): changed-files source, review request (PR) / linked
work item if available, and CI/check status if available. **Do not** require MCP unless
`--strict` and verification depends on provider-backed CI/check facts. Always retain the local
build/test status as primary evidence; cap confidence when only local git was available.
Include the shared **Repository Context** section when context is resolved.

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

**`change.md` first (all modes):** when `.chaos/changes/<change-id>/change.md` exists — any
mode, not just light — verify against it: read §Contract + §Delivery first (plus §Review,
`decision-events.md`, the `records/` and the `lifecycle.md` view) and do **not** demand
`apply-report.md`/`verification.md`. The output is the **verify phase record** — emit
`records/verify.pass-NN.facts.json` per `chaos-shared/reference/record-emission.md`: envelope
`verdict` (`READY | READY_WITH_DEBT | NOT_READY`), the completing run id, `mode` = the verify
rigor, `assessment`, and `facts`: `archiveReadiness`, independently re-run `checks`
(build/tests/contract/openspec/scopeDrift/rules — the renderer **cross-checks** these against
the deliver record and the contract), `approvalConditions` (status per condition of the
approving entry, analysis in `detail`), the strict `traceability` matrix (the rollup is
derived from rows, never asserted), and `findings` (`VFY-###`, severity, knowledge,
confidence, `detail`, optional `confirms` decision ref). "Why this verdict" goes in
`verdictRationale`. Then render: `python tools/chaos-render/render.py <change-id> --write` —
the renderer appends the `### Verification — pass N` snapshot to `change.md`; never hand-write
it. Presence of `change.md` selects this layout — mode does not.

**Legacy fallback (`change.md` absent — old/archived changes only):** read change-folder
artifacts (`lifecycle.md`, `apply-report.md`, `proposal-review.md`, `decision-events.md`,
`waivers.md`) when present and produce the legacy report (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/verification.md
```

Audit `.chaos/changes/<change-id>/decision-events.md` and `.chaos/changes/<change-id>/waivers.md`
if present (the decision-event audit paragraph is **derived by the renderer** from the ledger
scan — never hand-counted). The renderer sets `phases.verify` — the phase that was previously
left unwritten — reconciles `lifecycle.current` (`tests`, `contract`, `traceability`,
`decisions`, `archiveReadiness`) from the records, and re-renders `lifecycle.md`. A re-verify
emits the next pass record (`verify.pass-02.facts.json` → a new `### Verification — pass N`
block); a pass record is never rewritten. Do not edit production code. The legacy
`.chaos/verification/` folder may be READ for compatibility but is no longer the preferred
output location; do not migrate it. See `.chaos/changes/README.md`.

When verification cannot be completed, emit **no phase record** (a blocked attempt is not a
completed pass — the phase renders as attempted via its runtime session): report `BLOCKED` or
`INSUFFICIENT_EVIDENCE` with concrete next actions in the run summary, and record a ledger
entry when the blocker is material. On old changes the legacy report carries the outcome.

## Todo Candidates (optional)

`chaos:verify` MAY surface an optional `## Todo Candidates` list (in the legacy report when one
is produced; as a compact list in the run summary when the result lives on `change.md`) covering
material verification gaps, failed validations, waivers, archive blockers, or low-confidence
conformance findings, using the shared fields in
`.github/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:verify` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.
