# Architecture posture — Task Tracker API

**This file is a crossing source.** Together with [`docs/adr/`](../docs/adr/), it is what the
`chaos:run` pre-code stop checks intent against. A change that contradicts a posture recorded
here is not a coding decision: it must be surfaced to a human before code is written, and if
the crossing is approved, this file must be amended in the same change.

Each posture below is marked with its **status** — `accepted` (owner-confirmed or ADR-backed),
`inferred` (derived from code, not separately confirmed), or `proposed` (not yet in force) —
plus knowledge type and confidence.

## Architecture style

`[FACT / HIGH]` **accepted** — Single-process ASP.NET Core **Minimal API** on `net8.0`. No
controllers, no MVC, no mediator. Endpoints are registered as delegates and grouped with
`MapGroup`. One deployable unit; there is no service decomposition and none is planned.

## Module and boundary model

`[FACT / HIGH]` **accepted** — Four namespaces inside one project, with a one-way dependency flow:

```text
Endpoints  ->  Contracts  ->  Domain
   (HTTP)      (wire DTOs)    (TaskItem, TaskState, TaskPriority, TaskStore)
```

- **`Domain/`** — the entity, its enumerations, and the store. Knows nothing about HTTP.
- **`Contracts/`** — request DTOs (`CreateTaskRequest`, `UpdateTaskRequest`). The wire shape,
  kept separate from the domain record so the two can diverge.
- **`Endpoints/`** — routing, HTTP status selection, and validation of the request shape.
- **`Program.cs`** — composition root: configuration loading, middleware order, DI, policies.

`[INFERENCE / HIGH]` **accepted** — **HTTP concerns stay in the endpoint layer.** `TaskStore`
exposes `All()`, `Get`, `Add`, `Update`, `Remove` and contains no query, filter, paging, or
status-code logic. Query-parameter handling — including the filtering work the demo walkthrough
adds — belongs in `Endpoints/`, over `store.All()`, leaving `TaskStore` untouched. Pushing
HTTP-shaped concerns into `Domain/` is a crossing.

`[FACT / HIGH]` **accepted** — Validation lives at the endpoint, returning
`Results.BadRequest(new { error = "..." })`. There is no validation framework and no filter
pipeline; do not introduce one as a side effect of another change.

## Runtime and deployment model

`[FACT / HIGH]` **accepted** — Single process, single instance. Kestrel, self-hosted, with
`MaxRequestBodySize` configured on the host in addition to the explicit middleware guard.

`[FACT / HIGH]` **accepted (ADR 2026-08-01)** — **The application terminates TLS itself.**
`UseHttpsRedirection` and `UseHsts` (non-development only) are registered, and
`UseForwardedHeaders` is **deliberately not registered** — there is no trusted proxy set, and
the safe default is to omit the middleware rather than configure an empty one. Placing a
reverse proxy or CDN in front of this API is a **new decision**, not a configuration edit.

`[UNKNOWN / HIGH]` No deployment target, container image, orchestration manifest, or hosting
model exists in this repository. Scale-out is therefore undefined — and both the task store and
the rate-limiter state are per-instance, so scale-out would be incorrect today without a
decision about shared state.

## Data access posture

`[FACT / HIGH]` **accepted** — **In-memory only.** `TaskStore` is a singleton wrapping a
`ConcurrentDictionary<Guid, TaskItem>`, seeded with four fixed-timestamp tasks at construction.
There is no database, no ORM, no repository abstraction, and no persistence across restart.

`[FACT / HIGH]` **accepted** — `TaskItem` is an immutable `record`; `Update` replaces the entry
via `with` rather than mutating in place. `All()` returns tasks ordered by `CreatedAt`, so
ordering is deterministic.

Introducing persistence is a crossing that requires an ADR.

## API strategy

`[FACT / HIGH]` **accepted** — REST-ish JSON over `/tasks`, `{id:guid}` route constraints,
conventional status codes: `200`, `201` + `Location`, `204`, `400`, `404`, `413`, `429`, `401`.

`[FACT / HIGH]` **accepted** — Enums cross the wire **as names**, case-insensitively accepted,
via `JsonStringEnumConverter`. Changing this to numeric is a breaking contract change.

`[FACT / HIGH]` **accepted** — Endpoint groups carry auth and rate limiting at the **group**
level (`MapGroup("/tasks").RequireAuthorization().RequireRateLimiting(...)`), so a route added
later is protected by default rather than depending on someone remembering to decorate it.
Registering a `/tasks` route outside that group is a crossing.

`[FACT / HIGH]` **accepted** — There is no API versioning scheme and no OpenAPI/Swagger
generation. Adding either is a decision, not a cleanup.

## Authentication and authorization posture

`[FACT / HIGH]` **accepted (ADR 2026-08-01)** — **JWT bearer with a self-issued signing key.**
Every `/tasks` route requires a valid token. `GET /` stays anonymous as a liveness signal.
Issuer, audience, and signing key come from configuration supplied outside the repository, and
`AuthOptions.Load` throws when any is missing, so the app refuses to start half-secured.
`ClockSkew` is `TimeSpan.Zero`.

`[FACT / HIGH]` **accepted (ADR 2026-08-01)** — The `AddAuthentication().AddJwtBearer(...)`
seam is the intended upgrade path to an external IdP: repointable by configuration without
touching endpoint code.

