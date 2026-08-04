# CHAOS Verify Skill

Use this skill when the user asks to run or design `chaos:verify`, verify an implemented OpenSpec change, assess archive readiness, or perform a post-implementation CHAOS confidence review.

## Purpose

`chaos:verify` is the post-implementation verification command in CHAOS.

**Stage-D role (design `docs/design/2026-08-03-cost-bar-and-run-collapse.md` §4.1).** On a
change delivered by `chaos:run`, verification already ran **inside the loop** at the
vector-owed depth, and the deterministic obligation audit (`tools/chaos-classify/audit.py`)
gated the close. `chaos:verify` is then the human's **opt-in extra pass** — a fresh,
independent re-verification on demand. Its semantics below are unchanged; only the invocation
surface moved. On changes delivered by the phase commands (`chaos:apply` without `chaos:run`),
it remains the enforcement end exactly as before.

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
- `docs/design/2026-08-02-stage-c-progressive-rigor.md` (progressive rigor — verify is its enforcement end)
- `tools/chaos-classify/README.md` (the classifier contract; K4 + obligation audit)

## Repository context (vNext)

`chaos:verify` may enrich the verification output with the provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`), tool profile
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

## Stage-C enforcement (classification-driven)

When `.chaos/changes/<change-id>/classification-state.json` exists (design
`docs/design/2026-08-02-stage-c-progressive-rigor.md`; contract
`tools/chaos-classify/README.md`), `chaos:verify` is the **enforcement end** of progressive
rigor:

1. **K4 checkpoint (scan-only, C-12):** build the classifier payload (intent/scope from
   `change.md`; `ledgerFile` = `decision-events.md`; `selfReview: fail` when the recorded
   inline self-review / review verdict is not clean) and run
   `python tools/chaos-classify/classify.py --inline <payload.json> --state <classification-state.json>`
   with `checkpoint: K4`. An **X2 firing demands an independent review pass (review 2) and
   deeper verify — never a stop** (C-3): record the `TRG-*` event and route to a standalone
   review before any READY verdict.
2. **Obligation audit — the dimension vector is a checklist:**
   - `adr 2` → no READY until the ADR exists (READY_WITH_DEBT at most, debt named);
   - `openspec 1/2` → the delta/full set owed by K1–K3 firings exists (design §5.3 law 5:
     due by DELIVER exit); missing ⇒ finding + verdict cap;
   - `verify 1` → run the **trigger-attributed** safeguard checks (the firing's surface says
     which: auth → credential/enforcement checks; data-store → persistence/migration checks;
     contract-dependency → contract checks); `verify 2` → full orchestration;
   - every `newStops` stop was surfaced as a runtime decision and ANSWERED; every
     `stopSatisfiedBy` cites a real ANSWERED entry;
   - dimensions never decreased across checkpoints without a recorded human override decision.
3. Verdict metadata is unchanged (confidence doctrine); classification findings are normal
   `VFY-###` findings carrying their `TRG-*` refs in `detail`.

Absent `classification-state.json` (pre-C change): legacy behaviour, no new duties.

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
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:verify` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.
