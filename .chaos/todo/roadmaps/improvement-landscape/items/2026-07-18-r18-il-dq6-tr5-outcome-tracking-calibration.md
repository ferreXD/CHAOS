---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:18+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:18+02:00"
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
  id: TODO-2026-07-18-r18-il-dq6-tr5-outcome-tracking-calibration
  title: "#18 · IL-DQ6/IL-TR5 — Decision outcome tracking + calibration"
  status: open
  priority: LOW
  target: h-longterm
  type: governance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/06-decision-quality-analysis.md
    - .chaos/assessments/2026-07-18-improvement-landscape/07-traceability-accountability-analysis.md
  sourceIds:
    - IL-DQ6
    - IL-TR5
  relatedChanges:
  relatedRoadmapItems:
    - IL-DQ6
    - IL-TR5
  relatedFindings:
  nextStep: "Add decision outcome records and a calibration loop over historical outcomes."
  recommendedCommand: none
  closureCriteria:
    - "Decision outcomes recorded after the fact."
    - "Recommendations calibrated against the outcome history."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 18
  createdAt: "2026-07-18T13:00:18+02:00"
  lastSeenAt: "2026-07-18T13:00:18+02:00"
  closedAt: null
---

# TODO — #18 · IL-DQ6/IL-TR5 — Decision outcome tracking + calibration

## Why this exists

Rank #18. The self-improving differentiator no competitor has: record decision outcomes and calibrate future recommendations against them (one investment — DQ6 ≡ TR5). Horizon 4 / research track.

## Source Evidence

- Ranked #18 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-DQ6, IL-TR5.

## Next Action

Add decision outcome records and a calibration loop over historical outcomes.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Decision outcomes recorded after the fact.
- Recommendations calibrated against the outcome history.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
