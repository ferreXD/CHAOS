---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:09+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:09+02:00"
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
  id: TODO-2026-07-18-r09-il-pf3-pf4-evidence-index-validators
  title: "#9 · IL-PF3+PF4 — Evidence index + deterministic validators"
  status: open
  priority: HIGH
  target: h-beta
  type: performance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/08-performance-token-analysis.md
  sourceIds:
    - IL-PF3
    - IL-PF4
  relatedChanges:
  relatedRoadmapItems:
    - IL-PF3
    - IL-PF4
  relatedFindings:
    - EA-R8
  nextStep: "Build the evidence index and the deterministic validators; run validators in CI."
  recommendedCommand: none
  closureCriteria:
    - "Evidence index removes repeat re-reads within a lifecycle."
    - "Deterministic validators replace re-reasoned checks and run in CI."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 9
  createdAt: "2026-07-18T13:00:09+02:00"
  lastSeenAt: "2026-07-18T13:00:09+02:00"
  closedAt: null
---

# TODO — #9 · IL-PF3+PF4 — Evidence index + deterministic validators

## Why this exists

Rank #9. Kills the 3× re-read pattern with an evidence index (PF3) and makes checks mechanically trustworthy rather than re-reasoned with deterministic validators (PF4) — directly anti EA-R8 (validation-theater risk). Part of the beta token program alongside PF2.

## Source Evidence

- Ranked #9 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-PF3, IL-PF4.

## Next Action

Build the evidence index and the deterministic validators; run validators in CI.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Evidence index removes repeat re-reads within a lifecycle.
- Deterministic validators replace re-reasoned checks and run in CI.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
