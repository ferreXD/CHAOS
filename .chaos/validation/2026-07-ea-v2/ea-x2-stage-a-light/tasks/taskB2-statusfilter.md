# Task B2 — Filter GET /tasks by status

`GET /tasks` currently returns every task. Add an optional query-parameter filter on task status.
This is a query-shaping convenience: no authentication, no persistence-model change.

## Contract (implement exactly this — behaviour is checked against it)

- `GET /tasks?status=<state>` returns only tasks whose status equals `<state>`, where `<state>`
  is one of the `TaskState` names: **`Open`**, **`InProgress`**, **`Done`**.
- The match is **case-insensitive**: `?status=open` behaves identically to `?status=Open`.
- `GET /tasks` with **no** `status` parameter returns **all** tasks (unchanged behaviour).
- An **unrecognised** status value (e.g. `?status=Bogus`) returns **HTTP 400 Bad Request** and
  returns no task list.
- Existing seeded data: of the four seeded tasks, exactly **two** are `Open`, **one** is
  `InProgress`, and **one** is `Done`. A filtered response must contain only tasks of the
  requested status.

## Constraints

- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass; the
  unfiltered `GET /tasks` test must keep working).
- Do not change unrelated behaviour of the other CRUD endpoints.
- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).
