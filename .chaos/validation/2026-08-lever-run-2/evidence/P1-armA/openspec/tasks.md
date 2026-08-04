## 1. Tests first (the acceptance surface)

- [x] 1.1 Add `tests/TaskTracker.Tests/ApiKeyAuthTests.cs` covering: missing key on each of the
  five `/tasks` routes returns 401; wrong key returns 401; valid key returns the normal result;
  `GET /` without a key returns 200; unknown id without a key returns 401 (not 404); blank-title
  POST without a key returns 401 (not 400); unauthenticated DELETE leaves the task retrievable.
- [x] 1.2 Update `tests/TaskTracker.Tests/TaskEndpointsTests.cs` so all five existing CRUD tests
  send `X-Api-Key: test-secret-key` via a shared authenticated-client helper.
- [x] 1.3 Confirm the new tests FAIL against the current open API (the acceptance check).

## 2. Enforcement

- [x] 2.1 Add `src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs` — an `IEndpointFilter` that
  reads `IConfiguration["ApiKey"]` (default `test-secret-key`), compares the `X-Api-Key` request
  header ordinally, and short-circuits with `Results.Unauthorized()` on missing/incorrect key.
- [x] 2.2 Attach the filter to the `/tasks` group in `Endpoints/TaskEndpoints.cs` so it covers
  every current and future route in that group, leaving `GET /` public.

## 3. Validation

- [x] 3.1 `dotnet build` clean.
- [x] 3.2 `dotnet test` green — the pre-existing 5 CRUD tests plus the new auth tests.
- [x] 3.3 Confirm no `Domain/**` file references ASP.NET types (R-004) and `TaskState` naming is
  unchanged (R-005).
