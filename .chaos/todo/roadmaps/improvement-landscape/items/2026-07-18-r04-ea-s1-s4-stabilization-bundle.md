---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:04+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:04+02:00"
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
  id: TODO-2026-07-18-r04-ea-s1-s4-stabilization-bundle
  title: "#4 · EA-S1–S4 — Stabilization bundle"
  status: open
  priority: BLOCKER
  target: h-alpha
  type: sanitization
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/03-topics-runtime-performance.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - EA-S1
    - EA-S2
    - EA-S3
    - EA-S4
  relatedChanges:
  relatedRoadmapItems:
    - EA-S1
    - EA-S2
    - EA-S3
    - EA-S4
  relatedFindings:
    - IL-PA1
    - IL-PA2
    - IL-RT7
    - IL-DX2
  nextStep: "Deliver EA-S1–S4 (see the four public-alpha roadmap items)."
  recommendedCommand: none
  closureCriteria:
    - "Fresh clone → doctor green → tests pass; CI red on any breakage; SECURITY.md published."
    - "Cross-referenced with the public-alpha EA-S1–S4 items."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  rank: 4
  createdAt: "2026-07-18T13:00:04+02:00"
  lastSeenAt: "2026-07-18T13:00:04+02:00"
  closedAt: null
---

# TODO — #4 · EA-S1–S4 — Stabilization bundle

## Why this exists

Rank #4. Table-stakes bundle — sanitize (IL-PA1), first-run integrity (IL-DX2), real CI (IL-PA2, adding IL-PF10 token checks + IL-RT9 abuse suite), a security policy, and hook hardening (IL-RT7 ≡ EA-I03+EA-I10). Days of work; removes an entire silent-failure class. Materialized as four separate items in the public-alpha roadmap (EA-S1–S4).

## Source Evidence

- Ranked #4 of 20 in the improvement-landscape final prioritization (§11.2). IDs: EA-S1, EA-S2, EA-S3, EA-S4.

## Deduplication / cross-reference

EA-S1–S4 in the public-alpha roadmap view (four items, `.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-s1..s4-*.md`).

## Next Action

Deliver EA-S1–S4 (see the four public-alpha roadmap items).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Fresh clone → doctor green → tests pass; CI red on any breakage; SECURITY.md published.
- Cross-referenced with the public-alpha EA-S1–S4 items.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
