## 1. Dependencies and configuration shape

- [x] 1.1 Add the `Microsoft.AspNetCore.Authentication.JwtBearer` package to `src/TaskTracker.Api/TaskTracker.Api.csproj` (net8.0-compatible version)
- [x] 1.2 Add the non-secret configuration shape to `appsettings.json`: JWT issuer and audience, rate-limit permit count and window, CORS allowed origins, max request body size. No signing key, no secret values.
- [x] 1.3 Add a strongly-typed options record plus a startup validation helper that throws a descriptive error when the signing key, issuer or audience is missing (fail-fast, design D4)

## 2. Authentication

- [x] 2.1 Register `AddAuthentication().AddJwtBearer(...)` in `Program.cs`, reading the signing key/issuer/audience from configuration and validating signature, lifetime, issuer and audience
- [x] 2.2 Register `AddAuthorization()` and add `UseAuthentication()` / `UseAuthorization()` to the pipeline in the correct order
- [x] 2.3 Apply `RequireAuthorization()` to the `/tasks` `MapGroup` in `Endpoints/TaskEndpoints.cs` (group-level, design D3); leave `GET /` mapped outside the group and anonymous
- [x] 2.4 Verify no auth type or `Microsoft.AspNetCore.*` reference leaks into `Domain/**` (rule R-004)

## 3. Edge hardening

- [x] 3.1 Register `AddRateLimiter` with a fixed-window limiter partitioned by authenticated caller, falling back to remote IP; return `429` on rejection; apply it to the `/tasks` group
- [x] 3.1a Place `UseRateLimiter()` **before** `UseAuthentication()`/`UseAuthorization()` in the pipeline so unauthenticated requests consume a permit before credential validation (design D5, REV-DEC-002)
- [x] 3.1b Apply a separate, looser rate limit to the anonymous `GET /` liveness endpoint
- [x] 3.2 Register a CORS policy built from the configured allow-list; assert no wildcard origin is combined with credentials
- [x] 3.3 Add security-header middleware setting `X-Content-Type-Options: nosniff` and a restrictive `Referrer-Policy` on every response, including error responses
- [x] 3.4 Add `UseHttpsRedirection()` and `UseHsts()` (app terminates TLS, design D2)
- [x] 3.5 Enforce the maximum request body size so oversized payloads return `413`
- [x] 3.6 Confirm `UseForwardedHeaders()` is **not** registered anywhere in the pipeline (rule R-008, design D2)

## 3b. Development-only token issuance (REV-DEC-003, design D7)

- [x] 3b.1 Add an `Auth:EnableDevTokenEndpoint` configuration flag defaulting to `false`
- [x] 3b.2 Map the issuance endpoint **only** when `app.Environment.IsDevelopment()` **and** the flag is enabled — a registration-time condition, not a runtime check inside the handler, so the route is absent rather than guarded
- [x] 3b.3 Have the endpoint mint a token signed with the configured signing key, with the configured issuer, audience and lifetime
- [x] 3b.4 Confirm the endpoint is not registered when either gate fails, and that the flag's absence is equivalent to `false`

## 4. Tests

- [x] 4.1 Add a test helper that mints a valid token signed with a test signing key, and inject that key into the `WebApplicationFactory` configuration
- [x] 4.2 Update the 5 existing tests in `TaskEndpointsTests.cs` to present a valid token; confirm each still asserts its original status and body
- [x] 4.3 Add tests: each of the 5 `/tasks` routes returns `401` with no `Authorization` header
- [x] 4.4 Add tests: invalid signature, expired token, and wrong issuer/audience each return `401`
- [x] 4.5 Add a test: `GET /tasks/{unknown-id}` with no credential returns `401`, not `404`
- [x] 4.6 Add a test: `GET /` returns `200` anonymously
- [x] 4.7 Add a test: exceeding the configured rate limit returns `429` and performs no mutation
- [x] 4.7a Add a test: an **unauthenticated** caller exceeding the limit receives `429`, not `401` — proving rejected requests consume permits (REV-DEC-002)
- [x] 4.7b Add a test: exceeding the liveness limit on `GET /` returns `429`
- [x] 4.7c Add a test: the dev issuance endpoint returns `404` when the environment is not Development, and `404` in Development when the flag is absent or disabled (REV-DEC-003)
- [x] 4.7d Add a test: with both gates satisfied, the issued token is accepted by `/tasks`
- [x] 4.8 Add a test: an oversized `POST /tasks` body returns `413` and creates no task
- [x] 4.9 Add a test: startup fails with a descriptive error when the signing key is absent
- [x] 4.10 Add a test: security headers are present on both a `2xx` and a `401` response
- [x] 4.11 Run `dotnet build` and `dotnet test`; the full suite must be green (rule R-003)

## 5. Governance

- [x] 5.1 Create `docs/adr/` and write `docs/adr/2026-08-01-api-authentication-posture.md` recording the JWT-bearer decision, the alternatives rejected, the app-terminates-TLS transport posture, the dev-only issuance gate, and the upgrade path to an external IdP
- [x] 5.1a In that ADR, state explicitly that it **supersedes** the "Authentication / authorization / multi-tenant concerns" entry under §Non-goals in `.chaos/architecture.md` and the "the API is open" claim in its §Authentication/authorization posture (REV-DEC-001)
- [x] 5.1b Confirm REV-DEC-001 carries `sync-action: CREATE_ADR + UPDATE_CHAOS_RULES` so `chaos:sync` is obliged to reconcile `.chaos/architecture.md` and `.chaos/context.md` after archive — the architecture edit belongs to sync (with patch preview), not to apply
- [x] 5.2 Confirm no secret or signing material is present in any tracked file
- [x] 5.3 Tick the `.chaos/changes/secure-task-api/change.md` §Contract statements that are now covered by a passing test
