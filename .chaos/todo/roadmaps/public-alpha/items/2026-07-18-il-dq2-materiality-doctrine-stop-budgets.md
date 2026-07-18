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
  id: TODO-2026-07-18-il-dq2-materiality-doctrine-stop-budgets
  title: "IL-DQ2 — Materiality doctrine + stop budgets (prompt-only)"
  status: open
  priority: MEDIUM
  target: h1b-addendum
  type: governance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - IL-DQ2
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - IL-DQ2
  nextStep: "Write the materiality doctrine and per-change stop budgets into the command prompts."
  recommendedCommand: none
  closureCriteria:
    - "Materiality doctrine and stop budgets present in command prompts."
    - "Feeds the EA-X5 stop-materiality measurement."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — IL-DQ2 — Materiality doctrine + stop budgets (prompt-only)

## Why this exists

Accepted improvement-landscape addition to the alpha horizon: define when a stop is material and budget stops per change, as prompt-level doctrine (no runtime change).

## Source Evidence

- IL-DQ2 — addendum to Horizon 0–1 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Write the materiality doctrine and per-change stop budgets into the command prompts.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Materiality doctrine and stop budgets present in command prompts.
- Feeds the EA-X5 stop-materiality measurement.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
