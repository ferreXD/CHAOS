# The metric re-base — M1 (output tokens) retired, M2 (blended cost) adopted

> Toolkit meta-work (no CHAOS governance). **Creator decision, 2026-08-04**, taken on the
> recommendation in §7 of [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md).
>
> **This document exists primarily to preserve the superseded metric.** Changing the yardstick
> after a run fails is the classic way a failure is laundered into a pass. The guard is that the
> old metric, its bars, and every number ever measured under it stay on the record here — in the
> old unit, unedited — so any future claim can be checked against what was actually promised and
> what was actually measured.

## 0. The change in one line

**Ratios were measured on output tokens. From 2026-08-04 they are measured on blended API cost,
with output tokens demoted to a secondary diagnostic.** The denominator discipline, the banding,
and the pre-registration rules are unchanged. The **bar values are not yet set** in the new unit
(§5, O1) and no result may be claimed against M2 until they are.

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

**Ratios are measured against the within-session plain arm, on blended API cost (input + cache +
output, priced at published rates), same model.**

### 3.1 What carries over from M1, unchanged

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

### 3.2 What changes

- **Unit: blended cost.** Input tokens, cache-read and cache-creation tokens, and output tokens,
  each at their published rate, per arm. This is what an operator actually pays.
- **Output tokens are demoted to a diagnostic.** They stay in every RUNKIT row — they are the only
  way the M1 series remains comparable, and they remain the right instrument for L3/L4, which
  attack generated output directly.
- **Wall time is reported, not gating** (recommendation, §5 O3). §7 proposed "blended cost + wall
  time"; making time a gate contradicts M1 §1's own finding that time is too noisy at n=3, and it
  is still arm-self-reported rather than independently stamped. **One gate, on cost.**

### 3.3 Rates

Rates are **supplied at measurement time, never hardcoded** — a stale price table silently
corrupts a blended-cost number. The rate set used must be recorded in the row alongside the result.
This rule is already implemented in
[`counterfactual-price.py`](../../.chaos/validation/2026-08-lever-run-2/harness/counterfactual-price.py)
and carries forward.

---

## 4. The laundering guard

Stated before the first M2 number exists, so it cannot be claimed as a convenient discovery
afterwards:

1. **M2 will probably flatter CHAOS relative to M1.** CHAOS's cost is input-heavy and its fixed
   governance corpus is exactly the kind of content that lands in cache reads at a fraction of the
   base input rate — which is what L2 was built to exploit. A governed arm that is 5.6× on output
   tokens may well be materially less than that in dollars. **That is a predicted consequence of
   the unit change, not evidence that the levers worked.**
2. **Therefore the M1 series stays on the record** (§1.3), in M1's unit, unedited, with its
   uniform-failure verdict (§1.4) intact.
3. **The M2 bar values must be derived by a stated rule and frozen before the first M2
   measurement** (§5, O1). A bar chosen after seeing where the system already sits is not a bar.
4. **No M2 result may be compared to an M1 row as though they were the same measurement.** Rows are
   labelled by metric in the RUNKIT.
5. **Any re-derivation of historical rows into M2** (§6) is a *recomputation of archived
   transcripts*, published beside the M1 figure, never replacing it.

---

## 5. Open — required before any M2 result is claimed

| # | Open item | Owner |
|---|---|---|
| **O1** | **The M2 bar values.** M1's ≤2.0× / ≤3.0× / ≤4.0× do not transfer; a 5.57× in output tokens is a different number in dollars. Proposed derivation rule: re-derive rows 7–12 in M2 from the archived transcripts, publish them, and *then* set bars from the bands' original intent (A: a change the system itself calls trivial costs near-nothing; B: single-surface materiality ≤3× the plain cost) — **fixing the numbers before the next run, not after**. | **Creator** |
| **O2** | **The instrument.** No `blended-cost.py` exists. It needs per-message `usage` including `cache_read_input_tokens` and `cache_creation_input_tokens`, rates supplied on the command line, and the same journal-ordered arm attribution that `read-volume.py` needed after it got that wrong once. ~1 tool + tests. | Assistant, on go |
| **O3** | **Wall time's status.** Recommended above as reported-not-gating. If it is ever to gate, it needs independent stamping (not `date +%s` inside the arm) and more than n=3. | **Creator** |
| **O4** | **The "~3× baseline" goal** needs restating in M2's unit, or explicit retirement. | **Creator** |

## 6. What is *not* re-derived

The M1 series is **not** being converted wholesale. Re-derivation is cheap in principle — the
archived transcripts carry per-message `usage`, and `counterfactual-price.py` already demonstrates
transcript → dollars — but it is a separate, scoped piece of work gated on O2, and only rows 7–12
(Stage D onward, where transcripts are archived in the lever kits) are candidates. Rows 1–6 stay
M1-only unless their transcripts are located.

## 7. Where this is recorded

- **This document** — the decision, the superseded metric, the frozen M1 series.
- [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md) §1/§2 —
  banner pointing here; the sections themselves are left intact as M1's definition of record.
- [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md) §7 —
  marked settled.
- **RUNKIT invariants** — rows through lever run 2 labelled M1.
