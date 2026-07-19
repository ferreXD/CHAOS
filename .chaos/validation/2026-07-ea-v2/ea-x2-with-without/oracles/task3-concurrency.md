# Task 3 — Optimistic concurrency on task updates

`PUT /tasks/{id}` currently overwrites a task unconditionally, so a client working from a
stale copy can silently clobber someone else's update (lost-update race). Add **optimistic
concurrency control**.

## Contract (implement exactly this — behaviour is checked against it)

- Add an integer **`version`** to the task, serialized as `version`. New and seeded tasks
  start at version **1**.
- Every **successful** `PUT /tasks/{id}` increments the task's `version` by 1 (1 → 2 → 3 …).
- `UpdateTaskRequest` gains an **optional** integer field **`expectedVersion`**:
  - When `expectedVersion` is **provided** and does **not** equal the task's current
    `version`, the update must be **rejected with HTTP 409 Conflict** and the task must be
    left **unchanged** (no field updated, version not bumped).
  - When `expectedVersion` is **provided** and **matches**, the update succeeds (200) and the
    version increments.
  - When `expectedVersion` is **omitted** (null), the update proceeds unconditionally
    (backward-compatible last-writer-wins) and the version increments.
- `POST /tasks` returns a task with `version` = 1.

## Constraints

- Keep `dotnet build` and `dotnet test` green — the existing PUT test omits `expectedVersion`
  and must keep working.
- Do not change unrelated behaviour of the other CRUD endpoints.
- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).
