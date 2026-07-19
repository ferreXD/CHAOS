---
chaosMetadata:
  schemaVersion: 1
  artifactType: lifecycle
  artifactScope: change
  changeId: optimistic-concurrency-updates
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T18:26:30+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:26:30+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/ea-x2/p3-armA
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
---

# CHAOS Lifecycle — optimistic-concurrency-updates

Change ID: optimistic-concurrency-updates
OpenSpec path: openspec/changes/optimistic-concurrency-updates
Status: Verified (not archived)
Owner: team
Created: 2026-07-19
Last updated: 2026-07-19
Run context: EA-X2 mechanized run (no live human; material decisions resolved in-arm)

## Lifecycle

| Phase    | Artifact           | Status                                   |
| -------- | ------------------ | ---------------------------------------- |
| Proposal | proposal-report.md | Complete — PROPOSED_READY_FOR_REVIEW      |
| Review   | proposal-review.md | Complete — READY_FOR_APPROVAL             |
| Approval | approval.md        | Bypassed (EA-X2: no human; disclosed)     |
| Apply    | apply-report.md    | Complete — APPLIED (10/10 tests)          |
| Verify   | verification.md    | Complete — VERIFIED (READY)               |
| Archive  | archive-report.md  | Not run (left in working tree; no commit) |
| Sync     | sync-report.md     | Not run                                    |

## Decision Events

- PROP-DEC-001 — Version check + increment domain-owned (RESOLVED_IN_ARM, sync NONE)
- PROP-DEC-002 — Atomic lock-guarded check-and-increment, no TOCTOU (RESOLVED_IN_ARM, sync NONE)
- PROP-DEC-003 — Domain outcome type, not exceptions (RESOLVED_IN_ARM, sync NONE)
- PROP-DEC-004 — Accept + surface non-durable version (RESOLVED_IN_ARM, sync CONSIDER_DECISION_LOG)
- PROP-DEC-005 — No extra 400 for out-of-band expectedVersion (RESOLVED_IN_ARM, sync NONE)
- APP-DEC-001 — camelCase JSON policy for version/expectedVersion (RESOLVED_IN_ARM, sync NONE)

All decisions tagged `resolved-in-arm (no live human; EA-X2 mechanized run)` — documented deviation
from the normal Decision-Center stop-and-resume (R-001).

## Waivers / Accepted Risks

- Non-durable `version` (resets on restart) — accepted demo limitation (VFY-001).
- EA-X2 in-arm decision resolution — accepted per mechanized-run protocol (VFY-002).

## Current Next Command

```text
chaos:archive optimistic-concurrency-updates
```

## Confidence / Evidence summary

- Overall confidence: HIGH (post-apply: 10/10 tests green, OpenSpec --strict valid, build clean)
- Evidence coverage: COMPLETE
- Assumption load: LOW
