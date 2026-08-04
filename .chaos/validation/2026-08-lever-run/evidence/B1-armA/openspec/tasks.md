## 1. Endpoint

- [x] 1.1 Map `GET /tasks/count` in `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, inside the existing `/tasks` group, returning `Results.Ok(new { count = store.All().Count })`.
- [x] 1.2 Register it ahead of `GET /tasks/{id:guid}` and confirm the `:guid` constraint keeps the literal `count` segment unambiguous.
- [x] 1.3 Leave `Domain/**` and `Contracts/**` untouched, per decision D1 and rule R-004.

## 2. Tests

- [x] 2.1 Add `tests/TaskTracker.Tests/TaskCountEndpointTests.cs` with its own `WebApplicationFactory<Program>` class fixture (decision D4).
- [x] 2.2 Cover C-001: `GET /tasks/count` returns 200 with an integer `count` field.
- [x] 2.3 Cover C-002: `count` equals the item count of `GET /tasks` at the same moment.
- [x] 2.4 Cover C-003: `POST /tasks` (201) increases `count` by exactly 1, asserted as a delta.
- [x] 2.5 Cover C-004: `DELETE /tasks/{id}` (204) decreases `count` by exactly 1, asserted as a delta.
- [x] 2.6 Cover C-005: `GET /` still returns 200 with the unchanged health payload.

## 3. Validation

- [x] 3.1 `dotnet build` — clean, 0 warnings, 0 errors.
- [x] 3.2 `dotnet test` — green, with the 5 pre-existing tests still passing alongside the new ones.
- [x] 3.3 `openspec validate task-count --strict` — passes.
