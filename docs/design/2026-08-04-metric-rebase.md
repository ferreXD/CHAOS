# The metric re-base — M1 (output tokens) retired, M2 (wall clock, price-capped) adopted

> Toolkit meta-work (no CHAOS governance). **Creator decision, 2026-08-04**, taken on the
> recommendation in §7 of [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md).
>
> **This document exists primarily to preserve the superseded metric.** Changing the yardstick
> after a run fails is the classic way a failure is laundered into a pass. The guard is that the
> old metric, its bars, and every number ever measured under it stay on the record here — in the
> old unit, unedited — so any future claim can be checked against what was actually promised and
> what was actually measured.

## 0. The change in one line

**Cost was a ratio of output tokens. From 2026-08-04 it is an absolute wall-clock envelope per
governed change, with price as a very secondary absurdity ceiling and output tokens demoted to a
diagnostic.** The banding, the plain-arm denominator discipline and the pre-registration rules are
unchanged. **The bars are set in §3.1** — and CHAOS currently fails the primary one.

**Why the primary measure is time, not money.** Priced properly, governance overhead is
**+$1.07–1.37 per change**; at 1,000 changes/month that is $1,547/mo against $276/mo plain — a
rounding error beside payroll. The same governance adds **+12.5–15.2 minutes per change**
(independently measured, §6), and a developer will not wait 15 minutes to add a title-length
validation; they will route around the tool. **Money was never the binding constraint. Minutes
are.** Seven falsified cost hypotheses were chasing the wrong quantity.

---

## 1. M1 — the superseded metric, stated in full

### 1.1 Definition (as locked, creator 2026-08-03, cost-bar doc §1)

> **Ratios are measured against the within-session plain arm, on output tokens, same model.**

With these consequences, quoted as written:

- **Tokens are the gate.** Time is reported alongside (arm-self-reported `date +%s`) but does not
  pass or fail a run — it is too noisy at n=3.
- **Plain arms are re-run in every session**, never borrowed from a prior row.
- Cross-model rows stay comparable **as ratios only**.
- Tokens remain an **output-only proxy** (no input tokens; IL-PF10). The bar is therefore a bar on
  *generated* output, not on total inference cost.

### 1.2 The bars and the goal under M1

| Band | Classifier verdict | **M1 target** (tok, vs within-session plain) |
|---|---|---:|
| **A — zero-trigger** | no triggers fired; every dimension at floor | **≤ 2.0×** |
| **B — single-surface materiality** | ≥1 materiality trigger, one surface class | **≤ 3.0×** |
| **C — multi-surface / breaking** | ≥2 distinct surfaces, or breaking (C-13) | **≤ 4.0×** (provisional, never measured) |

Pass/fail on the **band aggregate (Σ)**. The program's stated goal — **"~3× baseline"** — was
never operationalized beyond this table; it was never expressed as money or wall time.

### 1.3 Every row ever measured under M1

Transcribed from the RUNKIT
([`.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md`](../../.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md),
append-only). **This table is the historical record and is never edited.**

| # | Row | Date | Model | Governed tok | Plain tok | **M1 ratio** | Time ratio | Oracle |
|---|---|---|---|---:|---:|---:|---:|---|
| 1 | EA-X2 frozen baseline | 2026-07-19 | opus-4-8[1m] | 185,376 | 38,996 | **4.75×** | 3.94× | 19/19 |
| 2 | Stage A `--light` | 2026-07-24 | opus-4-8[1m] | 78,310 | 22,557 | **3.47×** | 3.35× | 19/19 |
| 3 | Stage B light | 2026-08-02 | opus-5[1m] | 116,370 | 28,031 | **4.15×** | 3.79× | 19/19 |
| 4 | Stage B standard | 2026-08-02 | opus-5[1m] | 169,586 | 28,867 | **5.87×** | 5.68× | 19/19 |
| 5 | Stage C core | 2026-08-03 | opus-5[1m] | 157,588 | 28,857 | **5.46×** | 4.86× | 19/19 |
| 6 | Stage C extended (light band) | 2026-08-03 | opus-5[1m] | 116,434 | 19,421 | **6.00×** | 5.95× | 16/16 |
| 7 | Stage D frozen-3 | 2026-08-03 | opus-5[1m] | 188,583 | 36,055 | **5.23×** | 4.83× | 19/19 |
| 8 | Stage D light-3 | 2026-08-03 | opus-5[1m] | 117,857 | 21,420 | **5.50×** | 5.86× | 16/16 |
| 9 | Lever run 1 frozen-3 | 2026-08-04 | opus-5[1m] | 238,268 | 33,027 | **7.21×** | 8.06× | 19/19 |
| 10 | Lever run 1 light-3 | 2026-08-04 | opus-5[1m] | 160,226 | 19,367 | **8.27×** | 8.84× | 16/16 |
| 11 | Lever run 2 frozen-3 | 2026-08-04 | opus-5[1m] | 226,590 | 39,338 | **5.76×** | 5.77× | 19/19 |
| 12 | Lever run 2 light-3 | 2026-08-04 | opus-5[1m] | 144,697 | 26,908 | **5.38×** | 6.18× | 16/16 |

