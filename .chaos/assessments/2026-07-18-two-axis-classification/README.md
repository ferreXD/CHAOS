---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:02:02+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:02:02+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:736a4e2537c2a92306d4a0d2316f3949af028a9272fbdfba3e883c551ed3953c"
---

# CHAOS Two-Axis Classification & Adaptive Workflow Selection — 2026-07-18

Third companion assessment (with the [public-alpha assessment](../2026-07-18-public-alpha-assessment/README.md) and the [improvement landscape](../2026-07-18-improvement-landscape/README.md); same commit `6421feb`, same conventions). This is the full design for the improvement both prior assessments ranked as the highest-leverage workflow change (**IL-WF1 / EA-B1**): separating *how dangerous a change is* from *how much workflow it deserves*.

**Verdict up front: adopt the two-axis model.** `systemRisk: light|standard|strict` × `executionProfile: micro|compact|normal|full`, plus a closed 5-modifier set — risk raises the strength of *relevant* safeguards; profile determines workflow weight; neither axis sets the other's output.

**Visual summary:** [`views/dashboard.html`](views/dashboard.html) (self-contained, offline, light/dark). Markdown is the source of truth.

## At a glance

| | |
|---|---|
| Model | 2 axes + 5 closed modifiers (reversibility, blastRadius, uncertainty, sensitivity, urgency); third axis evaluated and rejected |
| Axis-2 name | **executionProfile** — a prescriptive selection; implementation complexity is its input, workflow weight its consequence |
| Classification | Deterministic signal scan → rule table → model adjudication only on ambiguity → user confirmation **only where material** (strict folds into the existing confirm; light/standard-micro/compact = zero stops) |
| Contract | One ~40-line `classification.yaml` per change (authoritative); lifecycle line + proposal prose are views; no separate report |
| Gates | 27-gate catalog v1 in 3 categories; selected by **relevance predicates**; severity raises strength, never breadth; verify records satisfied / waived / **not-applicable-with-reason** |
| Workflows | 4 profile templates ⊕ 3 risk overlays = 12 derived combinations, zero hardcoded; flagship: **strict-compact** (~40–60k tokens, 2–3 stops vs ~180–220k, 6–10 today — Hypothesis until measured) |
| Reclassification | Escalation self-applying at task boundaries with evidence reuse; **downgrades mechanically require a human decisionRef**; doctor flags violations as blockers |
| Compatibility | Additive: legacy `--light/--standard/--strict` map to systemRisk (+legacy-equivalent profile → unchanged behavior); old artifacts read via legacy-mapping, never rewritten |
| First implementation | **EA-B1a** — contract + rule table + deterministic signals, tested by the 15-scenario golden fixture suite |

## Index

| # | Section | One-liner |
|---|---|---|
| 01 | [Problem & model](01-problem-and-model.md) | Conflation failures, terminology decisions, level definitions, modifier adjudication |
| 02 | [Classification algorithm](02-classification-algorithm.md) | Ownership, algorithm, confidence, override policy, governed calibration |
| 03 | [Contract & compatibility](03-contract-and-artifacts.md) | `classification.yaml` schema, placement, consumers, additive migration |
| 04 | [Adaptive gates](04-adaptive-gates.md) | Gate schema + 27-gate catalog v1 with triggers, evidence, waivability |
| 05 | [Workflow matrix](05-workflow-matrix.md) | 4 templates × 3 overlays; all 12 combinations with costs and stops |
| 06 | [Scenarios](06-scenarios.md) | 15 golden classifications + the weaknesses they expose |
| 07 | [Reclassification & DC UX](07-reclassification-protocol.md) | Escalation/downgrade asymmetry, evidence continuity, the classification card |
| 08 | [Command impacts](08-command-impacts.md) | propose/review/apply/code-review/verify/status/doctor/retro/sync/todo |
| 09 | [Recommendation & roadmap](09-recommendation-and-roadmap.md) | Failure modes, tests, token impact, EA-B1a–e, explicit final answers |

## ID namespaces

- **EA-B1a…e** — implementation milestones refining the existing EA-B1 roadmap item ([09 §9.4](09-recommendation-and-roadmap.md)).
- **G-SYS-\* / G-CODE-\* / G-GOV-\*** — gate catalog v1 ([04](04-adaptive-gates.md)).
- **S1…S15** — scenario fixtures ([06](06-scenarios.md)).
- Workflow IDs: `<risk>-<profile>` (`strict-compact`, …).

## Evidence labels

Same conventions as the companion assessments: Observed · Reported (author) · Inferred · Hypothesis · Recommendation, with confidence tags. All baseline numbers trace to the first assessment's measurements; all savings are Hypothesis until IL-PF10 (token accounting in CI) measures them.
