# EA-X2 Stage-A — `--light` path measurement kit

Toolkit meta-work (no CHAOS governance, per the creator's standing preference). This kit measures
the **Stage-A collapsed `--light` lifecycle** (shipped in commit `eaa1b84`; design:
`docs/design/2026-07-22-light-mode-workflow.md`, `…-per-command.md`,
`docs/design/2026-07-24-artifact-model-roadmap.md`) against the frozen **EA-X2** baseline
(`../ea-x2-with-without/`, baseline **3.94× time / 4.75× tokens**, oracle 19/19).

It re-uses the EA-X2 mechanized-counterfactual methodology unchanged (same-model both arms, pinned
contracts, single agent standing in for the human-led loop, `budget.spent()` output-token proxy,
`date +%s` self-reported time) — so the **cost ratio** is comparable to the baseline row. What
moves is the governed arm's path: the collapsed FRAME→DELIVER **light** artifact set instead of the
standard 6-command / 11-artifact lifecycle.

## What it measures (Stage-A definition of done)

Two things, per the roadmap's "Definition of done for A":

1. **Cost** — ≤2× time, artifact-prose ≤15% of governed output, oracle still clean, zero decision
   loss. Measured two ways:
   - **Cost A — frozen 3, forced light (valve OFF).** The three frozen EA-X2 tasks (auth,
     soft-delete, concurrency) run on the collapsed light path with the escalation valve
     *suppressed*. These tasks deliberately cross architecture non-goals, so a faithful valve would
     escalate them — suppressing it isolates the **pure collapsed-artifact cost** and keeps the row
     directly comparable to the frozen baseline (same tasks, same oracles).
   - **Cost B — 3 new light-eligible tasks, valve LIVE.** Three small non-posture tasks
     (`task-count`, `filter-tasks-by-status`, `enforce-title-max-length`) representative of real
     light usage. The valve is live and must **not** fire (they are in-boundary). New held-out
     oracles in `oracles/`.
2. **Valve fidelity (both directions)** —
   - should-**escalate**: a FRAME-only seed on the under-specified EA-X2b auth task
     (`secure-api-underspecified`) must escalate light→standard (posture crossing). Under-detection
     = governance bypass.
   - should-**stay-light**: Cost B's three arms must stay light (no escalation). Over-detection =
     "light is a lie."

## Files

| File | Role |
|---|---|
| `harness/stage-a-arms.workflow.js` | the measurement workflow: light-governed (Arm A) vs plain (Arm B) over Cost A + Cost B, plus the FRAME-only valve seed. Sequential for clean per-arm token deltas. Task statements are embedded; `args` carries only changeId + worktree paths. |
| `harness/score-all.sh` | scores every cost arm against its held-out oracle (frozen EA-X2 oracles for A, new oracles for B), reusing `../ea-x2-with-without/harness/score-arm.sh`. |
| `tasks/taskB{1,2,3}-*.md` | the three new light-eligible task statements (pinned contracts). |
| `oracles/{Count,StatusFilter,TitleLength}OracleTests.cs` | held-out black-box oracles for Cost B, authored before any arm ran. |
| `results.md` | scorecard vs the Stage-A targets (written after the run). |

## Re-run procedure

1. Create worktrees off `demo/dotnet` in a scratch dir outside the repo — 13 total:
   `A{1,2,3}-arm{A,B}`, `B{1,2,3}-arm{A,B}`, `V1-armA`. Base ref `demo/dotnet` (it carries the
   governance surface + green baseline; `main` does not).
2. Stage the shipped `change-template.md` into each `*-armA` and `V1-armA` worktree at
   `.claude/skills/chaos-shared/reference/change-template.md` (the light arm reads it; `demo/dotnet`
   predates the Stage-A skills).
3. Build `args` (changeId + wtA/wtB per entry; see `harness/` generator) and launch
   `Workflow({scriptPath: "…/stage-a-arms.workflow.js", args})`. Multi-agent — needs explicit
   opt-in. ~60–90 min for 13 sequential arms.
4. Score: `bash harness/score-all.sh <scratch>`. Expect both arms clean per oracle unless a real
   regression appears.
5. Record a **new dated row** in `../ea-x2-with-without/harness/RUNKIT.md` (never overwrite the
   baseline) and fill in `results.md`.

## Invariants (do not drift)

- Same-model both arms; pinned contracts; single-agent loop — identical caveats to EA-X2; this kit
  measures **cost of producing the traceability**, not governance **value** (that is EA-X2b / EA-D3).
- Frozen-3 statements are byte-identical to the EA-X2 baseline (embedded in the workflow).
- Cost A suppresses the valve **only** for cost isolation; the valve's real behaviour on those tasks
  is tested separately by the escalate seed and asserted honestly in `results.md`.
- Tokens are an output-only proxy; time is arm-self-reported. Keep both caveats on any re-run.