Rows 7–12 were additionally reported **grouped by classifier band**, which is the grouping the §1.2
bars actually apply to (the trio grouping above is by task set, not by band):

| Row | Band A (bar ≤2.0×) | Band B (bar ≤3.0×) |
|---|---:|---:|
| Stage D | **4.81×** | **5.51×** |
| Lever run 1 | **8.34×** | **7.37×** |
| Lever run 2 | **5.57×** | **5.62×** |

### 1.4 M1's verdict, stated so it cannot be re-written later

**Every row above missed the M1 bar. Not one measured configuration of CHAOS ever passed.** The
lowest ratio in the entire series is **3.47×** (Stage A `--light`), which fails even the loosest
bar on the table; the best classifier-banded figures are **4.60×** band A against ≤2.0× and
**5.46×** band B against ≤3.0×. Six cost hypotheses were falsified under M1, and the seventh (the
four levers) failed its direction test. **The re-base retroactively passes nothing**, because there is nothing
in the M1 series that a kinder unit could rescue — the record is uniform failure against the bar,
and it stays that way.

---

## 2. Why M1 is retired — two structural failures, not one bad result

### 2.1 M1 is blind to half the optimization program

| Lever | Attacks | Visible to M1? |
|---|---|---|
| L1 model tiering | **price per token** | **No** — tiering changes what a token costs, not how many are emitted |
| L2 corpus amortization | **input tokens** | **No** — M1 is output-only by construction (IL-PF10) |
| L3 protocol mechanization | reasoning (output) | Yes |
| L4 derived records | authored output | Yes |

A perfectly functioning L1 scores exactly **0.00** on M1. That is not a hypothetical: runs 1 and 2
both reported `ceiling:1 mid:0 floor:0`, and the only way L1 could be sized at all was to leave the
metric entirely and price it in dollars
([lever-run-2 `results.md` §3.2](../../.chaos/validation/2026-08-lever-run-2/results.md)) — a
3.1% blended saving that M1 could not have expressed even if the harness had cooperated. L2's
~44% read-volume reduction is likewise reported beside the bar rather than against it.

**Two of the four levers this program was built around cannot pass or fail under M1.**

### 2.2 M1's noise exceeds the effects it is measuring

The M1 ratio's denominator is itself a model run, and it drifts between sessions for
**byte-identical prompts and identical work**:

| | Run 1 | Run 2 | Δ |
|---|---:|---:|---:|
| Plain output, 6 arms | 52,394 | 66,246 | **+26.4%** |
| Band A plain | — | — | **+47%** |
| Band A **governed** | 105,828 | 103,978 | **−1.7%** |
| Band A **M1 ratio** | 8.34× | 5.57× | "**−33%**" |

Band A's headline improved by a third while the thing under test moved 1.7%. **Instrument noise of
±26–47% cannot resolve lever effects in the single digits.** Two guards already existed and both
held — the within-session denominator lock (so *within* a run the comparison is sound) and the
RUNKIT invariant that the governed absolute is reported beside every ratio. What they establish is
that **cross-run M1 ratio comparison is unsafe**, and every headline in this program is exactly
that.

