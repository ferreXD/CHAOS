---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:07+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:07+02:00"
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
  id: TODO-2026-07-18-r07-il-rt1-rt2-ea-i08-lockfile-mcp-hardening
  title: "#7 · IL-RT1+RT2 (EA-I08) — Lockfile + MCP boundary hardening"
  status: open
  priority: HIGH
  target: h-beta
  type: runtime
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/03-topics-runtime-performance.md
  sourceIds:
    - IL-RT1
    - IL-RT2
    - EA-I08
  relatedChanges:
  relatedRoadmapItems:
    - IL-RT1
    - IL-RT2
    - EA-I08
  relatedFindings:
    - EA-V3
    - IL-RT9
  nextStep: "Land EA-I08 (lockfile + MCP boundary) as part of the EA-V3 hardening pass."
  recommendedCommand: none
  closureCriteria:
    - "Concurrent-writer test suite green; MCP read-path IDs validated at the boundary."
    - "Cross-referenced with the public-alpha EA-V3 item (EA-I08)."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 7
  createdAt: "2026-07-18T13:00:07+02:00"
  lastSeenAt: "2026-07-18T13:00:07+02:00"
  closedAt: null
---

# TODO — #7 · IL-RT1+RT2 (EA-I08) — Lockfile + MCP boundary hardening

## Why this exists

Rank #7. Beta-grade robustness: an advisory per-root lockfile (RT1) plus MCP read-boundary / ID hardening (RT2) close both audited gaps — the concurrent-writer race and the unsanitized read-path IDs. Bundled as EA-I08 inside the public-alpha EA-V3 hardening pass (with the IL-RT9 abuse suite in CI).

## Source Evidence

- Ranked #7 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-RT1, IL-RT2, EA-I08.

## Deduplication / cross-reference

Bundled as EA-I08 inside public-alpha EA-V3 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-v3-runtime-hardening-pass.md`).

## Next Action

Land EA-I08 (lockfile + MCP boundary) as part of the EA-V3 hardening pass.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Concurrent-writer test suite green; MCP read-path IDs validated at the boundary.
- Cross-referenced with the public-alpha EA-V3 item (EA-I08).

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
