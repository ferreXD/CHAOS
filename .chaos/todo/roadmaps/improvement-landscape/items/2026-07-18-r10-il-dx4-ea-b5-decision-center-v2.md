---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:10+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:10+02:00"
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
  id: TODO-2026-07-18-r10-il-dx4-ea-b5-decision-center-v2
  title: "#10 · IL-DX4 (EA-B5) — Decision Center v2"
  status: open
  priority: HIGH
  target: h-beta
  type: ui
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - IL-DX4
    - EA-B5
  relatedChanges:
  relatedRoadmapItems:
    - IL-DX4
    - EA-B5
  relatedFindings:
    - IL-DQ3
    - IL-DQ1
    - IL-RT4
  nextStep: "Build Decision Center v2 per EA-B5."
  recommendedCommand: none
  closureCriteria:
    - "EA-X5 stop-materiality ≥70%; history, batch queue and wait-state shipped."
    - "Cross-referenced with the public-alpha EA-B5 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 10
  createdAt: "2026-07-18T13:00:10+02:00"
  lastSeenAt: "2026-07-18T13:00:10+02:00"
  closedAt: null
---

# TODO — #10 · IL-DX4 (EA-B5) — Decision Center v2

## Why this exists

Rank #10. The product's face: decision history, the batch queue (IL-DQ3), the DQ1 reversibility view, the IL-RT4 janitor actions, one-click resume and a wait-state. Same item as public-alpha EA-B5.

## Source Evidence

- Ranked #10 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-DX4, EA-B5.

## Deduplication / cross-reference

EA-B5 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b5-decision-center-v2.md`).

## Next Action

Build Decision Center v2 per EA-B5.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- EA-X5 stop-materiality ≥70%; history, batch queue and wait-state shipped.
- Cross-referenced with the public-alpha EA-B5 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
