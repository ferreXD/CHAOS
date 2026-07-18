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
  id: TODO-2026-07-18-ea-b2-token-program
  title: "EA-B2 — Token program: lazy refs, evidence index, deterministic validators"
  status: open
  priority: HIGH
  target: h2-beta-foundation
  type: performance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-B2
  relatedChanges:
  relatedRoadmapItems:
    - EA-B2
  relatedFindings:
  nextStep: "Implement lazy references, an evidence index and deterministic validators; measure per-command token cost."
  recommendedCommand: none
  closureCriteria:
    - "Measured per-command token table published."
    - "Standard lifecycle ≤80k tokens."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B2 — Token program: lazy refs, evidence index, deterministic validators

## Why this exists

A full lifecycle currently costs ~196k tokens; the target is ≤80k for a standard lifecycle.

## Source Evidence

- EA-B2 — Horizon 2, P1, complexity M. Depends on: EA-B1 (14-roadmap.md §14.2).

## Next Action

Implement lazy references, an evidence index and deterministic validators; measure per-command token cost.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Measured per-command token table published.
- Standard lifecycle ≤80k tokens.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
