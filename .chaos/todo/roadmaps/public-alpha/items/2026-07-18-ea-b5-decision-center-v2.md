---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T12:00:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T12:00:00+02:00"
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
  id: TODO-2026-07-18-ea-b5-decision-center-v2
  title: "EA-B5 — Decision Center v2 (history, batch queue, rendering, one-click resume, wait-state)"
  status: open
  priority: MEDIUM
  target: h2-beta-foundation
  type: ui
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-B5
  relatedChanges:
  relatedRoadmapItems:
    - EA-B5
  relatedFindings:
  nextStep: "Build Decision Center v2: decision history, batch queue, richer rendering, one-click resume and wait-state."
  recommendedCommand: none
  closureCriteria:
    - "EA-X5 stop-materiality ≥70%."
    - "History tab used in the showcase video."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B5 — Decision Center v2 (history, batch queue, rendering, one-click resume, wait-state)

## Why this exists

The panel lacks the product own memory; the Decision Center is the ledger face and the product face.

## Source Evidence

- EA-B5 — Horizon 2, P2, complexity M, no dependencies (14-roadmap.md §14.2).

## Next Action

Build Decision Center v2: decision history, batch queue, richer rendering, one-click resume and wait-state.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- EA-X5 stop-materiality ≥70%.
- History tab used in the showcase video.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