### 2.3 The recommendation predates the failure — verifiable

| Event | Commit | Timestamp |
|---|---|---|
| **§7 recommends the re-base** | `8cb8543` | **2026-08-03 19:27** |
| Lever run 2 pre-registration frozen | `95cfb67` | 2026-08-04 09:23 |
| Lever run 2 result (direction test fails) | `b8417e1` | 2026-08-04 11:35 |
| L1 counterfactual closes L1 | `a27f485` | 2026-08-04 12:23 |

The metric objection was written **14 hours before the run was even pre-registered** and 16 before
its result existed. It is a response to §2.1, which was true before any of these runs, not a
response to a number that came out wrong.

---

## 3. M2 — the metric of record from 2026-08-04

**Primary — and it is the one that matters: the wall-clock envelope.** A governed change must
complete within an **absolute** wall-clock budget set by its classifier band. This is the gate. It
is what passes or fails a run.

**Secondary, and *very* secondary: a price ceiling.** Not an optimization target — an absurdity
guard. In the creator's words: a trivial change obviously cannot cost fifty dollars, but **ten
dollars is fine if the wall clock is under 3–5 minutes**. Price exists to catch a pathological
blow-up, not to be minimized.

### 3.1 The bars (creator, 2026-08-04)

| Band | **Wall clock — PRIMARY, gates** | Price ceiling — secondary | Measured today | Verdict |
|---|---|---|---|---|
| **A — trivial** | **≤ 5 min** (aspiration 3 min) | ≤ $10 / change | **15.0 min** · ~$1.30 | **FAILS time by 3.0×**; price passes with ~8× headroom |
| **B — single-surface materiality** | **≤ 15 min** | ≤ $25 / change | **18.8 min** · ~$1.67 | fails time by 1.3×; price passes with ~15× headroom |
| **C — multi-surface / breaking** | **≤ 30 min** (provisional) | ≤ $50 / change | never measured | — |

**Attribution, so the record is exact.** The band-A envelope (3–5 min) and the $10 ceiling are the
**creator's**. Band B and C wall clocks and the $25 / $50 ceilings are **assistant extrapolations**
from that anchor, carried from the 2026-08-04 recommendation and open to correction the first time
each band is measured. Band C remains provisional for the same reason it always was: no arm in the
program has ever reached it.

Price figures shown are **output-only floors** — true blended cost is higher (§3.4). Wall-clock
figures are **independently measured** (§6) but still come from workflow arms, not from a real
`chaos:run` under product conditions (§3.4).

### 3.2 How the two limbs interact

- **Time gates; price only bites when it is absurd.** A run that meets its envelope is not failed
  for costing $8 instead of $2.
- **The price ceiling currently has 4–8× of headroom.** Therefore **cost-reduction work is no
  longer justified on price grounds.** Any further performance work must be justified by the wall
  clock or not undertaken. This is the price limb's actual job: **telling you when to stop**, which
  is the one thing M1 could never do, and the reason this program ran seven falsified hypotheses.
- The two can conflict — buying wall time with parallel spawns raises price. The rule is that time
  wins until the ceiling is hit, and the ceiling is deliberately generous.

### 3.3 What carries over from M1, unchanged

These were never properties of the *unit* and survive the re-base intact:

- **The within-session plain-arm denominator**, re-run every session, never borrowed. This is the
  hardest available denominator and it stays locked (cost-bar doc §1 — the *only* clause of §1
  that is superseded is "on output tokens").
