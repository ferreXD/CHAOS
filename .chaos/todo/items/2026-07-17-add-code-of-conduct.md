---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T10:44:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T10:44:00+02:00"
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
  id: TODO-2026-07-17-add-code-of-conduct
  title: "Add CODE_OF_CONDUCT.md"
  status: done
  priority: HIGH
  target: v1
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
  nextStep: "Add CODE_OF_CONDUCT.md (e.g. Contributor Covenant) at the repo root."
  recommendedCommand: none
  closureCriteria:
    - "CODE_OF_CONDUCT.md exists at repo root."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T10:44:00+02:00"
  closedAt: "2026-07-18T10:44:00+02:00"
---

# TODO — Add CODE_OF_CONDUCT.md

## Why this exists

The full contribution set (v1 slice of RM-007) requires a code of conduct; none exists.

## Source Evidence

- F-16 — No CODE_OF_CONDUCT.md
- RM-007 (full scope) — Add CODE_OF_CONDUCT.md and issue templates

## Next Action

Add CODE_OF_CONDUCT.md (e.g. Contributor Covenant) at the repo root.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- CODE_OF_CONDUCT.md exists at repo root.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `CODE_OF_CONDUCT.md` exists at the
  repo root (Contributor Covenant v2.1), linked from `CONTRIBUTING.md`. Maintainer confirmation via
  runtime decision `DEC-2026-07-18-chaos-todo-close-repository-level-t-7599` (vscode-user, Decision
  Center; option `close-4-hold-1`), command run `RUN-2026-07-18-chaos-todo-3ac531`.

