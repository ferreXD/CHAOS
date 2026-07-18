---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:13+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:13+02:00"
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
  id: TODO-2026-07-18-r13-il-rt3-ea-i09-capsule-integrity
  title: "#13 · IL-RT3 (EA-I09) — Capsule integrity + quality gate"
  status: open
  priority: MEDIUM
  target: h-beta
  type: runtime
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-improvement-landscape/11-final-prioritization.md
    - .chaos/assessments/2026-07-18-improvement-landscape/03-topics-runtime-performance.md
  sourceIds:
    - IL-RT3
    - EA-I09
  relatedChanges:
  relatedRoadmapItems:
    - IL-RT3
    - EA-I09
  relatedFindings:
    - EA-V3
    - EA-R9
  nextStep: "Land EA-I09 (capsule hash + resume-time quality gate) as part of the EA-V3 hardening pass."
  recommendedCommand: none
  closureCriteria:
    - "Capsule hash wired; resume-time capsule-quality gate active (warn first)."
    - "Cross-referenced with the public-alpha EA-V3 item (EA-I09)."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  rank: 13
  createdAt: "2026-07-18T13:00:13+02:00"
  lastSeenAt: "2026-07-18T13:00:13+02:00"
  closedAt: null
---

# TODO — #13 · IL-RT3 (EA-I09) — Capsule integrity + quality gate

## Why this exists

Rank #13. Trustworthy resumes: wire the always-null capsule hash, add a resume-time capsule-quality gate (warn/stop on skeletal capsules), and prompt agents for scope/constraints at pause — anti EA-R9. Bundled as EA-I09 inside the public-alpha EA-V3 hardening pass.

## Source Evidence

- Ranked #13 of 20 in the improvement-landscape final prioritization (§11.2). IDs: IL-RT3, EA-I09.

## Deduplication / cross-reference

Bundled as EA-I09 inside public-alpha EA-V3 (`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-v3-runtime-hardening-pass.md`).

## Next Action

Land EA-I09 (capsule hash + resume-time quality gate) as part of the EA-V3 hardening pass.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Capsule hash wired; resume-time capsule-quality gate active (warn first).
- Cross-referenced with the public-alpha EA-V3 item (EA-I09).

## History

- 2026-07-18 — Created from the improvement-landscape assessment's Top-20 ranked opportunities (11-final-prioritization.md §11.2, horizoned via §11.3/§11.5). Roadmap-scoped: not imported into the main backlog.
