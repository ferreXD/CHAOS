## Why

`GET /tasks` returns the entire task list with no way to narrow it. As the number of tasks
grows, clients must pull everything and filter client-side. Adding optional `status` and
`priority` filters lets clients ask the API for exactly the slice they need.

## What Changes

- Add optional `status` and `priority` query parameters to `GET /tasks`.
- Multiple filters combine with logical **AND** (`?status=inprogress&priority=high` returns
  tasks that are both InProgress *and* High).
- An **unrecognized filter value returns `400 Bad Request`** (e.g. `?status=banana`) — see
  decision **PROP-DEC-001**. This is not a breaking change: existing unfiltered
  `GET /tasks` calls are unaffected.
- Filtering is domain-owned (a `TaskStore` query method), keeping the endpoint thin and the
  filter logic directly testable.

## Capabilities

### New Capabilities

- `task-api`: HTTP contract for the Task Tracker task resource, including listing tasks with
  optional `status`/`priority` filtering and the invalid-filter-value contract.

### Modified Capabilities

<!-- None. openspec/specs/ has no existing base specs yet; task-api is introduced new. -->

## Impact

- **Affected specs:** `task-api` (new)
- **Affected code:** `examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`
  (bind + validate query params), `examples/task-tracker/dotnet/src/TaskTracker.Api/Domain/TaskStore.cs`
  (domain-owned AND filtering).
- **Affected tests:** `examples/task-tracker/dotnet/tests/TaskTracker.Tests/TaskEndpointsTests.cs`
  (filter + invalid-value coverage).
- **APIs / dependencies:** additive, backward-compatible; no persistence, auth, or external
  side effects.
