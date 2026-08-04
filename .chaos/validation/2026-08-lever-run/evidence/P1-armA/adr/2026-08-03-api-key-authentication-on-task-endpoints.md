# ADR — API-key authentication on the `/tasks` endpoints

- **Date:** 2026-08-03
- **Change:** `require-api-key-auth`
- **Status:** Accepted — `RUN-DEC-001` answered A (`RESOLVED-IN-ARM`, 2026-08-03)
- **Trigger of record:** `TRG-002` (M1 posture-crossing, surface `auth`, raised by adjudication at K1)
- **Supersedes / amends:** `.chaos/architecture.md` §"Authentication / authorization posture"
  and the §Non-goals entry "Authentication / authorization / multi-tenant concerns".

## Context

`.chaos/architecture.md` records the governed subject's authentication posture as
`FACT`: *"None. The API is open. Any auth is out of scope and would be strict,
decision-bearing work."* It also lists **"Authentication / authorization / multi-tenant
concerns"** as an explicit **non-goal**. That non-goal is unhedged: it is not an
`[UNKNOWN]` open question but a recorded commitment.

The requested change requires a valid `X-Api-Key` header on every `/tasks` route,
rejecting missing or incorrect keys with `401 Unauthorized`. This commits to a concrete
mechanism and therefore **crosses** the recorded posture. Constitution §6 requires that a
change contradicting an accepted posture either be rejected or drive an explicit,
human-approved decision to change that posture, with an audit trail. This ADR is that
audit trail.

## Decision

Introduce API-key authentication as an **HTTP-layer concern only**, scoped to the
`/tasks` route group:

1. Enforcement is derived from **route-group membership**, not from a path string, and
   lives entirely in the HTTP layer — never in `Domain/**`. This keeps R-004 (domain must
   not depend on the HTTP layer) intact — no domain type gains any knowledge of
   authentication — and it makes "only `/tasks` is protected" a structural property rather
   than a path-matching condition that a future route could silently escape.

   **Mechanism (amended by `RUN-DEC-002`, 2026-08-03).** The `/tasks` group carries a
   `RequireApiKey` metadata marker; middleware registered *after* `UseRouting()` reads that
   marker off the selected endpoint and rejects before the endpoint's delegate runs.

   This clause originally specified an `IEndpointFilter` on the group. That mechanism was
   **rejected on evidence**: in ASP.NET Core minimal APIs the generated request delegate
   binds parameters *before* invoking the endpoint-filter pipeline (the filter context must
   already carry the bound arguments), so a `POST`/`PUT` with an absent or unbindable body
   returns `400 Bad Request` without the filter ever running — a direct violation of
   clause 3 below and of contract statement C-007. Four tests demonstrated it. Endpoint
   selection, by contrast, happens in routing, before binding; middleware placed after
   routing therefore sees the endpoint (and its metadata) while still preceding every
   binding, existence and validation check. Group membership remains what confers
   protection, so the original intent of this clause is preserved and only its mechanism
   changed. Path-prefix middleware was also rejected: it would make "protected" a string
   comparison, which is the brittleness risk RK-1 exists to avoid.
2. The expected key is read from configuration key `ApiKey`, falling back to
   `test-secret-key`. The fallback is a **demo default**, not a secret: it is committed
   in the specification and in the tests by design, because this repository's governed
   subject is a demo API with no production hosting defined
   (`.chaos/architecture.md` §Runtime / deployment model, `[UNKNOWN]`).
3. Authentication is evaluated **before** existence and payload validation, so an
   unauthenticated caller cannot probe for task existence or trigger validation
   behaviour. This is the security-meaningful ordering property and is specified and
   tested explicitly.
4. `GET /` stays public: it is the liveness signal
   (`.chaos/architecture.md` §Observability / release safety posture) and gating it
   would break the documented health check.

## Consequences

- **Posture amended.** The architecture non-goal "Authentication / authorization /
  multi-tenant concerns" no longer holds for the `/tasks` surface. `chaos:sync` should
  carry this ADR into `.chaos/architecture.md` §"Authentication / authorization posture"
  and narrow the non-goal to authorization / multi-tenancy, which remain out of scope.
- **Breaking for existing clients.** Every previously-open `/tasks` caller must now send
  `X-Api-Key`. The visible test suite is updated in this change; any other consumer is
  out of this repository's scope.
- **Not a production auth story.** A shared static key offers no per-caller identity, no
  rotation, no revocation, and no rate limiting. Authorization (who may do what),
  multi-tenancy, and secret management stay non-goals. Anything beyond a single shared
  key is a separate, decision-bearing change.
- **Confidence:** `knowledge: FACT` for the posture text and the mechanism;
  `confidence: HIGH`; `evidence_coverage: COMPLETE` (posture, rules, and the full HTTP
  surface were inspected directly); `assumption_load: LOW`.
