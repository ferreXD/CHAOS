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
  id: TODO-2026-07-17-add-issue-templates
  title: "Add issue templates"
  status: done
  priority: HIGH
  target: v1
  type: governance
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
  nextStep: "Add .github/ISSUE_TEMPLATE/ with at least a bug template and a change-proposal template."
  recommendedCommand: none
  closureCriteria:
    - ".github/ISSUE_TEMPLATE/ exists."
    - "At least bug + change-proposal templates are present."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T10:44:00+02:00"
  closedAt: "2026-07-18T10:44:00+02:00"
---

# TODO — Add issue templates

## Why this exists

The full contribution set (v1 slice of RM-007) requires issue templates; none exist under .github/ISSUE_TEMPLATE/.

## Source Evidence

- F-16 — No issue templates
- RM-007 (full scope) — Add CODE_OF_CONDUCT.md and issue templates

## Next Action

Add .github/ISSUE_TEMPLATE/ with at least a bug template and a change-proposal template.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- .github/ISSUE_TEMPLATE/ exists.
- At least bug + change-proposal templates are present.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `.github/ISSUE_TEMPLATE/` exists
  with `bug_report.yml` and `change_proposal.yml` (valid GitHub issue-form YAML); `CONTRIBUTING.md`
  references both templates. Maintainer confirmation via runtime decision
  `DEC-2026-07-18-chaos-todo-close-repository-level-t-7599` (vscode-user, Decision Center; option
  `close-4-hold-1`), command run `RUN-2026-07-18-chaos-todo-3ac531`.

