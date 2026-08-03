# ADR-001 — Accept the auth posture crossing: API-key authentication on `/tasks`

- Status: Accepted (2026-08-03)
- Change: `require-api-key-auth`
- Owed by: `adr 2` — trigger M1 posture-crossing (`TRG-002`), surface `auth`
- Authorizing decision: `PROP-DEC-001` (frame approval, folds 3)

## Context

`.chaos/architecture.md` states, as an explicit posture: *"Authentication / authorization
posture — None. The API is open. `[FACT]`. Any auth is out of scope and would be strict,
decision-bearing work."* and lists **"Authentication / authorization / multi-tenant concerns"**
under **Non-goals**. The requested change adds API-key authentication to every `/tasks` route.
The change therefore moves directly against a recorded non-goal — `[FACT · HIGH]`, cited from
the posture document itself, not inferred.

Under the constitution §6, a change that contradicts an accepted posture must either be rejected
or drive an explicit, human-approved decision to change that posture, with an audit trail. This
ADR is that trail.

## Decision

Accept the crossing, scoped narrowly:

1. Enforcement is an **HTTP-layer endpoint filter** applied to the `/tasks` route group only.
   The domain (`Domain/**`) is untouched, so R-004 (domain must not depend on the HTTP layer)
   holds by construction and R-005 (`TaskState` naming) is not in play.
2. The key is read from configuration key `ApiKey`, defaulting to `test-secret-key`. The default
   is a **demo/test credential committed on purpose** by the change contract; it is not a
   production secret and grants nothing beyond this in-memory demo store.
3. `GET /` stays public so the liveness signal in the observability posture keeps working.
4. Authorization, identity, multi-tenancy, key rotation, hashing/constant-time comparison and
   rate limiting stay **out of scope** — the non-goal is narrowed, not deleted.

## Consequences

- `.chaos/architecture.md` §"Authentication / authorization posture" and §Non-goals are now
  **stale**: the API is no longer open. Reconciling them is `chaos:sync`'s job at archive time,
  not this run's (this run may not silently edit repository posture docs). `[INFERENCE · HIGH]`
- Every existing integration test must supply the header; the visible suite is updated in the
  same change (R-003 keeps the baseline green).
- A committed default credential is an accepted risk for a demo subject. If this API is ever
  hosted, the default must become a required configuration value — recorded as debt, not fixed
  here. `[ASSUMPTION · MEDIUM]` — the assumption is that this repository stays a demo subject.
- `verify 1` is owed on the `auth` surface: credential/enforcement checks run inside this run.
