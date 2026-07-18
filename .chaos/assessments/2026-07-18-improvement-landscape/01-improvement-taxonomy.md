# 01 — Improvement-area taxonomy

Part of the CHAOS improvement-landscape assessment (companion to [2026-07-18-public-alpha-assessment](../2026-07-18-public-alpha-assessment/README.md)) · commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## Method

Areas were derived from the evidence in the first assessment (measured token costs, runtime audit, dogfood forensics, ecosystem research), not from the candidate list as-is. Test applied to each candidate area: does it map to real CHAOS components, carry a distinct top-risk or top-opportunity, and change roadmap decisions if ignored? **Nine areas** survived; the tenth candidate ("team collaboration and enterprise workflows") was deliberately **distributed rather than kept**: its concrete improvements decompose cleanly into other areas (identity/attribution → Traceability; PR-visible ledger → Traceability; shared decisions → Decision Quality; worktree locks → Runtime), and the first assessment's finding stands that team capability should be *pull, not push* before product-market fit. Keeping it as an area would invite building enterprise features prematurely (risk EA-R "enterprise-too-early").

## The nine areas

| Code | Area | Why it matters (evidence) |
|---|---|---|
| **WF** | Workflow & command model | The #1 abandonment driver is ceremony: ~196k instruction tokens, 9 sessions, 11–14 stops, 17–19 artifacts per standard change (measured). The portfolio has real overlaps (status/doctor, verify/code-review, archive/sync). Risk EA-R1/R2 live here. |
| **DQ** | Decision quality & human interaction | Decisions are the crown jewel — and the least theorized part: no materiality doctrine, no reversibility/urgency classes, no outcome tracking, free-text rationale. Fatigue is the failure mode that kills the whole thesis. |
| **TR** | Evidence, traceability & accountability | The audit trail *is* the product, yet today it cannot answer "which files changed because of DEC-X", "which model produced this", or "did the prediction hold". Regulatory tailwind (EU AI Act Aug 2026) rewards closing these gaps. |
| **RT** | Runtime reliability, recovery & security | The engine everything rides on: no cross-process mutex, unsanitized MCP read IDs, null capsule hash, `py -3` hooks silently no-op'ing, no schema migrations. All pre-beta classified findings. |
| **PF** | Performance & token efficiency | Token cost is a first-class product concern when the pitch is "governance is worth its cost". Waste is structural and measured: triplicated contracts, mandatory reference fan-outs, 3× evidence re-reads, prompt-encoded linting. |
| **AG** | Architecture guidance & governance artifacts | The blank-repo problem is real: without posture, agents default to model-preferred architecture. Foundation discovery (the greenfield exercise, [09](09-greenfield-foundation-design.md)/[10](10-greenfield-foundation-catalog.md)) plus ADR/rules/gates lifecycle live here. Also the brownfield mirror (observed posture). |
| **DX** | Developer experience & onboarding | Scores 3–4 in the first assessment: manual builds, silent first-run failures, hung-looking waits, no history view. The gap between engineering quality (8) and usability (4) is the adoption bottleneck. |
| **EX** | Extensibility, portability & ecosystem | The defensible identity is a *format* others can adopt; the current twin-tree adapter model is a liability. OpenSpec's OPSX rewrite (EA-R5) and platform absorption (EA-R6) both press on this area. |
| **PA** | Productization, adoption & OSS maturity | CI runs no tests, no tags/CHANGELOG, sanitization incomplete, no external users. Everything needed for the project to be *credible to strangers* and survivable beyond one maintainer (EA-R7). |

## Coverage check

- Every candidate topic from the exercise brief maps to ≥1 area (collaboration → TR/DQ/RT; observability → TR + DX; testing → RT/PA; security → RT/PA; context management → PF; governance → AG; onboarding → DX; provider portability → EX).
- Overlap is bounded and declared: DQ↔TR share the outcome-tracking loop (IL-DQ6/IL-TR5 are one investment, two views); PF↔EX share contract single-sourcing (IL-PF1/IL-EX1); DX↔WF share ceremony reduction. The [final prioritization](11-final-prioritization.md) dedupes across areas and against the first assessment's EA-* items.

## Topic inventory map

- [02 — WF · DQ · TR topics](02-topics-workflow-decisions-traceability.md) (28 topics)
- [03 — RT · PF topics](03-topics-runtime-performance.md) (19 topics)
- [04 — AG · DX · EX · PA topics](04-topics-guidance-dx-ecosystem-product.md) (28 topics)

75 topics total; 15/area is the hard cap, none reaches it. Each topic carries: ID, category, problem, change, affected users, value, evidence, complexity (L/M/H/VH), impact (low/med/high/transformative), dependencies, risks/downsides, validation, timing, recommendation (must/should/explore/defer/reject), plus command/artifact/token/ceremony extras where relevant. `(= EA-…)` marks items carried over from the first assessment rather than newly proposed.
