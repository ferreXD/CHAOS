# EA-X2b harness — re-runnable kit (under-specified counterfactual)

Reproduces the **under-specified** value test: does governance surface the material decision a
plain run guesses silently, and is the silent guess wrong? Unlike the pinned-contract EA-X2 kit,
this one keeps the tasks **ambiguous** and grades against **sealed hidden intents**.

## Scripts

| File | Role |
|---|---|
| `pass1.workflow.js` | Per task: plain arm ships one-shot; CHAOS arm surfaces the material ambiguity as a BLOCKING/OPEN decision and **stops** (R-001). Sequential for per-arm `budget.spent()` token deltas. Reads `args.tasks` (worktree paths + statements + changeIds). |
| `pass2.workflow.js` | Per task: CHAOS arm **resumes** with the human-answered decision (the hidden intent, supplied in `args.tasks[].answer`) and implements it (apply + verify). |
| `judge.workflow.js` | Per task: classifies each arm's **surfacing** and **choice-vs-intent** from the diffs + sealed intent, and derives `catchAttributableToChaos`. |

Task statements live in [`../tasks/`](../tasks/); the sealed intents in
[`../tasks/hidden-intents/`](../tasks/hidden-intents/); the one objective oracle in
[`../oracles/AuthScopeOracleTests.cs`](../oracles/AuthScopeOracleTests.cs).

## Re-run procedure

1. Create 6 detached worktrees off `demo/dotnet` in a scratch dir outside the repo:
   `for t in tA tB tC; do for a in chaos plain; do git worktree add --detach <scratch>/wt/$t-$a demo/dotnet; done; done`.
2. **Pass 1:** `Workflow({scriptPath: pass1.workflow.js, args: {tasks:[{id,changeId,statement,wtChaos,wtPlain}×3]}})`.
   Read the returned `chaos_pass1.surfacedDecisions` and `plain.materialChoiceMade`/`flaggedAmbiguity`.
3. **Answer as the human:** for each task, take the corresponding **hidden intent** and phrase it as
   the decision answer. (Do NOT invent a new answer — use the pre-registered intent, so the resume
   is auditable.)
4. **Pass 2:** `Workflow({scriptPath: pass2.workflow.js, args: {tasks:[{id,changeId,wtChaos,answer}×3]}})`.
5. **Diffs:** for each arm, `git -C <wt> add -A -- src tests && git -C <wt> diff --cached d27600f -- src tests > <name>.diff && git -C <wt> reset`.
6. **Objective oracle (Task A):** drop `AuthScopeOracleTests.cs` into each Task-A arm's test project
   and `dotnet test --filter FullyQualifiedName~TaskTracker.Oracle`. Intent-aligned = reads 200 /
   writes 401 without key; lock-all fails the read facts; open fails the write facts.
7. **Judge:** `Workflow({scriptPath: judge.workflow.js, args:{tasks:[{task,intentText,plainChoice,plainFlag,chaosSurfaced,plainDiffPath,chaosDiffPath}×3]}})`.
8. Clean up worktrees (`git worktree remove --force`, `git worktree prune`).

## Invariants

- Base worktrees on **`demo/dotnet`** (governance surface present); never mutate the branch.
- **Never leak a hidden intent into a task statement.** The arms must see only the vague ask.
- The CHAOS pass-1 arm must be instructed to **surface + stop**, not implement the material axis;
  pass-2 implements **the human answer** (= the pre-registered intent), even if it differs from the
  arm's own recommendation.
- Judge classifies **against the fixed intent** (match/conflict), not by preference; it must quote
  diff evidence. Note the judge-centrality limitation for tasks B/C (arm-chosen interfaces).
