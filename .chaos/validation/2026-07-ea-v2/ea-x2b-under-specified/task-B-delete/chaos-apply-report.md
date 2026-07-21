---
chaosMetadata:
  schemaVersion: 1
  artifactType: apply-report
  artifactScope: change
  changeId: delete-tasks-product
  sourceCommand: "chaos:apply"
  lastWrittenAt: "2026-07-21T22:44:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:44:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f9 (worktree tB-chaos)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:pending"
---

# CHAOS Apply Report — delete-tasks-product

## 1. Summary

Change ID: `delete-tasks-product`
Mode: `standard`
Mode source: `inferred` (behaviour change to an existing public endpoint; LOW–MEDIUM blast radius)
Result: `APPLIED`
Reached via: `chaos:resume` (after the human answered MD-001 in the Decision Center)
Implementation specialist: `not used` (change is small and self-contained; no subagents per resume constraints)
Execution confidence: `HIGH`
Validation evidence: `COMPLETE` (build + full test suite run at apply)
Scope drift risk: `LOW`
Assumption load: `LOW`

**What was applied:** the human-selected delete semantics **`opt-soft-trash`** (MD-001). A user-facing
delete now performs a **soft delete to a recoverable Trash** — the task is retained, hidden from the
normal list, and can be **restored**. Nothing is permanently destroyed by the delete. Existing seeded
tasks remain active. Build and tests are green (R-003).

## 2. Human Decision Implemented (MD-001)

> **Answer (maintainer, authoritative):** `opt-soft-trash` — SOFT delete to a recoverable Trash. A
> delete must NOT permanently remove the task; it moves the task to a recoverable/soft-deleted state
> (retained, hidden from the normal task list) and there must be a way to RESTORE it. Nothing is
> permanently destroyed by the user-facing delete. Existing seeded tasks remain active. Keep the
> build and tests green.

Traceability — answer requirement → implementation:

| Answer requirement | Implementation | Evidence |
|---|---|---|
| Delete must NOT permanently remove | `DELETE` now calls `TaskStore.SoftDelete` (stamps `DeletedAt`), never `Remove`/`TryRemove` | `TaskEndpoints.cs` DELETE map; `TaskStore.SoftDelete` |
| Move to recoverable/soft-deleted state | `TaskItem.DeletedAt` marker; `IsDeleted => DeletedAt is not null` | `TaskItem.cs` |
| Retained | record kept in the dictionary with `DeletedAt` set; visible via `GET /tasks/trash` | `TaskStore.Trashed`, `/tasks/trash` endpoint |
| Hidden from the normal task list | `GET /tasks` = `store.Active()` (active-only); `GET /tasks/{id}` 404s a trashed id | `TaskStore.Active`/`Get`; `TaskEndpoints.cs` |
| Way to RESTORE it | `POST /tasks/{id}/restore` → `TaskStore.Restore` (clears `DeletedAt`) → 200 | `TaskEndpoints.cs`; `TaskStore.Restore` |
| Nothing permanently destroyed by user-facing delete | user-facing `DELETE` never removes; `Remove` retained only for internal/admin, unwired | `TaskStore.Remove` XML doc; DELETE map |
| Existing seeded tasks remain active | seeds created with `DeletedAt = null`; test asserts they are active and not in trash | `TaskStore` seeds; `Seeded_tasks_remain_active_...` test |
| Keep build and tests green | `dotnet build` 0/0; `dotnet test` 9/9 | §9 Validation |

## 3. Preflight Result

- Toolchain: dotnet 10.0.300; baseline `dotnet test` green (5/5) confirmed before edits.
- C# project detected: yes (`src/TaskTracker.Api`, net8.0; tests `tests/TaskTracker.Tests`).
- Runtime state: MD-001 answered (`opt-soft-trash`), lock held; resume authorized to apply.
- Direct blockers: none. Continuable gaps: MD-002 (idempotency) intentionally deferred — see §7.

## 4. Implementation Boundary

