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

## `change.md` entry (classification-driven)

Before anything else: if `.chaos/changes/<change-id>/change.md` exists, this apply is the
**DELIVER** phase of the universal change lifecycle. Read
`.chaos/changes/<change-id>/classification-state.json` (Stage-C; design
`docs/design/2026-08-02-stage-c-progressive-rigor.md`):

- **Present** → the **dimension vector, not mode words, sets the rigor** (run the "Stage-C
  checkpoints" section below alongside the Deliver section of `reference/apply-contract.md`);
  `chaosMetadata.mode` is floor provenance only. The collapsed lifecycle is the universal base;
  depth comes from the dimensions.
- **Absent** (pre-C change) → legacy behaviour: infer the mode from `chaosMetadata.mode` and run
  Deliver at mode depth.

Either way the entry gate is unchanged: all decisions ANSWERED, else point at the Decision
Center and stop; output = rendered `change.md` §Delivery, no apply-report/verification.md.
Recommend `chaos:verify` when the `verify` dimension ≥ 1 (or a floor demands it); at
`verify 0` it stays post-hoc optional. Only when `change.md` is absent (legacy change) use the
legacy stages and the legacy output below.

## Stage-C checkpoints (K2 at entry · K3 at DELIVER end)

When `classification-state.json` exists:

1. **K2 (entry, scan-only — C-12):** build the classifier payload (intent + scope from
   `change.md` §Intent / §Review scope line; `ledgerFile` = `decision-events.md`; `mapFile` =
   `.chaos/path-class-map.json`) and run
   `python tools/chaos-classify/classify.py --inline <payload.json> --state .chaos/changes/<change-id>/classification-state.json`
   with `checkpoint: K2`. An M4 firing here raises review/openspec/evidence.targeted — apply
   the new obligations BEFORE implementing.
2. **Implement to contract** (unchanged: preflight, boundary construction, delegation, scope
   discipline).
3. **K3 (DELIVER end):** regenerate the payload with `numstatFile`/`patchFile` from
   `git diff --numstat` / `git diff` against the pre-apply base — **scoped per the rule below**;
   scan call first, then perform
   the **adjudication pass** per `tools/chaos-classify/adjudication-prompt.md` (K3 is an
   adjudication checkpoint) over the verdict's demoted candidates + full inputs, and merge
   raises via `--adjudication`. Record one `TRG-*` ledger event per new firing
   (`chaos-shared/reference/change-template.md` §2).

   **Diff-scope rule (mandatory — governance must not amplify itself).** The numstat and patch
   describe the **governed subject only**. Always exclude the change's own bookkeeping:
   `.chaos/**` and `openspec/**` (and any ADR the change authored). Stage newly created files
   first (`git add -N <subject paths>`) or the diff is blind to them. Concretely:

   ```bash
   git add -N src tests                      # subject paths; new files must be visible
   git diff --numstat -- src tests > .tmp/k3.numstat
   git diff          -- src tests > .tmp/k3.patch
   ```

   *Why this is a rule and not a preference:* measured on 2026-08-03 across six governed arms
   (`.chaos/validation/2026-08-stage-c-step5-rerun/results.md` §3), **every** arm that counted its
   own governance artifacts crossed X1's blast-radius threshold — the artifacts a change produces
   trip the trigger that then demands more governance. One arm actually did it, producing the
   program's only classification miss, and the spurious X1 also raised `verify` 0→1, which changed
   whether the final checkpoint ran at all. Blast radius is a property of the **subject**, never
   of the paperwork.
4. **New-stop protocol:** `newStops > 0` in the K3 verdict (a scope spill, or first-fired
   materiality with no covering ANSWERED decision — MR-3 satisfaction is the classifier's,
   not yours) ⇒ surface **one** runtime decision carrying every folded question, declaring
   `folds: <n>` on the entry (`change-template.md` §2 — M4 counts questions, not headings),
   create the resume capsule, and STOP (`mustStop`). Do not complete the deliver record until it is
   ANSWERED. A `stopSatisfiedBy` field means no stop — cite the covering decision in the
   delivery facts instead.
5. **Late-fired obligations (design §5.3 law 5):** artifact obligations from K2/K3 firings
   (openspec delta/full, adr entry/ADR) are due **before DELIVER completes**; verify enforces
   them.
6. **DELIVER-exit sign-off:** when the stops floor is ≥ 2 (strict preset), surface the
   sign-off decision at DELIVER exit before terminalizing.
7. **Scope drift:** M5 is the mechanical detector for `reference/scope-drift-policy.md`; the
   policy still governs what to DO about drift — detection and stop placement are the
   classifier's.

Open item (design §12, unchanged): K3 runs at DELIVER end only for now; per-task-boundary
classification is revisited with step-5 data.

## Golden rules

- OpenSpec owns proposal/design/spec/tasks.
- CHAOS owns implementation permission, scope discipline, decision events, confidence, and audit trail.
- `chaos:apply` may implement code only after preflight and boundary construction.
- C# specialists implement tasks; they do not decide scope.
- Light/standard can continue through non-direct blockers after explicit user confirmation.
- Strict blocks unless proposal/review/evidence are approval-ready.
- Under Stage-C, the classification dimension vector — never mode words — sets the rigor;
  floors only raise, and the system never lowers a fired dimension (human override only).
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
