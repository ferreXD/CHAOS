# Standard/strict → `change.md` migration (Stage-A completion)

> Toolkit meta-work (no CHAOS governance). Completes the universal-`change.md` model for **standard**
> and **strict** modes — the "follow-up pass" the Stage-A roadmap deferred
> (`2026-07-24-artifact-model-roadmap.md` §"Migration A→B", `2026-07-22-light-mode-workflow.md` §4).
> Prompted by an interactive light run whose auto-escalation light→standard produced the retired
> `proposal-report.md` + legacy `lifecycle.md` and **no `change.md`** — because standard was still on
> the pre-`change.md` path. This spec is the single source of truth the migration edits follow.

## Goal (one sentence)

Every change, in **every** mode, is the same four artifacts — **`change.md`** (story, depth scales) ·
**`lifecycle.md`** (state view/stub) · **`decision-events.md`** (append-only ledger) ·
**`openspec/changes/<id>/`** (full spec) — and the four narrative reports + `approval.md` are **retired
as outputs in all modes** (kept only as **legacy read-fallbacks** for old/archived changes).

## Retired as OUTPUT (all modes, new changes)

`proposal-report.md` · `proposal-review.md` · `apply-report.md` · `verification.md` · `approval.md`.

Where each goes instead:

| Retired report | Replaced by (all modes) |
|---|---|
| `proposal-report.md` | `change.md` §Intent + §Contract |
| `proposal-review.md` | `change.md` §Review (verdict/confidence/evidence_coverage/assumption_load + findings) |
| `approval.md` | `approves-change: true` marker on the approving decision entry |
| `apply-report.md` | `change.md` §Delivery (dashboard + files + deviations) |
| `verification.md` | `change.md` §Delivery / §Verification (post-hoc table appended by standalone verify) |

## Depth per mode (from `chaos-shared/reference/change-template.md` — already authoritative)

- **light** — tables / checklists / single lines only; **no paragraphs**.
- **standard** — same sections, **short prose allowed** where it earns its place.
- **strict** — fuller analysis + **extra sections** (risk, traceability matrix) + the **overflow rule**
  (any section > ~80 lines → `appendix/<section>.md`, leave a one-line summary + link).

`change.md` frontmatter: `artifactType: change` (not `light-change`); `mode: light|standard|strict`;
the `chaosMetadata.lifecycle` block is the authoritative machine-readable state.

## Per-command behavior (all modes)

- **`chaos-propose`** — always writes `change.md` (§Intent + §Contract + §Review verdict line) at mode
  depth, `decision-events.md`, `lifecycle.md` stub, and the full OpenSpec set. **No
  `proposal-report.md`.** Light = collapsed FRAME (unchanged). Standard/strict = same artifact set, more
  section depth, and (standard/strict) it still **recommends `chaos:review`** as a distinct step; light
  keeps its inline self-review verdict line. The propose run always produces a `change.md` even when it
  auto-escalates (see Escalation).
- **`chaos-review`** (standard/strict; inline in light) — updates `change.md` §Review
  (verdict/confidence/evidence_coverage/assumption_load + findings list) and records review decisions in
  `decision-events.md`. Remediation edits `change.md`/OpenSpec. **No `proposal-review.md`.**
- **`chaos-apply`** — implements to the approved contract, appends `change.md` §Delivery (build/tests/
  contract/rules dashboard + files + deviations), sets `lifecycle.status: Delivered`. **No
  `apply-report.md`.** Light-deliver is the base case; standard/strict add short prose / strict extras.
- **`chaos-verify`** — reads `change.md` (§Contract + §Delivery) first; standalone post-hoc verify
  appends a `## Verification` table to `change.md`. **No `verification.md`.**

## Escalation (light → standard/strict) — the bug this fixes

On an auto-escalation, `chaos-propose` **keeps the `change.md` model**: if `change.md` already exists,
add the `> ⚠ escalated: light → <mode>` line under its H1; if the trigger fired **before** FRAME wrote
`change.md` (e.g. posture crossing detected at classification), **create `change.md` now** at the
target mode's depth. Always set `escalatedFrom`, append an `ESC-*` entry, deepen the sections to the
target mode, and continue. **Never emit the retired reports on an escalated change.**

## Reader generalization (the key mechanical rule)

Every skill that currently branches **"if light → `change.md`; else → legacy reports"** changes to
**presence-conditioned**: **"if `change.md` present → use it (any mode); else fall back to the legacy
report set."** Applies to `chaos-verify`, `chaos-archive`, `chaos-sync`, `chaos-todo`, `chaos-status`,
`chaos-help`. Mode no longer selects the artifact layout — presence does.

