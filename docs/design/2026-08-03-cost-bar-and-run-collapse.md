# The graduated cost bar, and Stage D — the collapse

> Toolkit meta-work (no CHAOS governance). Written 2026-08-03, **after** the step-5 core + extended
> rows ([`.chaos/validation/2026-08-stage-c-step5-rerun/`](../../.chaos/validation/2026-08-stage-c-step5-rerun/),
> commits `d9d6575` + `59e0bc7`) and **before** any arm of the run it pre-registers.
> Creator decisions of 2026-08-03 are recorded in §1 and §2; the Stage-D design in §4–§6 is the
> assistant's, pre-registered so it cannot be retrofitted.
>
> **A version is a stage.** This document is the design of record for **Stage D**, continuing the
> A → B → C sequence in [`2026-07-24-artifact-model-roadmap.md`](2026-07-24-artifact-model-roadmap.md).
> Like its predecessors, D is **built, then measured against the frozen kit, then trimmed with the
> creator** — it is not a side experiment. It builds on **C.1** (`297794c`), the patch that
> repaired the five defects step 5 surfaced.
>
> Its companion validation, **EA-D3** (the real-human value trial), is deliberately *not* a stage:
> it measures the product without changing it, and sits beside EA-X2 / EA-X2b / EA-X4. It is not
> blocked by D — the stop it tests is identical in C.1 and D — which is why the two run in
> parallel.

## 1. The denominator — locked (creator, 2026-08-03)

**Ratios are measured against the within-session plain arm, on output tokens, same model.**

This is the hardest available denominator and it is locked *before* optimizing, deliberately. It
has already bitten this program once: Stage A reported **1.64× / 2.01×** against the frozen plain
baseline and **3.35× / 3.47×** against its own session's plain arm — same run, and the choice of
denominator flipped it from "target met" to "target missed."

Consequences of the lock:

- **Tokens are the gate.** Time is reported alongside (arm-self-reported `date +%s`) but does not
  pass or fail a run — it is too noisy at n=3.
- **Plain arms are re-run in every session**, never borrowed from a prior row, even though the
  Opus-5 plain arm has proven stable (frozen-3: 28,031 / 28,867 / 28,857 tok across three sessions;
  light trio: 19,421).
- Cross-model rows stay comparable **as ratios only** — the standing RUNKIT invariant, unchanged.
- Tokens remain an **output-only proxy** (no input tokens; IL-PF10). The bar is therefore a bar on
  *generated* output, not on total inference cost.

## 2. The bar is graduated, not flat (creator, 2026-08-03)

A flat target would quietly abandon progressive rigor's core promise — that a change the system
itself certifies as trivial should cost near-nothing. The bar is therefore banded by **the
classifier's own verdict**, which is the one thing already measured as trustworthy (24/25 exact in
the wild, both error directions).

| Band | Classifier verdict | Owes | **Target (tok, vs within-session plain)** | Measured today |
|---|---|---|---:|---:|
| **A — zero-trigger** | no triggers fired; every dimension at floor | contract in `change.md` + ledger + records; **no OpenSpec, no ADR, no verify phase** | **≤ 2.0×** | **4.60×** (B2) |
| **B — single-surface materiality** | ≥1 materiality trigger, one surface class | + delta spec, ≤1 ADR, verify checks | **≤ 3.0×** | **5.46×** (frozen-3 Σ) · 6.77× (B1) |
| **C — multi-surface / breaking** | ≥2 distinct surfaces, or breaking (C-13) | full OpenSpec set, blocking ADR, full verify | **≤ 4.0×** (provisional) | **never measured** |

Band C is provisional: no arm in the entire program has reached `openspec 2`. Its target is an
extrapolation and must be re-set the first time a real band-C change is measured.

Pass/fail is on the **band aggregate (Σ)**, consistent with how every RUNKIT row is reported.

## 3. What the bar actually demands — it is not an artifact problem

The step-5 attribution is unambiguous: **traceability is affordable and the process is not.**

| | core tier (band B) | B2 (band A) |
|---|---:|---:|
| plain arm output | 28,857 | 7,384 |
| governed output | 157,588 (5.46×) | 33,935 (4.60×) |
| authored governance *incl.* classifier | 27,061 (0.94× plain) | 3,865 (0.52× plain) |
| — of which traceability (records · rendered · OpenSpec · ADR · ledger) | 22,108 | 2,748 |
| — of which classifier + adjudication | 4,953 | 1,117 |
| **non-artifact output** (doing the work + process) | **130,527 = 4.52× plain** | **30,070 = 4.07× plain** |

