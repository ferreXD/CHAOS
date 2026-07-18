---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:05+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:05+02:00"
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
  id: TODO-2026-07-18-r05-il-pf10-token-accounting-ci
  title: "#5 · IL-PF10 — Token accounting in CI + budgets"
  status: open
  priority: BLOCKER
  target: h-alpha
  type: ci
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/08-performance-token-analysis.md
  sourceIds:
    - IL-PF10
  relatedChanges:
  relatedRoadmapItems:
    - IL-PF10
  relatedFindings:
  nextStep: "Add token accounting to CI with per-command budgets."
  recommendedCommand: none
  closureCriteria:
    - "CI reports per-command token use against budgets; regressions fail the build."
    - "Also tracked as the public-alpha addendum item IL-PF10."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  rank: 5
  createdAt: "2026-07-18T13:00:05+02:00"
  lastSeenAt: "2026-07-18T13:00:05+02:00"
  closedAt: null
---

# TODO — #5 · IL-PF10 — Token accounting in CI + budgets

## Why this exists

Rank #5. Cheap, and it makes every efficiency claim measurable and regression-proof — a precondition for any absolute token-savings claim (§11.4 bars such claims until PF10 measures them).

## Source Evidence

- Ranked #5 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-PF10.

## Deduplication / cross-reference

Public-alpha addendum item IL-PF10 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-il-pf10-token-accounting-ci.md`).

## Next Action

Add token accounting to CI with per-command budgets.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- CI reports per-command token use against budgets; regressions fail the build.
- Also tracked as the public-alpha addendum item IL-PF10.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
