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
  id: TODO-2026-07-18-ea-b4-claude-code-plugin-packaging
  title: "EA-B4 — Claude Code plugin packaging"
  status: open
  priority: HIGH
  target: h2-beta-foundation
  type: packaging
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-B4
  relatedChanges:
  relatedRoadmapItems:
    - EA-B4
  relatedFindings:
  nextStep: "Package CHAOS as a Claude Code plugin with a one-command install."
  recommendedCommand: none
  closureCriteria:
    - "One-command install works."
    - "EA-X1 time-to-first-value ≤15 min."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B4 — Claude Code plugin packaging

## Why this exists

Manual builds gate adoption; one-command install is the EA-X1 time-to-first-value gate.

## Source Evidence

- EA-B4 — Horizon 2, P1, complexity M. Depends on: EA-S2 (14-roadmap.md §14.2).

## Next Action

Package CHAOS as a Claude Code plugin with a one-command install.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- One-command install works.
- EA-X1 time-to-first-value ≤15 min.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
