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
  id: TODO-2026-07-18-ea-s2-first-run-integrity
  title: "EA-S2 — First-run integrity on a fresh clone"
  status: open
  priority: BLOCKER
  target: h0-stabilization
  type: implementation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-S2
  relatedChanges:
  relatedRoadmapItems:
    - EA-S2
  relatedFindings:
  nextStep: "Fix the silent first-run breakages so a fresh clone works end to end: openspec init, test fixture, MCP dist artifacts, py -3 launcher assumption, PATCH-SUMMARY drift."
  recommendedCommand: none
  closureCriteria:
    - "Fresh clone reaches doctor green."
    - "All 266/266 tests pass on a fresh clone."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-S2 — First-run integrity on a fresh clone

## Why this exists

Fresh clones break silently (openspec init, test fixture, MCP dist, py -3 launcher assumption, PATCH-SUMMARY drift), so every evaluator hits first-run failures.

## Source Evidence

- EA-S2 — Horizon 0, P0, complexity S, no dependencies; gates EA-S3, EA-V1 and EA-B4 (14-roadmap.md §14.2).

## Next Action

Fix the silent first-run breakages so a fresh clone works end to end: openspec init, test fixture, MCP dist artifacts, py -3 launcher assumption, PATCH-SUMMARY drift.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Fresh clone reaches doctor green.
- All 266/266 tests pass on a fresh clone.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
