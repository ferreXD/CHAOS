---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-17T20:30:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-17T20:30:00+02:00"
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
  id: TODO-2026-07-17-retire-legacy-scattered-folders
  title: "Retire legacy scattered report folders"
  status: open
  priority: LOW
  target: vNext
  type: cleanup
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-015
  relatedChanges: []
  relatedRoadmapItems:
    - RM-015
  relatedFindings:
    []
  nextStep: "Plan retirement of the legacy read-compat folders (migrate or remove) and update paths.legacy in .chaos/config.yaml accordingly."
  recommendedCommand: "chaos:sync"
  closureCriteria:
    - "Legacy read-compat folders retired or a dated retirement schedule is recorded."
    - "config.yaml paths.legacy updated to match."
  knowledgeType: INFERENCE
  confidence: MEDIUM
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: null
---

# TODO — Retire legacy scattered report folders

## Why this exists

Legacy read-compat folders (.chaos/reviews/, .chaos/apply-reports/, .chaos/retros/) are retained for compatibility; their retirement is scheduled but not planned in detail.

## Source Evidence

- RM-015 — Schedule legacy scattered-folder retirement

## Next Action

Plan retirement of the legacy read-compat folders (migrate or remove) and update paths.legacy in .chaos/config.yaml accordingly.

## Recommended Command

`chaos:sync`

## Closure Criteria

- Legacy read-compat folders retired or a dated retirement schedule is recorded.
- config.yaml paths.legacy updated to match.

