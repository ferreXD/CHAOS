---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:01+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:01+02:00"
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
  id: TODO-2026-07-18-r01-ea-v1-il-dx5-showcase-trail
  title: "#1 · EA-V1 (IL-DX5) — Showcase trail (decided)"
  status: open
  priority: BLOCKER
  target: h-alpha
  type: validation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - EA-V1
    - IL-DX5
  relatedChanges:
  relatedRoadmapItems:
    - EA-V1
    - IL-DX5
  relatedFindings:
  nextStep: "Publish the showcase trail per EA-V1 (see the public-alpha roadmap item)."
  recommendedCommand: none
  closureCriteria:
    - "Showcase trail published and reconstructable without installing anything."
    - "Cross-referenced with the public-alpha EA-V1 item (single delivery)."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  rank: 1
  createdAt: "2026-07-18T13:00:01+02:00"
  lastSeenAt: "2026-07-18T13:00:01+02:00"
  closedAt: null
---

# TODO — #1 · EA-V1 (IL-DX5) — Showcase trail (decided)

## Why this exists

Rank #1 of 20 (impact × confidence-in-impact ÷ cost). Unblocks credibility for everything downstream and is cheap because it is capture-not-create: one real strict-mode lifecycle published as a reconstructable trail. Same item as the public-alpha roadmap's EA-V1 (decided 2026-07-18, Option 2); IL-DX5 here.

## Source Evidence

- Ranked #1 of 20 in the improvement-landscape final prioritization (§11.2). IDs: EA-V1, IL-DX5.

## Deduplication / cross-reference

EA-V1 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-v1-showcase-trail.md`).

## Next Action

Publish the showcase trail per EA-V1 (see the public-alpha roadmap item).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Showcase trail published and reconstructable without installing anything.
- Cross-referenced with the public-alpha EA-V1 item (single delivery).

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
