## Context

The Task Tracker API is a single-project ASP.NET Core Minimal API (`net8.0`). `Program.cs`
composes the app and maps a public root health endpoint; `Endpoints/TaskEndpoints.cs` maps the
CRUD surface under a `/tasks` route group; `Domain/**` holds `TaskItem`, the `TaskState` /
`TaskPriority` enums and the in-memory `TaskStore`. There is no authentication of any kind
today, and `.chaos/architecture.md` records that as deliberate ("Non-goals: Authentication /
authorization / multi-tenant concerns").

This change introduces a shared API key on the task endpoints only. It is a security change on
an already-public contract, and it crosses a recorded posture, which is why a design document
and an ADR accompany it.

Constraints that shape the design:

- R-003 — `dotnet build` / `dotnet test` stay green.
- R-004 — `Domain/**` must not reference ASP.NET types; the auth check therefore lives in the
  HTTP layer only.
- R-005 — `TaskState` naming is untouched.
- The architecture's boundary posture: new HTTP behaviour belongs at the endpoint boundary,
  not in the store's public shape.

## Goals / Non-Goals

**Goals:**

- Every `/tasks` route requires a valid `X-Api-Key` header; missing or wrong key ⇒ `401`.
- The key is read from configuration key `ApiKey`, defaulting to `test-secret-key`.
- The check runs before existence and payload validation, so an unauthenticated caller learns
  nothing about task ids and mutates nothing.
- `GET /` stays public.
- CRUD behaviour for authenticated callers is bit-for-bit unchanged.

**Non-Goals:**

- Per-user identity, roles, scopes, or multi-tenancy — still non-goals.
- Key rotation, hashing, expiry, or a key store. One shared key from configuration.
- Transport security (TLS), rate limiting, audit logging of auth failures.
- Protecting anything other than `/tasks` (the root health endpoint stays open by contract).

## Decisions

**D1 — Enforce with an endpoint filter attached to the `/tasks` route group, not global
middleware.**
The group already exists (`app.MapGroup("/tasks")`), so `group.AddEndpointFilter(...)` applies
the check to exactly the five routes and to any future route added to the group, while
`GET /` is untouched by construction. Alternatives considered: (a) global middleware with a
path allow-list — it would re-express the route/public split as a string comparison in
`Program.cs`, duplicating routing knowledge and risking drift as routes are added;
(b) full ASP.NET `AuthenticationHandler` + `[Authorize]` — the correct choice for real identity,
but it introduces scheme/policy configuration and a `ClaimsPrincipal` we have no use for, well
beyond one shared secret. The filter is the smallest mechanism that satisfies the contract and
keeps the enforcement point next to the routes it guards.

**D2 — Filter ordering guarantees the "auth before everything" requirement.**
An endpoint filter runs after routing but before the endpoint delegate, so the 401 short-circuit
happens before route-parameter handlers touch `TaskStore` and before the `Title` validation
inside the POST/PUT delegates. `GET /tasks/{unknown-guid}` without a key therefore returns 401,
not 404, and `POST /tasks` with a blank title and no key returns 401, not 400 — which is what
the spec pins.

**D3 — Resolve the key from `IConfiguration["ApiKey"]` with the literal fallback
`test-secret-key`.**
Matches the pinned contract exactly. Configuration binding is what makes the value overridable
per environment (`appsettings.json`, environment variables, test host configuration) without a
code change. Alternative considered: requiring the value and failing startup when unset — safer
in production, but it contradicts the pinned default and would break the visible test suite's
default boot.

**D4 — Compare with an ordinal, case-sensitive string comparison.**
An API key is an opaque token; case-insensitive or culture-aware comparison would widen the
accepted set for no benefit.

**D5 — Return a bare `401` (`Results.Unauthorized()`), with no `WWW-Authenticate` challenge and
no body.**
The contract asks for the status code only. A response body describing why the key was rejected
would leak enforcement detail to an anonymous caller.

**D6 — The tests carry the key through a small helper rather than repeating the header.**
The five existing CRUD tests are updated to send the header; new tests cover missing key, wrong
key, the public root, the auth-before-existence ordering, and non-mutation. A single helper that
creates an authenticated client keeps the diff on the existing tests minimal and their intent
readable.

## Risks / Trade-offs

- **A shared secret with a committed default (`test-secret-key`) is not production
  authentication** → accepted, and recorded as an accepted risk in the ADR: the default exists
  so the demo suite boots, and any real deployment must supply `ApiKey` from the environment.
  The value is a demo credential, not a secret in the security sense.
- **Breaking for every existing `/tasks` caller** → intentional and stated as **BREAKING** in
  the proposal; the tests are updated in the same change so the baseline stays green.
- **Enforcement is opt-in per route group; a future route mapped outside the `/tasks` group
  would be unprotected** → mitigated by attaching the filter to the group rather than to
  individual routes, and by the spec scenario "Every task route is protected"; a future
  protected surface must join a filtered group or add its own filter.
- **No auth-failure logging** → accepted; observability is a recorded `[UNKNOWN]` posture area
  and out of scope here.
- **Constant-time comparison is not used** → accepted for a demo-scope shared key; a timing
  side channel on a static key is not a meaningful threat at this posture, and introducing
  `CryptographicOperations.FixedTimeEquals` would add encoding concerns for no in-scope benefit.

## Migration Plan

1. Ship the filter and the updated tests together — the suite defines the new baseline.
2. Deployers set `ApiKey` (environment variable `ApiKey`, or `appsettings.*.json`) before
   exposing the API; leaving it unset silently accepts the well-known demo key.
3. Clients add the `X-Api-Key` header. There is no grace period and no opt-out flag: the change
   is small enough that a dual-mode rollout would cost more than it saves, and a "disable auth"
   switch would be a standing hole.
4. Rollback: remove the `AddEndpointFilter` call — the routes revert to open with no data
   migration and no state to unwind.

## Open Questions

None blocking. Deliberately deferred, each already outside this change's scope: key rotation
and multiple valid keys; per-caller identity and rate limiting; whether the root health endpoint
should eventually expose more than a liveness signal (it stays public and minimal here).