## Legacy compatibility — do NOT remove

- Old/archived changes **never migrate**. Keep every legacy-report mention that is a **read-fallback**
  ("when `change.md` is absent, read `proposal-report.md`/…").
- Only remove/relocate mentions that **instruct writing** a retired report for a **new** change, or that
  assert the standard/strict output set **is** the legacy reports.
- `chaos-archive` existence contract is satisfied by `lifecycle.md` + `change.md` (as it already is for
  light).

## Metadata hook / config

- `change.md` stays in the managed include set (already added). Retired reports are simply no longer
  produced for new changes → nothing new to stamp; leave hook include/exclude otherwise unchanged.
- `.chaos/config.yaml`: no new keys required (`lightMode` already present; `defaultMode: standard`
  unchanged). Standard/strict now use `change.md` by the skill contracts, not a config flag.

## Per-file edit map (`.claude/skills`; mirror each to `.github/skills`)

Semantic core (retire report **writes**, wire `change.md` at mode depth):
- `chaos-propose/`: `SKILL.md` (steps 8–12 → change.md set), `reference/output-contract.md`,
  `reference/mode-reference.md`, `reference/change-artifacts-layout.md`, `reference/decision-event-register.md`
- `chaos-apply/`: `SKILL.md`, `reference/apply-contract.md`, `reference/output-contract.md`,
  `reference/generated-artifacts-contract.md`, `reference/mode-reference.md`, `reference/report-template.md`,
  `reference/decision-event-register.md`, `reference/task-delegation-contract.md`
- `chaos-review/`: `SKILL.md`, `reference/review-contract.md`, `reference/runtime-remediation-loop.md`,
  `reference/guided-amendment-policy.md`, `reference/decision-event-register.md`
- `chaos-verify/`: `SKILL.md`, `reference/verification-contract.md`, `reference/report-template.md`

Reader generalization (light→all-modes; keep legacy fallback):
- `chaos-archive/`: `reference/archive-contract.md`, `reference/report-template.md`,
  `reference/decision-event-closure.md`, `reference/install-checklist.md`
- `chaos-sync/`: `reference/change-scope-and-roles.md`
- `chaos-status/`: `reference/status-contract.md`, `reference/check-catalog.md`, `reference/config-audit.md`
- `chaos-help/`: `reference/help-contract.md`, `reference/report-and-artifact-map.md`,
  `reference/autodiscovery-policy.md`
- `chaos-init/`: `reference/config-contract.md`
- `chaos-shared/`: `reference/change-scoped-artifact-layout.md` (change-template.md already done)

## Verification (after edits)

1. No skill instructs **writing** a retired report on a **new standard/strict** change:
   `grep -rn 'write .*proposal-report\|Write the proposal report\|apply-report.md\|verification.md' .claude/skills`
   returns only legacy-fallback/read contexts.
2. `.claude/skills` == `.github/skills` (parity).
3. Re-sync into `demo-light`; re-run the escalating auth task → expect `change.md` (mode: standard,
   escalatedFrom: light, ESC-001) + `decision-events.md` + `lifecycle.md` + OpenSpec, and **no**
   `proposal-report.md`/`proposal-review.md`. Re-run a non-posture task in `--standard` → same
   `change.md`-only set. Legacy-change read path still works (change.md absent → legacy reports read).

## Addendum (2026-07-26) — frontmatter lifecycle-state schema extension

