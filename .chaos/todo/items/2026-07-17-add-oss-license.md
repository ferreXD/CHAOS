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
  id: TODO-2026-07-17-add-oss-license
  title: "Choose and add OSS license"
  status: done
  priority: BLOCKER
  target: public-alpha
  type: governance
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-006
    - F-17
  relatedChanges: []
  relatedRoadmapItems:
    - RM-006
  relatedFindings:
    - F-17
  nextStep: "Deliverable satisfied — LICENSE present. Owner to confirm the committed license is the intended one; optional follow-up: add SPDX headers to tooling files (not a public-alpha gate)."
  recommendedCommand: none
  closureCriteria:
    - "LICENSE file exists at repo root. ✓ (met)"
    - "Owner confirms the chosen license is intended."
  knowledgeType: CONFLICT
  confidence: MEDIUM
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: "2026-07-17T20:30:00+02:00"
---

# TODO — Choose and add OSS license

## Why this exists

Imported already-satisfied: a LICENSE file exists at the repository root (verified 2026-07-17). The active RM-006 BLOCKER row is stale vs. the roadmap’s own "Completed" note and the repo state.

## Source Evidence

- F-17 — No LICENSE file or SPDX headers
- RM-006 — Choose and add OSS license
- Repo state 2026-07-17 — LICENSE file present at repo root (1085 bytes)

## Next Action

Deliverable satisfied — LICENSE present. Owner to confirm the committed license is the intended one; optional follow-up: add SPDX headers to tooling files (not a public-alpha gate).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- LICENSE file exists at repo root. ✓ (met)
- Owner confirms the chosen license is intended.

## History

- 2026-07-17 — Imported as done. LICENSE file verified present at repo root; roadmap RM-006 row is stale (roadmap "Completed" section already claimed license placement). Recorded via chaos:todo --from-roadmap.

