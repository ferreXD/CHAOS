---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T00:55:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T00:55:00+02:00"
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
  id: TODO-2026-07-17-create-five-minute-overview
  title: "Create five-minute CHAOS overview"
  status: done
  priority: HIGH
  target: public-alpha
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-002
    - F-02
  relatedChanges: []
  relatedRoadmapItems:
    - RM-002
  relatedFindings:
    - F-02
  nextStep: "Compose one newcomer page assembling the lifecycle table, command-matrix summary, mode explanation, and artifact layout."
  recommendedCommand: none
  closureCriteria:
    - "A single overview document exists."
    - "Combines lifecycle + command map + modes + artifact layout in one page."
    - "Readable without cross-referencing 3-4 other files."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T00:55:00+02:00"
  closedAt: "2026-07-18T00:55:00+02:00"
---

# TODO — Create five-minute CHAOS overview

## Why this exists

All overview ingredients exist but are spread across 3-4 files; no single page lets a first-time reader understand CHAOS in five minutes. Depends on RM-001.

## Source Evidence

- F-02 — No single 5-minute newcomer overview
- RM-002 — Create five-minute CHAOS overview (depends on RM-001)

## Next Action

Compose one newcomer page assembling the lifecycle table, command-matrix summary, mode explanation, and artifact layout.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A single overview document exists.
- Combines lifecycle + command map + modes + artifact layout in one page.
- Readable without cross-referencing 3-4 other files.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `docs/overview.md` exists and
  combines the lifecycle table, command map, mode explanation, and artifact layout on one
  newcomer-readable page. Maintainer confirmation recorded via runtime decision
  `DEC-2026-07-17-chaos-todo-repository-level-todo-up-6304` (vscode-user, Decision Center),
  command run `RUN-2026-07-17-chaos-todo-568645`.
