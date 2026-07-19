---
chaosMetadata:
  schemaVersion: 1
  artifactType: lifecycle
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T12:21:11+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T12:21:11+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "{'name': 'chaos/dotnet/demo', 'isDefaultBranch': False, 'upstream': '', 'mergeBase': '', 'confidence': 'MEDIUM'}"
    reviewRequest: "{'providerType': 'unknown', 'id': '', 'url': '', 'title': '', 'author': '', 'sourceBranch': '', 'targetBranch': '', 'status': 'unknown', 'confidence': 'LOW'}"
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:88ad47279705bf9bb809af40e85c952e6743b835c2966550978f8ee1d030d580"
---

# CHAOS Lifecycle — add-task-query-filters

Change ID: add-task-query-filters
OpenSpec path: openspec/changes/archive/2026-07-19-add-task-query-filters
Status: Archived
Owner: team
Created: 2026-07-19
Last updated: 2026-07-19

## Lifecycle

| Phase    | Artifact           | Status               |
| -------- | ------------------ | -------------------- |
| Proposal | OpenSpec proposal  | Complete             |
| Review   | proposal-review.md | Complete — READY_FOR_APPROVAL |
| Approval | approval.md        | Approved (vscode-user) |
| Apply    | apply-report.md    | Complete — APPLIED (12/12 tests) |
| Verify   | verification.md    | Complete — VERIFIED (READY) |
| Archive  | archive-report.md  | Complete — ARCHIVED  |
| Sync     | sync-report.md     | Complete — SYNCED (PROP-DEC-001 → decision log) |
| Retro    | retro.md           | Not required (optional) |

## Decision Events

- PROP-DEC-001 — Invalid filter value returns 400 (see decision-events.md)
- REV-DEC-001 — Add invalid-priority 400 test + scenario (RESOLVED_DURING_REVIEW)
- APP-DEC-001 — Case-insensitive enum parse (ACCEPTED_DURING_APPLY, sync NONE)
- APP-DEC-002 — Numeric-out-of-range value returns 400 (ACCEPTED_DURING_APPLY, sync NONE)
- ARC-DEC-001 — Route PROP-DEC-001 to sync; archive + promote base specs (ACCEPTED_DURING_ARCHIVE)
- SYNC: PROP-DEC-001 promoted → docs/decision-log/2026-07-19-task-filter-validation.md

## Waivers / Accepted Risks

None recorded yet.

## Current Next Command

None — lifecycle complete (change ARCHIVED and SYNCED). Optional maintainer follow-ups: assign a
decision-log display ID in .chaos/decisions/index.md; fill the task-api base-spec Purpose.

## Confidence / Evidence summary

- Overall confidence: HIGH (post-apply: 12/12 tests green, OpenSpec --strict valid, build clean)
- Evidence coverage: COMPLETE (filtering + AND + both invalid-value paths tested; baseline preserved)
- Assumption load: LOW
- Note: confidence is formally confirmed by chaos:verify.
