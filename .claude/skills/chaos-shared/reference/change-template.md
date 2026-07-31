# Universal change artifacts — `change.md`, decision entries, `lifecycle.md` view

Canonical formats for the per-change artifact model (design:
`docs/design/2026-07-24-artifact-model-roadmap.md`; adopted 2026-07-24). Every change, in every
mode, is exactly four artifacts, each with one job:

| Artifact | Job | Written by |
|---|---|---|
| `change.md` | the **story**: intent → contract → review → delivery | propose (FRAME sections) + apply (Delivery section) |
| `lifecycle.md` | the **state**: generated view of `change.md` frontmatter | stub at phase transitions (rendered mechanically in Stage B) |
| `decision-events.md` | the **decisions**: append-only ledger | any command surfacing/resolving a decision |
| `openspec/changes/<id>/` | the **spec**: full OpenSpec set | OpenSpec (all modes, unchanged) |

**Modes scale section depth, not file count.** Light = tables/checklists/single lines only
(hard rule: **no paragraphs**). Standard = short prose allowed per section. Strict = fuller
analysis + extra sections (risk, traceability matrix).

**Overflow rule (standard/strict):** any section exceeding ~80 lines moves to
`appendix/<section>.md`, leaving a one-line summary + link in the section. One entry point, always.

**Structured-format rule (Stage-B obligation):** every section below is a strict format —
tables, checklists, `key: value` lines. Do not restyle, reorder, or rename fields; downstream
commands and the future renderer parse them.

**Reconcile-on-write rule (single source of current state).** Every command that writes `change.md`
MUST, before it finishes: (a) set **its own** `lifecycle.phases.<step>` entry (`status`, `at`, `run`,
`mode`, plus `verdict` for review/verify/sync), advance `lifecycle.status` if the step changes it, and
(b) reconcile the `lifecycle.current` rollup to present values (test counts, contract met/total,
decision-events count, traceability, syncState, archiveReadiness). Then re-render `lifecycle.md` (§3).
The prose §Delivery / §Verification dashboards are **per-pass snapshots, tagged by their run id, and are
appended — never back-edited**: each records the figures as of that pass. The **only** authoritative
*current* cumulative state is `lifecycle.current` (rendered in `lifecycle.md`). A reader must never take
a dated pass dashboard as current — §Delivery/§Verification each open with a one-line pointer saying so.
This keeps the append-only story intact while giving one non-stale home for current counts.

## 1. `change.md` template

```markdown
---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: <change-id>
  mode: light            # light | standard | strict
  escalatedFrom: null    # set to the prior mode on auto-escalation
  sourceCommand: "chaos:propose"
  lifecycle:             # authoritative machine-readable state (lifecycle.md is a VIEW of this)
    status: Framed       # Framed | Approved | Delivered | Rejected | Escalated | Archived
    # phases models EVERY step that can run in the mode, so no step is ever schemaless.
    # Light: frame + deliver only. Standard/strict: the full lifecycle below (a phase stays
    # `pending` until its step runs). Each entry carries its own `mode` (per-phase rigor —
    # review/verify/sync may auto-escalate above the framing `mode` above); review/verify/sync
    # also carry a `verdict`.
    phases:
      frame:   { status: complete, at: "<ISO-8601>", run: "<commandRunId>", mode: <mode> }
      review:  { status: pending,  at: null, run: null, mode: null, verdict: null }   # standard/strict
      deliver: { status: pending,  at: null, run: null, mode: null }
      verify:  { status: pending,  at: null, run: null, mode: null, verdict: null }   # standard/strict
      sync:    { status: pending,  at: null, run: null, mode: null, verdict: null }   # standard/strict
      archive: { status: pending,  at: null, run: null, mode: null }                  # standard/strict
    current:               # authoritative CURRENT cumulative rollup — reconciled on every write
      tests: null          # "<passed>/<total>"           (once delivered)
      contract: null       # "<met>/<total>"
      decisions: null      # integer count of decision-events.md entries
      traceability: null   # "<satisfied>/<partial>/<missing>" (strict; omit when N/A)
      syncState: null      # RECONCILED | PARTIALLY_RECONCILED | ... (once sync runs)
      archiveReadiness: null # READY | READY_WITH_DEBT | NOT_READY (once verified)
---

# <change-id> — <one-line title>

## Intent

<≤3 lines: what and why now. Light: single lines only.>

## Contract

<!-- Testable statements of what will be true when delivered. Each gets a checkbox; DELIVER
     ticks it only when covered by a test or a directly-evidenced check. -->
- [ ] <testable statement 1>
- [ ] <testable statement 2>

OpenSpec: `openspec/changes/<change-id>/` · decisions: see `decision-events.md`

## Review

verdict: PASS · confidence: MEDIUM · evidence_coverage: PARTIAL · assumption_load: LOW
scope: <files/modules the change may touch> · rules in play: <R-00x, R-00y>
<!-- Light: the inline self-review checklist result — one line, no report. Checklist:
     scope sane / rules mapped / contract testable / decisions complete / decision cross-refs
     resolve (every `*-DEC-*` id cited elsewhere in change.md exists and points at the entry that
     actually records the fact). Failure ⇒ escalate. Standard/strict: chaos:review sets the
     phases.review entry (mode + verdict) and a fuller findings list. -->

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

| check | result |
|---|---|
| build | <0 warn / 0 err> |
| tests | <N/N (baseline + new)> |
| contract | <N/N statements covered> |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: <changed files, comma-separated>
deviations: none · <or one line per deviation, each backed by a decision>
status: Delivered · <date> · run: <apply commandRunId>

## Verification            <!-- standard/strict; standalone/post-hoc appends here -->

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited (a re-verify appends a new
     "### Verification — pass N" block). Current cumulative state lives in `lifecycle.current`. -->

verdict: <READY | READY_WITH_DEBT | NOT_READY> · confidence: <…> · archive_readiness: <…>
verified: <date> · run: <verify commandRunId>

| check | result |
|---|---|
| build | <0/0> |
| tests | <N/N> |
| contract | <N/N ticked> |
| traceability | <sat/partial/missing> → `appendix/verification-traceability.md` (strict overflow) |
| rules | R-003 ✅ · … |
```

