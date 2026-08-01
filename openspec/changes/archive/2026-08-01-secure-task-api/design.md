## Context

The Task Tracker API is a single-project ASP.NET Core Minimal API (`net8.0`) with an in-memory `ConcurrentDictionary` store registered as a singleton. Five CRUD routes sit under `/tasks`; `GET /` is a liveness endpoint. There is no authentication, no authorization and no edge hardening anywhere in the pipeline — `Program.cs` registers only `TaskStore`, JSON enum options and the endpoint group.

The decision has been taken to expose this surface to the public internet. Under CHAOS this is a `--strict` change: it crosses the architecture non-goal "Authentication / authorization / multi-tenant concerns", and the architecture document states that any auth "would be strict, decision-bearing work".

Governing constraints already in force:

- **R-008** (blocker) — `X-Forwarded-*` may be honoured only from an explicitly configured trusted proxy set; the middleware must never be registered with both `KnownProxies` and `KnownNetworks` empty.
- **R-003** (blocker) — the 5-test integration baseline stays green.
- **R-004** (major) — endpoints may depend on domain/contracts; the domain must not depend on the HTTP layer.

## Goals / Non-Goals

**Goals:**

- Every `/tasks` route requires a valid, expiring credential.
- The public surface carries abuse controls: rate limiting, CORS allow-listing, security headers, transport security, body size limits.
- Credential material lives outside the repository and its absence fails startup loudly.
- The authentication seam is standard enough to be repointed at an external IdP later without touching endpoint code.

**Non-Goals:**

- **Token issuance.** Nothing here mints, refreshes or revokes tokens.
- **Per-caller authorization.** `TaskItem` has no owner field; every authenticated caller can see and mutate every task. Roles and scopes are a separate change.
- **Persistence of rate-limit state.** In-memory, single-instance, consistent with the existing store.
- **Multi-tenancy.**

## Decisions

### D1 — JWT bearer with a self-issued signing key (over API key, OIDC, mTLS)

`Microsoft.AspNetCore.Authentication.JwtBearer` with signing key, issuer and audience from configuration.

*Why not a shared API key header:* simplest to build, but a leaked key is valid forever — no expiry, no rotation story, no standard revocation. Not defensible against an untrusted caller population.

*Why not OIDC against an external IdP:* the strongest posture and stores no credential material in the app, but no IdP, tenant or client registration exists in this repository. Choosing it would block the change on an external dependency that has not been provisioned.

*Why not mTLS:* strong, but a poor fit for public-internet clients we do not control, and it pushes the trust decision into hosting that is undefined.

JWT bearer is the only option giving expiring credentials without depending on infrastructure that does not exist yet, and `AddAuthentication().AddJwtBearer(...)` is the seam that can later be repointed at an IdP by changing configuration rather than endpoint code.

*Accepted consequence:* nothing in this repository issues tokens. Operationally, tokens must be minted out-of-band until an issuance change lands. This is a real gap, recorded rather than hidden.

### D2 — The application terminates TLS; forwarded-headers middleware is not registered

`UseHttpsRedirection()` + `UseHsts()`; `UseForwardedHeaders()` is deliberately **absent**.

This satisfies R-008 by construction rather than by configuration: with no middleware registered there is no trusted-proxy set that could be left empty, and a caller-supplied `X-Forwarded-For` cannot influence the client IP the rate limiter partitions on.

*Alternative considered:* terminating at a reverse proxy or CDN. Both would require registering forwarded-headers middleware **and** populating `KnownProxies`/`KnownNetworks` from configuration, plus a startup check that the trusted set is non-empty. Deferred — introducing a proxy later is a new decision, not a quiet config edit.

### D3 — Authorization applied at the route group, not per endpoint

`RequireAuthorization()` on the `/tasks` `MapGroup`, so a route added later is protected by default. `GET /` is mapped outside the group and stays anonymous.

*Alternative considered:* a global fallback policy with `AllowAnonymous` on `GET /`. Rejected as easier to get wrong — the failure mode of forgetting `AllowAnonymous` is a broken health check, but the failure mode of the group approach is a compile-visible mapping choice.

### D4 — Fail-fast configuration validation at startup

Signing key, issuer and audience are read at startup; a missing value throws before the host starts listening.

*Alternative considered:* falling back to a development default. Rejected outright — a default signing key that reaches production is the exact failure this change exists to prevent.

### D5 — Rate limiting via the built-in `AddRateLimiter`, fixed window, **registered before authentication**

Built-in middleware, no new dependency beyond the framework. Partition key is the authenticated caller where available, falling back to remote IP (trustworthy precisely because of D2).

