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
  id: TODO-2026-07-18-ea-b3-contract-single-sourcing
  title: "EA-B3 — Contract single-sourcing + generated Copilot surface + content-aware parity"
  status: open
  priority: HIGH
  target: h2-beta-foundation
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-B3
  relatedChanges:
  relatedRoadmapItems:
    - EA-B3
  relatedFindings:
  nextStep: "Single-source the command contracts, generate the Copilot surface from the canonical source, and make parity checking content-aware."
  recommendedCommand: none
  closureCriteria:
    - "An edit propagates from one canonical file."
    - "Parity checking compares content, not just file sets."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B3 — Contract single-sourcing + generated Copilot surface + content-aware parity

## Why this exists

Each command has ~6 reworded contract copies, so semantic drift is undetectable. One canonical source with generated surfaces and content-aware parity checking fixes it.

## Source Evidence

- EA-B3 — Horizon 2, P1, complexity L. Depends on: EA-B1 stable (14-roadmap.md §14.2).

## Next Action

Single-source the command contracts, generate the Copilot surface from the canonical source, and make parity checking content-aware.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- An edit propagates from one canonical file.
- Parity checking compares content, not just file sets.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
