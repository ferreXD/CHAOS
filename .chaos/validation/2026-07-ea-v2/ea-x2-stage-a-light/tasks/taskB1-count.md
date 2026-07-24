# Task B1 — Active-task count endpoint

Add a lightweight aggregate endpoint that reports how many tasks exist. This is a read-only
convenience for the dashboard; it introduces no authentication and no persistence-model change.

## Contract (implement exactly this — behaviour is checked against it)

- Add **`GET /tasks/count`**. It returns **HTTP 200** with a JSON object
  **`{ "count": <integer> }`** where `count` is the total number of tasks currently in the store.
- `count` must always equal the number of items returned by `GET /tasks` (same store, same moment).
- Creating a task (`POST /tasks`, 201) increases `count` by exactly 1; deleting a task
  (`DELETE /tasks/{id}`, 204) decreases `count` by exactly 1.
- The root health endpoint **`GET /`** and all existing `/tasks` CRUD behaviour are unchanged.

## Constraints

- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).
- Do not change unrelated behaviour of the CRUD endpoints.
- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).