- **The graduated band structure** (A/B/C by the classifier's own verdict) and pass/fail on the
  band aggregate Σ. Only the target *values* are superseded (cost-bar doc §2).
- **Pre-registration**: predictions frozen and committed before any arm runs, never edited to match
  results.
- **The governed absolute reported beside every ratio**, and a **direction test on the absolute** —
  the guard that caught run 2 and the reason §2.2 is provable at all.
- **The oracle as a stop-the-analysis gate.** Quality is not traded for cost.

**One thing that does not carry, and is the point:** the plain arm is **no longer the gate's
denominator**. The primary bar is absolute — "≤5 minutes", not "≤2× plain" — so the ±26–47%
plain-arm drift that broke M1 (§2.2) **cannot touch the gate at all**. Plain arms are still run
every session, but now as a *control* feeding the diagnostics, not as the thing the verdict divides
by.

### 3.4 Units, rates and instrumentation

- **Wall clock (primary).** End-to-end time per governed change, **independently stamped — not
  `date +%s` reported by the arm itself** — and measured under product conditions rather than as a
  workflow subagent. **The independence half is solved** by
  [`tools/chaos-stopwatch/`](../../tools/chaos-stopwatch/), built 2026-08-04: it reads the
  runtime's own `timestamp` on every transcript record, which no arm can influence, and every
  figure in this document is now measured that way (§6). **The product-conditions half is still
  open** — every measured row is still a workflow subagent, not a real `chaos:run` from chat or
  CLI. The tool's `session` subcommand exists for that; no such run has been measured yet (§5, O2).
- **Price (secondary).** Input + cache-read + cache-creation + output tokens, each at its published
  rate. Rates are **supplied at measurement time, never hardcoded** — a stale table silently
  corrupts a cost number. The rate set used is recorded in the row beside the result. This rule is
  already implemented in
  [`counterfactual-price.py`](../../.chaos/validation/2026-08-lever-run-2/harness/counterfactual-price.py)
  and carries forward.
- **Output tokens (diagnostic).** Retained in every RUNKIT row. They are the only thing keeping the
  M1 series readable, and they remain the right instrument for L3/L4, which attack generated output
  directly.
- **The time ratio (diagnostic).** Absolute time is what a developer feels, but the ratio is the
  only scale-extrapolation instrument — today's tasks are single endpoints and real changes are
  10–100× larger. Watch it; do not gate on it.

### 3.5 A reversal, recorded rather than quietly edited

The first revision of this document (commit `05efd49`) recommended the opposite: *"blended cost
gates; wall time is reported but does not pass or fail a run."* **That was reversed the same day by
creator decision, and the creator was right.**

The recommendation reasoned about *instrument quality* — time is self-reported and noisy at n=3 —
and never asked **which quantity a user actually experiences**. That is precisely the error M1
made, committed while writing the document that diagnoses it. Bad instrumentation is a reason to
fix the instrument, not to demote the measurement. Recorded here because a decision record that
silently absorbs its own reversals is worth nothing.

---

## 4. The laundering guard

Stated before the first M2 number exists, so it cannot be claimed as a convenient discovery
afterwards:

1. **The price limb flatters CHAOS; the time limb does not — and the time limb is the gate.**
   CHAOS's cost is input-heavy and its fixed corpus lands in cache reads at a fraction of the base
   input rate, which is what L2 was built to exploit, so a 5.6× on output tokens is materially less
   in dollars. Predicted as a consequence of the unit change, **not** as evidence the levers worked.
   Against the primary bar the movement runs the other way: **CHAOS fails band A by 3.0×**, and the
   lever program looks *worse* under M2 than under M1 (§4.1). **A re-base that makes the system
   fail its headline bar is not a laundering operation.**
2. **Therefore the M1 series stays on the record** (§1.3), in M1's unit, unedited, with its
   uniform-failure verdict (§1.4) intact.
3. **The bars were set from principle, not from the data** (§3.1). The band-A envelope comes from
   the developer context-switch horizon and the price ceiling from what an operator would balk at —
   neither was fitted to where CHAOS already sits, which is why CHAOS fails one of them. Where the
   figures *are* extrapolations rather than creator decisions, §3.1 says so by name.
4. **No M2 result may be compared to an M1 row as though they were the same measurement.** Rows are
   labelled by metric in the RUNKIT.
5. **Any re-derivation of historical rows into M2** (§6) is a *recomputation of archived
   transcripts*, published beside the M1 figure, never replacing it.

### 4.1 The re-base makes this program's most recent work look worse

The cleanest proof that the new metric is not self-serving:

| Stage D → lever run 2 | Under M1 (output tokens) | Under M2 (wall clock, **measured**) |
|---|---:|---:|
| Governed total, 6 changes | 398,494 → 371,287 = **−6.8%** | 87.0 → 105.3 min = **+21.0%** |
| — frozen-3 tasks | | 16.9 → 21.0 min/change = **+24.3%** |
| — B-tasks | | 12.1 → 14.1 min/change = **+16.5%** |

**The four levers cut tokens slightly and made the felt cost ~21% worse.** M1 could not see that;
M2 gates on it. Anyone re-basing a metric to flatter their own work does not choose the unit under
which their last two runs are a regression.

---

## 5. Decisions taken, and the one thing still open

| # | Item | Status |
|---|---|---|
| **O1** | **The M2 bar values.** | **RESOLVED 2026-08-04 — §3.1.** Band A (3–5 min, $10) is the creator's; B/C are marked extrapolations. |
| **O3** | **Wall time's status.** | **RESOLVED 2026-08-04 — it is the primary gate** (§3, §3.5). |
| **O4** | **The "~3× baseline" goal.** | **RESOLVED 2026-08-04 — retired, replaced by the promise in §5.1.** |
| **O2** | **The instruments**, re-prioritized by the decision. | **OPEN.** See below. |

**O2, re-prioritized.** The build order inverts: measure the thing that gates before pricing the
thing that does not.

1. **An independent stopwatch — BUILT 2026-08-04**, [`tools/chaos-stopwatch/`](../../tools/chaos-stopwatch/)
   (29 tests). Reads the runtime's `timestamp`, which the arm cannot influence; gates with a
   non-zero exit; orders arms by journal start rather than filename. It needed no new run-time
   instrumentation and no new arms — every archived run already carried the clock, so all 12
   historical rows were re-measured for free (§6), and it immediately falsified two claims made
   from self-report (§6.1).
2. **A product-conditions run — STILL OPEN, and now the only thing blocking a real gate.** Every
   measured row is a workflow subagent. A real `chaos:run` from chat/CLI is the case the 5-minute
   bar is actually about, and it is the one case never measured. `stopwatch.py session
   --from-match` is built for it and untested against a live run.
3. **`blended-cost.py` (last, and possibly never).** Per-message `usage` including
   `cache_read_input_tokens` and `cache_creation_input_tokens`, rates supplied on the command line,
   and the journal-ordered arm attribution that `read-volume.py` needed after it got that wrong
   once. Given the price ceiling's 4–8× headroom (§3.2), this is a periodic sanity check, not a
   measurement the program runs on.

### 5.1 The goal: "~3× baseline" is retired

**Retired, not restated.** It was denominated in a dead unit; it was a *ratio* goal, which is
gameable by degrading the baseline and unstable on small denominators; and it never had an
operational meaning — nobody could say what passing would feel like. Its wording and its history
are preserved in §1.2, so retiring it costs no record.

**Replaced by a promise rather than a ratio:**

> **A change CHAOS itself classifies as trivial is fully governed — classified, recorded,
> traceable — in under 5 minutes. A single-surface material change, in under 15 minutes. Neither
> costs more than a few dollars of model spend.**

This is falsifiable, it is in units a user feels, it can go in a README, and it makes the
*graduated* claim checkable — which matters, because §6 shows CHAOS is not currently delivering it.

## 6. The history, re-measured on the independent clock

**No re-derivation was needed and no re-running.** Wall time was recorded in every RUNKIT row all
along as the non-gating secondary — but as *self-report*, which §3.4 forbids. The instrument built
on 2026-08-04 ([`tools/chaos-stopwatch/`](../../tools/chaos-stopwatch/)) reads the runtime's own
`timestamp` on every archived transcript record, so **all 12 rows have now been re-measured
independently**, without spending a single arm.

Each row was matched to its archived workflow by a **falsification test**: self-report must be
≤ measured, because the arm's own bracket is a sub-interval of its transcript. All 12 mapped
unambiguously across 14 candidate workflows.

| Row | Tasks | Model | **Measured / change** | (self-reported) |
|---|---|---|---:|---:|
| EA-X2 frozen baseline | frozen-3 | opus-4-8 | **12.8 min** | 11.9 |
| **Stage A `--light`** | frozen-3 | opus-4-8 | **5.5 min** | 5.0 |
| Stage B light | frozen-3 | opus-5 | **9.6 min** | 9.0 |
| Stage B standard | frozen-3 | opus-5 | **14.8 min** | 13.9 |
| Stage C core | frozen-3 | opus-5 | **13.9 min** | 13.0 |
| Stage C extended | B-tasks | opus-5 | **11.0 min** | 10.0 |
| Stage D frozen-3 | frozen-3 | opus-5 | **16.9 min** | 15.4 |
| Stage D light-3 | B-tasks | opus-5 | **12.1 min** | 10.7 |
| Lever run 1 frozen-3 | frozen-3 | opus-5 | **21.9 min** | 20.5 |
| Lever run 1 light-3 | B-tasks | opus-5 | **14.6 min** | 13.5 |
| Lever run 2 frozen-3 | frozen-3 | opus-5 | **21.0 min** | 19.7 |
| Lever run 2 light-3 | B-tasks | opus-5 | **14.1 min** | 12.7 |

### 6.1 Two corrections to this document's first revision (`5c8a138`)

Both were produced by reading self-reported times, and both are fixed by the instrument. Recorded
rather than silently edited, on the same principle as §3.5.

1. **"Stage A is the only row that would meet the band-A envelope" — WRONG.** Measured, Stage A is
   **5.5 min, not 5.0**, so it misses the ≤5 min bar too. The correct statement is stronger and
   worse: **no configuration in this program's history has ever met the band-A bar.** Stage A
   remains the closest anything has come.
2. **The "+41% within opus-5, and that comparison is clean" degradation series — NOT clean.** It
   chained Stage A/B *light* rows (which run the **frozen-3** tasks under a light path) to Stage C
   extended onward (which run the smaller **B-tasks**). Two different task sets, so the series was
   not comparing like with like. The task column above now makes the boundary explicit.

### 6.2 What the clean comparisons actually say

Same tasks, same model, independent clock:

| Series | Trend | Δ |
|---|---|---:|
| **frozen-3, opus-5** | Stage B std 14.8 → Stage C 13.9 → Stage D 16.9 → run 1 21.9 → **run 2 21.0** | **+42%** |
| **B-tasks, opus-5** | Stage C ext 11.0 → Stage D 12.1 → run 1 14.6 → **run 2 14.1** | **+28%** |

**The degradation is real and it survives the correction** — it is simply smaller than claimed and
measured on properly matched task sets. Stage A→B (+75%) stays confounded by the opus-4-8→opus-5
model change and is not counted above.

### 6.3 The two findings, restated on measured numbers

**(a) Nothing has ever passed, and the trend is the wrong way.** The cheapest governed
configuration ever measured is Stage A `--light` at **5.5 min/change** (2026-07-24) — still a miss.
Everything built since is slower on both task sets.

**(b) The graduated bar is not graduating.** Measured, band A is **15.0 min** against band B's
**18.8 min** — band A costs **80%** of band B while owing far less (it also fails its own bar by
**3.0×**, not the 2.7× computed from self-report). Progressive rigor's core promise is that a change
the system certifies as trivial costs near-nothing; **the measured curve is nearly flat.** The fixed
cost of *entering* the governed loop dominates everything the classifier decides.

**(b) is the target the next phase should attack**, and it is structural — cut the fixed entry cost
— rather than another attempt to shave generated tokens, which four levers and seven hypotheses have
now failed to convert into anything a user would notice.

## 7. Where this is recorded

- **This document** — the decision, the superseded metric, the frozen M1 series, and the
  independently re-measured M2 series (§6).
- [`tools/chaos-stopwatch/`](../../tools/chaos-stopwatch/) — the instrument the primary measure
  gates on, with its own README and 29 tests.
- [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md) §1/§2 —
  banner pointing here; the sections themselves are left intact as M1's definition of record.
- [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md) §7 —
  marked settled.
- **RUNKIT invariants** — rows through lever run 2 labelled M1.
