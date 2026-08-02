# EA-X2 harness — re-runnable kit (baseline for post-performance-fix comparison)

This kit reproduces the **mechanized pinned-contract A/B** exactly as first run on 2026-07-19.
Its purpose going forward is a **regression baseline**: after CHAOS performance fixes, re-run it
and compare the **time ratio** and **token ratio** against the numbers frozen below. The *value*
outcome (0 catches) is not expected to move — this harness under-measures governance value by
design (pinned contracts; see the sibling `ea-x2b-under-specified/` for the value-focused test).
What *should* move after perf work is the **cost ratio**.

## Frozen baseline (2026-07-19, model claude-opus-4-8[1m])

| Pair | task | CHAOS time | plain time | **time ratio** | CHAOS out-tok | plain out-tok | token ratio | oracle (both arms) |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 642 s | 255 s | 2.52× | 62,597 | 16,331 | 3.83× | 9/9 clean |
| 2 | soft-delete | 779 s | 133 s | 5.86× | 64,556 | 9,967 | 6.48× | 5/5 clean |
| 3 | concurrency | 728 s | 158 s | 4.61× | 58,223 | 12,698 | 4.59× | 5/5 clean |
| **Σ** | | **2,149 s** | **546 s** | **3.94×** | **185,376** | **38,996** | **4.75×** | 19/19 both |

**Success criterion for a perf fix:** aggregate time ratio moves meaningfully toward ≤2× without
regressing the oracle (still 19/19 clean both arms) or the governance artifact set (11 artifacts /
run). Record the re-run numbers next to these in a new dated row — do not overwrite.

## Re-run — Stage-A `--light` collapsed path (2026-07-24, model claude-opus-4-8[1m])

Governed arm swapped from the standard 6-command / 11-artifact lifecycle to the **collapsed light
path** (FRAME→DELIVER, artifact set = OpenSpec + `change.md` + lean `decision-events.md` +
lifecycle stub). Frozen-3 tasks run **forced-light** (valve suppressed) for comparability. Full
scorecard + Cost B (new light-eligible tasks) + valve fidelity: `../../ea-x2-stage-a-light/`.

| Pair | task | light time | plain time | time ratio | light out-tok | plain out-tok | tok ratio | oracle |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 258 s | 78 s | 3.31× | 27,652 | 5,868 | 4.71× | 9/9 clean |
| 2 | soft-delete | 302 s | 97 s | 3.11× | 23,418 | 8,264 | 2.83× | 5/5 clean |
| 3 | concurrency | 335 s | 92 s | 3.64× | 27,240 | 8,425 | 3.23× | 5/5 clean |
| **Σ** | | **895 s** | **267 s** | **3.35×** | **78,310** | **22,557** | **3.47×** | 19/19 both |

**Read against the frozen baseline (2,149 s / 185,376 tok governed):** the governed arm's absolute
cost dropped **−58%** on the identical tasks. The within-session ratio is 3.35× only because this
session's plain arm was ~2× cheaper than the frozen plain (546 s / 38,996 tok); vs the **frozen
plain** baseline the light arm is **1.64× time / 2.01× tok** — meeting ≤2×. Oracle unregressed
(19/19 both). Artifact count 11 → **7** (4 narrative reports collapsed into `change.md`); artifact
prose **45.5% → 4.7%** of governed output. Bottleneck now the OpenSpec set + governance reads +
decision records, not prose → motivates Stage B. (Tokens output-only proxy; time self-reported.)

## Re-run — Stage-B ledger-first renderer (2026-08-02, model claude-opus-5[1m])

Governed arm swapped again: agents no longer author artifacts at all — they emit **structured
records** (`records/contract.json` + `<phase>.pass-NN.facts.json`) plus the hand-appended ledger,
and `python tools/chaos-render/render.py <id> --write` produces `change.md` + `lifecycle.md`.
Same frozen tasks, same held-out oracles, **plain-arm prompt byte-identical**. Harness:
`../../ea-x2-stage-a-light/harness/stage-b-arms.workflow.js`; scorecard in that kit's
`results.md`. **Model differs from the two rows above (Opus 5 vs Opus 4.8) — compare ratios, not
absolutes.**

