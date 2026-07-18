---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:17+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:17+02:00"
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
  id: TODO-2026-07-18-r17-il-wf5-governed-break-glass
  title: "#17 · IL-WF5 — Governed break-glass path"
  status: open
  priority: LOW
  target: h-beta
  type: workflow
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/02-topics-workflow-decisions-traceability.md
  sourceIds:
    - IL-WF5
  relatedChanges:
  relatedRoadmapItems:
    - IL-WF5
  relatedFindings:
    - EA-B1
  nextStep: "Implement the governed break-glass path inside EA-B1 (urgency modifier)."
  recommendedCommand: none
  closureCriteria:
    - "Break-glass path records a trail and binds to the urgency modifier."
    - "Delivered within the public-alpha EA-B1 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 17
  createdAt: "2026-07-18T13:00:17+02:00"
  lastSeenAt: "2026-07-18T13:00:17+02:00"
  closedAt: null
---

# TODO — #17 · IL-WF5 — Governed break-glass path

## Why this exists

Rank #17. Keeps the trail alive exactly when users would otherwise bypass it — a governed break-glass path bound to the urgency modifier of the two-axis model. Folded into EA-B1 per §11.5 / §11.5a.

## Source Evidence

- Ranked #17 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-WF5.

## Deduplication / cross-reference

Folded into EA-B1 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b1-risk-execution-profile-model.md`), bound to the urgency modifier.

## Next Action

Implement the governed break-glass path inside EA-B1 (urgency modifier).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Break-glass path records a trail and binds to the urgency modifier.
- Delivered within the public-alpha EA-B1 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
