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
  id: TODO-2026-07-18-research-track-bundle
  title: "Research track — compact resume, archaeology snapshots, model routing, chaos:run, cross-worktree locks"
  status: open
  priority: LOW
  target: research-track
  type: research
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-RT
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - EA-I15
    - EA-I16
    - EA-I17
  nextStep: "Keep the track small and parallel; graduate each topic to a horizon item or drop it with a note."
  recommendedCommand: none
  closureCriteria:
    - "Each topic graduated to a horizon item or dropped with a note."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — Research track — compact resume, archaeology snapshots, model routing, chaos:run, cross-worktree locks

## Why this exists

Parallel small research track from the roadmap: EA-I15 compact resume protocol (~10k tokens saved per interruption), EA-I16 archaeology snapshots (content-hashed cache, --since deltas), EA-I17 model routing (small models for todo scan/report formatting), the chaos:run pipeline driver, and cross-worktree lock semantics.

## Source Evidence

- Research track — parallel, small (14-roadmap.md §14.2; EA-I15/16/17 in 13-improvement-inventory.md).

## Next Action

Keep the track small and parallel; graduate each topic to a horizon item or drop it with a note.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Each topic graduated to a horizon item or dropped with a note.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