| Pair | task | Stage-B time | plain time | time ratio | Stage-B out-tok | plain out-tok | tok ratio | oracle |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 521 s | 146 s | 3.57× | 40,509 | 7,848 | 5.16× | 9/9 clean |
| 2 | soft-delete | 586 s | 164 s | 3.57× | 38,601 | 10,044 | 3.84× | 5/5 clean |
| 3 | concurrency | 513 s | 118 s | 4.35× | 37,260 | 10,139 | 3.68× | 5/5 clean |
| **Σ** | | **1,620 s** | **428 s** | **3.79×** | **116,370** | **28,031** | **4.15×** | 19/19 both |

**Negative cost result, reported as found.** Against the Stage-A light row the governed premium
**widened**: 3.35× → 3.79× time, 3.47× → **4.15×** tokens, and authored governance bytes rose from
**4.7% → 12.5%** of governed output. Cause: Stage A had already collapsed light-mode prose to
near-nothing, so B replaced ~3–5 KB of lean prose with ~13–15 KB of strict JSON records plus
schema-reading — on the light path the ledger-first inversion **costs more than the prose it
removes**. B's structural claim (prose → 0) is untestable here because light had no prose left;
it belongs to standard/strict, where the 45.5% prose cost center still exists.

**What did hold, mechanically:** 14 render invocations across 6 governed arms with **0 failures**
(agents authored schema-valid records first try, from the schemas alone); **0 hand-written
artifacts** (honesty flag false on every arm); all 6 arms re-render **CLEAN** (`--check`
idempotent); provenance stamped on all 12 rendered artifacts (the round-3 0/4-provenance defect is
now impossible); valve fidelity correct **both** directions (posture-crossing seed escalated →
standard; all 3 light-eligible tasks stayed light); oracle **unregressed at 35/35 per arm**.
Cost B (light-eligible, valve live): 1,247 s / 85,642 tok vs 425 s / 25,338 tok → 2.93× / 3.38×.

## Re-run — Stage-B standard lifecycle (2026-08-02, model claude-opus-5[1m])

The measurement Stage B was actually built for: the **standard** path, where artifact prose was
45.5% of governed output and four narrative reports collapse into one rendered file. Governed arm
emits records + renders; **plain-arm prompt byte-identical to the frozen row**; same 3 tasks, same
held-out oracles. Harness: `stage-b-standard-arms.workflow.js`. **Model differs from the 2026-07-19
baseline — compare ratios, not absolutes.**

| Pair | task | Stage-B time | plain time | time ratio | Stage-B out-tok | plain out-tok | tok ratio | oracle |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 718 s | 122 s | 5.89× | 55,193 | 8,830 | 6.25× | 9/9 clean |
| 2 | soft-delete | 1,019 s | 135 s | 7.55× | 65,304 | 8,981 | 7.27× | 5/5 clean |
| 3 | concurrency | 758 s | 182 s | 4.16× | 49,089 | 11,056 | 4.44× | 5/5 clean |
| **Σ** | | **2,495 s** | **439 s** | **5.68×** | **169,586** | **28,867** | **5.87×** | 19/19 both |

