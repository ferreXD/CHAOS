# Prompt — independent performance review of the CHAOS delivery loop

> Hand this to a fresh session with no context on the program. Paste everything below the line.

---

You are reviewing the performance of **CHAOS**, a governance framework that delivers code changes
under classification, human stops, and traceability artifacts. Your job is to find the **top 5–10
options for reducing wall-clock time per governed change**, ranked, with evidence.

Repository root: this repo. Everything you need is committed. **Read
`docs/design/2026-08-04-wall-clock-handoff.md` first** — it is written for exactly this task and
is self-contained. Then, as needed: `docs/design/2026-08-04-metric-rebase.md` (the metric of
record), `.chaos/validation/2026-08-product-conditions/results-T1.md` (the only real-world run),
and `tools/chaos-stopwatch/README.md` (the instrument).

## The target

A governed change takes **15–24 minutes**; ungoverned it takes **2–3**. The bars are absolute
wall clock per change: **band A (trivial) ≤ 5 min**, band B ≤ 15, band C ≤ 30. Nothing has ever
met band A. **Money does not gate** — governance adds ~$1.20/change and the price ceiling has
4–8× headroom, so do not propose cost optimizations. Output tokens are a diagnostic, not a bar.

## The central open question — resolve or work around it, do not assume it

**Nobody knows whether the clock is driven by round-trip count or by generated token volume.**
Across all 36 archived arms: time↔tokens **r=+0.994**, time↔tool-calls **r=+0.994**, and the two
are collinear at **r=+0.987**. Seconds-per-tool-call is stable at 10.2–13.6 s (mean ≈11.9) across
18 governed arms — equally consistent with "each round-trip costs a fixed ~12 s" and with "tokens
per call are constant, and tokens are what cost time".

This matters because it flips the ranking of everything: if round-trips dominate, batching is the
lever; if tokens dominate, batching buys ~nothing and generated volume is the target. **A prior
draft of the handoff asserted the round-trip answer and was wrong** — it paired deltas from two
different intervals. That correction is in the handoff §4.1. Treat the question as open.

## What is already dead — do not propose these

Seven cost hypotheses have been falsified and four named levers built and judged:

- **Model tiering (price):** closed. 3.1% blended ceiling; and a floor-tier unit shipped a
  contract violation it certified green, because it wrote the tests that checked it.
- **Corpus amortization (input tokens):** built, works, invisible to the gate.
- **Protocol mechanization (reasoning tokens):** hit its token target; the loop got *slower*.
- **Derived records (authored output):** works. Artifacts are 10.3% of output.

**Cutting governance artifacts has failed four times** — they were never the dominant cost.

## Assumptions in the existing analysis you should attack

Be adversarial about these. Each is load-bearing and under-evidenced:

1. **The 61% model / 39% tool split is n=1** — a single run. It may not generalize.
2. **"The fixed entry cost dominates"** rests on one run's phase split (39% before any code) plus
   the observation that band A costs 80% of band B. Both are thin.
3. **Every "cleared" verdict in this program was reached on the token metric and none has been
   re-tested on the clock.** Artifacts are 10.3% of *output tokens* — but they were 15 of 113
   *tool calls* in the measured run, and if round-trips cost time, their share of the clock is not
   their share of the tokens. **The artifact question may deserve reopening on time grounds even
   though it is settled on token grounds.** The same caution applies to every other cleared item.
4. **The ≤5 min band-A bar is a judgement**, derived from a developer's context-switch horizon,
   not from measurement. If you think it is the wrong target, say so.
5. **The product-conditions run is n=1** and slower than the harness by 58%. One data point.

## Hard constraints — a proposal that violates these is not a proposal

- **Governance fidelity is not negotiable.** The classifier's verdicts, the stops it demands, and
  the audit that gates close must not weaken. Speed bought by classifying less is not a win.
- **Quality is a stop-the-analysis gate.** The subject repo's test suite must stay green.
- **No metric shopping.** Wall clock is the bar. Do not propose re-defining success.
- **Deterministic-first ladder:** tool > cheaper model > stronger model. Prefer moving work into
  deterministic tooling over asking a model to be faster.
- Anything that changes what governance is owed must be a constrained choice or fail closed —
  this rule exists because it has been violated four times.

## Evidence available to you

- `tools/chaos-stopwatch/stopwatch.py` — reads runtime-written transcript timestamps. **Never
  trust self-reported timing**; it under-reports by 6–31%, worst on short runs.
- Archived transcripts for 36 arms across Stage D, lever run 1, lever run 2, plus one
  product-conditions run, under the user's Claude projects directory. Per-message `usage`, every
  tool call, and every timestamp are in them. Prior analyses derived phase splits, tool-call
  counts and model/tool time splits directly from these — you can too, and you should re-derive
  anything you intend to rely on.
- `.chaos/validation/*/` — each kit README is its own frozen pre-registration.

## What to produce

A ranked list of **5–10 options**, best first. For each:

| Field | Requirement |
|---|---|
| **What** | The change, concretely enough to implement. |
| **Mechanism** | *Why* it would reduce wall clock — the causal path, not a vibe. |
| **Expected effect** | A number or range, with the reasoning that produced it. |
| **Evidence** | What in the repo or transcripts supports it. Cite. Say "none" if none. |
| **Cost & risk** | Build effort, and what it could break — especially governance fidelity. |
| **How it could be wrong** | The observation that would falsify it. |
| **Depends on** | Whether it is contingent on the round-trip-vs-tokens question. |

Then close with:

- **The single experiment you would run first**, and why it discriminates best.
- **Anything in the existing analysis you believe is wrong**, with your reasoning.
- **What you could not determine** from the available evidence.

Prefer a small number of well-evidenced options over a long brainstorm. This program has a record
of **0 for 7** on plausible-sounding cost hypotheses, so an option's value lies mostly in how
cheaply it can be falsified. If the honest answer to some part is "the data cannot tell you", say
that rather than filling the gap.