`change.md` and `lifecycle.md` are renderer output and cost the authoring agent **nothing**
(27 render invocations across both tiers, 0 failures, `--check` clean, 0 hand-written artifacts).

### The single number the bar reduces to

> **Today a governed arm generates ~4–4.5× as much output as a plain arm *before writing a single
> artifact*. The bar requires that to fall to ~1.5–2×.**

| Band | non-artifact output now | budget at target | required cut |
|---|---:|---:|---:|
| A (≤2.0×) | 4.07× plain | 1.48× plain | **−64%** |
| B (≤3.0×) | 4.52× plain | 2.06× plain | **−54%** |

Both bands need the same intervention at roughly the same magnitude — **cut non-artifact work
generation by ~55–65%** — which is why one change (collapsing the phase march) plausibly serves
both. **Zero artifact reduction is required to hit either target.** Every artifact the creator
asked to keep — records, `change.md`, `lifecycle.md`, OpenSpec deltas, ADRs, the ledger — fits
inside the budget with room left over.

## 4. Stage D: build the collapse, then measure it

> **Correction (2026-08-03).** An earlier draft of this section claimed that "A, B and C were each
> measured as a prompted lifecycle before any command was built," and concluded that no
> `chaos:run` command should be written before measuring. **That premise was false.** Stage A
> shipped in `eaa1b84` and *then* was measured; Stage B built the renderer and swapped the writer
> in all six skills, then measured; Stage C built `tools/chaos-classify` and wired all six
> commands, then measured. The governed *arms* were prompt-driven only because a detached worktree
> cannot invoke a slash command — every arm read the **real staged `SKILL.md` files**, so the
> toolkit under test was always built first. The prompt is a driver, not a substitute.

**A version is a stage.** D is therefore a **build**, on the same footing as A, B and C: the
collapsed command ships into the skills tree, is staged into the governed worktrees exactly as
step 5 staged Stage C, and the arms exercise it through the real files. Measuring a prompt-only
mock would price a shape nobody can ship.

**Dependency: D builds on C.1, not C.** The five C.1 repairs (`297794c`) are prerequisites, not
optional tidying — three of them would corrupt the bands D measures: the dangling OpenSpec pointer
lands on every band-A arm, the lossy `lifecycle.md` projection on every arm that verifies, and the
OpenSpec completeness misreport already drove one arm to rewrite a completed pass record.

### 4.1 What Stage D builds

- **One `chaos:run`** replacing the mandatory `propose → review → apply → verify` march.
- **The continuous classification rule — resolved (creator, 2026-08-03).** K1–K4 were never
  phases; they were **evidence births**: intent exists (K1), answered decisions exist (K2), the
  diff exists and grows (K3), the review verdict exists (K4). The rule: **the classifier runs
  whenever evidence is born or grows — not when a phase boundary is crossed.** Model adjudication
  still runs only on new *semantic* input (intent; previously un-adjudicated diff surface) —
  C-12 carries over unchanged, as do raise-only, P1 (mechanical never stops) and P4 (monotone
  dimensions).
- **The obligation audit becomes a deterministic in-loop assertion** over
  `classification-state.json` (adr owed ⇒ exists; openspec depth owed ⇒ matches; verify owed ⇒
  record exists; every stop answered and consumed; dimensions never decreased). A checklist, not
  a model pass, so ~free.
- **Verification stays in the loop; only the *command* becomes the opt-in.** The rigor vector
  drives verification exactly as in C (`verify→1/2` fired by M2/M3/X1/X2/X3): when owed, the loop
  runs the pass internally before close, and the obligation audit asserts the record exists.
  `chaos:verify` survives as the human's *extra* pass over an already-verified change. (An earlier
  draft called this a semantics change — overstated: verification semantics are unchanged; only
  the invocation surface moves.)
- **Unchanged:** `init`, `status`, `todo`, `doctor`, `code-review`, `sync`, `archive`, `help` —
  none of them were ever in the delivery loop, so none of them carry per-change cost.
- **Unchanged:** the artifact set — records, `change.md`, `lifecycle.md`, OpenSpec deltas, ADRs,
  the ledger. §3 shows they are affordable; they are not what D is cutting.

