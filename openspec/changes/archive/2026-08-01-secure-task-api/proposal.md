## Why

The Task Tracker API is completely open: every `/tasks` route accepts any caller, with no credential check, no rate limit, and no security headers. The decision has been taken to expose it to the **public internet**, which makes the current posture untenable — an unauthenticated CRUD surface reachable by untrusted callers.

This crosses an architecture non-goal ("Authentication / authorization / multi-tenant concerns"), so it is governed as a `--strict` CHAOS change with a mandatory ADR.

## What Changes

- **BREAKING** All five `/tasks` routes (`GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`) require a valid JWT bearer token. Callers that succeed today will receive `401` without one.
- JWT bearer authentication via `Microsoft.AspNetCore.Authentication.JwtBearer`. Signing key, issuer and audience come from configuration supplied outside the repository; the app fails to start if they are absent.
- `GET /` remains anonymous as a liveness signal.
- Fixed-window rate limiting per caller on `/tasks`, returning `429` when exceeded.
- Explicit CORS allow-list policy — no wildcard origin on a credentialed endpoint.
- Security response headers on every response: `X-Content-Type-Options: nosniff`, a restrictive `Referrer-Policy`, and HSTS.
- HTTPS redirection and HSTS, because the app terminates TLS itself.
- A maximum request body size, returning `413` when exceeded.
- A **development-only** token issuance endpoint, gated behind two independent conditions (`IsDevelopment()` **and** an explicit configuration flag defaulting to off), so the API is usable during the PoC without hand-minting tokens.
- An ADR recording the new authentication posture, which explicitly supersedes the "Authentication / authorization / multi-tenant concerns" non-goal in `.chaos/architecture.md`.

**Non-goals** (deliberately excluded, each recorded as a decision):

- **Production token issuance.** The dev-only endpoint above is not an issuance story for a public deployment; a real issuer (or an external IdP) remains a separate change.
- **Per-caller authorization.** `TaskItem` has no owner field, so "authenticated" does not mean "authorized for this particular task". Roles/scopes are out of scope.
- **Forwarded-headers middleware.** Not registered at all — the app terminates TLS, and rule R-008 names "do not register the middleware" as the safe default rather than configuring an empty trusted-proxy set.
- **Persistence.** Rate-limit state is in-memory and does not survive restart, consistent with the existing single-instance store.

## Capabilities

### New Capabilities

- `api-authentication`: JWT bearer authentication over the `/tasks` surface — which routes require a credential, which stay anonymous, and how invalid, expired and absent credentials are answered.
- `api-edge-hardening`: abuse and transport controls for a public-internet surface — rate limiting (including of unauthenticated traffic), CORS allow-listing, security headers, transport security, and request size limits.

### Modified Capabilities

<!-- None. openspec/specs/ contains no existing capability specs; the CRUD behaviour of
     /tasks has never been captured as an OpenSpec requirement, so there is no delta to write. -->

## Impact

**Code**

- `src/TaskTracker.Api/Program.cs` — authentication/authorization, rate limiter, CORS, security headers, HSTS/HTTPS redirection, body size limit, fail-fast configuration validation.
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — `RequireAuthorization()` on the `/tasks` group.
- `src/TaskTracker.Api/appsettings.json` — non-secret configuration shape (issuer, audience, rate-limit and CORS settings). No secret material.
- `src/TaskTracker.Api/TaskTracker.Api.csproj` — adds `Microsoft.AspNetCore.Authentication.JwtBearer`.

**Tests**

- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` — all 5 existing integration tests currently call `/tasks` unauthenticated and will fail; each is updated to present a valid test token. New tests cover the `401`, `429`, `413` and anonymous-`GET /` paths.

**Dependencies**

- New NuGet package `Microsoft.AspNetCore.Authentication.JwtBearer` (net8.0).

**Operations**

- The API can no longer start without credential configuration. This is deliberate (fail-fast) and changes local-dev startup.

**Governance**

- `docs/adr/2026-08-01-api-authentication-posture.md` — new ADR; `docs/adr/` does not yet exist and is created by this change.
- Rule R-008 (forwarded headers, blocker) is satisfied by construction — the middleware is not registered.
