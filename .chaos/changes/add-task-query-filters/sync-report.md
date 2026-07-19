---
chaosMetadata:
  schemaVersion: 1
  artifactType: change-sync-report
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: "chaos:sync"
  lastWrittenAt: "2026-07-19T12:20:51+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T12:20:51+02:00"
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
    bodyHash: "sha256:7f5b9d51fbd1fa768ce86c8a2d6c43826f041efa05919283666674bb54c65693"
---

# CHAOS Sync Report — add-task-query-filters

## 1. Sync Dashboard

| Decision | Type | Promotion | Reconciliation |
|---|---|---|---|
| PROP-DEC-001 — invalid filter → 400 | DESIGN_DECISION | DECISION_LOG | promoted to decision-log (applied) |
| REV-DEC-001 — invalid-priority test + scenario | TASK_AMENDMENT | OPENSPEC_UPDATE | already in base spec (archive) → closed |
| APP-DEC-001 — case-insensitive parse | LOCAL_DESIGN_DECISION | NO_PROMOTION | closed |
| APP-DEC-002 — numeric → 400 hardening | LOCAL_DESIGN_DECISION | NO_PROMOTION | closed |
| ARC-DEC-001 — route to sync | sync-routing | — | fulfilled by this run → closed |

## 2. Invocation and Mode

Command: `chaos:sync --change add-task-query-filters --strict`
Mode: strict
Scope: single change (`add-task-query-filters`)
Role level: contributor-safe
Report target: `.chaos/changes/add-task-query-filters/sync-report.md`
Maintainer confirmation (for `--all`): n/a (not a repo-wide sync)
Dry-run: no

## 3. Source Manifest

| Source | Status | Notes |
|---|---|---|
| `.chaos/changes/add-task-query-filters/decision-events.md` | Found | PROP/REV/APP/ARC decision events |
| `.chaos/changes/add-task-query-filters/archive-report.md` | Found | ARCHIVED; sync routing |
| `.chaos/changes/add-task-query-filters/verification.md` | Found | VERIFIED |
| `openspec/specs/task-api/spec.md` | Found | base spec (promoted at archive) |
| `openspec/changes/archive/2026-07-19-add-task-query-filters/` | Found | archived change |
| `docs/decision-log/` | Created | new folder for the promoted entry |
| `.chaos/decisions/index.md` | Found (not edited) | repo-wide index — maintainer scope |

## 4. Toolchain / OpenSpec Status

- `openspec list` → no active changes (change archived).
- OpenSpec base spec `task-api` present with the promoted List Tasks requirement.
- No production code/tests touched by sync.

## 5. Drift Findings

| ID | Category | Severity | Knowledge | Confidence | Summary | Action |
|---|---|---|---|---|---|---|
| SYNC-001 | governance-promotion | MINOR | FACT | HIGH | PROP-DEC-001 convention not yet in durable governance | Promote to decision log (applied) |
| SYNC-002 | spec-hygiene | MINOR | FACT | HIGH | `task-api` base spec `Purpose` is an OpenSpec archive placeholder ("TBD") | Recommend maintainer fill (debt) |
| SYNC-003 | index-hygiene | ADVISORY | FACT | HIGH | Decision-log entry has no display ID in `.chaos/decisions/index.md` | Maintainer-level index update (debt) |

## 6. Decision Event Reconciliation

| Decision | Source | Promotion | User action | Status |
|---|---|---|---|---|
| PROP-DEC-001 | propose/archive | DECISION_LOG | decision-log (Decision Center) | applied |
| REV-DEC-001 | review | OPENSPEC_UPDATE | already promoted into base spec at archive | closed |
| APP-DEC-001 | apply | NO_PROMOTION | implementation detail (spec-mandated) | closed |
| APP-DEC-002 | apply | NO_PROMOTION | implementation hardening within contract | closed |
| ARC-DEC-001 | archive | — | routing fulfilled by this sync | closed |

