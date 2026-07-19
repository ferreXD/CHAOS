---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-19T12:46:38+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-19T12:46:38+02:00"
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
  id: TODO-2026-07-18-ea-v1-showcase-trail
  title: "EA-V1 — Publish the showcase trail (one real strict-mode lifecycle)"
  status: done
  priority: BLOCKER
  target: h1-validation
  type: validation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-V1
  relatedChanges:
  relatedRoadmapItems:
    - EA-V1
  relatedFindings:
  nextStep: "Run one real strict-mode change on task-tracker through the full lifecycle and publish the complete sanitized artifact set on the showcase branch with README deep-link and docs excerpt page."
  recommendedCommand: none
  closureCriteria:
    - "A stranger can read the full trail without installing anything."
    - "README links the showcase trail."
    - "No retouched artifacts."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-19T12:46:38+02:00"
  closedAt: "2026-07-19T12:46:38+02:00"
---

# TODO — EA-V1 — Publish the showcase trail (one real strict-mode lifecycle)

## Why this exists

Validation exists privately (Reported) but is unverifiable; the framework standard is reconstruct-from-disk-alone. This is the critical-path artifact. Decided 2026-07-18 (Option 2): publish the complete sanitized artifact set in a showcase location — recommended orphan branch showcase/…, README deep-link plus a docs excerpt page.

## Source Evidence

- EA-V1 — Horizon 1, P0, complexity M. Depends on: EA-S2. Decided 2026-07-18: Option 2 (14-roadmap.md §14.2).

## Next Action

Run one real strict-mode change on task-tracker through the full lifecycle and publish the complete sanitized artifact set on the showcase branch with README deep-link and docs excerpt page.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A stranger can read the full trail without installing anything.
- README links the showcase trail.
- No retouched artifacts.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
- 2026-07-19 — Closed as **done** (`chaos:todo --close`) on direct maintainer instruction. EA-V1 is solved on the published `demo/dotnet` branch: a real strict-mode lifecycle for change `add-task-query-filters` is published under [`.chaos/changes/add-task-query-filters/`](../../../changes/add-task-query-filters/) (proposal-report → proposal-review → approval → apply-report → verification → archive-report → sync-report + decision-events + lifecycle manifest), with a self-contained, install-free walkthrough at [`docs/demo/README.md`](../../../../docs/demo/README.md) linked from the root README (Getting started → "Worked end-to-end example"). Closure criteria verified against this branch: stranger-readable trail ✅, README-linked ✅, no retouched artifacts (real lifecycle run) ✅. Maintainer confirmation: recorded from the repository owner's explicit close directive (chat session). Roadmap file (`14-roadmap.md`) is not mutated — this closure is the record of completion (per todo↔roadmap bridge).
