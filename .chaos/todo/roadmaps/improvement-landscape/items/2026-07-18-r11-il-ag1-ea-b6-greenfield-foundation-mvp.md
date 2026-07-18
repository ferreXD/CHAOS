---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:11+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:11+02:00"
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
  id: TODO-2026-07-18-r11-il-ag1-ea-b6-greenfield-foundation-mvp
  title: "#11 · IL-AG1 (EA-B6) — Greenfield Foundation Discovery MVP"
  status: open
  priority: MEDIUM
  target: h-beta
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/09-greenfield-foundation-design.md
    - .chaos/assessments/2026-07-18-improvement-landscape/10-greenfield-foundation-catalog.md
  sourceIds:
    - IL-AG1
    - EA-B6
  relatedChanges:
  relatedRoadmapItems:
    - IL-AG1
    - EA-B6
  relatedFindings:
    - IL-DQ8
    - IL-RT5
    - IL-AG2
  nextStep: "Build the Foundation Discovery MVP per §09/§10 (EA-B6)."
  recommendedCommand: none
  closureCriteria:
    - "foundation.yaml + derived governance files generated for a fresh project within the stop budget."
    - "Cross-referenced with the public-alpha EA-B6 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 11
  createdAt: "2026-07-18T13:00:11+02:00"
  lastSeenAt: "2026-07-18T13:00:11+02:00"
  closedAt: null
---

# TODO — #11 · IL-AG1 (EA-B6) — Greenfield Foundation Discovery MVP

## Why this exists

Rank #11. Makes the greenfield story real and gives agents boundaries: 4 areas + 1 conditional, 19 curated options, 3 presets + a regulated overlay, ≤6 stops (3 with a preset), foundation.yaml authoritative, ≤8 derived governance files, zero new commands. Full design in §09/§10; deps IL-DQ8, IL-RT5, and pairs with foundation-aware commands (IL-AG2). Same item as public-alpha EA-B6.

## Source Evidence

- Ranked #11 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-AG1, EA-B6.

## Deduplication / cross-reference

EA-B6 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b6-greenfield-foundation-mvp.md`).

## Next Action

Build the Foundation Discovery MVP per §09/§10 (EA-B6).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- foundation.yaml + derived governance files generated for a fresh project within the stop budget.
- Cross-referenced with the public-alpha EA-B6 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
