# 06 — Decision-quality analysis

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Topic inventory for this area: [02 §DQ](02-topics-workflow-decisions-traceability.md). This file carries the reasoning and the guardrails.

## 6.1 What decisions are today (Observed)

The real captured decision (`DEC-…-364d`) shows the current ceiling: a clear title, three options with consequence prose, a recommended flag, 1,900 chars of context, a human answer with substantive free-text rationale, full audit chain with latency. What it lacks: reversibility/urgency classes, per-option evidence links, structured rationale, expiry, impact preview, and any record of whether the choice worked out. The runtime supports batching (`batch-independent`) and terminal states (`expired`, `superseded`) that no policy or UI exploits.

## 6.2 The quality model: better decisions ≠ more decisions

The failure mode that kills CHAOS is not bad answers — it is **fatigue** (11–14 stops/change trains rubber-stamping, which destroys the audit trail's meaning: an unread approval is not an approval). Every improvement below is therefore judged against the brief's constraints: don't overwhelm, don't fake certainty, don't manipulate toward the agent's preference, don't interrupt constantly, don't hide consequences, don't formalize trivia.

**Ordering of investment (Recommendation):**

1. **Fewer, better-classified stops** — IL-DQ2 (materiality doctrine + stop budgets: stop only for one-way doors, boundary crossings, risk acceptance, or human-reserved topics; everything else is a *logged, non-stopping* decision event) and IL-DQ1 (reversibility/urgency/expiry classes). Two-way doors get speed; one-way doors get ceremony. This is the highest-leverage change and is mostly prompt text.
2. **One interruption instead of N** — IL-DQ3 batch queue + IL-DQ8 dependency-aware ordering (the independent frontier is answerable together; dependent chains are sequenced, which greenfield init requires).
3. **Better-grounded single decisions** — IL-DQ4 impact previews (deterministic where derivable from the repo manifest, labeled INFERENCE otherwise) and per-option `evidenceRefs` (IL-DQ1 + IL-TR9). Evidence links are also the anti-manipulation mechanism: see 6.3.
4. **Learning** — IL-DQ6 outcome tracking closed at verify/archive/retro, aggregated into calibration by category. No researched competitor does this; it is the long-term differentiator that makes the workflow *provably* improve.

## 6.3 Anti-manipulation and honesty guardrails (Recommendation)

- **No evidence, no recommendation** (IL-DQ5): the `recommended` flag requires cited evidence refs and confidence ≥ MEDIUM; otherwise the agent abstains explicitly ("options presented without recommendation — evidence insufficient") or offers a bounded evidence-gathering option. Abstention is a feature, not a failure.
- **Symmetric option presentation:** consequence text required for *every* option, not just the favored one; the DC renders options in schema order, never recommendation-first.
- **Confidence-weighted deference:** display the recommendation's confidence and its evidence coverage; a LOW-confidence recommendation renders visually as a hypothesis.
- **Adversarial second-look** (IL-DQ7) reserved for strict × one-way decisions — a bounded refutation pass attached to the decision, so the human sees the strongest case *against* the recommendation. Token-costed, so never default for trivia.
- **Calibration honesty** (IL-DQ6): publish per-category recommendation hit-rates in retro output. If apply-scope recommendations run 9/11 confirmed, deference is earned; if 3/11, the user learns to scrutinize — either outcome is a win for trust.

## 6.4 Role-aware approval and escalation — deliberately deferred

Role-aware approval, escalation rules, and multi-approver flows belong to the team horizon (first assessment §11: pull, not push). The schema should *not* preclude them: `selectedBy` + provider-identity (IL-TR2) and decision `scope` fields are the future hooks. Building routing now would be enterprise-too-early.

## 6.5 What must never become a formal decision

Implementation details below the materiality bar: naming, local refactors within approved scope, tool-choice within stated constraints, formatting, test arrangement. These are logged as inline decision events when notable (traceability without interruption) and are otherwise just work. The doctrine text should say this in exactly those terms — the current "material decision" language leaves it to model temperament (Observed variance risk).

## 6.6 Measures of success

EA-X5 (≥70% of stops rated "needed my judgment"), stop-count budgets respected (propose ≤3, apply ≤2 at standard), median answer latency under 5 minutes for two-way doors, and — once IL-DQ6 lands — outcome closure on ≥80% of material decisions in the showcase change.
