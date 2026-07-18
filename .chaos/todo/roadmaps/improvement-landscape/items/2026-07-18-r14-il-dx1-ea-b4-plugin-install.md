---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:14+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:14+02:00"
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
  id: TODO-2026-07-18-r14-il-dx1-ea-b4-plugin-install
  title: "#14 · IL-DX1 (EA-B4) — One-command plugin install"
  status: open
  priority: MEDIUM
  target: h-beta
  type: packaging
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - IL-DX1
    - EA-B4
  relatedChanges:
  relatedRoadmapItems:
    - IL-DX1
    - EA-B4
  relatedFindings:
  nextStep: "Package CHAOS as a one-command Claude Code plugin (EA-B4)."
  recommendedCommand: none
  closureCriteria:
    - "One-command install works; EA-X1 time-to-first-value ≤15 min."
    - "Cross-referenced with the public-alpha EA-B4 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 14
  createdAt: "2026-07-18T13:00:14+02:00"
  lastSeenAt: "2026-07-18T13:00:14+02:00"
  closedAt: null
---

# TODO — #14 · IL-DX1 (EA-B4) — One-command plugin install

## Why this exists

Rank #14. Time-to-first-value ≤15 min; the adoption gate. Same item as public-alpha EA-B4.

## Source Evidence

- Ranked #14 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-DX1, EA-B4.

## Deduplication / cross-reference

EA-B4 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b4-claude-code-plugin-packaging.md`).

## Next Action

Package CHAOS as a one-command Claude Code plugin (EA-B4).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- One-command install works; EA-X1 time-to-first-value ≤15 min.
- Cross-referenced with the public-alpha EA-B4 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