**The cost hypothesis is falsified where it was supposed to hold.** Against the frozen baseline
(3.94× / 4.75×) the ratio got **worse: 5.68× time, 5.87× tokens**; governed absolute moved only
**−9% tokens / +16% time**. The prose reduction is real but did not become savings: authored
artifact bytes fell **45.5% → 23.9%** of governed output (artifact-authoring tokens roughly halved),
yet everything *else* the governed arm does grew ~28% — schema reading, record authoring, richer
implementation (16/12/11 tests vs the plain arm's 9/8/12). Agents now author **100 KB of JSON
records** to render **78 KB of markdown**: the input to the projection is no cheaper than the prose
it replaced. The roadmap's "prose cost → structurally ~0, B is the only path toward ~1×" does not
survive contact with measurement on either path.

**Mechanically flawless, again:** 15 render invocations, **0 failures**; **0 hand-written
artifacts**; `--check` **CLEAN on 6/6** rendered files; oracle **19/19 both arms**, unregressed.
One governed arm independently reported that R-001 was unmet — no material decision passed through
the interaction runtime — and held its verdict at READY_WITH_DEBT rather than claiming a clean
READY, which is the governance layer working as designed.

## Re-run — Stage-C progressive rigor, no preset flag (2026-08-03, model claude-opus-5[1m])

Governed arm runs the **Stage-C** lifecycle with **no preset flag — zero floors**: a deterministic
classifier + a raise-only model adjudication run at K1..K4, fired triggers raise rigor dimensions
monotonically, and the dimension vector (not a mode word) sets every obligation, including OpenSpec
depth (C-10 zero-base/delta/full). Same frozen tasks, same held-out oracles, **plain-arm prompt
byte-identical**. Harness: `../../2026-08-stage-c-step5-rerun/harness/stage-c-arms.workflow.js`;
full scorecard, fidelity table and cost attribution in that kit's `results.md`. **Model differs
from the 2026-07-19/24 rows (Opus 5 vs Opus 4.8) — compare ratios, not absolutes.**

| Pair | task | Stage-C time | plain time | time ratio | Stage-C out-tok | plain out-tok | tok ratio | oracle |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 675 s | 129 s | 5.23× | 49,803 | 8,350 | 5.96× | 9/9 clean |
| 2 | soft-delete | 836 s | 229 s | 3.65× | 54,233 | 10,630 | 5.10× | 5/5 clean |
| 3 | concurrency | 822 s | 122 s | 6.74× | 53,552 | 9,877 | 5.42× | 5/5 clean |
| **Σ** | | **2,333 s** | **480 s** | **4.86×** | **157,588** | **28,857** | **5.46×** | 19/19 both |

**Third cost hypothesis falsified; classification fidelity perfect.** The pre-registered cost
prediction (3.47×–4.15×, i.e. between the Stage-A and Stage-B light rows) is **wrong**: Stage C
lands at **4.86× / 5.46×**, better than Stage-B standard (−6.5% time / −7.1% tok governed) but
**+44% time / +35% tok** against Stage-B light. The cause is not waste — with zero floors the
triggers themselves raised `verify 1` and `adr 2` on all three tasks, so the collapsed base grew a
verify phase and a blocking ADR *by classification*. Targeted ceremony on a posture-crossing change
is still expensive. Note the frozen-3 are all posture-crossing by construction, so this kit
measures C's **expensive end**; the zero-trigger band (extended tier) was not run.

**Fidelity, first blind test (the corpus was the calibration set): 13/13 checkpoint verdicts exact,
0 under-detection, 0 over-detection**, dimension vectors and confidence trajectory exact against
expectations frozen before launch, and reproduced by an independent replay of the archived
payloads. M3/X1/M5/X2 correctly never fired. `newStops` 0 at every checkpoint on every arm (P6
holds in the wild). 20 classifier invocations, 0 failures; every adjudication raise carried a
citation; 0 `ESC-*`/`escalatedFrom` legacy leakage; 13 renders, 0 failures, `--check` CLEAN 4/4;
0 hand-written artifacts; oracle **19/19 both arms, unregressed**.

**Cost attribution (the number Stage-B's fate was waiting on):** authored governance is 17.2% of
governed output, split **records 54.9%** · classifier+payloads 18.3% · ADRs 9.3% · **OpenSpec delta
specs 8.3%** · decision entries 6.1% · `TRG-*` events 3.0%. Agents authored **59.5 KB of JSON to
render 47.0 KB of markdown — ratio 0.79**, reproducing Stage-B standard's 100 KB → 78 KB (0.78) to
within 1% on a different lifecycle shape. The classifier consumed **zero** `records/*.json`, so all
three B options stay mechanically live. **C-10's lever fired the good way** — all three tasks got a
single delta spec, never the full set — **and is worth ~1.4% of governed output**: measured, real,
and not where the cost is. Two structural findings: M4 **cannot fire from K1-folded materiality**
(stop folding collapses N questions into one ledger heading, below its threshold of 2), and
blast-radius scope is **undefined** — whether a change's own governance output counts toward X1
flipped between arms, and every counterfactual fires X1.

## Files

| File | Role |
|---|---|
| `ea-x2-arms.workflow.js` | the 6-arm A/B workflow (3 tasks × CHAOS/plain), sequential for clean per-arm `budget.spent()` token deltas. Reads `args.pairs` (worktree paths + task statements + changeIds). |
| `ea-x2-judge.workflow.js` | blind conformance judge over the anonymized src/tests diffs. **Note:** `JUDGE_DIR` is hard-coded to a scratch path — update it per run. |
| `score-arm.sh` | copies a held-out oracle into an arm's test project, runs the arm's own suite + the oracle-only suite, reports pass/fail, removes the oracle. `Usage: score-arm.sh <worktree> <oracle.cs>` |
| `setup-worktrees.sh` | creates the 6 detached worktrees off `demo/dotnet`. `Usage: setup-worktrees.sh <out-dir-outside-repo>` |
| `args.example.json` | the exact `args` payload used for the frozen run (paths are session-specific placeholders — repoint `wtA`/`wtB`). |

The held-out **oracles** (`AuthOracleTests.cs`, `SoftDeleteOracleTests.cs`,
`ConcurrencyOracleTests.cs`) and the **task statements** (`task*.md`) live one level up in
[`../oracles/`](../oracles/) — the kit references them rather than duplicating.

## Re-run procedure

1. **Pick a scratch dir outside the repo** (e.g. your temp dir). Run:
   `bash setup-worktrees.sh <scratch>` → creates `<scratch>/wt/pN-arm{A,B}` off `demo/dotnet`.
2. **Copy `args.example.json`** → `args.json`, repoint every `wtA`/`wtB` to the new `<scratch>/wt/...`
   paths. (Task statements + changeIds stay identical — they are the frozen contract.)
3. **Run the arms workflow** (multi-agent; needs explicit opt-in): `Workflow({scriptPath:
   ".../ea-x2-arms.workflow.js", args: <contents of args.json>})`. It runs 6 arms sequentially
   (~35–50 min) and returns per-pair `{armA_chaos, armB_plain, tokens}`.
4. **Score each arm** with the held-out oracle (kept OUT of the worktrees):
   `bash score-arm.sh <scratch>/wt/p1-armA ../oracles/AuthOracleTests.cs` (and so on: p2→SoftDelete,
   p3→Concurrency, both arms). Expect 19/19 clean both arms unless a regression appears.
5. **(optional) Blind conformance judge:** extract each arm's `src/`+`tests/` diff vs the base
   commit, drop into neutral `pairN-{X,Y}.diff` files, point `JUDGE_DIR` at them, run
   `ea-x2-judge.workflow.js`.
6. **Record** the new time/token ratios in the baseline table (new dated row). Clean up worktrees:
   `git worktree remove --force <scratch>/wt/*` then `git worktree prune`.

## Invariants (do not drift)

- Base all worktrees on **`demo/dotnet`** (commit `d27600f` at freeze) — `main` has no governance
  surface and an empty `src/TaskTracker.Api`. `demo/dotnet` is never mutated (detached worktrees).
- The **task statements pin exact wire contracts** on purpose (objective oracle). Do not "improve"
  them — that is the whole point of this baseline. The value-measuring variant is the other kit.
- Arms run **sequentially** so `budget.spent()` output-token deltas attribute to one arm.
- Tokens are an **output-only proxy** (no input tokens; no token infra — IL-PF10). Time is
  **arm-self-reported** (`date +%s`), not an independent stopwatch. Keep both caveats on any re-run.
