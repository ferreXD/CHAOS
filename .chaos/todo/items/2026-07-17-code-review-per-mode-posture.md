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
  id: TODO-2026-07-17-code-review-per-mode-posture
  title: "Make chaos:code-review per-mode posture explicit"
  status: open
  priority: LOW
  target: vNext
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-014
    - F-14
  relatedChanges: []
  relatedRoadmapItems:
    - RM-014
  relatedFindings:
    - F-14
  nextStep: "State the optional (light) / recommended (standard) / required (strict) posture in the command’s own doc."
  recommendedCommand: none
  closureCriteria:
    - "chaos:code-review doc states the per-mode posture explicitly."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: null
---

# TODO — Make chaos:code-review per-mode posture explicit

## Why this exists

The optional/recommended/required posture per mode must be inferred from general mode logic rather than stated in the command’s own doc.

## Source Evidence

- F-14 — chaos:code-review mode posture is implicit
- RM-014 — Finalize chaos:code-review lifecycle integration

## Next Action

State the optional (light) / recommended (standard) / required (strict) posture in the command’s own doc.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- chaos:code-review doc states the per-mode posture explicitly.