Escalation warning (when it happens) goes directly under the H1, so it is unmissable:

```markdown
> ⚠ **escalated: light → standard** — <trigger, one line> · <ISO date> · see ESC-001
```

## 2. Decision entry format (`decision-events.md`, append-only)

Same file name and anatomy as always; entries are **appended, never rewritten** — a state change
edits the `status:` line only. No narrative retelling of the question.

```markdown
## <PREFIX>-DEC-<nnn> — <question, one line>

- status: OPEN | ANSWERED (<who>, <date>) | RESOLVED-IN-ARM | CONSUMED
- approves-change: true            # exactly one entry per light change carries this marker
- options: A <one line> · B <one line> · C <one line>
- recommendation: <letter> — <one clause>
- answer: <letter or verbatim short answer>
- why-material: <one line>
- knowledge: FACT | INFERENCE | ASSUMPTION · confidence: HIGH | MEDIUM | LOW
```

Escalation events use the same shape with the `ESC-` prefix:

```markdown
## ESC-001 — auto-escalated: <trigger>

- status: RECORDED (<date>)
- from: light · to: standard
- trigger: <posture-crossing | decision-count | scope-spill | self-review-fail | openspec-degraded | answer-widened-scope>
- kept-work: <one line — what FRAME output seeds the standard path>
```

## 3. `lifecycle.md` — generated state view

Authoritative state lives in `change.md` frontmatter (`chaosMetadata.lifecycle`). `lifecycle.md`
is a **view** of it — never a second source of truth, never narrative. Until the Stage-B renderer
exists, commands hand-write this stub and edit it at each phase transition, rendering the frontmatter
`phases` (incl. per-phase `mode`/`verdict`) and the `current` rollup. The **Current** line is where a
reader gets present cumulative state — the change.md prose dashboards are historical per-pass snapshots.

```markdown
# Lifecycle — <change-id>

Status: <Framed | Approved | Delivered | Rejected | Escalated | Archived>
Mode: <light | standard | strict> · Escalated-from: <none | light>
OpenSpec: openspec/changes/<change-id> · Runs: <per-phase run ids>
Current: tests <N/N> · contract <N/N> · decisions <N> · traceability <s/p/m> · sync <state> · archive <readiness>

| Phase | Status | Mode | Verdict | Date | Pointer |
|---|---|---|---|---|---|
| Frame | Complete | <mode> | — | <date> | change.md#contract |
| Review | Pending | — | — | — | change.md#review |
| Deliver | Pending | — | — | — | change.md#delivery |
| Verify | Pending | — | — | — | change.md#verification |
| Sync | Pending | — | — | — | change.md (decision-events) |
| Archive | Pending | — | — | — | — |
```

Light renders only the `Frame` and `Deliver` rows and omits the `Current` fields that never populate
(no traceability/sync/archive on the collapsed path). Standard/strict render all rows.

## 4. Legacy compatibility

- New changes (any mode) use this model. **Old/archived changes never migrate.**
- Readers (`chaos:verify`, `chaos:archive`, `chaos:sync`, `chaos:todo`) read `change.md` first;
  when it is absent, fall back to the legacy report set (proposal-report / proposal-review /
  apply-report / verification / approval).
- Standard/strict adopt this model for new changes in a follow-up pass; light ships first
  (`docs/design/2026-07-24-artifact-model-roadmap.md`, migration staging).
