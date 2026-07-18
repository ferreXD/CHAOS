---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T12:06:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T12:06:00+02:00"
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
  id: TODO-2026-07-17-document-three-tier-paths
  title: "Document lightweight, normal, and strict CHAOS paths"
  status: done
  priority: MEDIUM
  target: public-alpha
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-008
    - F-05
  relatedChanges: []
  relatedRoadmapItems:
    - RM-008
  relatedFindings:
    - F-05
  nextStep: "Add an explicit three-tier table: tiny (propose→apply→verify); normal (+review/code-review/archive); brownfield (full chain + sync/retro)."
  recommendedCommand: none
  closureCriteria:
    - "A three-tier happy-path section/table exists."
    - "Each tier is named and distinct."
    - "Complements the existing single golden path."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T12:06:00+02:00"
  closedAt: "2026-07-18T12:06:00+02:00"
---

# TODO — Document lightweight, normal, and strict CHAOS paths

## Why this exists

Only one golden path is documented; the three distinct tiers are not laid out as named, separate paths. Depends on RM-002.

## Source Evidence

- F-05 — Happy paths not explicitly tiered
- RM-008 — Document lightweight, normal, and strict CHAOS paths explicitly

## Next Action

Add an explicit three-tier table: tiny (propose→apply→verify); normal (+review/code-review/archive); brownfield (full chain + sync/retro).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A three-tier happy-path section/table exists.
- Each tier is named and distinct.
- Complements the existing single golden path.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `docs/overview.md` now has an
  explicit "### Three paths" section naming three distinct tiers — **Tiny** (`propose → apply →
  verify`), **Normal** (`propose → review → apply → code-review → verify → archive`), and
  **Brownfield** (`archaeology → … → sync → retro`) — each with its command path and typical mode,
  complementing the golden path above it. Maintainer confirmation via runtime decision
  `DEC-2026-07-18-chaos-todo-close-document-three-tie-d396` (vscode-user, Decision Center; option
  `close-done`), command run `RUN-2026-07-18-chaos-todo-b92a30`.

