---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:03+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:03+02:00"
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
  id: TODO-2026-07-18-r03-il-wf1-ea-b1-risk-execution-profile
  title: "#3 · IL-WF1 (EA-B1) — risk × execution-profile model"
  status: open
  priority: BLOCKER
  target: h-beta
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/02-topics-workflow-decisions-traceability.md
    - .chaos/assessments/2026-07-18-two-axis-classification/README.md
  sourceIds:
    - IL-WF1
    - EA-B1
  relatedChanges:
  relatedRoadmapItems:
    - IL-WF1
    - EA-B1
  relatedFindings:
    - IL-WF3
    - IL-WF5
    - IL-WF4
  nextStep: "Implement per EA-B1 / the two-axis classification design (EA-B1a–e)."
  recommendedCommand: none
  closureCriteria:
    - "Compact strict change ≤2 sessions, ≤4 stops, ≤35k tokens (measured, EA-X3)."
    - "Cross-referenced with the public-alpha EA-B1 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 3
  createdAt: "2026-07-18T13:00:03+02:00"
  lastSeenAt: "2026-07-18T13:00:03+02:00"
  closedAt: null
---

# TODO — #3 · IL-WF1 (EA-B1) — risk × execution-profile model

## Why this exists

Rank #3. Removes the #1 abandonment driver by decoupling assurance (systemRisk) from ceremony (executionProfile). The companion two-axis classification design is its authoritative blueprint; EA-B1 decomposes into EA-B1a–e. Absorbs IL-WF3 command merges and IL-WF5 break-glass; IL-WF4 blast-radius estimator becomes EA-B1a's deterministic signal scan.

## Source Evidence

- Ranked #3 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-WF1, EA-B1.

## Deduplication / cross-reference

EA-B1 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b1-risk-execution-profile-model.md`).

## Next Action

Implement per EA-B1 / the two-axis classification design (EA-B1a–e).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Compact strict change ≤2 sessions, ≤4 stops, ≤35k tokens (measured, EA-X3).
- Cross-referenced with the public-alpha EA-B1 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