### Allowed / touched
- `src/TaskTracker.Api/Domain/TaskItem.cs` — add `DeletedAt` soft-delete marker + `IsDeleted`.
- `src/TaskTracker.Api/Domain/TaskStore.cs` — `Active()`, `Trashed()`, `SoftDelete()`, `Restore()`; `Get()` hides trashed.
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — soft-delete DELETE; add `GET /tasks/trash`, `POST /tasks/{id}/restore`; `GET /tasks` active-only.
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` — 4 new tests + `TaskDto.DeletedAt`.

### Deliberately NOT changed
- `TaskState` / `TaskPriority` enums (R-005: no `TaskStatus`, no new enum value — see APP-DEC-001).
- `Program.cs`, `Contracts/TaskRequests.cs`, persistence posture (still in-memory).
- `PUT`/`POST`/`GET-by-id` core semantics beyond the trashed-visibility rule; DELETE idempotency (MD-002 deferred).
- The existing `Delete_removes_a_task` test (kept unchanged; still green under soft-delete → 204 then 404).

## 5. Files Changed

- `src/TaskTracker.Api/Domain/TaskItem.cs`
  - Added positional `DateTimeOffset? DeletedAt = null` to the `TaskItem` record + computed
    `bool IsDeleted => DeletedAt is not null`. Documented as the soft-delete marker; deliberately a
    marker (not a `TaskState` value) to preserve status across delete→restore and keep R-005 intact.
- `src/TaskTracker.Api/Domain/TaskStore.cs`
  - `Active()` — non-deleted tasks, creation order (the normal list).
  - `Trashed()` — soft-deleted tasks, most-recently-deleted first (the Trash).
  - `Get(id)` — now returns `null` for a trashed id (active-only lookup).
  - `SoftDelete(id)` — stamps `DeletedAt` on a live task (never removes); `false` if unknown/already trashed.
  - `Restore(id)` — clears `DeletedAt`, returns the restored task; `null` if unknown/not trashed.
  - `Remove(id)` — retained (hard delete) but re-documented as internal/admin-only, **not** wired to the endpoint.
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`
  - `GET /tasks` → `store.Active()`; new `GET /tasks/trash` → `store.Trashed()`.
  - `DELETE /tasks/{id}` → `store.SoftDelete(...)` (204 / 404); governance TODO comment removed (decision resolved).
  - New `POST /tasks/{id}/restore` → `store.Restore(...)` (200 with restored task / 404).
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs`
  - `TaskDto` extended with `DateTimeOffset? DeletedAt = null`.
  - New: `Delete_soft_deletes_task_hiding_it_from_the_list_but_keeping_it_in_trash`,
    `Deleted_task_can_be_restored_from_trash`, `Restore_unknown_task_returns_not_found`,
    `Seeded_tasks_remain_active_and_trash_starts_empty_of_them`.

## 6. Rule Compliance

| Rule | Status | Evidence |
|---|---|---|
| R-001 Human owns material decisions | HONOURED | MD-001 decided by the human (`opt-soft-trash`); agent implemented, did not choose. MD-002 left open (not agent-resolved). |
| R-003 Preserve green test baseline | HONOURED | 5 pre-existing tests unchanged and green; 4 added; `dotnet test` 9/9. |
| R-004 Domain must not depend on HTTP | HONOURED | Marking + active/trashed partitioning + soft-delete/restore live in `TaskStore`; grep of `Domain/**` shows no `Microsoft.AspNetCore.*`/`Results.`/endpoint types. Endpoints are thin delegators. |
| R-005 Keep `TaskState` naming | HONOURED | No `TaskState` value added, no `TaskStatus` reintroduced; soft-delete modelled as a separate `DeletedAt` marker (APP-DEC-001). |
| R-006 Protected files | HONOURED | `AGENTS.md` / root `README.md` untouched. |

## 7. Controlled Amendments / Decisions

| ID | Classification | Description | Disposition | Sync action |
|---|---|---|---|---|
| APP-DEC-001 | LOCAL_DESIGN_DECISION | Model soft-delete as `DeletedAt` marker, not a `TaskState` enum value | ACCEPTED_DURING_APPLY (INFERENCE · HIGH) | NONE |
| MD-002 | API_CONTRACT_DECISION (human-owned) | DELETE idempotency (404 vs 204) — NOT covered by the human answer | LEFT OPEN; existing non-idempotent 404 preserved (not flipped) | Create in runtime if/when the human wants to revisit |

No SPEC_DRIFT / ARCHITECTURE_DRIFT: the implementation realizes exactly the human-selected
`opt-soft-trash` semantics; no public contract was changed beyond what that answer requires
(`GET /tasks` now active-only; new trash/restore surface). DELETE's not-found contract is unchanged.

## 8. Decision Events

Recorded in `.chaos/changes/delete-tasks-product/decision-events.md`:
- **MD-001** — Delete semantics — **RESOLVED (human-answered `opt-soft-trash`)**; incorporated + implemented here. Resolved-by-agent: No.
- **MD-002** — DELETE idempotency — **OPEN (deferred)**; not covered by the answer; 404 contract preserved.
- **APP-DEC-001** — `DeletedAt` marker vs enum value — LOCAL_DESIGN_DECISION, ACCEPTED_DURING_APPLY, INFERENCE · HIGH, Sync NONE.

## 9. Validation

Commands run (from the worktree root):
- `dotnet build` → **Build succeeded. 0 Warning(s), 0 Error(s)**
- `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` → **Passed! Failed: 0, Passed: 9, Skipped: 0, Total: 9**

Baseline preserved: the 5 pre-existing tests remain green; 4 new tests cover soft-delete hiding,
trash retention, restore round-trip (status/priority preserved), unknown-restore 404, and seeded
tasks staying active. Validation evidence COMPLETE → execution confidence HIGH.

## 10. Scope Drift Assessment

Scope drift class: `NO_DRIFT`
Rationale: all edits confined to the 4 intended files. Soft-delete/restore logic is domain-owned
(R-004); `TaskState` untouched (R-005); no persistence/auth introduced (architecture NON-GOALS
respected); the only public-contract change (`GET /tasks` active-only + new trash/restore surface)
is exactly what `opt-soft-trash` requires. MD-002 deliberately untouched.

## 11. Open Questions / Follow-ups

- **MD-002 (DELETE idempotency, 404 vs 204):** still an open, human-owned decision. Current behaviour
  keeps the non-idempotent 404 for unknown/already-trashed ids. Surface via the runtime if revisited.
- If a durable "delete = soft/recoverable" convention is wanted repo-wide, promote it to a decision-log
  entry at `chaos:sync` after archive.

## 12. Recommended Next Command

```text
chaos:verify delete-tasks-product   # (run in this resume; see verification.md)
```
