## Why

The dashboard needs to show how many tasks exist without downloading the whole task list.
Today the only way to learn that number is `GET /tasks`, which returns every task item and
forces the client to count them — wasteful for a display that needs a single integer, and it
grows worse as the store grows. A lightweight aggregate read closes that gap now, before the
dashboard work depends on a client-side workaround that would later have to be unwound.

## What Changes

- **New route `GET /tasks/count`** returning `200 OK` with `{ "count": <integer> }`, the total
  number of tasks currently held in the store.
- The value is **derived from the same store projection `GET /tasks` returns**
  (`TaskStore.All()`), so the two can never drift and no counter state is introduced.
- No change to any existing endpoint: `GET /`, `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,
  `PUT /tasks/{id}` and `DELETE /tasks/{id}` keep their current behaviour, status codes and
  payload shapes.
- No authentication, no persistence-model change, no new dependency.

## Capabilities

### New Capabilities
<!-- None. The count endpoint extends the existing task-api HTTP contract rather than
     introducing a new capability. -->

### Modified Capabilities
- `task-api`: adds a `Count Tasks` requirement covering the new `GET /tasks/count` route, its
  response shape, and the invariants tying `count` to `GET /tasks`, `POST /tasks` and
  `DELETE /tasks/{id}`.

## Impact

- **Code:** `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — one additional mapped route
  inside the existing `/tasks` group. `Domain/**` and `Contracts/**` are untouched, so the
  domain→HTTP boundary (R-004) and the `TaskState` naming (R-005) are unaffected.
- **Tests:** `tests/TaskTracker.Tests/TaskCountEndpointTests.cs` — a new integration test class
  covering the response shape, the list/count equality invariant, the create and delete deltas,
  and the unchanged root health endpoint. The 5 pre-existing tests are untouched.
- **APIs:** additive only. No existing route, status code, or field is removed or renamed, so
  no client can break on this change.
- **Dependencies / systems:** none. No package reference is added; the store remains the
  in-memory singleton described in `.chaos/architecture.md`.
