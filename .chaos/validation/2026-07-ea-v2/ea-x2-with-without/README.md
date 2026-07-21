# EA-X2 — With/without value (mechanized counterfactual A/B)

> This is a **mechanized counterfactual** that isolates the *marginal value of the governance
> layer over the same model unaided* — it is **NOT** the unbiased human EA-X2 trial. §15.1
> point 2: the creator cannot run an unbiased with/without on themself. Same underlying model
> runs both arms, and the tasks are maintainer-authored (selection bias). The result is real
> and published whatever it shows; a null result legitimately shifts weight to EA-D3.

## Honesty legend (used throughout)

**Observed** — directly measured by a tool this run (test/oracle output, file diffs).
**Reported (author)** — asserted by an arm agent about its own run.
**Inferred** — reasoned from evidence, not directly proven.
**Hypothesis / Recommendation / Unknown** — as labelled inline.
Plus an explicit **agent-vs-human caveat**: every "governed" arm here is an *agent* standing
in for the human-led CHAOS loop; where a human decision would normally gate the work, the
agent recorded and resolved it in-arm (documented per pair). No claim of a human trial is made.

## What this experiment is

A same-model A/B across **3 strict-risk brownfield tasks** on the Task Tracker API:

- **Arm A — CHAOS (governed):** the governed lifecycle (propose → review → apply → verify)
  with the real artifact set + decision events, run against the discovered governance
  (AGENTS.md, `.chaos/constitution.md`, `.chaos/rules/index.md` R-001..R-007,
  `.chaos/architecture.md`).
- **Arm B — plain:** the same model, the same task statement, no governance, no CHAOS
  artifacts — "make the change and keep tests green."

Both arms start from an **identical clean worktree** and see the **identical task statement**
plus the **visible** (baseline) test suite. Neither arm sees the **held-out oracle** — a
hidden xUnit suite authored *before* either arm ran that encodes correct behaviour + the
defect traps. That oracle is what makes "later-found defects" **objective** rather than judged.

## The claim under test (§15.2)

**Hypothesis:** CHAOS improves outcomes on strict-risk work.

| Threshold | Target |
|---|---|
| Material defect/conformance catch per CHAOS run | **≥ 1** |
| CHAOS time vs plain | **≤ 2×** |

**Failure interpretation:** value claim unsupported → shift weight to EA-D3.

## Files

- [`protocol.md`](protocol.md) — the 3 tasks, the held-out oracles (published *after* the
  runs so readers can audit), arm definitions, scoring rubric, and the base/worktree setup.
- [`oracles/`](oracles/) — the three held-out oracle suites, verbatim, plus their
  pre-registration evidence (they compiled and their traps were live against the featureless
  baseline *before* any arm ran).
- [`pair-01/`](pair-01/), [`pair-02/`](pair-02/), [`pair-03/`](pair-03/) — per pair: both
  arms' code diffs, oracle results, conformance scores, time, tokens, artifacts-read.
- [`results.md`](results.md) — the scorecard vs thresholds (material catches/CHAOS run,
  time ratio), per pair and aggregate, with the mechanized-counterfactual caveat repeated.
- [`harness/`](harness/) — the **durable, re-runnable kit** (workflow scripts, oracle scorer,
  worktree setup, `RUNKIT.md` with the frozen baseline). Re-run after CHAOS performance fixes to
  check whether the cost ratio (3.94× time / 4.75× tokens) improves. The **value**-focused
  follow-up that fixes this harness's contract-pinning blind spot is
  [`../ea-x2b-under-specified/`](../ea-x2b-under-specified/).

## Provenance of every number (read before trusting a metric)

| Metric | How it was obtained |
|---|---|
| later-found defects | **Observed** — the held-out oracle run against each arm's final build; a failing oracle `[Fact]` = a shipped defect. |
| architecture conformance | **Observed+Inferred** — a judge agent scored each arm's `src/`+`tests/` diff against R-001..R-007 + architecture, same rubric both arms (judge reasoning is inference). |
| time | **Reported (author)** — each arm bracketed its own work with the system clock (`date +%s`) and reported elapsed seconds. Not an independent stopwatch. |
| tokens | **Observed (proxy)** — workflow `budget.spent()` **output-token** delta around each arm, measured with arms run **sequentially** so deltas attribute cleanly. Output-only; excludes input tokens; no token infra exists yet (IL-PF10 open). |
| artifacts actually read | **Reported (author)** — the governed arm listed which governance artifacts it read *and that changed a choice*; cross-checked against its produced diff where possible. |