## 7. Planned Patch Preview

### Will create
- `docs/decision-log/2026-07-19-task-filter-validation.md`

### Will update
- `.chaos/changes/add-task-query-filters/lifecycle.md` (Sync row + next command)

### Will not modify
- production code
- tests
- migrations
- `.chaos/decisions/index.md` (repo-wide index — maintainer scope)
- `AGENTS.md` / `README.md` (protected; no drift found)

## 8. Applied Sync Actions

| Action | File | Result |
|---|---|---|
| Create decision-log entry | `docs/decision-log/2026-07-19-task-filter-validation.md` | Created |
| Update lifecycle Sync row | `.chaos/changes/add-task-query-filters/lifecycle.md` | Updated |
| Write sync report | `.chaos/changes/add-task-query-filters/sync-report.md` | Created |

## 9. Rules and Gates

### Rules created/updated
- None. The convention was promoted as a decision log, not a rule (single-surface convention; a
  rule/gate can follow if the pattern recurs across endpoints).

### Gates created/updated
- None.

### Duplicate sequential-ID reconciliation (`--all`)
- Not applicable (contributor-safe `--change` sync).

## 10. Sync Debt Ledger

| Item | Reason | Impact | Follow-up |
|---|---|---|---|
| Assign display ID for the new decision-log entry | `.chaos/decisions/index.md` is repo-wide (maintainer scope) | LOW — discoverability | maintainer `chaos:sync --adrs`/index update |
| Fill `task-api` base spec `Purpose` | OpenSpec archive left a "TBD" placeholder | LOW — spec hygiene | maintainer spec edit |

## 11. Post-Sync Consistency Check

| Check | Result |
|---|---|
| Decision-log file created with provenance | PASS |
| All change decision events reconciled/classified | PASS (5/5) |
| No repo-wide index edited under contributor scope | PASS |
| No production code/tests modified | PASS |
| Lifecycle Sync row updated | PASS |

## 12. Final Sync Verdict

Verdict: SYNCED
Confidence: HIGH
Drift load: LOW
Decision load: LOW
Rule impact: LOW
Gate impact: LOW
ADR impact: LOW
Manual follow-up required: YES (two LOW maintainer-scope items in the debt ledger)

## 13. Closure Summary

PROP-DEC-001 (invalid filter value → 400) is now a durable, discoverable decision-log entry with a
full provenance trail (propose → review → apply → archive → sync). All five decision events for the
change are reconciled and closed. Two LOW maintainer-scope follow-ups remain (index display ID,
base-spec Purpose) — recorded as sync debt, non-blocking.

Recommended next command:

```text
(none required for this change) — optionally, a maintainer runs chaos:sync at maintainer scope to
assign the decision-log display ID and fill the task-api spec Purpose.
```

## Config Health

Status: `CONFIG_OK`

Config values used:
- ADR path: `docs/adr`
- Decision-log path: `docs/decision-log`
- OpenSpec path: `openspec`
- Rules path/index: `.chaos/rules` / `.chaos/rules/index.md`
- Gates path/index: `.chaos/gates`
- Report paths: `.chaos/changes/<id>/` (change-scoped)
- Protected-file policies: `AGENTS.md`, `README.md` (requirePatchPreview)

## Config Drift Findings

| ID | Finding | Recommended action | User decision | Status |
|---|---|---|---|---|
| (none) | No config drift detected | — | — | — |

## Config Reconciliation Decisions

- None.

## Config Sync Debt

- None.

## Protected Documentation Reconciliation

| File | Drift type | Action | Patch/Rewrite | Override used | Result |
|---|---|---|---|---|---|
| (none) | No drift | — | — | No | — |

Required notes:
- Current policy: `AGENTS.md` / `README.md` editable by status/sync only via patch preview + confirmation (`requirePatchPreview: true`).
- No `AGENTS.md` / `AGENT.md` / `README.md` change was needed or made.
- Post-sync consistency check: PASS.
