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
  id: TODO-2026-07-17-add-copilot-stability-label
  title: "Add explicit Copilot adapter stability label"
  status: done
  priority: MEDIUM
  target: v1
  type: adapter
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-010
    - F-09
  relatedChanges: []
  relatedRoadmapItems:
    - RM-010
  relatedFindings:
    - F-09
  nextStep: "Label the Copilot surface explicitly (e.g. \"experimental adapter\") in .github/copilot-instructions.md and the command matrix; do not overclaim support."
  recommendedCommand: none
  closureCriteria:
    - "The Copilot adapter carries an explicit stability/maturity label."
    - "Support is not overclaimed anywhere."
  knowledgeType: FACT
  confidence: MEDIUM
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T10:44:00+02:00"
  closedAt: "2026-07-18T10:44:00+02:00"
---

# TODO — Add explicit Copilot adapter stability label

## Why this exists

The Copilot surface is a hand-maintained digest of the Claude reference library with no disclosed stability level; operators are not told it is experimental.

## Source Evidence

- F-09 — No stability/maturity label on the Copilot adapter
- RM-010 — harden Copilot adapter (label stability)

## Next Action

Label the Copilot surface explicitly (e.g. "experimental adapter") in .github/copilot-instructions.md and the command matrix; do not overclaim support.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- The Copilot adapter carries an explicit stability/maturity label.
- Support is not overclaimed anywhere.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `.github/copilot-instructions.md`
  carries an explicit "experimental adapter" stability label (top-of-file note + the "Copilot
  adapter maturity" section), the "reach parity" overclaim was removed, and `docs/command-matrix.md`
  states the same status — support is not overclaimed anywhere. Maintainer confirmation via runtime
  decision `DEC-2026-07-18-chaos-todo-close-repository-level-t-7599` (vscode-user, Decision Center;
  option `close-4-hold-1`), command run `RUN-2026-07-18-chaos-todo-3ac531`.

