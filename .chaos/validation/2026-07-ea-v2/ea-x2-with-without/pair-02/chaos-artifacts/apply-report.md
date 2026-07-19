---
chaosMetadata:
  schemaVersion: 1
  artifactType: apply-report
  artifactScope: change
  changeId: soft-delete-tasks
  sourceCommand: "chaos:apply"
  lastWrittenAt: "2026-07-19T18:24:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:24:00+02:00"
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
    bodyHash: "sha256:a376950b9230878165e55c5ed9c4f838a101a2f4fe4e615d13fb67f137c1d1ea"
---

# CHAOS Apply Report — soft-delete-tasks

## 1. Summary

Change ID: `soft-delete-tasks`
Mode: `strict`
Mode source: `inferred`
Result: `APPLIED`
Implementation specialist: `none (self-applied; subagents disallowed in this run)`
Execution confidence: `HIGH`
Validation evidence: `COMPLETE`
Scope drift risk: `LOW`
Assumption load: `LOW`

## 2. Source Manifest

| Source | Found | Used | Notes |
|---|---|---|---|
| OpenSpec proposal | yes | yes | Why/What/Impact |
| OpenSpec design | yes | yes | Option B (domain-owned) + MDEC/APP decisions |
| OpenSpec specs | yes | yes | MODIFIED List Tasks + 3 ADDED requirements |
| OpenSpec tasks | yes | yes | 12 tasks, all checked |
| CHAOS proposal report | yes | yes | non-goal surfaced; MDEC-001/002/003 |
| CHAOS review | yes | yes | READY_FOR_APPROVAL |
| CHAOS approval | no | n/a | omitted (EA-X2 mechanized; no human gate) — documented deviation |
| CHAOS rules | yes | yes | R-003/R-004/R-005/R-006 honored; R-001 deviation recorded |
| Architecture non-goals | yes | yes | retention scoped in-memory (MDEC-003) |

## 3. Preflight Result

- Toolchain: dotnet (net8.0 target); `openspec` 1.6.0; baseline `dotnet test` green (5/5) before apply
- OpenSpec validation availability: yes (`openspec validate --strict`)
- C# project detected: yes (`src/TaskTracker.Api`, net8.0)
- Direct blockers: none
- Continuable gaps: approval.md absent (accepted for mechanized run; recorded deviation)

## 4. Implementation Boundary

### Allowed
- `src/TaskTracker.Api/Domain/TaskItem.cs` (add nullable `DeletedAt` — required for the schema change; R-005 preserved)
- `src/TaskTracker.Api/Domain/TaskStore.cs`
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

### Not allowed
- `Program.cs`, `Contracts/TaskRequests.cs` (no request-shape change needed)
- Other endpoint behaviours beyond the soft-delete visibility rule (POST, PUT, GET-list filters)
- Persistence / durable store / migration engine (MDEC-003 non-goal)
- `AGENTS.md`, root `README.md` (R-006)

### Expected files/components
- Domain: nullable `DeletedAt`; `All(includeDeleted)`; `Get` hides deleted; `SoftDelete`
- Endpoint: bind `includeDeleted`; DELETE stamps
- Tests: soft-delete + visibility + seed-active + null-serialization

## 5. Apply Plan

- [x] 2.1 Nullable `DeletedAt` on `TaskItem` (trailing defaulted param — migration)
- [x] 2.2 `TaskStore.All(bool includeDeleted = false)` active-only by default
- [x] 2.3 `TaskStore.Get(id)` hides soft-deleted → GET-by-id 404
- [x] 2.4 `TaskStore.SoftDelete(id, when)` replaces `Remove`
- [x] 2.5 `GET /tasks` binds `bool includeDeleted = false` and delegates
- [x] 2.6 `DELETE /tasks/{id}` stamps via `SoftDelete` → 204 / 404
- [x] 3.1–3.6 Tests

## 6. Task Execution Log

### Tasks 1.1–3.6 — soft-delete capability + tests

Status: `COMPLETE`
Specialist used: `none (self-applied)`

Files inspected:
- OpenSpec proposal/design/spec/tasks; TaskItem.cs, TaskStore.cs, TaskEndpoints.cs, Program.cs, TaskEndpointsTests.cs

Files changed:
- `src/TaskTracker.Api/Domain/TaskItem.cs` — added `DateTimeOffset? DeletedAt = null` as a trailing
  defaulted positional param (MDEC-001). Every existing 5-arg construction (4 seeds + `Add`) keeps
  compiling and yields an active task → backward-compatible migration. `TaskState` unchanged (R-005).
