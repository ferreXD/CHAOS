---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:02+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:02+02:00"
  lastAuditedBy: vscode-user
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: git
    confidence: LOW
  metadata:
    identitySource: provider
    timestampSource: local-system
    confidence: LOW

todo:
  id: TODO-2026-07-18-r02-il-dq2-materiality-doctrine
  title: "#2 · IL-DQ2 — Materiality doctrine + stop budgets"
  status: open
  priority: BLOCKER
  target: h-alpha
  type: governance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/06-decision-quality-analysis.md
  sourceIds:
    - IL-DQ2
  relatedChanges:
  relatedRoadmapItems:
    - IL-DQ2
  relatedFindings:
  nextStep: "Write the materiality doctrine and per-change stop budgets into the command prompts."
  recommendedCommand: none
  closureCriteria:
    - "Materiality doctrine + per-change stop budgets present in command prompts."
    - "Also tracked as the public-alpha addendum item IL-DQ2."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  rank: 2
  createdAt: "2026-07-18T13:00:02+02:00"
  lastSeenAt: "2026-07-18T13:00:02+02:00"
  closedAt: null
---

# TODO — #2 · IL-DQ2 — Materiality doctrine + stop budgets

## Why this exists

Rank #2. A transformative decision-fatigue fix delivered as prompt text only, so it ships immediately with no runtime change. Defines when a stop is material and budgets stops per change; feeds the EA-X5 stop-materiality experiment.

## Source Evidence

- Ranked #2 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-DQ2.

## Deduplication / cross-reference

Public-alpha addendum item IL-DQ2 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-il-dq2-materiality-doctrine-stop-budgets.md`).

## Next Action

Write the materiality doctrine and per-change stop budgets into the command prompts.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Materiality doctrine + per-change stop budgets present in command prompts.
- Also tracked as the public-alpha addendum item IL-DQ2.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
