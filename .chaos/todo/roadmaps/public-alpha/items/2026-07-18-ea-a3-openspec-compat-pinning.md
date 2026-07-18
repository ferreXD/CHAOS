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
  id: TODO-2026-07-18-ea-a3-openspec-compat-pinning
  title: "EA-A3 — OpenSpec compatibility pinning + spec-engine seam"
  status: open
  priority: MEDIUM
  target: h3-beta-adoption
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-A3
  relatedChanges:
  relatedRoadmapItems:
    - EA-A3
  relatedFindings:
    - EA-R5
  nextStep: "Pin OpenSpec compatibility and introduce the spec-engine seam."
  recommendedCommand: none
  closureCriteria:
    - "OpenSpec compatibility pinned."
    - "Spec-engine seam in place."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-A3 — OpenSpec compatibility pinning + spec-engine seam

## Why this exists

Mitigates EA-R5 (OpenSpec drift risk) by pinning the supported OpenSpec compatibility and introducing a spec-engine seam.

## Source Evidence

- EA-A3 — Horizon 3, core, complexity S-M; anti EA-R5 (14-roadmap.md §14.2).

## Next Action

Pin OpenSpec compatibility and introduce the spec-engine seam.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- OpenSpec compatibility pinned.
- Spec-engine seam in place.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
