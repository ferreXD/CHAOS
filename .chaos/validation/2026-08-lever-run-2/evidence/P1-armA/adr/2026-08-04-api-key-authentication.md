# ADR — API-key authentication on the task endpoints

- **Status:** Accepted (approved via `RUN-DEC-001`, 2026-08-04)
- **Change:** `require-api-key-auth`
- **Supersedes (partially):** `.chaos/architecture.md` § "Authentication / authorization
  posture" and the Non-goals bullet "Authentication / authorization / multi-tenant concerns",
  for the `/tasks` surface only.
- **Knowledge:** FACT (posture text inspected) · **Confidence:** HIGH

## Context

`.chaos/architecture.md` records the API as deliberately open: "None. The API is open.
`[FACT]`. Any auth is out of scope and would be strict, decision-bearing work.", and lists
"Authentication / authorization / multi-tenant concerns" under **Non-goals**. That posture is
unhedged for the non-goal bullet, so the classifier's adjudication pass raised **M1
posture-crossing** (surface `auth`) at K1, alongside the scan's **M2 sensitive-surface** and an
adjudicated **M3 contract-surface** firing for the changed request contract on five
already-public routes.

The incoming intent requires exactly what the posture excludes: a credential on every `/tasks`
route. A posture crossing cannot be absorbed silently (constitution §6) — it is either rejected
or driven by an explicit, recorded decision. This ADR is that record.

## Decision

Adopt shared-secret API-key authentication on the `/tasks` route group:

1. Every `/tasks` route requires a valid `X-Api-Key` request header; missing or incorrect ⇒
   `401 Unauthorized`, evaluated before any existence or payload-validation check.
2. The valid key is `IConfiguration["ApiKey"]`, defaulting to the literal `test-secret-key`.
3. `GET /` (health/liveness) stays public.
4. Enforcement lives in the HTTP layer as an endpoint filter attached to the `/tasks` group
   (design D1/D2). `Domain/**` is untouched, preserving R-004.

The architecture's auth posture is amended **for this surface only**: authentication is no
longer a non-goal for `/tasks`. Authorization (roles, scopes, per-user identity) and
multi-tenancy remain non-goals and are unaffected.

## Alternatives considered

- **Reject the change and keep the API open.** Rejected: the intent is the repository owner's
  explicit instruction, and the posture text itself anticipates that auth would arrive as
  decision-bearing work rather than never.
- **Full ASP.NET authentication scheme + `[Authorize]`.** Rejected as disproportionate: scheme
  registration, policies and a `ClaimsPrincipal` for a single shared secret, with no identity to
  carry. Revisit if per-caller identity ever becomes a goal.
- **Global middleware with a path allow-list.** Rejected: it duplicates routing knowledge in
  `Program.cs` and drifts as routes are added.
- **Require `ApiKey` to be configured and fail startup when unset.** Rejected: it contradicts
  the pinned default in the approved contract and would break the visible test suite's default
  boot.

## Consequences

**Positive**

- The CRUD surface is no longer anonymous; unauthenticated callers cannot read, create, mutate
  or delete tasks, and cannot probe task-id existence (401 precedes 404).
- The enforcement point sits next to the routes it guards, so any future route added to the
  `/tasks` group inherits protection.
- Rollback is a one-line removal with no data migration.

**Negative / accepted risks**

- **AR-1 — a committed default credential.** `test-secret-key` ships in source. Accepted: it is
  a demo credential that keeps the suite booting, not a secret. Any real deployment must supply
  `ApiKey` from the environment. Leaving it unset silently accepts a well-known key.
- **AR-2 — one shared key, no rotation, no expiry, no per-caller identity.** Accepted at this
  posture; revisiting means a new decision, not a code tweak.
- **AR-3 — breaking for every existing `/tasks` client.** Accepted and declared **BREAKING** in
  the OpenSpec proposal; the in-repo test suite is updated in the same change.
- **AR-4 — no auth-failure logging and no rate limiting.** Accepted: observability is a recorded
  `[UNKNOWN]` posture area and out of this change's scope.
- **AR-5 — a route mapped outside the `/tasks` group is not protected.** Accepted and made
  visible by the spec scenario "Every task route is protected".

## Sync action

`CREATE_ADR` — on `chaos:sync`, promote this draft to `docs/adr/` with a sequential display id
and amend `.chaos/architecture.md` § "Authentication / authorization posture" and the Non-goals
list so the posture text stops contradicting the shipped behaviour.
