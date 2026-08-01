# API authentication posture for the Task Tracker API

- Status: Accepted
- Date: 2026-08-01
- Change: `secure-task-api`
- Decisions: PROP-DEC-001, PROP-DEC-002, PROP-DEC-004, PROP-DEC-005, REV-DEC-001, REV-DEC-002, REV-DEC-003
- Supersedes: see **Superseded governance** below

## Context

The Task Tracker API was completely open: five CRUD routes under `/tasks` with no credential
check, no rate limiting, and no security headers. The decision was taken to expose it to the
**public internet** (PROP-DEC-002), which made that posture untenable.

The repository records no deployment target and no hosting model, and holds no ADR corpus — this
is the first ADR. Rule **R-008** (forwarded headers only from an explicitly configured trusted
proxy set) was already in force and constrained the transport decision.

## Decision

**Authentication is JWT bearer with a self-issued signing key** (PROP-DEC-004). Every `/tasks`
route requires a valid token; `GET /` stays anonymous as a liveness signal. Signing key, issuer
and audience come from configuration supplied outside the repository, and the application
refuses to start without them.

**The application terminates TLS** (PROP-DEC-005). `UseHttpsRedirection` and `UseHsts` are
enabled; `UseForwardedHeaders` is deliberately **not registered**.

**Edge hardening ships with authentication, not after it** (PROP-DEC-001): per-caller fixed-window
rate limiting, an explicit CORS allow-list, defensive response headers, and a maximum request
body size.

**Rate limiting is registered before authentication** (REV-DEC-002). On a public surface the
untrusted caller population is the unauthenticated one, so a rejected request must consume a
permit; otherwise the credential-validation path can be flooded for free.

**A development-only token issuance endpoint exists behind two independent gates** (REV-DEC-003):
`IsDevelopment()` **and** an opt-in configuration flag defaulting to `false`, applied at route
registration time so the route is absent rather than present-and-refusing.

## Alternatives considered

| Option | Why not |
|---|---|
| Shared API key header | Simplest to build, but a leaked key is valid forever — no expiry, no rotation, no standard revocation. Not defensible against untrusted callers. |
| OIDC against an external IdP | Strongest posture and stores no credential material in the app, but no IdP, tenant, or client registration exists. Would have blocked the change on unprovisioned infrastructure. |
| mTLS | Strong, but a poor fit for public-internet clients we do not control, and pushes the trust decision into undefined hosting. |
| Reverse proxy / CDN terminating TLS | Would require registering forwarded-headers middleware **and** populating a trusted-proxy set that does not exist yet. R-008 names "do not register the middleware" as the safe default. |
| No token issuance at all (review recommendation) | Rejected by the human for PoC practicality. See **Accepted risk**. |

## Consequences

- Existing clients break: every `/tasks` call now needs a bearer token. This is a **BREAKING**
  change, taken deliberately before exposure rather than after.
- The `AddAuthentication().AddJwtBearer(...)` seam can be repointed at an external IdP by
  changing configuration, without touching endpoint code. That is the intended upgrade path.
- The app cannot start without credential configuration. Local development and CI must supply a
  signing key.
- Rate-limit state is in-memory and per-instance; it does not survive restart or scale out. This
  is coherent with the existing single-instance in-memory store.
- Clock skew for token lifetime validation is set to zero, so an expired token is expired.

## Accepted risk

**The development-only issuance endpoint is a deliberate, gated hole.** If it ever reached a
deployed environment it would mint credentials for any caller — a complete bypass of everything
else in this ADR. It is tracked as RK-8 (Critical impact) and was accepted explicitly by the
human on 2026-08-01 with the rationale "Risk accepted", against the review's recommendation to
ship without any issuance.

The mitigation is that two independent mistakes are required to expose it: a wrong
`ASPNETCORE_ENVIRONMENT` **and** an explicitly enabled flag. Because the gate is applied at
registration time, the route cannot exist in a deployed environment even if the flag is on.
Five tests in `DevTokenEndpointTests` assert both gates independently.

**Authenticated is not authorized.** `TaskItem` has no owner field, so any valid token can read
and mutate any task (RK-4). Per-caller authorization is out of scope for this change.

**Production has no token issuer.** The dev endpoint does not close this; a real deployment needs
an issuer or an external IdP before it is usable (RK-5).

## Superseded governance

This ADR **supersedes** the following statements in `.chaos/architecture.md`, which described the
pre-change system and are now false:

- §Non-goals — "Authentication / authorization / multi-tenant concerns" is no longer a non-goal
  for authentication and transport hardening. It remains a non-goal for **per-caller
  authorization** and **multi-tenancy**.
- §Authentication / authorization posture — "None. The API is open." is superseded by this ADR.

It also supersedes the `[UNKNOWN] Persistence, auth, and multi-user concerns are out of scope for
the demo` note in `.chaos/context.md`, insofar as it concerns auth.

Reconciling those two documents is `chaos:sync`'s responsibility (REV-DEC-001,
`sync-action: CREATE_ADR + UPDATE_CHAOS_RULES`) and had not yet run when this ADR was written.
`chaos:apply` does not edit architecture or context directly.
