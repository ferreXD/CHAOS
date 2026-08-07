# Evidence — what is measured, what is not

> **CHAOS makes an AI agent stop once before it writes code — and remembers what you
> decided, so it can catch the change that contradicts you six weeks later. Measured on a
> real client codebase at ~1.1× the cost of not asking.**

That sentence is the claim. This page is the receipts, with the caveats in the same
table as the numbers.

> **One limit, stated up front.** The measurements below were taken against a private
> production codebase. The raw record for those runs — prompts, per-run transcript
> analysis, expected-convention sheets — is **not published**, because it would describe a
> third party's system, and that is not mine to publish. What you get here is the numbers,
> the method, and the caveats. Everything from the earlier public-demo series *is* in the
> repository under [`.chaos/validation/`](../.chaos/validation/). Weigh this page
> accordingly: on the private runs, you are trusting a summary rather than checking an
> artifact — which is exactly why the challenge at the bottom exists.

## The headline numbers (lean core, real terrain)

Three tasks on a large, long-lived production codebase, each run twice from the same
baseline: plain Claude Code vs `chaos:run`. Wall-clock machine time, measured from
session transcripts with [`tools/chaos-stopwatch`](../tools/chaos-stopwatch/)
(human thinking/waiting time excluded from both arms).

| Task | Plain | CHAOS | Multiplier | Premium | Caveat |
|---|---:|---:|---:|---:|---|
| Task 1 | 16.4 min | 18.9 min | **1.15×** | +2.5 min | on-clause (same model, same effort) |
| Task 2 | 7.5 min | 23.1 min | **3.08×** | +15.6 min | **off-clause: governed arm accidentally ran at a higher reasoning effort — upper bound, not comparable** |
| Task 3 | 17.8 min | 18.7 min | **1.05×** | +0.9 min | on-clause; spec gate self-selected optional |

On the two clean rows the entire premium is, to the minute, the pre-code stop itself;
the post-approval build phase was *shorter* than plain's whole run, and the governed
arm shipped ~35% less production code than plain on the same verdicts.

**Catches:** 2 operator overrides in 3 tasks — cases where the human, shown the folded
decision, rejected the agent's defensible recommendation for reasons that lived only in
their head (a DB-consistency convention; an application-philosophy line that refused
~343 LOC the same operator had approved days earlier under a weaker "approve this plan"
stop). Every catch this program ever measured was an **authority** catch, not a
capability catch: better models don't make them go away, because no model contains the
maintainer's intent.

## The caveats that bound the claim

- **n = 3 tasks** (plus five earlier tasks against the retired apparatus). Small.
- **One operator, who is also the author and the adjudicator.** No independent
  replication exists yet; the first external record-caught crossing is the single most
  valuable datum this project could receive.
- **One codebase, one model family** (Claude, effort-pinned; each run's model clause is
  verified in the transcript before its number is quoted).
- **The strongest rival has not been run** — see the challenge below.

## What the program falsified (its own product, mostly)

The same instruments killed the project's earlier, heavier design — full lifecycle
commands, classification machinery, per-phase artifacts — measuring it at **+17.6 to
+35.4 minutes per change** (2.1–5.7×) on the same three tasks, *worst* on fully
repaired machinery. It was deleted, not deprecated (git tag `apparatus-final`).
Seven separate cost hypotheses died on the way; the ceilings-and-budgets design was
falsified 3-for-3 and removed. The lean core is what the data left standing.

## The plain+ask challenge (run the rival yourself)

The cheapest competing product is not another tool — it is one standing instruction
pasted above your prompt. This exact text was frozen in
[the pre-registered arm design](../.chaos/validation/2026-08-product-conditions/plain-ask-arm.md)
**before any run**, and it has never been run on real terrain — which makes it the
strongest unrebutted rival to the 1.05–1.15× stop:

```text
Before writing any code: if this request leaves a decision that is genuinely mine
rather than yours - something you would otherwise settle silently, and that a
maintainer might have wanted to settle themselves - ask me about it and wait for my
answer. If there is nothing like that, say so and implement it directly.
```

Try it in your own repo against `chaos:run` on the same task. What it cannot do by
construction: persist the answer (nothing checks your next change against this one),
survive an interrupted session, or fold *every* question and crossing into one bounded
decision instead of a conversation. Whether those differences are worth ~1.1× on your
terrain is exactly the question — if you run the comparison, we want the result either
way: [open an issue](https://github.com/ferreXD/CHAOS/issues).

## Standing falsifiable predictions

The current assessment keeps its own neck on the line in
[`08-scorecard.md`](../.chaos/assessments/2026-08-06-lean-core-assessment/08-scorecard.md)
— including "plain+ask catches at most one of the two lean-era override-class
divergences" and "without a mechanical check, decision-record length regrows within
five changes". Scoring them is part of the next assessment.
