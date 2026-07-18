---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-17T20:30:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-17T20:30:00+02:00"
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
  id: TODO-2026-07-17-decide-chaos-gate-fate
  title: "Decide the fate of chaos:gate"
  status: open
  priority: LOW
  target: vNext
  type: decision
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-016
  relatedChanges: []
  relatedRoadmapItems:
    - RM-016
  relatedFindings:
    []
  nextStep: "Decide whether to implement chaos:gate or fold it into verify/archive, and downgrade the G-0x language accordingly."
  recommendedCommand: none
  closureCriteria:
    - "A decision on chaos:gate is recorded (ADR / decision-log)."
    - "G-0x language is reconciled with the decision."
  knowledgeType: INFERENCE
  confidence: MEDIUM
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: null
---

# TODO — Decide the fate of chaos:gate

## Why this exists

chaos:gate is neither clearly implemented nor clearly folded into verify/archive; its G-0x language is ambiguous.

## Source Evidence

- RM-016 — Decide fate of chaos:gate (implement or fold into verify/archive)

## Next Action

Decide whether to implement chaos:gate or fold it into verify/archive, and downgrade the G-0x language accordingly.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A decision on chaos:gate is recorded (ADR / decision-log).
- G-0x language is reconciled with the decision.