`[FACT / HIGH]` **accepted (ADR 2026-08-01, accepted risk RK-8)** — A **development-only token
issuance endpoint** exists behind **two independent gates**: `IsDevelopment()` *and* an opt-in
flag defaulting to `false`, applied at **route-registration time** so the route is absent rather
than present-and-refusing. This is a deliberate, human-accepted hole. Weakening either gate, or
moving the check inside the handler, is a crossing.

`[FACT / HIGH]` **non-goal, accepted (ADR 2026-08-01, RK-4)** — **Per-caller authorization is
out of scope.** `TaskItem` has no owner field, so any valid token can read and mutate any task.
Authenticated is not authorized. Adding ownership is a crossing.

## Observability and release safety posture

`[FACT / HIGH]` **accepted** — Defensive response headers (`X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`) are set by the **first** middleware, so they are present on every
response including `401`, `413`, and `429`. Keep that ordering.

`[FACT / HIGH]` **accepted (ADR 2026-08-01)** — **Rate limiting is registered before
authentication.** Per-caller fixed-window limiting, with a separate looser policy for the
anonymous liveness route, `QueueLimit = 0`, rejecting with `429`. Moving `UseRateLimiter()`
after `UseAuthentication()` is a crossing — it would make `401`s free and let the
signature-validation path be flooded.

`[FACT / HIGH]` **accepted** — Oversized bodies are rejected deterministically with `413` by
explicit middleware, rather than relying on how the JSON pipeline surfaces a Kestrel limit
breach (which can present as `400`).

`[FACT / HIGH]` **accepted** — CORS is an **explicit allow-list**. No wildcard origin, and
credentials are never combined with one.

`[INFERENCE / HIGH]` **inferred** — There is **no structured logging, metrics, tracing, or
health-check framework** beyond `GET /`. Adding an observability stack is a decision, not an
incidental improvement.

## Side-effect and integration strategy

`[FACT / HIGH]` **accepted** — **The API has no outbound dependencies.** No HTTP clients, no
message bus, no external service calls, no background workers or hosted services. The only
side effects are in-process mutations of `TaskStore`. Introducing any outbound integration is
a crossing.

`[FACT / HIGH]` **accepted** — Two NuGet dependencies in the API project only:
`Microsoft.AspNetCore.Authentication.JwtBearer` and `System.IdentityModel.Tokens.Jwt`, both
pinned. Adding a dependency to satisfy a small change is a decision worth surfacing.

## Testing and release posture

`[FACT / HIGH]` **accepted** — **xUnit integration tests** booting the real app through
`WebApplicationFactory<Program>` (`TestApiFactory`). `Program` is exposed via
`public partial class Program { }` specifically to permit this. Four suites:
`AuthenticationTests`, `DevTokenEndpointTests`, `EdgeHardeningTests`, `TaskEndpointsTests` —
covering behaviour through the real middleware pipeline rather than unit-testing handlers.

`[FACT / HIGH]` **accepted** — The green baseline is `dotnet test TaskTracker.sln --nologo`,
mirrored exactly in CI (`.github/workflows/ci.yml`, `ubuntu-latest`, .NET `8.0.x`). Every
governed change keeps it green, and verification pastes real output.

`[FACT / HIGH]` **accepted** — Security-relevant gates are asserted by tests, not by convention:
`DevTokenEndpointTests` asserts both dev-token gates independently. A change touching a gate
must keep or extend its test.

`[UNKNOWN / HIGH]` There is no release process, versioning scheme, changelog, or publishing
pipeline. CI builds and tests; it does not deploy.

## Non-goals

Explicitly **not** part of this system's posture. Each is a crossing if proposed:

- **Persistence.** No database, no durable storage, no migration story.
- **Per-caller authorization and multi-tenancy.** Any valid token may act on any task.
- **Horizontal scale-out.** Store and rate-limit state are per-instance by design.
- **A user interface.** No UI, no client application.
- **Service decomposition.** One process, one deployable.
- **Outbound integrations.** No external systems.
- **An API versioning scheme or generated API documentation.**

> **Historical note.** Before ADR 2026-08-01, "authentication / authorization" appeared here as
> a blanket non-goal and the API was open. That ADR superseded it. Authentication and transport
> hardening are now **in force**; only **per-caller authorization** and **multi-tenancy** remain
> non-goals. This file was regenerated after that ADR, so the superseded text is not carried
> forward — the reconciliation the ADR asked for is complete as of `chaos:init` on 2026-08-07.
> `[CONFLICT / resolved / HIGH]`

## Confidence and open questions

**Posture verdict** — `confidence: HIGH`, `evidence_coverage: COMPLETE` for what the code and
the ADR state, `assumption_load: LOW`.

Every posture above was derived from directly inspected source (`Program.cs`, `TaskEndpoints.cs`,
`TaskStore.cs`, `TaskItem.cs`, `TaskRequests.cs`, both `.csproj` files, `ci.yml`) or from the
Accepted ADR. `[FACT / HIGH]`

Coverage is **complete for the current system** and **weak for anything beyond the process
boundary** — deployment, hosting, TLS termination in a real environment, token issuance in
production, and scale-out are all `[UNKNOWN]`. `[FACT / HIGH]`

Open questions, carried from [`context.md`](context.md): OQ-001 (deployment target and TLS
termination), OQ-002 (production token issuer), OQ-003 (per-caller authorization).

No unresolved conflicts. The one conflict this run found — the ADR superseding earlier
architecture and context text — was resolved by regenerating both documents against the
Accepted ADR, and is recorded in [`bootstrap-report.md`](bootstrap-report.md).
