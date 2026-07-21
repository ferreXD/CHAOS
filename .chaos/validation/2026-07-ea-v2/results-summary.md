# EA-V2 — Synthesis & kill/pivot gate read

> **Honesty legend:** **Observed** (measured this run) · **Reported** (asserted by an author/agent) ·
> **Inferred** (reasoned, not measured) · **Hypothesis** · **Recommendation** · **Unknown**. Every
> place an agent stood in for a human carries an explicit agent-vs-human caveat.

One honest verdict over the EA-V2 experiment folders under `.chaos/validation/2026-07-ea-v2/`, read
against the §12.3 kill/pivot gate. Covers the three planned experiments (X1 usable, X2 valuable, X4
trustworthy) **plus EA-X2b**, a follow-up that fixes EA-X2's contract-pinning blind spot.

## Scorecard

| Exp | Claim | Threshold (§15.2) | Result | Pass? | Provenance / caveat |
|---|---|---|---|---|---|
| **X1** cold-start | a stranger reaches first value | 0 silent failures (mechanical sub-threshold) | 0 silent failures after F1/F3 fixes | ✅ (sub-threshold) | **Observed** machine probe. **Human time-to-first-value NOT run** — recruitment kit provided. |
| **X4** resume | trustworthy under abuse | ≥95% correct-continuation, 0 corruption | baseline 60% ❌ → **fixed (EA-V3)** → **20/20 = 100%, 0 corruption** | ✅ (post-fix) | **Observed**, deterministic, no humans. |
| **X2** with/without | governance adds value | ≥1 material catch / CHAOS run; ≤2× time | **0 catches**; **3.94×** time | ❌ | **Observed** mechanized counterfactual (same model both arms; **pinned contracts**). NOT the human trial. |
| **X2b** under-specified | governance adds value *when the task is ambiguous* | (same, re-tested without pinned contracts) | surfacing **CHAOS 3/3 vs plain 0/3**; **1 clear + 1 qualified catch**; **4.83×** time | ⚠️ conditional | **Observed** + judge-Inferred; **partial real human-in-the-loop** (maintainer answered live). n=3, creator-as-maintainer. |

## What EA-V2 now establishes

1. **Trustworthy (X4): yes, post-fix.** Pause/resume survives kill/resume abuse 20/20 with zero
   corruption after the EA-V3 hardening. This is the strongest, fully-agent-executable result.
2. **Usable (X1): mechanically yes, humanly unknown.** The onboarding path has 0 silent failures
   after two env fixes; whether a *stranger* reaches first value, and how fast, is **untested** (needs
   the recruited human trial).
3. **Valuable (X2 + X2b): conditional and located.** This is the load-bearing synthesis:
   - On **fully-specified** tasks, governance catches nothing the capable model doesn't already get
     right, at ~4× cost (X2). Pure overhead there.
   - On **under-specified, decision-bearing** tasks, governance's value **does** appear — as reliable
     *decision-surfacing*: it stopped for a human on 3/3 material decisions the plain agent silently
     guessed on 0/3, and 1–2 of those silent guesses conflicted with real intent (X2b). But it is
     **bounded** (the model sometimes guesses the org-right answer unaided — X2b Task B) and **costly**
     (~4.8×). **Governance's lever is R-001 — "don't silently decide what a human should own" — not
     code correctness.** Its marginal value is a function of *decision-density × ambiguity × how often
     the human's intent diverges from the model's default*, not of code quality.

## Still unknown (do not overclaim)

- **X1 human time-to-first-value** and **X2 unbiased human comparison** — both require recruited
  humans; neither was run. A recruitment kit exists for each.
