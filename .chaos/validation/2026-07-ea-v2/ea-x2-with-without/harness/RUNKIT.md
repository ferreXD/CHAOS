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
