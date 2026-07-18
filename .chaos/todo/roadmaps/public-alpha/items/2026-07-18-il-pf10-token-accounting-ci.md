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
  id: TODO-2026-07-18-il-pf10-token-accounting-ci
  title: "IL-PF10 — Token accounting in CI + per-command budgets"
  status: open
  priority: MEDIUM
  target: h1b-addendum
  type: ci
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - IL-PF10
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - IL-PF10
  nextStep: "Add token accounting to CI with per-command budgets so token regressions are visible."
  recommendedCommand: none
  closureCriteria:
    - "CI reports per-command token use against budgets."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — IL-PF10 — Token accounting in CI + per-command budgets

## Why this exists

Accepted improvement-landscape addition to the alpha horizon: make token cost visible and regressions detectable before the Horizon 2 token program lands.

## Source Evidence

- IL-PF10 — addendum to Horizon 0–1 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Add token accounting to CI with per-command budgets so token regressions are visible.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- CI reports per-command token use against budgets.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
