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
  id: TODO-2026-07-17-create-command-support-matrix
  title: "Create stable command support matrix"
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
    - RM-009
    - F-06
  relatedChanges: []
  relatedRoadmapItems:
    - RM-009
  relatedFindings:
    - F-06
  nextStep: "Extend .chaos/commands/index.md with explicit per-command mode / confidence / Copilot-status / next-command rows."
  recommendedCommand: none
  closureCriteria:
    - "Command matrix covers mode + confidence + Copilot-status + next-command per command."
    - "No implemented command is missing a dimension."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T10:44:00+02:00"
  closedAt: "2026-07-18T10:44:00+02:00"
---

# TODO — Create stable command support matrix

## Why this exists

The command index documents purpose/inputs/outputs but is missing mode behaviour, confidence behaviour, per-command Copilot status, and per-command next-command on several rows.

## Source Evidence

- F-06 — Command stability matrix incomplete on 3 of 10 dimensions
- RM-009 — Create stable command support matrix

## Next Action

Extend .chaos/commands/index.md with explicit per-command mode / confidence / Copilot-status / next-command rows.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Command matrix covers mode + confidence + Copilot-status + next-command per command.
- No implemented command is missing a dimension.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `docs/command-matrix.md` exists and
  covers mode + confidence + Copilot-status + next-command for all 15 implemented CHAOS commands
  (no dimension missing); linked from `README.md` and `docs/overview.md`. Companion
  `docs/command-flags.md` adds the full per-command flag surface. Maintainer confirmation recorded
  via runtime decision `DEC-2026-07-18-chaos-todo-close-repository-level-t-7599` (vscode-user,
  Decision Center; option `close-4-hold-1`), command run `RUN-2026-07-18-chaos-todo-3ac531`.

