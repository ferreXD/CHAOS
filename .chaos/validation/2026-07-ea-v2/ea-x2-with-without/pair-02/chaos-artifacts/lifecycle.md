---
chaosMetadata:
  schemaVersion: 1
  artifactType: lifecycle
  artifactScope: change
  changeId: soft-delete-tasks
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T18:32:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:32:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "p2-armA (worktree; detached from main)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:ec32f1d4f8e83502db6c4bb8882cc5a9d6ac1702137de79a7cac434df81f4f29"
---

# CHAOS Lifecycle — soft-delete-tasks

Change ID: soft-delete-tasks
OpenSpec path: openspec/changes/soft-delete-tasks
Status: Verified (not archived)
Owner: team
Created: 2026-07-19
Last updated: 2026-07-19
Run context: EA-X2 mechanized (no live human; R-001 deviation documented)

## Lifecycle

| Phase    | Artifact           | Status                         |
| -------- | ------------------ | ------------------------------ |
| Proposal | proposal-report.md + OpenSpec | Complete — PROPOSED_READY_FOR_REVIEW |
| Decisions| decision-events.md | Complete — MDEC-001/002/003 + APP-DEC-001/002/003 (resolved-in-arm) |
| Review   | proposal-review.md | Complete — READY_FOR_APPROVAL  |
| Approval | approval.md        | Omitted (mechanized run; documented R-001 deviation) |
| Apply    | apply-report.md    | Complete — APPLIED (10/10 tests) |
| Verify   | verification.md    | Complete — VERIFIED (READY)     |
| Archive  | archive-report.md  | Not run                        |
| Sync     | sync-report.md     | Not run                        |

## Decision Events

- MDEC-001 — Nullable `DeletedAt` timestamp on the domain record (SCHEMA_DESIGN, resolved-in-arm)
- MDEC-002 — Domain-owned visibility + mutation (ARCHITECTURE_DESIGN, R-004, resolved-in-arm)
- MDEC-003 — In-memory retention only; don't cross the persistence non-goal (SCOPE_ARCH, resolved-in-arm)
- APP-DEC-001 — GET-by-id hides soft-deleted → 404 (LOCAL_DESIGN, resolved-in-arm)
- APP-DEC-002 — DELETE physical-existence resolution (LOCAL_DESIGN, resolved-in-arm)
- APP-DEC-003 — Default web JSON serialization for `deletedAt` (LOCAL_DESIGN, resolved-in-arm)

## Waivers / Accepted Risks

- R-001 stop-and-resume deviation (no live human, EA-X2 mechanized run) — recorded and accepted.

## Current Next Command

```text
chaos:archive soft-delete-tasks   # after human approval / decision re-confirmation in a normal run
```

## Confidence / Evidence summary

- Overall confidence: HIGH (post-apply: 10/10 tests green, OpenSpec --strict valid, build clean)
- Evidence coverage: COMPLETE (all contract clauses tested; baseline preserved)
- Assumption load: LOW
