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
  id: TODO-2026-07-18-ea-v3-runtime-hardening-pass
  title: "EA-V3 — Runtime hardening pass"
  status: open
  priority: HIGH
  target: h1-validation
  type: runtime
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-V3
  relatedChanges:
  relatedRoadmapItems:
    - EA-V3
  relatedFindings:
    - EA-I08
    - EA-I09
    - EA-I10
  nextStep: "Close EA-I08 (runtime hardening bundle), EA-I09 (capsule integrity + quality gate) and EA-I10 (hooks posture reconciliation)."
  recommendedCommand: none
  closureCriteria:
    - "Concurrent-writer test suite green."
    - "EA-I08, EA-I09 and EA-I10 closed."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-V3 — Runtime hardening pass

## Why this exists

Known robustness gaps — write races, unsanitized read-path IDs, the open chaos_answer_decision bridge, and the always-null capsule hash — are cheap to fix while the code is fresh; per the addendum, IL-RT5/RT8 fold into this pass.

## Source Evidence

- EA-V3 — Horizon 1, P1, complexity M, no dependencies (14-roadmap.md §14.2; details in 13-improvement-inventory.md).

## Next Action

Close EA-I08 (runtime hardening bundle), EA-I09 (capsule integrity + quality gate) and EA-I10 (hooks posture reconciliation).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Concurrent-writer test suite green.
- EA-I08, EA-I09 and EA-I10 closed.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
