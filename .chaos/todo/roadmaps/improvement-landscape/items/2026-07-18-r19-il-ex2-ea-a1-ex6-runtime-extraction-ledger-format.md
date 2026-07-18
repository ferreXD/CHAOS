---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:19+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:19+02:00"
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
  id: TODO-2026-07-18-r19-il-ex2-ea-a1-ex6-runtime-extraction-ledger-format
  title: "#19 · IL-EX2 (EA-A1) + IL-EX6 — Standalone runtime extraction + published ledger format"
  status: open
  priority: LOW
  target: h-longterm
  type: research
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - IL-EX2
    - IL-EX6
    - EA-A1
    - EA-A7
  relatedChanges:
  relatedRoadmapItems:
    - IL-EX2
    - IL-EX6
    - EA-A1
    - EA-A7
  relatedFindings:
    - EA-D3
  nextStep: "Run the extraction spike (EA-A1) and publish ledger format v1 (EA-A7)."
  recommendedCommand: none
  closureCriteria:
    - "Extraction spike executed; ledger/capsule format v1 published as a spec."
    - "Cross-referenced with the public-alpha EA-A1 and EA-A7 items."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 19
  createdAt: "2026-07-18T13:00:19+02:00"
  lastSeenAt: "2026-07-18T13:00:19+02:00"
  closedAt: null
---

# TODO — #19 · IL-EX2 (EA-A1) + IL-EX6 — Standalone runtime extraction + published ledger format

## Why this exists

Rank #19. The absorption hedge and the format moat: extract the decision runtime as framework-agnostic infrastructure (EX2 = EA-A1) and publish "CHAOS ledger format v1" as an open standard (EX6 = EA-A7). Same items as public-alpha EA-A1 + EA-A7.

## Source Evidence

- Ranked #19 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-EX2, IL-EX6, EA-A1, EA-A7.

## Deduplication / cross-reference

EA-A1 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-a1-runtime-extraction-spike.md`) + EA-A7 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-a7-ledger-format-v1-publication.md`).

## Next Action

Run the extraction spike (EA-A1) and publish ledger format v1 (EA-A7).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Extraction spike executed; ledger/capsule format v1 published as a spec.
- Cross-referenced with the public-alpha EA-A1 and EA-A7 items.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
