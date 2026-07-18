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
  id: TODO-2026-07-18-ea-a6-rules-gates-structured-data
  title: "EA-A6 — Rules/gates as structured data"
  status: open
  priority: MEDIUM
  target: h3-beta-adoption
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - EA-A6
  relatedChanges:
  relatedRoadmapItems:
    - EA-A6
  relatedFindings:
    - IL-AG4
  nextStep: "Model rules and gates as structured data and wire commands to consume them."
  recommendedCommand: none
  closureCriteria:
    - "Rules/gates expressed as structured data consumed by commands."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-A6 — Rules/gates as structured data

## Why this exists

Addendum addition (IL-AG4): rules and gates become structured data instead of prose, so commands can consume them mechanically.

## Source Evidence

- EA-A6 — addendum to Horizon 3 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Model rules and gates as structured data and wire commands to consume them.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Rules/gates expressed as structured data consumed by commands.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
