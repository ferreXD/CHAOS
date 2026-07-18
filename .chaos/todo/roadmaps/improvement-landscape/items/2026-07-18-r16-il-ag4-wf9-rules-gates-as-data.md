---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:16+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:16+02:00"
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
  id: TODO-2026-07-18-r16-il-ag4-wf9-rules-gates-as-data
  title: "#16 · IL-AG4 (+IL-WF9) — Rules/gates as structured data"
  status: open
  priority: LOW
  target: h-longterm
  type: architecture
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/04-topics-guidance-dx-ecosystem-product.md
  sourceIds:
    - IL-AG4
    - IL-WF9
  relatedChanges:
  relatedRoadmapItems:
    - IL-AG4
    - IL-WF9
  relatedFindings:
    - EA-A6
    - EA-B1
  nextStep: "Model rules as structured data (EA-A6); fold gates into the EA-B1c catalog; retire chaos:gate (IL-WF9)."
  recommendedCommand: none
  closureCriteria:
    - "Rules expressed as structured data consumed by commands."
    - "Cross-referenced with public-alpha EA-A6 and the addendum IL-WF9."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 16
  createdAt: "2026-07-18T13:00:16+02:00"
  lastSeenAt: "2026-07-18T13:00:16+02:00"
  closedAt: null
---

# TODO — #16 · IL-AG4 (+IL-WF9) — Rules/gates as structured data

## Why this exists

Rank #16. Governance becomes listable, citable and partially machine-checkable when rules and gates are structured data rather than prose; retiring the chaos:gate concept (IL-WF9) is the data model's corollary. Per §11.5a the gate half is absorbed by EA-B1c (the two-axis 27-gate catalog); the rules half is public-alpha EA-A6.

## Source Evidence

- Ranked #16 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-AG4, IL-WF9.

## Deduplication / cross-reference

Rules half = public-alpha EA-A6 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-a6-rules-gates-structured-data.md`); gate-retirement half = addendum IL-WF9.

## Next Action

Model rules as structured data (EA-A6); fold gates into the EA-B1c catalog; retire chaos:gate (IL-WF9).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Rules expressed as structured data consumed by commands.
- Cross-referenced with public-alpha EA-A6 and the addendum IL-WF9.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
