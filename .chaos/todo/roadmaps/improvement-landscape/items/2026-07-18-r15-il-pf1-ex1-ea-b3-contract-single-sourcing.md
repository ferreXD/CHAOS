---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:15+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:15+02:00"
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
  id: TODO-2026-07-18-r15-il-pf1-ex1-ea-b3-contract-single-sourcing
  title: "#15 · IL-PF1→IL-EX1 (EA-B3) — Contract single-sourcing → generated adapters"
  status: open
  priority: MEDIUM
  target: h-beta
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - IL-PF1
    - IL-EX1
    - EA-B3
  relatedChanges:
  relatedRoadmapItems:
    - IL-PF1
    - IL-EX1
    - EA-B3
  relatedFindings:
  nextStep: "Single-source the command contracts and generate the adapter surfaces (EA-B3)."
  recommendedCommand: none
  closureCriteria:
    - "An edit propagates from one canonical file; parity checking is content-aware."
    - "Cross-referenced with the public-alpha EA-B3 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 15
  createdAt: "2026-07-18T13:00:15+02:00"
  lastSeenAt: "2026-07-18T13:00:15+02:00"
  closedAt: null
---

# TODO — #15 · IL-PF1→IL-EX1 (EA-B3) — Contract single-sourcing → generated adapters

## Why this exists

Rank #15. Halves instruction mass and ends twin-tree drift by single-sourcing command contracts (PF1) and generating the adapter surfaces (EX1, which PF1 is the precondition for) — portability made real. Same item as public-alpha EA-B3.

## Source Evidence

- Ranked #15 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-PF1, IL-EX1, EA-B3.

## Deduplication / cross-reference

EA-B3 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b3-contract-single-sourcing.md`).

## Next Action

Single-source the command contracts and generate the adapter surfaces (EA-B3).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- An edit propagates from one canonical file; parity checking is content-aware.
- Cross-referenced with the public-alpha EA-B3 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
