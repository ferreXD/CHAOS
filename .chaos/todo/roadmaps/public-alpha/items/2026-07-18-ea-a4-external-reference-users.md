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
  id: TODO-2026-07-18-ea-a4-external-reference-users
  title: "EA-A4 — Three external reference users/repos with committed trails"
  status: open
  priority: MEDIUM
  target: h3-beta-adoption
  type: adoption
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-A4
  relatedChanges:
  relatedRoadmapItems:
    - EA-A4
  relatedFindings:
    - EA-R7
  nextStep: "Recruit and support three external reference users/repos until each has a committed CHAOS trail."
  recommendedCommand: none
  closureCriteria:
    - "3 unaffiliated repos with committed trails."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-A4 — Three external reference users/repos with committed trails

## Why this exists

Adoption proof: three unaffiliated repos with committed CHAOS trails; feeds the EA-R7 (bus-factor) mitigation.

## Source Evidence

- EA-A4 — Horizon 3, adoption (14-roadmap.md §14.2).

## Next Action

Recruit and support three external reference users/repos until each has a committed CHAOS trail.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- 3 unaffiliated repos with committed trails.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
