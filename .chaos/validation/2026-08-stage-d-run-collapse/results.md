# Stage-D results — the collapsed `chaos:run`, measured

Run: 2026-08-03, model **claude-opus-5[1m]**, 12 arms sequential, 106 min wall, 0 agent errors.
Pre-registration: [`README.md`](README.md) §3/§4, frozen and committed (`1766461`) **before any
arm ran**. Nothing below was edited into agreement with these numbers.

> **Headline: the cost case is FALSIFIED — the fifth hypothesis to die in this program.** Both
> bands missed both their pre-registered ranges *and* their bars. The governed arm got **more**
> expensive in absolute terms on band B (+19.7% output tokens vs Stage C). The §3 diagnosis of
> the design doc — that the phase march was the dominant cost — **does not survive measurement**.
>
> **Quality held perfectly** (oracles 12/12 arms clean) and **the Stage-D mechanics all worked
> as designed**. The collapse is not broken. It is simply not where the money was.

## 1. Cost (the pre-registered metric is output tokens)

| Pair | Band | Governed tok | Plain tok | **tok ratio** | Step-5 tok ratio | Governed time | Plain time | time ratio |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| P1 auth | B | 65,872 | 9,234 | **7.13×** | 5.96× | 899 s | 124 s | 7.25× |
| P2 soft-delete | B | 60,570 | 16,176 | **3.74×** | 5.10× | 913 s | 309 s | 2.95× |
| P3 concurrency | B | 62,141 | 10,645 | **5.84×** | 5.42× | 958 s | 141 s | 6.79× |
| B1 task-count | B | 46,595 | 6,603 | **7.06×** | 6.77× | 742 s | 102 s | 7.27× |
| B2 filter-by-status | A | 39,321 | 7,970 | **4.93×** | 4.60× | 675 s | 127 s | 5.31× |
| B3 title-max-length | A | 31,941 | 6,847 | **4.66×** | 6.93× | 511 s | 100 s | 5.11× |
| **Σ** | | **306,440** | **57,475** | **5.33×** | 5.68× | 4,698 s | 903 s | 5.20× |

**Against the pre-registered predictions and the graduated bar:**

| Band | Bar (§2) | Predicted (§4) | **Measured** | Verdict |
|---|---|---|---|---|
| **A** (B2, B3) | ≤ 2.0× | 2.0×–3.0× | **4.81×** | missed the bar by **2.4×**; missed my own prediction |
| **B** (P1, P2, P3, B1) | ≤ 3.0× | 3.0×–4.0× | **5.51×** | missed the bar by **1.8×**; missed my own prediction |

I predicted a miss on both bars. I did not predict missing my own predicted *ranges* — the
collapse under-delivered against even the pessimistic case.

**The absolute number, which does not depend on plain-arm variance:**

| Band | Stage-C governed tok | Stage-D governed tok | Δ |
|---|---:|---:|---:|
| frozen-3 (P1–P3) | 157,588 | 188,583 | **+19.7%** |
| light-3 (B1–B3) | 116,434 | 117,857 | **+1.2%** |

Per-pair ratios move in both directions (P2 3.74× vs 5.10×; B3 4.66× vs 6.93× — both *better*)
but that is plain-arm variance, not the collapse: P2's plain arm cost 16,176 tokens against
step-5's 10,630 for identical work. The governed absolute is the honest read, and it went **up**.

## 2. The direction test — and what killed the diagnosis

§4 registered the real test: *"If non-artifact output does not fall by at least 30%, the phase
march was not the dominant cost."*

**Non-artifact output did not fall. It rose 12%** (274,022 → 306,440 governed tokens). Authored
governance is **15.1%** of Stage-D's governed output, against **16.2%** for Stage C — essentially
unchanged. So ~85% of a governed arm's output is still not artifacts, exactly as before.

The design doc reasoned that if artifacts are ~15% and the collapse removes the phase march, the
remaining ~80% should shrink. It did not, because **"the phase march" was never a separable cost
center.** It was a label for the work the phases *contained* — read the governance surface,
classify, decide, record, render, verify. D deleted the boundaries between those steps and kept
every step. Deleting a boundary between two pieces of work you still perform saves the boundary.

Attribution across all six governed arms makes it concrete:

| Cost center | Stage-C bytes | Stage-D bytes | Δ |
|---|---:|---:|---:|
| classifier (state + authored payloads) | 35,201 | 46,652 | **+32.5%** |
| ledger (decisions + `TRG-*`) | 16,858 | 20,223 | **+20.0%** |
| records | 104,798 | 99,851 | −4.7% |
| ADR | 10,108 | 9,420 | −6.8% |
| OpenSpec | 10,150 | 9,193 | −9.4% |
| rendered (free to the agent) | 86,308 | 79,261 | −8.2% |
| **authored governance** | **177,115** | **185,339** | **+4.6%** |
| implementation (added src/tests) | 34,433 | 36,494 | +6.0% |

