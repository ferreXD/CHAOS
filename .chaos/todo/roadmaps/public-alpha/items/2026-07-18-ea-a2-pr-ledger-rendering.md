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
  id: TODO-2026-07-18-ea-a2-pr-ledger-rendering
  title: "EA-A2 — PR ledger rendering (decision-events.md → PR body)"
  status: open
  priority: LOW
  target: h3-beta-adoption
  type: implementation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-A2
  relatedChanges:
  relatedRoadmapItems:
    - EA-A2
  relatedFindings:
  nextStep: "Render decision-events.md into the PR body."
  recommendedCommand: none
  closureCriteria:
    - "decision-events.md rendered into the PR body."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-A2 — PR ledger rendering (decision-events.md → PR body)

## Why this exists

First team-facing feature; optional and small, with high demo value.

## Source Evidence

- EA-A2 — Horizon 3, optional, complexity S (14-roadmap.md §14.2).

## Next Action

Render decision-events.md into the PR body.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- decision-events.md rendered into the PR body.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
