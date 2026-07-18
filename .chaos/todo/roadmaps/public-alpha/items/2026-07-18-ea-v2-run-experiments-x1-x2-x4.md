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
  id: TODO-2026-07-18-ea-v2-run-experiments-x1-x2-x4
  title: "EA-V2 — Run validation experiments EA-X1 / EA-X2 / EA-X4"
  status: open
  priority: BLOCKER
  target: h1-validation
  type: validation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-public-alpha-assessment/15-validation-experiments.md
  sourceIds:
    - EA-V2
  relatedChanges:
  relatedRoadmapItems:
    - EA-V2
  relatedFindings:
    - EA-X1
    - EA-X2
    - EA-X4
  nextStep: "Run experiments EA-X1, EA-X2 and EA-X4 against the thresholds in 15-validation-experiments.md and publish honest results."
  recommendedCommand: none
  closureCriteria:
    - "EA-X1, EA-X2, EA-X4 executed against their published thresholds."
    - "Results — including failures — committed to the repo."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-V2 — Run validation experiments EA-X1 / EA-X2 / EA-X4

## Why this exists

The value, usability, and trust claims are untested externally. EA-X1 (cold-start usability), EA-X2 (with/without counterfactual value) and EA-X4 (resume reliability under abuse) test the three load-bearing claims and gate beta investment.

## Source Evidence

- EA-V2 — Horizon 1, P0, complexity M. Depends on: EA-V1 (14-roadmap.md §14.2; thresholds in 15-validation-experiments.md).

## Next Action

Run experiments EA-X1, EA-X2 and EA-X4 against the thresholds in 15-validation-experiments.md and publish honest results.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- EA-X1, EA-X2, EA-X4 executed against their published thresholds.
- Results — including failures — committed to the repo.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