D shaved every artifact center by 5–9% and paid it all back, with interest, on **classification**.
That is the continuous rule doing exactly what it was designed to do: K3 now runs once per work
unit (P1 ran 3 scans, P2/P3 2 each) instead of once, and every scan needs a freshly authored
payload and produces a verdict to read back.

**The collapse did reduce reading, measurably.** On P1, Stage D read one skill file (12.4 KB
`chaos-run`) where Stage C read three (34.2 KB across propose/apply/verify), and 18 distinct files
against 21. The saving is real and it was swamped. Governed prompts were length-matched as a
control: **14,621 vs 14,619 chars** — the prompt is not the confound.

## 3. Classification fidelity — 6/6 on OpenSpec depth, 3/6 vectors exact

| Pair | Expected triggers (§3) | Fired | Expected vector | Final vector | Depth |
|---|---|---|---|---|---|
| P1 | M1, M2 | M1, M2, **+M4** | `1·1·0·0·1·1·2` | `1·1·0·**1**·1·1·2` | 1 ✓ |
| P2 | M1, M2 | M1, M2, **+M4** | `1·1·0·0·1·1·2` | `1·1·0·**1**·1·1·2` | 1 ✓ |
| P3 | M1, M2 | M1, M2, **+M4** | `1·1·0·0·1·1·2` | `1·1·0·**1**·1·1·2` | 1 ✓ |
| B1 | M3 additive | M3 | `1·0·0·0·1·1·1` | `1·0·0·0·1·1·1` | 1 ✓ **exact** |
| B2 | none | **none** | `1·0·0·0·0·0·0` | `1·0·0·0·0·0·0` | 0 ✓ **exact** |
| B3 | none | **none** | `1·0·0·0·0·0·0` | `1·0·0·0·0·0·0` | 0 ✓ **exact** |

**The three divergences are my pre-registration error, not a classifier fault — and they are all
the same error.** I built §3 by carrying step-5's measured verdicts forward, but **C-16 shipped in
between** (`325b337`), and C-16 exists precisely to fix step-5's finding that *M4 could never fire
from K1-folded materiality* because it counted ledger headings instead of questions. M4 firing on
all three frozen-3 arms is the fix working. I registered the pre-fix expectation for a detector I
had already fixed. **§3 stays unedited; this is scored as a divergence with cause attributed.**

Two decisions validated in the wild, on the exact cases that motivated them:

- **C-17 held.** M1+M2+M4 spans two nominal surfaces; under the pre-C-17 rule that escalates to
  `openspec 2` (the full set). All three arms stayed at **`openspec 1`**, because C-17 removed M4
  from C-13's distinct-surface count. Had C-17 not shipped, these three arms would have authored
  a full OpenSpec set each.
- **C-15 held — B3 came out clean.** B3's step-5 X1 firing was the program's only fidelity miss,
  caused by a numstat that counted the change's own bookkeeping. With C-15 shipped, **B3 fired
  nothing** and landed exactly on the pre-registered zero-trigger vector. All six arms reported
  C-15-scoped diffs (`git add -N src tests` + `-- src tests` pathspec). P1's arm noted that
  including `.chaos/**`/`openspec/**` would have added 10 more files to its numstat.

**B2 reproduced the informative step-5 result exactly:** zero triggers, `verify 0`, **no verify
phase ran at all**, zero OpenSpec, zero ADR — and it still cost **4.93×**.

## 4. Stage-D mechanics — clean across all six arms

| Signal | Result | Pre-registered |
|---|---|---|
| S1 frame approval stop | exactly **1** on 6/6 | 1 (the C-11 floor) ✓ |
| `newStopsTotal` (trigger-created) | **0** on 6/6 | 0 ✓ |
| S4 verify sign-off | **0** on 6/6 | 0 (no preset) ✓ |
| **Absorption events** | **0** on 6/6 | 0 — but see §5 ✓/⚠ |
| Obligation audit final exit | **0** on 6/6 | 0 ✓ |
| Independent audit replay (out of band) | **0** on 6/6 | — ✓ |
| `adjudicationPasses` == `adjudicationDueCount` | **6/6** | the continuous C-12 cadence ✓ |
| Hand-written rendered artifacts | **0** on 6/6 | 0 ✓ |
| Legacy `ESC-*` / `escalatedFrom` | **0** on 6/6 | 0 ✓ |
| Classifier invocations / failures | 42 / **0** | — ✓ |
| Render invocations / failures | 29 / **1** (B2, self-repaired) | — ✓ |
| OpenSpec authored at the firing, never at close | **4/4 owed** (3× "before S1", 1× "at scan 1") | the creator's timing rule ✓ |

