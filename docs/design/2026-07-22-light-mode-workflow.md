# True `--light` mode — workflow design

> **Status:** agreed design (creator + assistant, 2026-07-22) — ready for the per-command design pass,
> then implementation. Toolkit meta-work: developed **without** CHAOS governance, per the creator's
> standing preference. Evidence base: [`../perf/2026-07-22-ea-v2-cost-attribution.md`](../perf/2026-07-22-ea-v2-cost-attribution.md).

## 1. Problem — today's `--light` is not light

The EA-V2 cost-attribution showed the governed lifecycle costs **~4× a plain run**, and located the
cost precisely:

- **Artifact prose is 45.5%** of the governed arm's output tokens (168.9k of 371k across 9 agents);
  writing code is only ~13% and costs the same as the plain arm.
- The per-file split (across the 3 EA-X2 governed changes): decision-events **49.0k/24 turns**,
  proposal-report **36.9k**, verification **24.4k**, lifecycle **19.8k over 16 edit-turns**,
  proposal-review **18.6k**, apply-report **11.6k** — vs **OpenSpec's 5 files at only 8.6k (5.1%)**.
- The 6-command cadence (propose → review → approve → apply → verify → archive) multiplies turns
  (2.8× vs plain), preflights, context re-reads, and frontmatter re-stamps.

Meanwhile the skills' current `--light` only **relaxes validation rigor** (degraded-mode handling,
confidence caps); it emits the same ~11 artifacts through the same 6 invocations. Only `chaos:todo`
actually skips work on light. So light today = same path, looser checks — the worst trade.

**The design goal:** cut the cost of *producing the traceability*, never the traceability itself.

## 2. The reframe — what `--light` means

> **Light = "the decision record IS the lifecycle."**

### The light invariant (never cut, in any mode)

1. **Every material decision** is surfaced through the interaction runtime (Decision Center), answered
   by a human, and recorded with full traceability (R-001). Light **never** means fewer decisions or
   less human decision-weight.
2. **Tests stay green** (R-003) and rules are respected (R-004/R-005/R-006) exactly as in standard.
3. **The knowledge lives in the repo** — decisions, contract, and outcome are committed artifacts.
4. **OpenSpec artifacts are produced wholesale** (proposal/design/tasks/spec-delta) — measured at 5.1%
   of artifact cost, they are the *cheap, structured* part of the trail and stay identical across
   modes (one spec model everywhere; no light-specific spec dialect).

### What light trades away

Narrative *ceremony*: the four prose reports (proposal-report, proposal-review, apply-report,
verification ≈ **54% of the CHAOS artifact cost**), the per-phase command cadence with its repeated
preflights, and the repeated re-editing/re-stamping of manifest files.

## 3. Workflow shape — two phases, one governed session

```
chaos --light "<intent>"
        │
        ▼
   ┌─ FRAME ─────────────────────────────┐      ┌─ human stop ─────────────┐
   │ preflight (once)                    │      │ Decision Center           │
   │ evidence scan (scoped)              │ ───► │ answers material decisions│
   │ OpenSpec artifacts (full set)       │      │ ── answering IS approval ─│
   │ change.md: intent + contract        │      └───────────┬──────────────┘
   │ surface material decisions → STOP   │                  │ chaos:resume
   └─────────────────────────────────────┘                  ▼
                                          ┌─ DELIVER ────────────────────────┐
                                          │ implement to the approved        │
                                          │ contract (+ tests)               │
                                          │ dotnet build / test green        │
                                          │ change.md: delivery dashboard    │
                                          │ lifecycle stub closed            │
                                          │ → DONE (archive = terminal note) │
                                          └──────────────────────────────────┘
```

### 3.1 FRAME (propose + review + approval, collapsed)

One command invocation, one runtime session (`chaos_begin_command`), one preflight. Steps:

1. **Scoped evidence scan.** Read what the change touches + the governance digest (rules index,
   architecture posture). Light explicitly does *not* re-derive the whole workspace: no full-repo
   discovery sweeps, no re-reading assessments/archaeology unless the change touches them.
2. **OpenSpec artifacts** — full set, exactly as standard (one spec model everywhere).
3. **`change.md`** started: 3-line intent + the **contract** (testable statements of what will be true
   when done — this section, plus the OpenSpec delta, *is* the spec surface the human approves).
4. **Material decisions surfaced** to the runtime as blocking decisions — same materiality bar as
   standard. Options + recommendation + why-material, in the lean structured format (§5.2).
5. **Self-review, no report.** The review phase becomes an inline checklist gate (scope sane, rules
   mapped, contract testable, decisions complete). Its output is a **verdict line** in `change.md`
   (`review: PASS — confidence MEDIUM`), not a proposal-review.md. If the self-check *fails*, light
   escalates (§6) rather than iterating prose.
