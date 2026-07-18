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
  id: TODO-2026-07-18-il-pf9-report-budgets-summary-first
  title: "IL-PF9 — Report budgets / summary-first reports"
  status: open
  priority: MEDIUM
  target: h1b-addendum
  type: performance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - IL-PF9
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - IL-PF9
  nextStep: "Introduce report budgets and a summary-first structure for command reports."
  recommendedCommand: none
  closureCriteria:
    - "Command reports follow a summary-first structure within budgets."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — IL-PF9 — Report budgets / summary-first reports

## Why this exists

Accepted improvement-landscape addition to the alpha horizon: report budgets and summary-first structure improve readability and double as token savings.

## Source Evidence

- IL-PF9 — addendum to Horizon 0–1 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Introduce report budgets and a summary-first structure for command reports.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Command reports follow a summary-first structure within budgets.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
