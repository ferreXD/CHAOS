---
chaosMetadata:
  schemaVersion: 1
  artifactType: lifecycle
  artifactScope: change
  changeId: require-api-key-auth
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T17:49:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T17:49:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f (EA-X2 mechanized worktree p1-armA)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:hook-managed-pending"
---

# CHAOS Lifecycle — require-api-key-auth

Change ID: require-api-key-auth
OpenSpec path: openspec/changes/require-api-key-auth
Status: Verified (not archived; left in working tree per run directive)
Owner: team
Created: 2026-07-19
Last updated: 2026-07-19
Run context: EA-X2 mechanized (no live human; material decisions resolved-in-arm)

## Lifecycle

| Phase    | Artifact           | Status               |
| -------- | ------------------ | -------------------- |
| Proposal | proposal-report.md + OpenSpec | Complete — PROPOSED_READY_FOR_REVIEW (`--strict` valid) |
| Decisions| decision-events.md | Complete — AUTH-DEC-001/002/003 (resolved-in-arm) |
| Review   | proposal-review.md | Complete — READY_FOR_APPROVAL (MEDIUM; in-arm) |
| Apply    | apply-report.md    | Complete — APPLIED (13/13 tests) |
| Verify   | verification.md    | Complete — VERIFIED (MEDIUM; READY w/ disclosed caveat) |
| Archive  | —                  | Not run (leave changes in working tree) |
| Sync     | —                  | Not run (AUTH-DEC-001 → UPDATE_ARCHITECTURE_POSTURE pending) |

## Decision Events

- AUTH-DEC-001 — Adopt API-key auth, crossing the architecture NON-GOAL (POSTURE_CHANGE; sync UPDATE_ARCHITECTURE_POSTURE)
- AUTH-DEC-002 — Group-level endpoint filter on `MapGroup("/tasks")` (DESIGN_DECISION; sync NONE)
- AUTH-DEC-003 — Read `ApiKey` from config, default `test-secret-key` when unset (LOCAL_DESIGN_DECISION; sync NONE)

## Waivers / Accepted Risks

- R-001 human approval of AUTH-DEC-001 substituted by an in-arm resolution (EA-X2, no live human).
  Disclosed on every artifact; human re-confirmation recommended before a real merge.

## Current Next Command

```text
chaos:archive require-api-key-auth   # (not executed in this run)
```

## Confidence / Evidence summary

- Overall confidence: MEDIUM (capped by the R-001 in-arm substitution; correctness is HIGH)
- Evidence coverage: COMPLETE (all 6 spec scenarios tested + passing; baseline preserved)
- Assumption load: LOW
