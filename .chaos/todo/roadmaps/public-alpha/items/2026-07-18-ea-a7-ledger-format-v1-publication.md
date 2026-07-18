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
  id: TODO-2026-07-18-ea-a7-ledger-format-v1-publication
  title: "EA-A7 — Ledger format v1 publication"
  status: open
  priority: MEDIUM
  target: h3-beta-adoption
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - EA-A7
  relatedChanges:
  relatedRoadmapItems:
    - EA-A7
  relatedFindings:
    - IL-EX6
  nextStep: "Publish the ledger format v1 spec, paired with the EA-A1 extraction spike."
  recommendedCommand: none
  closureCriteria:
    - "Ledger format v1 published."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-A7 — Ledger format v1 publication

## Why this exists

Addendum addition (IL-EX6, pairs EA-A1): publish the git-native decision-ledger/capsule format as a spec others can adopt.

## Source Evidence

- EA-A7 — addendum to Horizon 3, pairs EA-A1 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Publish the ledger format v1 spec, paired with the EA-A1 extraction spike.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Ledger format v1 published.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
