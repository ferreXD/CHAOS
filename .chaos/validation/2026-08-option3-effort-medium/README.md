# Option-3 effort trial (high → medium) — pre-registered measurement kit

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** CHAOS runs only
> *inside* the governed arms.
>
> **Pre-registration.** §3 and §4 are frozen **at the commit that lands this kit, before any
> arm runs**, and are **never edited to match results**. A negative or null result is a valid
> outcome. **This is a trial by design: fidelity is gated, the effect size is not.**

## 1. Why effort is worth one run

Thinking is ~52% of governed output tokens (subtraction-estimated — thinking blocks are
redacted; plain arms reason at ~56% too), so it is **model style, not governance need**, and
reasoning effort is the direct dial on it. The archived high↔xhigh comparison (lever run 1 vs
run 2, ≈ no delta) suggests saturation at the top of the dial; **downward is untested**. No
build is involved: the trial is one workflow run at `effort: 'medium'`.

## 2. Setup

| Held constant | Value |
|---|---|
| base commit · tasks · oracles · plain prompts | lever-run kit invariants (base `d27600f`; plain prompts lifted byte-identically — `harness/build-workflow.py` prints the shas) |
| toolkit | the **composite toolkit** (options 1+2, tip), staged by `harness/setup-effort-worktrees.sh`; governed prompt teaches the composite protocol (`harness/effort-arms.template.js`) |
| arm model (ceiling) | Opus 5 · mid Sonnet · floor Haiku |
| speed | `standard` |
| sequencing | sequential arms, nothing heavy concurrent (plain sweep must be finished) |

**The variable:** `effort: 'medium'`, set **explicitly per agent call in the workflow args**,
echoed into the structured output, and verified post-hoc in the transcript records — the
lever-run-2 unrecorded-`xhigh` confound is closed by construction.

**Pairs (frozen): P1, B2, B3** — a deliberate deviation from the plan's "frozen-3 (P1–P3)",
recorded before any arm runs: the P-trio is all band B, but the trial's two fidelity-risk
surfaces are (a) **trigger-rich adjudication at medium** (P1: M1+M2+M4, the richest
classification in the set) and (b) **the zero-trigger short-circuit at medium** (B2/B3, band
A — the wall-clock bar's own band). P1+B2+B3 covers both risks and both bands at the same
6-arm cost as the P-trio.

**Comparators.** Classifier verdicts: lever run 1's measured verdicts per pair (the
classifier is deterministic on the same evidence; the composites changed the call surface,
not the classification). Time/tokens: the **tip@high arms** (option-1/2 kit) — the same
harness runs them (`args.effort: "high"`, all 6 pairs), whichever campaign runs first; the
medium-vs-high comparison happens at analysis, same toolkit both sides.

## 3. Frozen fidelity gates (stop-the-analysis; a failure closes the route, L1-D11)

1. **Oracle green in every arm** — the same held-out checks every measured row uses.
2. **Classifier-verdict equality vs lever run 1** per pair: same fired triggers, same final
   vectors (lever-run kit §3 expectations, which run 1 measured true). **A verdict flip at
   medium kills the route** — it would mean effort changes what the loop notices, which is
   governance loss, not savings.
3. **Short-circuit correctness at medium**: B2/B3 governed arms short-circuit
   (marker present, `materialized` at close); P1 does not. Audit exit 0 everywhere.
4. **Judgement-surface diff REPORTED, never tuned away**: adjudication raises, stop counts
   and folds, contract statement counts, coverage rows, deviation counts vs the run-1 arms.
   Divergence here is a finding about what medium changes — reported as such.

## 4. Frozen direction reading (not a pass/fail bar — the trial measures, the gates decide)

- **If medium halves thinking** (~52% → ~26% of output): ~25% less governed output
  ≈ ~15% of wall clock ≈ **2–3 min on a band-A change**. If it moves nothing, the
  saturation observed at the top of the dial extends downward and the route closes cheaply.
- **Thinking share per arm** is measured the established way (per-API-call regression +
  subtraction over the workflow transcripts), reported per arm alongside tokens and the
  independent stopwatch wall clock.
- The plain arms run at medium too: if medium speeds plain and governed **equally**, the
  governance overhead ratio is untouched and the absolute band clock is the only gain —
  reported either way (the fast-mode lesson: serving/style speedups are not CHAOS
  improvements unless the governed arm gains more).

## 5. Launch procedure

1. `bash harness/setup-effort-worktrees.sh <short-path-outside-repo>` — all sanity checks
   must be OK (they include: skill routes composites, `chaos-loop` staged, loop suite green
   inside the worktree, plain arms pristine).
2. Launch `harness/effort-arms.workflow.js` with args
   `{ "effort": "medium", "pairs": [P1, B2, B3 with wtA/wtB paths] }` — sequential, no
   concurrent measured work (the plain product sweep must be finished first).
3. Afterwards: oracle + verdict checks, stopwatch re-measure from the workflow transcripts,
   thinking-share decomposition. Evidence lands under `evidence/`.

Cost, stated first: ~6 arms ≈ half a lever run ≈ ~200k output tokens, ~1.5–2.5 h sequential.

## 6. Status log (never back-dated)

- 2026-08-04 — kit + harness authored (template with explicit `effort` arg, composite-aware
  governed prompt, worktree staging incl. `tools/chaos-loop`); workflow assembled, plain
  prompts lifted byte-identical (shas printed by the build). §3/§4 frozen at the landing
  commit. **No arm has run.**
