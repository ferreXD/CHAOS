## Why

The Task Tracker API is open: every `/tasks` route serves any caller with no credential of any
kind. Task data can be read, created, mutated and deleted anonymously. This change closes that
gap with the smallest credible mechanism — a shared API key presented in a request header — so
the CRUD surface stops being anonymous while the liveness probe stays reachable.

This crosses a recorded posture: `.chaos/architecture.md` lists "Authentication / authorization
/ multi-tenant concerns" under **Non-goals** and states "Any auth is out of scope and would be
strict, decision-bearing work." The crossing is deliberate and is recorded in
`.chaos/changes/require-api-key-auth/adr/2026-08-04-api-key-authentication.md`.

## What Changes

- **BREAKING** — every request to a `/tasks` route (`GET /tasks`, `GET /tasks/{id}`,
  `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`) must present a valid API key in the
  `X-Api-Key` request header. Callers that work today receive `401 Unauthorized` after this
  change until they send the header. The route set itself is unchanged.
- The valid key is the string value of configuration key `ApiKey`, defaulting to
  `test-secret-key` when that configuration value is not set.
- A missing or incorrect `X-Api-Key` on a `/tasks` route is rejected with `401 Unauthorized`
  **before** any existence or validation check, so an unauthenticated caller cannot read or
  mutate a task and cannot distinguish a real task id from an unknown one.
- `GET /` (root health/liveness) stays **public** — no key required.
- The existing integration test suite is updated to present the key, and new tests pin the
  rejection behaviour.
- No change to the CRUD semantics themselves: status codes, payload shapes and validation for
  authenticated requests are exactly as before.

## Capabilities

### New Capabilities
- `task-api-auth`: API-key authentication for the task endpoints — the header contract, the
  configured key and its default, the 401 rejection semantics, and the public health endpoint
  carve-out.

### Modified Capabilities
- `task-api`: the listing/CRUD contract now presupposes an authenticated caller — every
  scenario in that spec is reached only with a valid `X-Api-Key` header.

## Impact

- `src/TaskTracker.Api/` — new authentication filter/middleware, wired at the `/tasks` group;
  `Program.cs` composition.
- `tests/TaskTracker.Tests/` — existing CRUD tests supply the header; new tests cover missing
  key, wrong key, the public root endpoint, and the auth-before-existence ordering.
- API consumers: **breaking** for every existing caller of `/tasks`.
- No new package dependency; no change to the domain layer (`Domain/**` stays free of
  ASP.NET types, R-004), and `TaskState` naming is untouched (R-005).
- Posture: `.chaos/architecture.md` "Authentication / authorization posture" and the Non-goals
  list are superseded for this surface by the accompanying ADR.
