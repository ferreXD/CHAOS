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
  id: TODO-2026-07-18-ea-a1-runtime-extraction-spike
  title: "EA-A1 — Standalone runtime extraction spike + ledger/capsule format spec"
  status: open
  priority: MEDIUM
  target: h3-beta-adoption
  type: research
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-A1
  relatedChanges:
  relatedRoadmapItems:
    - EA-A1
  relatedFindings:
    - EA-D3
  nextStep: "Run the extraction spike and draft the ledger/capsule format spec."
  recommendedCommand: none
  closureCriteria:
    - "Extraction spike executed."
    - "Ledger/capsule format spec drafted."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-A1 — Standalone runtime extraction spike + ledger/capsule format spec

## Why this exists

Direction EA-D3 hedge: explore extracting runtime + MCP + panel + capsules as framework-agnostic infrastructure. Becomes core if EA-V2 is weak or the absorption tripwire fires.

## Source Evidence

- EA-A1 — Horizon 3, explore → core if EA-V2 weak or absorption tripwire fires (14-roadmap.md §14.2).

## Next Action

Run the extraction spike and draft the ledger/capsule format spec.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Extraction spike executed.
- Ledger/capsule format spec drafted.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