6. **STOP** (mustStop) for the human.

**Approval collapse:** answering the surfaced decision(s) **is** the approval. The decision entry
carries an explicit `approves-change: true` marker so the audit trail shows the human's answer
authorized implementation — no separate approval.md, no second stop. If a change somehow surfaces
*zero* material decisions, FRAME surfaces one explicit gate decision — "Approve contract as framed?" —
so light **always** has exactly one human stop, never zero.

### 3.2 DELIVER (apply + verify, collapsed) — owned by `chaos-apply`

Ownership chain (creator-corrected, 2026-07-24 — see the
[artifact-model roadmap](2026-07-24-artifact-model-roadmap.md) decisions register):
**`chaos:propose --light` (FRAME, never writes production code) → human answers →
`chaos:apply` (DELIVER, under its own command identity)**. Vanilla `chaos:apply` **infers the mode
from `change.md` frontmatter** (explicit `--light` optional); it validates the decisions are
answered (else points at the Decision Center and stops), administratively closes the answered
propose run, and executes DELIVER. `chaos:resume` keeps its normal mid-flight job only — it is
**not** a deliver-router. Steps:

1. **Implement to the approved contract** — honoring the human's answers *verbatim*, R-003/4/5 intact.
2. **Validate:** build + full test suite; the contract's testable statements must each be covered by a
   test or checked directly.
3. **Delivery dashboard** appended to `change.md` (§5.1): build/tests/rules/contract table + files
   changed + deviations (if any) — compact, checkbox/table style, no narrative.
4. **Terminalize:** lifecycle stub set to `Delivered`; runtime session completed
   (`chaos_complete_command`), locks released. Archive on light is a **terminal state note in
   `change.md`**, not a separate command run — `chaos:archive` remains available for repo-wide
   housekeeping but is not part of the light path.

**Second human stop — only on deviation.** If DELIVER cannot meet the approved contract exactly
(a test reveals the contract is wrong, an answer is unimplementable, new material ambiguity appears),
it surfaces a new decision and stops again. Delivering-as-approved requires no second confirmation.

### 3.3 Session/runtime mechanics

- **Two linked runs, one changeId — today's session model, unchanged** (revised 2026-07-24): the
  propose run owns FRAME and pauses at the stop; once its decisions are answered and consumed it is
  administratively terminalized (at apply preflight or via normal resume). The apply run owns
  DELIVER under its own `sourceCommand`. Change-scoped lock re-acquired by apply.
- The capsule for the stop records `nextStep: deliver` plus the contract hash, so apply needs no
  re-derivation of FRAME's work (seed of the step-context capsule work — Lever 3).
- All existing runtime guarantees (EA-X4-hardened reconcile, capsule hash, write lock) apply unchanged.

## 4. Artifact set on light

