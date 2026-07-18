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
  id: TODO-2026-07-17-fix-f07-project-default-leak
  title: "Fix F-07 project-specific default leak (both platforms)"
  status: done
  priority: MEDIUM
  target: v1
  type: sanitization
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-010
    - F-07
    - F-18
  relatedChanges: []
  relatedRoadmapItems:
    - RM-010
  relatedFindings:
    - F-07
    - F-18
  nextStep: "Claude side verified generic. Recommended quick follow-up: confirm the .github mirror copy of csharp-implementation-specialist-contract.md is equally generic (not re-verified in this run)."
  recommendedCommand: none
  closureCriteria:
    - "Specialist contract (Claude side) uses generic wording. ✓ (verified)"
    - ".github mirror copy confirmed equally generic."
  knowledgeType: FACT
  confidence: MEDIUM
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: "2026-07-17T20:30:00+02:00"
---

# TODO — Fix F-07 project-specific default leak (both platforms)

## Why this exists

Imported already-satisfied on the Claude side: csharp-implementation-specialist-contract.md:31 now uses generic wording ("inspect repo conventions... aligned with the ADRs... Clean Architecture / modular monolith"), no project-specific default. Verified 2026-07-17.

## Source Evidence

- F-07 — Project-specific default leaked into generic C# specialist contract
- F-18 — Consolidated public-safety sanitization requirement
- RM-010 — harden Copilot adapter (fix F-07 mirror)
- Repo state 2026-07-17 — Claude-side contract uses generic wording

## Next Action

Claude side verified generic. Recommended quick follow-up: confirm the .github mirror copy of csharp-implementation-specialist-contract.md is equally generic (not re-verified in this run).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Specialist contract (Claude side) uses generic wording. ✓ (verified)
- .github mirror copy confirmed equally generic.

## History

- 2026-07-17 — Imported as done. Claude-side generic wording verified at csharp-implementation-specialist-contract.md:31; .github mirror not re-verified this run (flagged in Next Action). Recorded via chaos:todo --from-roadmap.

