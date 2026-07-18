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
  id: TODO-2026-07-17-build-demo-worked-example
  title: "Build sanitized demo / worked end-to-end example"
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
    - RM-004
    - F-04
  relatedChanges: []
  relatedRoadmapItems:
    - RM-004
  relatedFindings:
    - F-04
  nextStep: "Build a small fictional-domain worked example (archaeology → propose → review → apply → verify → archive → sync) using no private-project data."
  recommendedCommand: none
  closureCriteria:
    - "A sanitized end-to-end worked example exists."
    - "Uses a fictional/toy domain, not private-project data."
    - "Covers the full lifecycle chain."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T00:55:00+02:00"
  closedAt: "2026-07-18T00:55:00+02:00"
---

# TODO — Build sanitized demo / worked end-to-end example

## Why this exists

All existing change/archaeology/archive content reflects private-project history; chaos:help demo is unsupported. Newcomers have no teaching example.

## Source Evidence

- F-04 — No demo repository or worked example
- RM-004 — Create demo repository or worked end-to-end example (sanitized, non-project-specific)

## Next Action

Build a small fictional-domain worked example (archaeology → propose → review → apply → verify → archive → sync) using no private-project data.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A sanitized end-to-end worked example exists.
- Uses a fictional/toy domain, not private-project data.
- Covers the full lifecycle chain.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: a sanitized end-to-end worked
  example exists at `docs/demo/README.md` over the runnable `examples/task-tracker/dotnet/`
  project (fictional task-tracker domain, no private-project data), covering
  propose → review → apply → verify → archive → sync. Maintainer confirmation recorded via runtime
  decision `DEC-2026-07-17-chaos-todo-repository-level-todo-up-6304` (vscode-user, Decision
  Center), command run `RUN-2026-07-17-chaos-todo-568645`.
