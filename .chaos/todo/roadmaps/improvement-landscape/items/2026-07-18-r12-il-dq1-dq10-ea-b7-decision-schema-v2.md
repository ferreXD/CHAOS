---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:12+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:12+02:00"
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
  id: TODO-2026-07-18-r12-il-dq1-dq10-ea-b7-decision-schema-v2
  title: "#12 · IL-DQ1+DQ10 (EA-B7) — Decision schema v2 + expiry policy"
  status: open
  priority: MEDIUM
  target: h-beta
  type: runtime
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/06-decision-quality-analysis.md
  sourceIds:
    - IL-DQ1
    - IL-DQ10
    - EA-B7
  relatedChanges:
  relatedRoadmapItems:
    - IL-DQ1
    - IL-DQ10
    - EA-B7
  relatedFindings:
    - IL-RT5
    - IL-DQ8
  nextStep: "Ship decision schema v2 with reversibility/urgency/evidence classes, dependent decisions, and expiry (EA-B7)."
  recommendedCommand: none
  closureCriteria:
    - "Schema v2 live with decision classes + expiry; migration framework in place."
    - "Cross-referenced with the public-alpha EA-B7 item."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 12
  createdAt: "2026-07-18T13:00:12+02:00"
  lastSeenAt: "2026-07-18T13:00:12+02:00"
  closedAt: null
---

# TODO — #12 · IL-DQ1+DQ10 (EA-B7) — Decision schema v2 + expiry policy

## Why this exists

Rank #12. Reversibility / urgency / evidence classes (DQ1) plus an expiry policy (DQ10) unlock decision triage and policy; needs the IL-RT5 migration framework. Same item as public-alpha EA-B7 (with dependent decisions, DQ8).

## Source Evidence

- Ranked #12 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-DQ1, IL-DQ10, EA-B7.

## Deduplication / cross-reference

EA-B7 in the public-alpha roadmap view (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-b7-decision-schema-v2.md`).

## Next Action

Ship decision schema v2 with reversibility/urgency/evidence classes, dependent decisions, and expiry (EA-B7).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Schema v2 live with decision classes + expiry; migration framework in place.
- Cross-referenced with the public-alpha EA-B7 item.

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
