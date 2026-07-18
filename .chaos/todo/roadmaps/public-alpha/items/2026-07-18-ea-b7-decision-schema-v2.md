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
  id: TODO-2026-07-18-ea-b7-decision-schema-v2
  title: "EA-B7 — Decision schema v2 + dependent decisions + expiry"
  status: open
  priority: MEDIUM
  target: h2-beta-foundation
  type: runtime
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
  sourceIds:
    - EA-B7
  relatedChanges:
  relatedRoadmapItems:
    - EA-B7
  relatedFindings:
    - IL-DQ1
    - IL-DQ8
    - IL-DQ10
  nextStep: "Design and ship decision schema v2 with dependent decisions and an expiry policy."
  recommendedCommand: none
  closureCriteria:
    - "Decision schema v2 shipped with dependent decisions and expiry policy."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — EA-B7 — Decision schema v2 + dependent decisions + expiry

## Why this exists

Addendum addition (IL-DQ1/DQ8/DQ10, dep IL-RT5): reversibility, urgency and evidence classes unlock decision triage and policy.

## Source Evidence

- EA-B7 — addendum to Horizon 2 (14-roadmap.md addendum; 11-final-prioritization.md §11.5).

## Next Action

Design and ship decision schema v2 with dependent decisions and an expiry policy.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Decision schema v2 shipped with dependent decisions and expiry policy.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md + improvement-landscape addendum) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
