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
  id: TODO-2026-07-17-add-contributing-md
  title: "Add CONTRIBUTING.md"
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
    - RM-007
    - F-16
  relatedChanges: []
  relatedRoadmapItems:
    - RM-007
  relatedFindings:
    - F-16
  nextStep: "Add a minimal CONTRIBUTING.md covering how to propose changes, run CHAOS commands, and PR expectations."
  recommendedCommand: none
  closureCriteria:
    - "CONTRIBUTING.md exists at repo root."
    - "Covers the contribution workflow and CHAOS command expectations."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T00:55:00+02:00"
  closedAt: "2026-07-18T00:55:00+02:00"
---

# TODO — Add CONTRIBUTING.md

## Why this exists

No CONTRIBUTING.md exists. RM-007 was split by target: the minimal CONTRIBUTING.md is the public-alpha slice; CODE_OF_CONDUCT.md and issue templates are the v1 slice.

## Source Evidence

- F-16 — No CONTRIBUTING.md, CODE_OF_CONDUCT.md, or issue templates
- RM-007 (minimal scope) — Add CONTRIBUTING.md

## Next Action

Add a minimal CONTRIBUTING.md covering how to propose changes, run CHAOS commands, and PR expectations.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- CONTRIBUTING.md exists at repo root.
- Covers the contribution workflow and CHAOS command expectations.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `CONTRIBUTING.md` exists at repo
  root and covers the contribution workflow (normal PR flow) plus CHAOS command expectations.
  Maintainer confirmation recorded via runtime decision
  `DEC-2026-07-17-chaos-todo-repository-level-todo-up-6304` (vscode-user, Decision Center),
  command run `RUN-2026-07-17-chaos-todo-568645`.
