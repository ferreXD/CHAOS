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
  id: TODO-2026-07-18-ea-b6-greenfield-foundation-mvp
  title: "EA-B6 — Greenfield Foundation Discovery MVP"
  status: open
  priority: MEDIUM
  target: h2-beta-foundation
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - EA-B6
  relatedChanges:
  relatedRoadmapItems:
    - EA-B6
  relatedFindings:
    - IL-AG1
  nextStep: "Build the Greenfield Foundation Discovery MVP per the greenfield-foundation design in the improvement-landscape assessment."
  recommendedCommand: none
  closureCriteria:
    - "Greenfield Foundation MVP usable on a fresh project."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B6 — Greenfield Foundation Discovery MVP

## Why this exists

Addendum addition (IL-AG1): makes the greenfield story real and gives agents boundaries. Depends on IL-DQ8 and IL-RT5.

## Source Evidence

- EA-B6 — addendum to Horizon 2 (14-roadmap.md addendum; 11-final-prioritization.md §11.5; design in 09/10-greenfield-foundation docs).

## Next Action

Build the Greenfield Foundation Discovery MVP per the greenfield-foundation design in the improvement-landscape assessment.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Greenfield Foundation MVP usable on a fresh project.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
