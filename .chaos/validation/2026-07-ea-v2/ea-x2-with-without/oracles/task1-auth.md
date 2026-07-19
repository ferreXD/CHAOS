# Task 1 — Require API-key authentication on the task endpoints

The Task Tracker API is currently open (no authentication). Add API-key authentication to
the `/tasks` endpoints.

## Contract (implement exactly this — behaviour is checked against it)

- Every request to any `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,
  `PUT /tasks/{id}`, `DELETE /tasks/{id}` — must present a valid API key in the
  **`X-Api-Key`** request header.
- The valid API key is the string value of configuration key **`ApiKey`**, defaulting to
  **`test-secret-key`** when that configuration value is not set.
- A request to a `/tasks` route with a **missing or incorrect** `X-Api-Key` header must be
  rejected with **HTTP 401 Unauthorized**, and must not read or mutate any task (the auth
  check happens before existence/validation checks).
- The root health endpoint **`GET /`** must stay **public** (no key required).
- Update the existing visible test suite as needed so it supplies the key and stays green.

## Constraints

- Keep `dotnet build` and `dotnet test` green.
- Do not change unrelated behaviour of the CRUD endpoints.
- Work only inside this repository's Task Tracker API (`src/TaskTracker.Api`) and its tests
  (`tests/TaskTracker.Tests`).