#### The loop (blessed with two amendments, creator, 2026-08-03)

0. **Open** — `begin_command`, change skeleton, intent captured verbatim.
1. **Classify at intent** (K1-equivalent) — deterministic scan over intent + predicted scope,
   one adjudication pass → the initial rigor vector; OpenSpec artifacts owed by this
   classification are authored *here* (timing rule below); then **S1**.
2. **Work loop**, per task-sized unit — do the unit; deterministic re-scan of the grown diff
   (C-15 scope); adjudication only on previously un-adjudicated surface; **S2** if a
   stop-carrying trigger fired (folded per scan); **S3** whenever the agent hits a discordance
   (decision via the runtime, `folds: n`); each answered decision re-runs the M4 density scan
   (scan-only).
3. **Self-review** (mechanical) — X2 raises review→2 · verify→1; never stops (P1).
4. **In-loop verify** — if the vector owes verify ≥1, run the pass now; a failing verify
   re-enters the work loop with the failure as new evidence.
5. **Obligation audit** — the deterministic gate above; failure names the owed artifact and
   blocks close. A gate, not a stop.
6. **Close** — render `change.md`/`lifecycle.md`, `complete_command`. **S4** only under preset
   floor ≥2.

**Stop points:**

| Stop | When | Fires |
|---|---|---|
| **S1** frame approval | after classify-at-intent | **always** — the C-11 floor; the run's one unconditional stop |
| **S2** materiality | any work-loop scan | conditional; folds per scan |
| **S3** discordance | agent hits ambiguity/contradiction | agent-judged; carries `folds: n` |
| **S4** verify sign-off | at close | only under preset floor ≥2 (`--standard`/`--strict`) |

Two rules make the stops safe, and both are named build requirements:

- **Pending-stop absorption.** Continuous scanning produces more scan events than four
  checkpoints; without absorption D would *un-fold* stops and interrupt more often than step 5
  measured. Rule: while a stop is pending unanswered, new firings attach to it (amend) rather
  than creating another. Generalizes Stage C's HIGH-severity attach rule.
- **Capsule at stop creation.** Every stop writes its resume capsule when created — loop cursor:
  work-unit index, pending stop id, classification-state hash. Auto-continuation is a harness
  convenience, never a guarantee (EA-X4 measured 60% pre-hardening; 100% only after EA-V3,
  `647a472`). `chaos:resume` therefore survives the collapse and gets *simpler*: it trusts the
  capsule for **position only** and re-derives obligations from `classification-state.json` on
  disk.

**OpenSpec authoring timing (creator amendment, 2026-08-03).** The artifact is authored **when
its obligation fires, always before the surface it governs is implemented further**. Fired at
intent-classify → authored before S1, approved together with the frame in one stop. Raised
mid-loop (a scan on the actual diff fires M3/M1 on an unpredicted surface) → authored at that
scan, attached to the folded stop; work on that surface pauses until approved. **Never at
close** — a spec authored at the audit would document, not govern; the audit asserts existence
and depth, it never authors. Post-authoring drift is the in-loop verify's contract check to
catch, not the audit's.

### 4.2 What Stage D measures

**Held constant** (so the only variable is the collapse):

- base `d27600f`; same worktree staging as step 5 (both tiers already share one implementation);
- **plain-arm prompts byte-identical** to the step-5 tiers — frozen `ea-x2` variant for the
  frozen-3, Cost-B variant for the light trio;
- the same classifier (`tools/chaos-classify`), the same pinned adjudication contract, the same
  renderer, the same schemas, the same records, the same held-out oracles;
- the same telemetry schema, so the rows line up with step 5 field-for-field.

**The one variable:** the governed arm invokes the **built** `chaos:run` — one continuous loop
(intent → work → classifier watches → materiality fires → stop, ask, record → resume → records
accrue → render) — instead of the four-command march. Everything else, including the artifact set,
is identical to step 5.

One rule is already shipped rather than restated here: **blast-radius scope excludes `.chaos/**`
and `openspec/**`** (C-15, `325b337`). It is in `chaos-apply/SKILL.md` and the classifier adapter
contract, so D inherits it instead of re-specifying it in a prompt — which is the point of D being
a build.

**Arm plan (12 arms, sequential):**

