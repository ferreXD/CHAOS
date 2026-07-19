---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: require-api-key-auth
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T17:49:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T17:49:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f (EA-X2 mechanized worktree p1-armA)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:hook-managed-pending"
---

# Decision Events — require-api-key-auth

> **Runtime-flow deviation (documented).** In the normal CHAOS flow (R-001, AGENTS.md §3) each
> material decision is created in the interaction runtime and the command **stops** for a human to
> answer in the Decision Center. This is an **EA-X2 mechanized run with no live human available**.
> Each material decision below is therefore **recorded AND resolved in-arm** with an explicit,
> documented maintainer-style rationale, tagged `resolved-in-arm (no live human; EA-X2 mechanized
> run)`. This substitutes a documented mechanized resolution for the Decision-Center
> stop-and-resume; it is a deliberate, disclosed deviation, not a silent guess.

### AUTH-DEC-001 — Adopt API-key authentication, crossing the architecture NON-GOAL

Command: chaos:propose
Change ID: require-api-key-auth
Mode: strict
Type: POSTURE_CHANGE (architecture NON-GOAL override; constitution §6, R-001)
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run)
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Adopt a **scoped, minimal API-key gate** on the `/tasks` routes, deliberately overriding the
recorded "Authentication/authorization = NON-GOAL" posture in `.chaos/architecture.md`. The
override is bounded: single shared secret via configuration, no user accounts / roles / scopes /
multi-tenant — the rest of the NON-GOAL stands.

Rationale (maintainer-style):
The task explicitly requires authentication, which is the concrete, human-authored instruction
that a posture change needs (constitution §6: contradicting an accepted posture must be an
explicit, approved decision, not a silent one). Adopting the *narrowest* mechanism that satisfies
the contract keeps blast radius minimal and preserves the intent of the NON-GOAL for everything
beyond a single shared key. Recorded here rather than decided in chat, per §3 (no silent
assumptions).

Evidence:
- `.chaos/architecture.md` — "Authentication / authorization posture: None … out of scope …
  strict, decision-bearing work"; Non-goals list auth.
- `.chaos/constitution.md` §6 — posture-contradicting change must drive an explicit decision.
- Task contract — requires `X-Api-Key` auth on `/tasks`.

Impact:
Introduces the `task-api` "Authenticate Task Requests" requirement (OpenSpec delta) and the
HTTP-layer filter. Follow-up: update `.chaos/architecture.md` auth posture at sync (out of this
change's edit scope; noted, not performed here).

Sync action:
- UPDATE_ARCHITECTURE_POSTURE   # promote the auth posture change to architecture.md at chaos:sync

Follow-up owner: maintainer/team

### AUTH-DEC-002 — Enforce via a group-level endpoint filter on `MapGroup("/tasks")`

Command: chaos:propose
Change ID: require-api-key-auth
Mode: strict
Type: DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run)
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Enforce auth with a single group-level `IEndpointFilter` (`ApiKeyEndpointFilter`) attached to
`MapGroup("/tasks")`, rather than (B) `UseWhen` middleware path-matching `/tasks` or (C) an inline
check duplicated in each handler.

Rationale (maintainer-style):
Option A gates all five routes at one attach point, runs **before** the handler body (so before
existence/validation — satisfying "401 before read/mutate"), needs no brittle path-string match,
and leaves `GET /` (mapped on `app`, outside the group) public with no extra work. Option C is
error-prone (easy to forget on a new route) and would scatter auth across handlers; Option B works
but couples enforcement to a path string instead of the route group. Option A is also the most
idiomatic Minimal-API choice and keeps the domain HTTP-free (R-004).

Evidence:
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — all CRUD routes hang off `MapGroup("/tasks")`.
- `src/TaskTracker.Api/Program.cs` — `GET /` mapped on `app`, outside the group.
- ASP.NET Core endpoint filters execute after parameter binding, before the route handler.

Scope impact:
`Endpoints/ApiKeyEndpointFilter.cs` (new) + one `group.AddEndpointFilter<…>()` line in
`Endpoints/TaskEndpoints.cs`. No domain/contract/Program change.

Sync action:
- NONE

Follow-up owner: implementer

### AUTH-DEC-003 — Read `ApiKey` from configuration; default `test-secret-key` when unset

Command: chaos:propose
Change ID: require-api-key-auth
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run)
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
The expected key is `IConfiguration["ApiKey"]`, falling back to `test-secret-key` when the value
is null or whitespace ("not set"). `appsettings.json` is left **without** an `ApiKey` entry so the
documented default path is what actually runs (and what the tests rely on); a real deployment
supplies the key via configuration/secret. Key comparison is `StringComparison.Ordinal`.

Rationale (maintainer-style):
The contract fixes the header (`X-Api-Key`), config key (`ApiKey`), default (`test-secret-key`),
and status (`401`); the only genuine local latitude is "what counts as not set" and "leave the
default in appsettings or not". Treating null-or-whitespace as unset avoids a surprising empty-key
match; leaving `appsettings.json` unset exercises the real default branch. Constant-time comparison
is intentionally out of scope for an in-memory demo (design Non-Goals).

Evidence:
- Task contract — `ApiKey` default `test-secret-key`, header `X-Api-Key`, `401` on mismatch.
- `src/TaskTracker.Api/appsettings.json` — no `ApiKey` key present (default path exercised).
- `src/TaskTracker.Api/Endpoints/ApiKeyEndpointFilter.cs` — `IsNullOrWhiteSpace` fallback + ordinal compare.

Scope impact:
`Endpoints/ApiKeyEndpointFilter.cs` only. No `appsettings.json` change.

Sync action:
- NONE

Follow-up owner: implementer