**Pipeline order is part of this decision, not an implementation detail.** `UseRateLimiter()` is registered **before** `UseAuthentication()`/`UseAuthorization()`. On a public-internet surface the untrusted caller population is by definition the unauthenticated one; if authorization ran first, a `401` would consume no permit and an attacker could flood JWT signature validation for free. Every request therefore consumes a permit before any credential work happens.

`GET /` is anonymous and outside the `/tasks` group, so it carries its own (looser) limit rather than being left unthrottled.

*Trade-off:* in-memory and per-instance. The architecture already declares horizontal scale-out a non-goal, so this is coherent with the current runtime model.

### D7 — Development-only token issuance behind two independent gates

The API exposes a token issuance endpoint that is registered **only** when `IsDevelopment()` is true **and** an explicit configuration flag (defaulting to off) is enabled. Failing either gate means the route is never mapped, so it returns `404` rather than being present-but-refusing.

*Why two gates rather than one:* an environment-only guard fails open on the single most common operational mistake — `ASPNETCORE_ENVIRONMENT` left or set to `Development` in a deployed environment. That single misconfiguration would otherwise expose an unauthenticated token minter on a public-internet surface, which is a complete bypass of everything else in this change. Requiring an opt-in flag as well means two independent mistakes are needed, and the flag's default-off means a fresh deployment is safe without anyone remembering to set it.

*Why registration-time rather than a runtime check inside the handler:* a mapped-but-guarded route still appears in the routing table and is one refactor away from losing its guard. An unmapped route cannot be called at all.

*Alternative considered:* no issuance at all, with tokens minted out-of-band using the production signing key. Rejected by the human decision (REV-DEC-003) as impractical for the PoC. The trade-off is recorded honestly: this endpoint is a deliberate, gated hole, and it is the highest-severity residual risk in the change.

### D6 — Tests obtain a real token rather than bypassing authentication

The 5 existing integration tests boot the app via `WebApplicationFactory<Program>` and call `/tasks` anonymously; all 5 will fail after this change. Each is updated to present a token signed with a test signing key injected through test configuration.

*Alternative considered:* a test authentication handler that stubs out the real one. Rejected — it would leave the actual JWT validation path untested, which is the part most worth testing.

## Risks / Trade-offs

- **[Credential mechanism chosen for PoC convenience proves inadequate]** → The ADR records the upgrade path to an external IdP explicitly; D1's seam makes that a configuration change rather than a rewrite.
- **[The dev-only issuance endpoint reaches a deployed environment and mints tokens for anyone]** → **Highest residual risk in this change.** Two independent gates (D7), flag defaults off, route unmapped rather than guarded, and tests assert absence outside Development. Residual exposure requires both a wrong `ASPNETCORE_ENVIRONMENT` *and* an explicitly enabled flag.
- **[Production still has no token issuer, so a real deployment needs one before it is usable]** → Scoped out deliberately; the dev endpoint does not close this. Recorded as a follow-up.
- **[Authenticated ≠ authorized: any valid token can mutate any task]** → Explicitly a non-goal; recorded so it is a known gap. Adding an owner field to `TaskItem` is the eventual fix.
- **[Secret material committed by accident]** → Spec requirement plus fail-fast startup; `appsettings.json` carries only non-secret issuer/audience settings.
- **[Someone later puts a proxy in front and "fixes" forwarded headers by registering the middleware with an empty trusted set]** → Exactly the R-008 violation criterion; D2 documents that this requires a new decision.
- **[Rate-limit state lost on restart, and absent across instances]** → Accepted; consistent with the in-memory store and the single-instance non-goal.

## Migration Plan

1. Add the JwtBearer package and the configuration shape (non-secret values in `appsettings.json`).
2. Wire authentication, authorization, rate limiting, CORS, security headers, HSTS/HTTPS redirection and the body size limit in `Program.cs`.
3. Apply `RequireAuthorization()` to the `/tasks` group.
4. Update the 5 existing tests to authenticate; add tests for the `401`, `429`, `413` and anonymous-`GET /` paths.
5. Write the ADR.
6. Provision the signing key in the target environment **before** deploying — the app will not start without it.

**Rollback:** revert the change. There is no data migration and no persisted state, so rollback restores the previous open surface with no cleanup. Note that rolling back re-opens the API, so it is only acceptable while the service is not yet publicly exposed.

## Open Questions

None blocking. All material questions raised during framing were answered and recorded as `PROP-DEC-001` … `PROP-DEC-006` in `.chaos/changes/secure-task-api/decision-events.md`.