> **Amendment (2026-07-22, creator-approved): `change.md` is the universal core narrative — all
> modes, not just light.** Every change, in every mode, is exactly four artifacts, each with one job:
> **`change.md`** (the story) · **`lifecycle.md`** (the state) · **`decision-events.md`** (the
> decisions) · **`openspec/`** (the spec). **Modes scale section *depth*, not file *count*** — light
> = tables/checklists/single lines (the base case); standard = same sections with short prose where
> it earns its place; strict = fuller analysis + extra sections (risk, traceability matrix). The
> separate narrative reports (proposal-report / proposal-review / apply-report / verification /
> approval) are retired for **new** changes in all modes.
>
> - **`lifecycle.md`** (revised 2026-07-24, creator conceded the two-sources-of-truth point):
>   authoritative machine-readable state lives in **`change.md` frontmatter** (YAML phase block);
>   `lifecycle.md` survives as a **generated view** of it — rendered, never hand-maintained
>   (Stage B renderer; until then a hand-written 10-line stub, edited only at phase transitions).
>   Kills the observed 19.8k/16-edit churn and the drift risk, keeps the at-a-glance file (and
>   archive's existence contract).
> - **Overflow rule** (guards strict-mode file growth): any `change.md` section exceeding ~80 lines
>   moves to `appendix/<section>.md`, leaving a summary + link. One entry point, always.
> - **Write contention** is acceptable: the lifecycle is sequential per change, and the team model is
>   per-change scoped; phases never race on one change.
> - **Migration staging** (no big-bang): (1) light ships `change.md` first — new path, zero breakage;
>   (2) standard/strict adopt it for **new** changes; (3) readers (verify/archive/sync/todo) accept
>   both layouts during the transition — which they must anyway for archived changes. Old/archived
>   changes never migrate. End-state: no `artifactType`-based special-casing — every command reads
>   `change.md`, period.

The table below is the **light** (base-case) instantiation:

| Artifact | Today (all modes) | Light |
|---|---|---|
| `openspec/changes/<id>/*` (5 files) | full | **full — unchanged** |
| `decision-events.md` | narrative, rewritten across phases (49k/24 turns observed) | **kept, same name/contract** — append-only structured entries (§5.2) |
| `lifecycle.md` | manifest re-edited every phase (16 turns observed) | **kept, reframed as pure state manifest** (phase table + pointers, no narrative), edited exactly twice on light (open, close) |
| `proposal-report.md` | narrative (36.9k) | **gone** → `change.md` §intent+contract |
| `proposal-review.md` | narrative (18.6k) | **gone** → verdict line in `change.md` |
| `approval.md` | separate artifact | **gone** → `approves-change` marker on the decision entry |
| `apply-report.md` | narrative (11.6k) | **gone** → `change.md` §delivery |
| `verification.md` | narrative (24.4k) | **gone** → `change.md` §dashboard |
| `change.md` | — | **new — the universal core narrative** (light is its base case): one compact sectioned file, one frontmatter stamp |

Net: **11 files → 8**, and the four pure-narrative reports (~54% of CHAOS artifact tokens) collapse
into one ~3k file. Estimated artifact prose per change: **~53k → ~9–10k tokens (−80%)**, ≈ **−38% of
total governed output**, *before* the turn savings from 6 invocations → 2.

## 5. Artifact formats

### 5.1 `change.md` template

```markdown
---
chaosMetadata: { schemaVersion: 1, artifactType: light-change, changeId: <id>,
                 mode: light, escalatedFrom: null, sourceCommand: "chaos:light" }
---
# <change-id> — <one-line title>

## Intent
<≤3 lines: what and why now>

## Contract (approved by DEC-… answers)
- [ ] <testable statement 1>
- [ ] <testable statement 2>
OpenSpec: openspec/changes/<id>/ (full delta)

## Review
verdict: PASS · confidence: MEDIUM · scope: <files/modules> · rules in play: R-003, R-004

## Delivery
| check | result |
|---|---|
| build | 0 warn / 0 err |
| tests | 12/12 (5 baseline + 7 new) |
| contract | 2/2 statements covered by tests |
| rules | R-003 ✅ R-004 ✅ R-005 ✅ R-006 ✅ |
files: <list> · deviations: none
status: Delivered · <date> · run: <commandRunId>
```

Hard rule for the template: **sections are tables, checklists, and single lines — no paragraphs.**
Anything that wants to be a paragraph is either a decision (→ decision-events) or doesn't belong.

### 5.2 Lean `decision-events.md` entries (append-only)

```markdown
## DEC-<id> — <question, one line>
- status: OPEN → ANSWERED (<user>, <date>) · approves-change: true
- options: A <one line> / B <one line> / C <one line>
- recommendation: B — <one clause>
- answer: C — <the human's answer, verbatim if short>
- why-material: <one line> · knowledge: INFERENCE · confidence: MEDIUM
```

Entries are **appended, never rewritten**; state changes edit the `status:` line only. This preserves
the full decision trail (the crown jewel) while eliminating the observed rewrite churn. Same file
name and section anatomy as standard mode, so `chaos:verify`, `chaos:todo`, `chaos:sync`, and the
harnesses keep reading it unchanged.

## 6. Eligibility and the auto-escalation valve

Light is **requested** (`--light`) or — later, once the blast-radius classifier exists — suggested.
It is **kept** only while the change stays inside the light envelope. The valve is one-way:

**Escalation triggers (light → standard, automatic):**
- the change **crosses an architecture non-goal / posture boundary** (auth, persistence, …);
- **> N material decisions** surface (default **N = 2**) or one decision is itself posture-changing;
- scope spills beyond the framed files/modules mid-DELIVER;
- the FRAME self-review fails its checklist;
- OpenSpec unavailable → standard's degraded-mode handling (light never silently skips the spec);
- the human answers a decision in a way that widens the change beyond the approved contract.

**Escalation mechanics (agreed):**
1. Escalate **without asking** — it only ever *adds* rigor. Announce it in-flight.
2. **Warn on the dashboard**: `change.md` gets a visible `⚠ escalated: light → standard — <reason>` line.
3. **Record it in the artifacts**: `escalatedFrom: light` + reason + timestamp in the metadata of
   `change.md` (which becomes the standard artifacts' seed) **and** a structured entry in
   `decision-events.md` (`ESC-001 — auto-escalated: <trigger>`).
4. Work already done is **kept** — the standard path continues from FRAME's outputs (OpenSpec + intent
   + contract + decisions become the proposal's core); nothing is re-derived from scratch.
5. **Downgrade (standard → light) never happens automatically.** A human may re-run with `--light`.

## 7. Contracts with the rest of the toolkit

| Consumer | Impact |
|---|---|
| **runtime / Decision Center** | none — same begin/decision/stop/resume/complete protocol, one session instead of six. |
| `chaos:resume` | none — normal capsule resume; `nextStep: deliver`. |
| `chaos:verify` (standalone) | reads `change.md` §Delivery instead of apply-report/verification (transitional: falls back to the legacy report set on old changes); decision-events unchanged. Optional post-hoc deep verify **may** run on a delivered light change and appends to `change.md`. |
| `chaos:archive` | light changes terminalize in-place (`status: Delivered`); archive treats them as already-terminal when doing repo housekeeping; `lifecycle.md` stub satisfies its existence contract. |
| `chaos:sync` | reads decisions from `decision-events.md` (unchanged) and change state from `change.md` §status; the light template keeps the same field names sync keys on (verdict/status/confidence). |
| `chaos:todo` | scans decision-events + `change.md` dashboards — same anatomy, less text. |
| metadata hook | stamps 1 new file (`change.md`) instead of 5 narrative reports; include `change.md` in the managed set. |

## 8. Failure & edge behavior

- **Human rejects / answers "don't do this":** DELIVER never runs; `change.md` gets
  `status: Rejected (DEC-…)`; session completes; lock released. Cheap by design — rejection costs
  one FRAME, not a full lifecycle.
- **Tests fail in DELIVER and can't be fixed within the approved contract:** surface a decision
  (fix-forward / narrow contract / abandon) and stop — never ship red (R-003), never silently narrow
  the contract.
- **Session dies mid-flight:** normal EA-X4-hardened resume; the capsule + answered decisions restore
  DELIVER without re-running FRAME.
- **Change turns out trivial mid-FRAME** (pure mechanical, zero material decisions): still one gate
  decision ("approve contract?") — light's floor is one human stop; there is no zero-stop mode.

## 9. What light explicitly does NOT change (summary)

- Number or materiality-bar of surfaced decisions; the human's decision weight (R-001).
- The interaction runtime, Decision Center flow, locks, capsules, resume semantics.
- OpenSpec artifact production (full set, all modes).
- R-003 green tests, R-004 boundary, R-005 naming, R-006 protected files.
- `decision-events.md` name + section anatomy (leaner entries only).

## 10. Measurement plan

Re-run the frozen **EA-X2 harness** (`.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/`,
baseline **3.94× time / 4.75× tokens**, oracle 19/19) with the governed arm on the light path.

Targets: **time ≤ 2×** plain (the §15.2 bar), artifact-prose share **≤ 15%** of governed output
(from 45.5%), oracle **still 19/19**, decisions surfaced **≥ baseline** (no decision loss), and a new
dated row in `RUNKIT.md` — never overwrite the baseline.

## 11. Implementation sketch (next passes)

1. **Per-command design** — done: [`2026-07-22-light-mode-per-command.md`](2026-07-22-light-mode-per-command.md).
   Ownership chain (creator-corrected 2026-07-24): `chaos-propose` owns FRAME (never writes
   production code), **`chaos-apply` owns DELIVER under its own command identity** (mode inferred
   from `change.md`; explicit `--light` optional); `chaos-resume` keeps its normal mid-flight job —
   not a deliver-router; verify is out of the critical path. No new top-level command.
2. **Templates**: `change.md` + lean decision-entry formats as skill reference files.
3. **Config**: `defaultMode` stays `standard`; add `lightMode:` block (N-decision threshold,
   escalation triggers) to `config.yaml`.
4. **Escalation valve** implementation in the FRAME/DELIVER prompts.
5. **Measure** (§10), then iterate toward the step-context capsules (Lever 3,
   [`../perf/2026-07-22-ea-v2-cost-attribution.md`](../perf/2026-07-22-ea-v2-cost-attribution.md) §capsules).

## 12. Open questions (for the per-command pass)

- Entry point: `chaos:light "<intent>"` vs `chaos:propose --light` auto-chaining? (Leaning: keep the
  user-facing surface as `--light` on existing commands, implemented as the collapsed path, so the
  mode triad stays the mental model.)
- Does the blast-radius classifier (Lever 3 cousin) later *suggest* light, or auto-select it with a
  confirm? (Deferred until the classifier exists.)
- Exact `N` for the decision-count trigger (default 2 — tune after first measured runs).