Follow-up to an artifact quality-grade review of the first standard/strict run (`secure-task-api`),
which surfaced four nits in the generated `change.md`: (#1) a cumulative count went stale in a prose
dashboard, (#2) the frontmatter `lifecycle.phases` block omitted `verify` (it modelled only the light
`frame`/`deliver`), (#4) a decision cross-ref cited the approach entry instead of the accepted-risk
entry, (#5) mixed rigor (standard framing, strict review/verify) was visible only in prose.

Root cause was one place — the `change-template.md` frontmatter `lifecycle` block. Extended so it
models **every step that can run in the mode** and carries current cumulative state:

- `phases` now covers `frame → review → deliver → verify → sync → archive` (standard/strict; light =
  `frame`+`deliver`), each with a **per-phase `mode`** (mixed rigor is machine-readable — #5) and, for
  review/verify/sync, a `verdict`. No standard/strict step is schemaless (#2).
- A new **`current:` rollup** (`tests`, `contract`, `decisions`, `traceability`, `syncState`,
  `archiveReadiness`) is the **single authoritative home for cumulative figures**; `lifecycle.md`
  renders it as a `Current:` line + `Mode`/`Verdict` columns.
- **Reconcile-on-write rule:** every writing command sets its own phase entry + reconciles `current`
  + re-renders `lifecycle.md`. Prose §Delivery/§Verification dashboards are per-pass snapshots tagged
  by run id — appended, never back-edited — so a historical figure (e.g. the pass-1 "15 decisions")
  stays a correct snapshot while current lives in `current` (#1).
- Cross-ref hygiene (#4): a propose/review self-review checklist item — every `*-DEC-*` id cited in
  `change.md` exists and points at the entry that records the fact.

Wired into `chaos-propose/apply/review/verify/sync/archive` (both skill trees). The `secure-task-api`
demo instance was retrofitted to the extended schema as the reference example.

## Addendum 2 (2026-08-01) — closure completeness, projection purity, enum, serialization

Second artifact quality-grade review, over a *fresh* full-lifecycle run (`secure-task-api`, strict, escalated
light → standard → strict, archived). The previous addendum's schema work verified: all six phases, per-phase
`mode`, and the `current` rollup were produced **natively**, and the per-pass snapshot mechanism worked as
designed. Four new findings were fixed:

1. **Archive closure claimed completeness it did not have.** The report asserted `UNCLASSIFIED: none` while
   classifying 12 of 14 decision entries. Fixes: a **canonical decision-entry scan rule** in
   `change-template.md` §2 — an entry is `^## (<PREFIX>-DEC-<nnn>|ESC-<nnn>)` in the **ledger**
   (`decision-events.md`); prose/grouping headings are not entries, and legacy reports' nested `###`
   decision subsections are report structure, not the ledger. `chaos:archive` must now enumerate by that
   rule, emit **one row per entry**, record `N enumerated / N classified`, and may claim completeness only
   when it balances; unmatched entries become `UNCLASSIFIED` rather than vanishing. Missing scan prefixes
   (`CR-`, `ARC-`, `SYNC-`, `RETRO-`) were added, and the `### PREFIX-DEC-XXX` register templates were
   reconciled to the `##` shape so writers and scanners agree. The same rule now defines
   `lifecycle.current.decisions` (closing the earlier heading-vs-entry counting nit).
2. **`lifecycle.md` invented a cell** (a `Frame` verdict with no frontmatter backing). Fixes: every phase may
   now carry an optional `verdict` (frame `READY_FOR_REVIEW`, deliver `APPLIED`/`PARTIALLY_APPLIED`), plus a
   hard **purity rule** — render exactly what exists, absent ⇒ `—`, **never synthesize a value and never add
   an unbacked row/line**. Root causes removed: `chaos-propose`'s divergent 4-column stub template (now a
   pointer to §3, one source), and the unbacked writes by `chaos-code-review` / `chaos-retro` (now optional
   `codeReview` / `retro` phases set in frontmatter first) and `chaos-help`'s read of a `Current Next Command`
   field that no longer exists (now derived from `status` + `phases`).
3. **`archiveReadiness` held a terminal value.** The rollup enum now admits `ARCHIVED | ARCHIVED_WITH_DEBT`
   — readiness pre-archive (verify-set), outcome post-archive (archive-set). The archive **report's**
   `archive_readiness` field and the whole verify side stay the 3-value readiness.
4. **`repositoryContext` serialized as a Python dict repr.** Not a defect in `main`: `a3229c6` already added
   `_scalarize_branch`/`_scalarize_review_request` + a `_yaml_scalar` structured-value safety net. The demo
   worktree was running a **pre-fix copy** of the hook (and the old broad `.chaos/**/*.md` managed set).
   Fixes: synced the hook + narrowed managed set to the demo; made the hook **self-healing** — the update
   path previously copied existing metadata verbatim, so a stringified `branch`/`reviewRequest` persisted
   forever; it now detects and rebuilds those scalars in place (6 corrupted demo files healed on one pass);
   and added `.claude/hooks/scripts/test_chaos_artifact_metadata_hook.py`. **The test is the durable fix** —
   `a3229c6`'s verification was ad-hoc and never committed, which is exactly why the defect could survive on
   a branch. The suite fails against the pre-fix hook and passes against the fixed one.

**Sequencing note.** Three of these four (1–3) are *writer-discipline* defects — the class a deterministic
Stage-B renderer eliminates by construction (it enumerates mechanically, projects only what exists, and
validates against the schema). Item 4 is the counterpoint: a deterministic-tool defect, whose durable fix is a
test. This round is not wasted on Stage B — per the roadmap, A's formats **are** B's schemas, so the scan
rule, purity rule, and enum are literally the renderer's spec. But the returns are diminishing:
**next step is the Stage-B renderer, not a third artifact-nit cycle.**
