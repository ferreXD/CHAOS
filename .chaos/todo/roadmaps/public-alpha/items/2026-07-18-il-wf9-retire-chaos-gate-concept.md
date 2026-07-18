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
  id: TODO-2026-07-18-il-wf9-retire-chaos-gate-concept
  title: "IL-WF9 — Retire the chaos:gate concept"
  status: open
  priority: MEDIUM
  target: h1b-addendum
  type: cleanup
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - IL-WF9
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - IL-WF9
  nextStep: "Retire chaos:gate as a standalone concept across prompts, docs and indexes."
  recommendedCommand: none
  closureCriteria:
    - "chaos:gate is no longer presented as a standalone concept."
    - "Main-backlog item decide-chaos-gate-fate resolved accordingly."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — IL-WF9 — Retire the chaos:gate concept

## Why this exists

Accepted improvement-landscape addition to the alpha horizon; the current-feature disposition already lists chaos:gate as a standalone concept to deprecate. Overlaps the open main-backlog item TODO-2026-07-17-decide-chaos-gate-fate and resolves it toward retirement.

## Source Evidence

- IL-WF9 — addendum to Horizon 0–1 (14-roadmap.md addendum + §14.5 disposition; 11-final-prioritization.md §11.5).

## Next Action

Retire chaos:gate as a standalone concept across prompts, docs and indexes.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- chaos:gate is no longer presented as a standalone concept.
- Main-backlog item decide-chaos-gate-fate resolved accordingly.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
