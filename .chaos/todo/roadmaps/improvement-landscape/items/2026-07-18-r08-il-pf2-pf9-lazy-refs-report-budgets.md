---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:08+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:08+02:00"
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
  id: TODO-2026-07-18-r08-il-pf2-pf9-lazy-refs-report-budgets
  title: "#8 · IL-PF2+PF9 — Lazy references + report budgets"
  status: open
  priority: HIGH
  target: h-beta
  type: performance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/08-performance-token-analysis.md
  sourceIds:
    - IL-PF2
    - IL-PF9
  relatedChanges:
  relatedRoadmapItems:
    - IL-PF2
    - IL-PF9
  relatedFindings:
    - IL-PF9
  nextStep: "Ship report budgets/summary-first (PF9, alpha) then lazy references (PF2, beta token program)."
  recommendedCommand: none
  closureCriteria:
    - "Lazy references in place; reports are summary-first within budgets."
    - "PF9 half cross-referenced with the public-alpha addendum item IL-PF9."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 8
  createdAt: "2026-07-18T13:00:08+02:00"
  lastSeenAt: "2026-07-18T13:00:08+02:00"
  closedAt: null
---

# TODO — #8 · IL-PF2+PF9 — Lazy references + report budgets

## Why this exists

Rank #8. 30–60% per-run token reduction for low effort: lazy skill/reference loading (PF2, part of the beta token program) plus report budgets / summary-first reports (PF9), where readability doubles as savings. PF9's report-budget half is an alpha quick win; PF2 belongs to the beta token program.

## Source Evidence

- Ranked #8 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-PF2, IL-PF9.

## Deduplication / cross-reference

PF9's report-budget half is the public-alpha addendum item IL-PF9 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-il-pf9-report-budgets-summary-first.md`).

## Next Action

Ship report budgets/summary-first (PF9, alpha) then lazy references (PF2, beta token program).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Lazy references in place; reports are summary-first within budgets.
- PF9 half cross-referenced with the public-alpha addendum item IL-PF9.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
