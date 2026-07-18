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
  id: TODO-2026-07-18-il-rt9-abuse-suite-skeleton-ci
  title: "IL-RT9 — Abuse-suite skeleton in CI"
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
    - IL-RT9
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - IL-RT9
  nextStep: "Seed an abuse-test suite skeleton (kill/resume, concurrent writers) wired into CI."
  recommendedCommand: none
  closureCriteria:
    - "Abuse-suite skeleton exists and runs in CI."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — IL-RT9 — Abuse-suite skeleton in CI

## Why this exists

Accepted improvement-landscape addition to the alpha horizon: seed the abuse suite (kill/resume, concurrent writers) now so EA-X4 and the hardening pass have a harness to grow into.

## Source Evidence

- IL-RT9 — addendum to Horizon 0–1, seeded (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Seed an abuse-test suite skeleton (kill/resume, concurrent writers) wired into CI.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Abuse-suite skeleton exists and runs in CI.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