- `src/TaskTracker.Api/Domain/TaskStore.cs` — `All(bool includeDeleted = false)` filters out
  soft-deleted rows by default; `Get(id)` returns null for a soft-deleted row (APP-DEC-001);
  removed `Remove`, added `SoftDelete(Guid, DateTimeOffset)` that stamps `DeletedAt` on the physical
  row and never removes it (APP-DEC-002). Domain-owned; no HTTP dependency (R-004).
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — `GET /tasks` binds optional
  `bool includeDeleted = false` and delegates to `store.All(includeDeleted)`; `DELETE /tasks/{id}`
  calls `store.SoftDelete(id, DateTimeOffset.UtcNow)` → 204 / 404. GET-by-id unchanged.
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` — extended shared `TaskDto` with
  `DateTimeOffset? DeletedAt`; added 5 integration tests (see below). The 5 pre-existing tests are
  unmodified and remain green.

Tests added/updated:
- `Seeded_tasks_are_active_with_null_deletedAt` (3.1) — 4 seeds present, all `deletedAt` null
- `Active_task_serializes_deletedAt_as_null` (3.2) — raw JSON contains `"deletedAt":null` (APP-DEC-003)
- `Delete_soft_deletes_task_returns_204_and_hides_it` (3.3) — 204; GET-by-id 404; hidden from default list; visible with non-null `deletedAt` under includeDeleted
- `Delete_unknown_id_returns_404` (3.4)
- `Get_tasks_excludes_soft_deleted_by_default_but_includeDeleted_returns_them` (3.5)
- Baseline preserved (3.6): the 5 original tests untouched, incl. `Delete_removes_a_task` (204 + 404-after still hold under soft-delete)

Decisions discovered/confirmed at apply:
- APP-DEC-001 (Get hides soft-deleted), APP-DEC-002 (DELETE physical-existence semantics),
  APP-DEC-003 (default web JSON serialization) — all recorded in decision-events.md.

Assumptions:
- Tests assert predicates on returned items + fresh POST-then-DELETE ids rather than exact counts
  (shared singleton store across the class); seeds are never mutated by other tests.

Unknowns: None.

## 7. Controlled Amendments

| ID | Classification | Description | Decision | Sync action |
|---|---|---|---|---|
| APP-DEC-001 | LOCAL_DESIGN_DECISION | `Get` hides soft-deleted → GET-by-id 404 | resolved-in-arm (enforces contract) | NONE |
| APP-DEC-002 | LOCAL_DESIGN_DECISION | DELETE physical-existence resolution (re-delete → 204) | resolved-in-arm | NONE |
| APP-DEC-003 | LOCAL_DESIGN_DECISION | Default web JSON serialization for `deletedAt` | resolved-in-arm | NONE |

No SPEC_DRIFT or ARCHITECTURE_DRIFT: all three enforce the approved contract and the MDEC-003
in-memory boundary; none change requirements, public request shapes, or introduce persistence.

## 8. Decision Events

Recorded in `.chaos/changes/soft-delete-tasks/decision-events.md`:
- MDEC-001/002/003 (propose-time material decisions, resolved-in-arm)
- APP-DEC-001/002/003 (apply-time local decisions, resolved-in-arm)

R-001 deviation (no live human) is declared in the decision-events header and honored via
record-and-resolve-in-arm with maintainer rationale.

## 9. Validation

Commands run:
- `openspec validate soft-delete-tasks --strict` → **valid** ("Change 'soft-delete-tasks' is valid")
- `dotnet build` → **Build succeeded, 0 Warning(s), 0 Error(s)**
- `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` → **Passed! Failed: 0, Passed: 10, Skipped: 0, Total: 10**

Results:
- All validations pass. 5 new tests added (10 total); the 5 pre-existing tests remain green
  (R-003 preserved). Baseline before apply was 5/5.

Confidence impact:
- Validation evidence COMPLETE → execution confidence HIGH.

## 10. Scope Drift Assessment

Scope drift class: `NO_DRIFT`
Rationale: edits confined to the 4 approved files. Soft-delete visibility/mutation placed in the
domain (R-004); `TaskState` naming preserved (R-005); persistence non-goal respected (MDEC-003,
in-memory only); protected files untouched (R-006). POST/PUT/GET-filter behaviours unchanged.

## 11. Open Questions / Follow-ups

- Restore/undelete + hard-purge + TTL deferred (out of scope; future decision-bearing work).
- PUT on a soft-deleted task left as physical-row behaviour (don't change unrelated endpoints).
- Optional future rename of `Delete_removes_a_task` (semantically loose under soft-delete; left
  unmodified to preserve the baseline exactly).

## 12. Recommended Next Command

```bash
chaos:verify soft-delete-tasks
```

## Config Context

Status: `CONFIG_OK`
Configured values used:
- OpenSpec path: `openspec`
- Apply report path: `.chaos/changes/soft-delete-tasks/apply-report.md`
- Validation commands: `dotnet build`, `dotnet test`, `openspec validate --strict`
Confidence impact: None.
