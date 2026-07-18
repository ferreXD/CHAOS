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
  id: TODO-2026-07-18-ea-b8-provenance-chain-waiver-lifecycle
  title: "EA-B8 — Provenance chain + waiver lifecycle"
  status: open
  priority: MEDIUM
  target: h2-beta-foundation
  type: governance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - EA-B8
  relatedChanges:
  relatedRoadmapItems:
    - EA-B8
  relatedFindings:
    - IL-TR1
    - IL-TR4
    - IL-TR2
  nextStep: "Implement the provenance chain across the lifecycle and a waiver lifecycle (create, approve, expire, audit)."
  recommendedCommand: none
  closureCriteria:
    - "Provenance chain recorded across the lifecycle."
    - "Waiver lifecycle implemented."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B8 — Provenance chain + waiver lifecycle

## Why this exists

Addendum addition (IL-TR1/TR4/TR2): an end-to-end provenance chain and a real waiver lifecycle for traceability and accountability.

## Source Evidence

- EA-B8 — addendum to Horizon 2 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Implement the provenance chain across the lifecycle and a waiver lifecycle (create, approve, expire, audit).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Provenance chain recorded across the lifecycle.
- Waiver lifecycle implemented.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