**S3 (discordance) fired once, on P2** — the agent judged an ambiguity worth stopping for on a
task with a pinned wire contract. Recorded, not scored (§3.3 registered it as unpredicted). Worth
a look in the EA-D3 design: on deliberately over-specified tasks, an S3 may indicate over-asking.

**One self-reported loop deviation (P1): K2 was never run.** The arm answered S1 and went straight
into work unit 1. The obligation still landed — `classify.py` runs the M4 ledger scan at K2, K3
and K4 alike, so M4 fired on the next diff scan and raised `review→1` before further
implementation. Timing deviation, not an outcome deviation; the vector is what a correct run
produces. The honesty field caught it, which is the field working.

## 5. A real defect found by the run — `RESOLVED-IN-ARM` is invisible to the classifier

**All six arms independently hit this, and all six independently invented the same workaround.**

`RESOLVED-IN-ARM` is a first-class decision state in the **renderer**
([`render.py:225`](../../../tools/chaos-render/render.py#L225)), in the **schema**
(`decision-entry.schema.json` enum) and in the **documented format**
(`change-template.md:169`). But
[`classify.py:176`](../../../tools/chaos-classify/classify.py#L176) computes `answered` as
`re.search(r"-\s*status:\s*ANSWERED", block)` — so `RESOLVED-IN-ARM` (and `RECORDED`) read as
**unanswered everywhere the classifier looks**:

- the obligation audit's `stops.all-answered` gate (blocks close),
- MR-3 stop satisfaction (`stopSatisfiedBy` can never fire),
- **Stage-D pending-stop absorption** (`stopAbsorbedBy`).

The arms worked around it by writing a dual status line
(`ANSWERED (…) · RESOLVED-IN-ARM · resolved-in-arm (…)`). P1 found it deliberately, with an early
audit probe placed right after S1 *specifically so a permanently-pending stop could not silently
turn every later scan into a false absorption event* — good instrumentation instinct.

**This qualifies the absorption result.** `absorptionEvents = 0` is correct as measured, but it
is measured *through the workaround*. Had the arms used the documented status verbatim, every stop
would have read as pending and absorption would have fired **spuriously** on every later scan. The
mechanism was therefore never exercised on its real trigger, and its 0/6 is weaker evidence than
it looks.

Severity: the predicate is load-bearing for a gate I shipped the same day. **No corpus expectation
moves** (0 of 29 seeds use either status), so the fix is a one-line predicate widening plus a
regression test. **Not fixed in this commit** — it is a semantics change to shipped code and
belongs in its own change with the creator's call.

## 6. What this settles, and what it does not

**Settled:**

- The artifact model is **exonerated** for the third time. Artifacts are ~15% of governed output;
  three stages of attacking them (A collapsed prose, B inverted to records, C gated OpenSpec)
  moved the total ~nowhere.
- The phase march is **exonerated**. Removing it entirely cost 19.7% *more* on band B.
- Therefore the residual — the ~85% that is reading, classifying, deciding, recording, verifying
  and reasoning — is **the whole problem**, and no stage in this program has yet attacked it.
- C-15, C-16 and C-17 are validated in the wild.
- The collapsed loop is mechanically sound: it classifies continuously, stops once, audits
  deterministically, and closes clean, on 6/6 arms with zero oracle regressions.

**Not settled:**

- **Governance value.** Every arm still self-answers its own decisions. The mechanism the product
  rests on — stop, ask a human, record the answer — has still **never been tested with a real
  person**. That remains the highest-value experiment (EA-D3 shaped), independent of cost.
- **Band C.** Still never reached; its ≤4× target is still extrapolation.
- **Absorption**, per §5 above.
- **Whether `chaos:run` should ship.** It is cheaper in artifacts, more expensive in
  classification, and strictly simpler to use than a four-command march. That is a product call,
  not a cost call — and the cost case for it is now dead.

## 7. Caveats

Tokens are an output-only proxy (`budget.spent()` deltas around sequential agents). Time is
arm-self-reported (`date +%s`). Byte attribution is a file-size proxy (bytes ÷ 4 ≈ tokens) and
excludes reasoning that never lands on disk — notably the adjudication passes. Plain-arm variance
between sessions is large (P2: 10,630 → 16,176 tokens for identical work), which is exactly why
§1 locks the denominator to the **within-session** plain arm and why the governed absolute is
reported alongside every ratio.