- **The one number that would settle value ROI** — the rate at which a real human's intent diverges
  from the unaided model's guess on material decisions — is **Unknown** and **cannot be self-run**
  (X2b Task C is a live demonstration: the experimenter's own pre-registered intent was *wrong*, and
  only the real maintainer's answer corrected an otherwise-false, inverted finding).
- **EA-X6** (usage-breadth / retention) — not run this pass.

## Kill/pivot gate read — §12.3 (Recommendation)

The §12.3 pivot-to-EA-D3 tripwire requires **all three** of: (a) no external user completes the
lifecycle unassisted (X1), **and** (b) with/without shows **no** defect/conformance advantage on
strict-risk tasks (X2), **and** (c) usage stays confined to a few commands (X6).

**The gate does NOT trip. Call: CONTINUE — do not pivot to EA-D3 yet.** Evidence:

- **(a) — untested.** The human cold-start trial was not run; "no external user completes unassisted"
  is unproven, not established. The mechanical path is clean (0 silent failures).
- **(b) — not satisfied.** X2 alone would support (b), but **X2b overturns it for the exact question
  the gate asks**: there *is* a decision/conformance advantage on **ambiguous** strict-risk work
  (surfacing 3/3 vs 0/3; a clear oracle-verified catch on auth scope). Condition (b) — "*no* advantage"
  — is false as stated.
- **(c) — untested** (EA-X6 not run).

With one tripwire condition affirmatively **false** and the other two **untested**, the AND-gate
cannot fire. The honest posture is **continue on the EA-D1 × EA-D3 direction**, with the value case
**explicitly conditional** (it lives on ambiguous, decision-bearing work) and the **human trials as
the deciding open question**. **Absorption tripwire** (a platform shipping durable repo-local decision
records before EA-A1) remains the thing to watch, because — per the creator's note below — the
decision/traceability layer is the crown jewel and also the EA-D3 kernel.

## Creator's note — the value axis the thresholds under-measure (Reported)

The maintainer states that the value they most prize is **not** primarily "catches" (error-prevention),
but: **the ability to author a spec, get full traceability of what the agent decided, be able to
*shape* that decision (which prompts — however elaborate — do not offer), and have that knowledge live
in the repo itself.** This is a legitimate, distinct value axis, and it is **Observed to have been
produced in every governed run**, independent of whether a "catch" occurred:

- X2: 15 material decisions + 33 governance artifacts across 3 runs, repo-resident and confidence-labelled.
- X2b: 3/3 material decisions surfaced, **human-shaped** (you overrode the agent's recommendation on
  Task A; you chose the strategy on Task C), and persisted as `decision-events.md` in the change folder.

So EA-X2's "0 catches" is the honest result **for the error-prevention metric §15.2 specified** — but
it undersells what the same runs positively demonstrated on the **governance-artifact / decision-record
axis**, which is what the creator actually optimizes for. Both are true; they are different axes.
Crucially, that traceable-and-shapeable-decision machinery is **also the primary cost driver** (the ~4–5×
is spent producing prose artifacts and the surface-and-resume loop) — so the value the creator prizes and
the cost EA-V2 measured are **the same mechanism**.

## Cost & the performance direction (Recommendation / creator brainstorm)

Cost is consistent and large: **X2 3.94× / X2b 4.83× wall-time; ~4.3–4.75× output tokens.** The maintainer's
constraint on any performance work: **do not reduce the number of decisions or the human's decision
weight** — that machinery *is* the value. The direction instead:

- a genuine **`--light` path** that is actually light (not `--standard` with a smaller preamble);
- an **altitude/blast-radius classifier** that detects when a requested change is genuinely small and
  scales rigor down automatically;
- teaching the agent **when to cut information** (stop re-deriving context, stop restating governance);
- **less prose-driven** artifacts (structured/append-only decision records over long narrative reports).

These target the *cost of producing the traceability*, not the traceability itself. Spun out as a
follow-up (below); a real design plan is the natural next step.

## Follow-ups spawned

| Item | Source | Status |
|---|---|---|
| **EA-V3** runtime hardening | X4 baseline 60% fail | **Done** — X4 re-validated 20/20/0. |
| **IL-PF10** token accounting infra | X2/X2b used an output-token *proxy* | Open — no real token infra yet. |
| **Performance / altitude pass** (light path, blast-radius classifier, cut-info, less prose) | X2 3.94× + X2b 4.83× cost; creator note | **New** — design plan next; must NOT reduce decisions/human weight. Re-measure with the `ea-x2-with-without/harness/` cost baseline. |
| **Human trials** (X1 TTFV, X2 unbiased) | X1/X2 caveats | Open — recruitment kits provided; the deciding open question. |
| **EA-X6** usage-breadth/retention | §12.3 condition (c) | Open — not run this pass. |
| **EA-D3** watch | §12.3 absorption tripwire + creator note (decision layer = kernel) | Monitor. |

## Bottom line

**Continue.** EA-V2 shows CHAOS is **trustworthy** under abuse (X4, post-fix), **mechanically usable**
(X1, human trial pending), and **conditionally valuable** — its worth is real but *located* on
ambiguous, decision-bearing strict-risk work, delivered as human-shapeable, repo-resident decision
records, at a ~4–5× cost that is the same mechanism as the value. The pivot gate does not fire. The two
things that would actually settle the ROI — the **human-intent-divergence rate** and **human
time-to-first-value** — remain open and cannot be self-run; the harnesses (`ea-x2-with-without/harness/`,
`ea-x2b-under-specified/harness/`) are preserved to re-run them, and to re-measure cost after the
performance pass.
