# Task B3 — Enforce a maximum title length

Task titles are currently unbounded. Add an upper bound on title length as input validation.
This is a request-validation convenience: no authentication, no persistence-model change.

## Contract (implement exactly this — behaviour is checked against it)

- A task **title** may be at most **200 characters** long.
- `POST /tasks` with a title **longer than 200 characters** must be rejected with
  **HTTP 400 Bad Request** and must not create a task.
- `PUT /tasks/{id}` with a title **longer than 200 characters** must be rejected with
  **HTTP 400 Bad Request** and must not modify the task.
- A title of **exactly 200 characters** is accepted (`POST` → 201, `PUT` → 200).
- The existing **blank/whitespace title → 400** behaviour is preserved for both `POST` and `PUT`.
- Titles of normal length continue to work exactly as before.

## Constraints

- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).
- Do not change unrelated behaviour of the other CRUD endpoints.
- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).
