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
  id: TODO-2026-07-18-h4-v1-productization-bundle
  title: "H4 — v1 productization bundle (deferred until beta evidence)"
  status: open
  priority: LOW
  target: h4-v1-productization
  type: productization
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-H4
  relatedChanges:
  relatedRoadmapItems:
  relatedFindings:
    - EA-I19
  nextStep: "Hold until the Horizon 2 exit criteria are met; then split this bundle into individual todos."
  recommendedCommand: none
  closureCriteria:
    - "Split into individual todos when Horizon 2 exits."
    - "None of the bundle started before then."
  knowledgeType: RECOMMENDATION
  confidence: MEDIUM
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: null
---

# TODO — H4 — v1 productization bundle (deferred until beta evidence)

## Why this exists

Horizon 4 is explicitly deferred — none of it starts before the Horizon 2 exits. Bundle: versioned schemas + migrations, package formalization (EA-I19: workspaces, file: deps, published builds), CHANGELOG + tags/releases, protected-file guard implementation, identity/attribution enforcement, DSSE-style attestation, team pilot. The protected-file guard overlaps the open main-backlog item TODO-2026-07-17-add-protected-file-guard-profile.

## Source Evidence

- Horizon 4 — all deferred; none started before Horizon 2 exits (14-roadmap.md §14.2).

## Next Action

Hold until the Horizon 2 exit criteria are met; then split this bundle into individual todos.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Split into individual todos when Horizon 2 exits.
- None of the bundle started before then.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
