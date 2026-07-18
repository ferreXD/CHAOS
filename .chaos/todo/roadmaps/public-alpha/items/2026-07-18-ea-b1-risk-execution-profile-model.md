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
  id: TODO-2026-07-18-ea-b1-risk-execution-profile-model
  title: "EA-B1 — Risk × execution-profile model + command merges"
  status: open
  priority: BLOCKER
  target: h2-beta-foundation
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-B1
  relatedChanges:
  relatedRoadmapItems:
    - EA-B1
  relatedFindings:
    - EA-I25
    - IL-WF5
  nextStep: "Design and implement the risk × execution-profile model with a consolidated single report and batched decision surfacing; include the EA-I25 command merges and IL-WF5 break-glass."
  recommendedCommand: none
  closureCriteria:
    - "Compact strict change ≤2 sessions, ≤4 stops, ≤35k instruction tokens (measured via EA-X3)."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B1 — Risk × execution-profile model + command merges

## Why this exists

Assurance and ceremony are coupled: strict risk currently forces maximum ceremony. Splitting risk × execution profile (e.g. strict-compact) plus the EA-I25 command merges (status→doctor, change-scoped sync→archive, verify + code-review at compact) removes the small-change tax; IL-WF5 break-glass folds in per the addendum.

## Source Evidence

- EA-B1 — Horizon 2, P0, complexity M-L. Depends on: EA-V2 evidence (14-roadmap.md §14.2).

## Next Action

Design and implement the risk × execution-profile model with a consolidated single report and batched decision surfacing; include the EA-I25 command merges and IL-WF5 break-glass.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Compact strict change ≤2 sessions, ≤4 stops, ≤35k instruction tokens (measured via EA-X3).

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
