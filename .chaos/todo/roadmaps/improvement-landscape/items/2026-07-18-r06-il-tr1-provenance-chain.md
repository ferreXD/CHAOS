---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:06+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:06+02:00"
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
  id: TODO-2026-07-18-r06-il-tr1-provenance-chain
  title: "#6 · IL-TR1 — Decision→files→tests provenance chain"
  status: open
  priority: HIGH
  target: h-beta
  type: traceability
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/07-traceability-accountability-analysis.md
  sourceIds:
    - IL-TR1
  relatedChanges:
  relatedRoadmapItems:
    - IL-TR1
  relatedFindings:
    - EA-B8
    - IL-TR4
    - IL-TR2
  nextStep: "Implement the provenance chain (EA-B8 base + waiver lifecycle), then the checked reconstruct-from-disk guarantee later."
  recommendedCommand: none
  closureCriteria:
    - "Decision→files→tests links recorded deterministically across the lifecycle."
    - "Cross-referenced with the public-alpha EA-B8 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 6
  createdAt: "2026-07-18T13:00:06+02:00"
  lastSeenAt: "2026-07-18T13:00:06+02:00"
  closedAt: null
---

# TODO — #6 · IL-TR1 — Decision→files→tests provenance chain

## Why this exists

Rank #6. Turns the audit trail queryable by linking each decision to the files and tests it touched; capture is deterministic (no added human ceremony) and it is the compliance story. The base chain plus waiver lifecycle (TR4/TR2) lands in beta as EA-B8; the "reconstruct everything from disk as a checked guarantee" completion (§7.4) is a longer-term goal.

## Source Evidence

- Ranked #6 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-TR1.

## Deduplication / cross-reference

Base chain lands as public-alpha EA-B8 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b8-provenance-chain-waiver-lifecycle.md`).

## Next Action

Implement the provenance chain (EA-B8 base + waiver lifecycle), then the checked reconstruct-from-disk guarantee later.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Decision→files→tests links recorded deterministically across the lifecycle.
- Cross-referenced with the public-alpha EA-B8 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
