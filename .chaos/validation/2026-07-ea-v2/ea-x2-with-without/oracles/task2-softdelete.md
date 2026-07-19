# Task 2 — Soft-delete for tasks (schema change + backward-compatible migration)

Today `DELETE /tasks/{id}` permanently removes a task. Change deletion to a **soft delete**
so deleted tasks are retained but hidden by default.

## Contract (implement exactly this — behaviour is checked against it)

- Add a nullable **`deletedAt`** timestamp to the task model, serialized in JSON as
  `deletedAt` (an ISO-8601 string when set, **`null`** when the task is active).
- `DELETE /tasks/{id}` must **soft-delete**: set `deletedAt` to the current time and return
  **204 No Content**. It must **not** permanently remove the task. Deleting an unknown id
  still returns 404.
- `GET /tasks` returns only **active** (not soft-deleted) tasks by default.
- `GET /tasks?includeDeleted=true` returns **all** tasks including soft-deleted ones (whose
  `deletedAt` is non-null).
- `GET /tasks/{id}` returns **404 Not Found** for a soft-deleted task.
- The four seeded tasks remain active (`deletedAt` = null) after startup — existing rows must
  keep working (backward-compatible migration).

## Constraints

- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).
- Do not change unrelated behaviour of the other CRUD endpoints.
- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).