| Arms | Band | Tasks | Expected classifier verdict |
|---|---|---|---|
| 3 governed + 3 plain | **B** | frozen-3 (auth, soft-delete, concurrency) | M1+M2 same surface ⇒ `openspec 1`, `adr 2` |
| 2 governed + 2 plain | **A** | `filter-tasks-by-status`, `enforce-title-max-length` | zero triggers ⇒ `openspec 0`, no ADR, no verify |
| 1 governed + 1 plain | **B** | `task-count` | M3 additive @K3 ⇒ `openspec 1`, `adr 1` |

Plain arms are re-run rather than borrowed, per the §1 lock.

**Optional riders — proposed, NOT yet approved.** Three calibration gaps could close for the
marginal cost of a few extra arms while the kit is already hot, rather than needing their own run
later: `--standard` / `--strict` arms (the §8 **preset floor vectors** have never been measured),
and one deliberately breaking multi-surface task (**band C** has never been reached — its ≤4×
target in §2 is pure extrapolation). **X1's numeric thresholds** (MR-5: 8 files / 400 LOC) stay
uncalibrated either way — C-15 fixed the *scope*, not the numbers. Creator's call on scale; the
12-arm plan above stands on its own without them.

## 5. Pre-registered predictions (frozen before launch; never edited to match results)

**Classification must not move.** The collapse changes *when* the classifier runs, not what it
decides. Registered expectation: the step-5 verdicts reproduce **exactly** — frozen-3 fire M1+M2
on one surface at `1·1·0·0·1·1·2`; `task-count` fires M3 at the diff checkpoint;
`filter-tasks-by-status` and `enforce-title-max-length` fire **nothing** and sit at
`1·0·0·0·0·0·0`. **B3 must now come out clean** — its step-5 X1 came from a numstat that counted
the change's own bookkeeping, which **C-15 already fixed in the shipped skills** (`325b337`), so D
inherits the correction rather than re-specifying it. Any divergence is a finding about the
collapse, scored in both directions.

**One prediction is weaker than it looks, and is registered as such.** "Classification must not
move" is a clean expectation under phases, where K1–K4 have fixed evidence boundaries. The
continuous rule is now designed (§4.1: classify on evidence birth/growth), but it makes triggers
fire **earlier and more often than K3 did** — e.g. M5 scope-spill and the M1 re-check are defined
against a diff that, in a continuous loop, exists earlier and grows per work unit. If the verdicts diverge, the
first question is whether the new rule is wrong or whether the step-5 verdicts were an artifact of
phase boundaries. Both answers are findings; neither is automatically a regression.

**Cost.** My honest expectation, stated so it can fail:

- Band A: **2.0×–3.0×** — I expect the collapse to help but **not** to reach ≤2.0× on the first
  attempt. Predicting a miss.
- Band B: **3.0×–4.0×** — likewise, improvement over 5.46× but short of ≤3.0×.
- **Direction is the real test.** If non-artifact output does not fall by at least 30%, the phase
  march was *not* the dominant cost and the ~79% residual is something else — which would falsify
  the entire diagnosis in §3 and send the next investigation at the residual directly.

**Quality is a stop-the-analysis gate, unchanged.** Oracle must stay 19/19 (band B) and 16/16
(band A) across both arms. Any regression halts the cost reading — a cheaper governed arm that
breaks the oracle is not a result, it is a defect.

## 6. What Stage D does NOT settle

- **Governance value.** Every arm in this program self-answers its own decisions. The mechanism the
  whole product now rests on — *stop, ask a human, record the answer* — has **never been tested
  with a real person in the loop**. That is a separate trial (EA-D3 shaped) and it is the highest-
  value experiment remaining, independent of cost.
- **Band C.** No measured change has ever reached `openspec 2`.
- ~~The step-6 decisions~~ — **all resolved 2026-08-03** (`325b337`): C-10 kept trigger-gated,
  C-11 floor stop kept, Stage-B adopted, C-15 diff scope, C-16 M4 counts questions, C-17 M4 leaves
  C-13's surface count. **Still open and untouched by D:** preset floor vectors, X1's numeric
  thresholds, and the carried register questions (M3's breaking definition / corpus O-4, the
  concurrency M2 class / O-2, PII / O-5, urgency / O-6, the frontmatter classification block now
  unblocked by the Stage-B adoption).
- **Whether the shape is worth shipping.** D builds and prices `chaos:run`; whether it *stays* is
  the step-6-style trim that follows the measurement, with the creator, recorded in a D register.
  A build that misses the bar is still a result — it tells you the residual is not the phase march.
