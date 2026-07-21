# EA-V2 — Validation experiments (index)

Real, agent-executed evidence for the three load-bearing CHAOS claims — **usable**, **valuable**,
**trustworthy** — plus a value follow-up. Addresses the `2026-07-18-ea-v2-run-experiments-x1-x2-x4`
BLOCKER/P0 TODO and feeds the §12.3 kill/pivot gate. **Read
[`results-summary.md`](results-summary.md) first** — it is the one honest EA-V2 verdict and the gate
read.

## Honesty legend (used across every folder)

**Observed** (measured this run) · **Reported (author)** (asserted by an author/agent) ·
**Inferred** (reasoned, not measured) · **Hypothesis** · **Recommendation** · **Unknown**. Wherever an
**agent stood in for a human**, that is stated explicitly — no agent run is dressed up as a human trial.

## The experiments

| Folder | Claim | Headline result | Status |
|---|---|---|---|
| [`ea-x1-cold-start/`](ea-x1-cold-start/) | **usable** — a stranger reaches first value | 0 silent failures on the mechanical path (post F1/F3); **human TTFV pending** (recruitment kit) | ✅ sub-threshold / ⏳ human |
| [`ea-x4-resume-reliability/`](ea-x4-resume-reliability/) | **trustworthy** — resume survives abuse | baseline 60% ❌ → EA-V3 hardening → **20/20 = 100%, 0 corruption** | ✅ post-fix |
| [`ea-x2-with-without/`](ea-x2-with-without/) | **valuable** — governance adds value | **0 catches, 3.94× time** (pinned-contract mechanized A/B) | ❌ on §15.2 |
| [`ea-x2b-under-specified/`](ea-x2b-under-specified/) | **valuable** — *when the task is ambiguous* | surfacing **3/3 vs 0/3**; **1 clear + 1 qualified catch**; **4.83× time** | ⚠️ conditional |
| [`results-summary.md`](results-summary.md) | **EA-V2 verdict + §12.3 gate read** | **Continue** (pivot does not trip); value conditional & located; human trials open | — |

## How to read this trail from disk alone

Each experiment folder opens with its own honesty framing, then a `protocol.md` (method), per-unit
evidence (diffs, oracle output, decision records), and a `results.md` scorecard. The `ea-x2*/harness/`
folders are **durable re-runnable kits** (workflow scripts + `RUNKIT.md`) so the mechanized A/Bs can be
re-run — e.g. to re-measure cost after a performance pass.

## One-line verdict

CHAOS is **trustworthy** under abuse (X4), **mechanically usable** (X1; human trial pending), and
**conditionally valuable** — its worth is real but located on **ambiguous, decision-bearing** strict-risk
work, delivered as human-shapeable, repo-resident decision records, at a **~4–5× cost that is the same
mechanism as the value**. The §12.3 pivot gate does **not** fire. See
[`results-summary.md`](results-summary.md).
