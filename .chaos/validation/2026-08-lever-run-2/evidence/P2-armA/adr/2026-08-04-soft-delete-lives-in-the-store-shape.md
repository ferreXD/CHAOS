# ADR — Soft-delete state lives in the domain model and the store's public shape

- **Change:** `soft-delete-tasks`
- **Date:** 2026-08-04
- **Status:** Accepted (authorized by `RUN-DEC-001`, resolved-in-arm 2026-08-04)
- **Owed by:** classification dimension `adr 2`, raised by trigger **M1** (posture-crossing,
  surface `data-store`) at K1 — see `TRG-002` in `decision-events.md`.
- **Knowledge:** FACT (posture text + code inspected) · **Confidence:** HIGH

## Context

`.chaos/architecture.md` records two posture statements that this change moves against:

1. **Module / boundary model** `[INFERENCE · MEDIUM]` — "endpoints depend on domain
   (`TaskStore`) and contracts; domain has no dependency on the HTTP layer. Keep that
   direction — new behaviour (e.g. filtering) belongs at the endpoint/query boundary, **not in
   the store's public shape**, unless a decision says otherwise."
2. **Data access posture** `[FACT]` — "The store is the single source of truth in memory.
   `All()` returns tasks in creation order".

The approved intent commits to a mechanism, not merely a problem: add a nullable `deletedAt`
to the task model, make `DELETE /tasks/{id}` retain the row, hide soft-deleted tasks from
`GET /tasks` by default, and expose them again via `?includeDeleted=true`. Per the pinned
adjudication contract, a hedged posture statement ("unless a decision says otherwise") is
still crossable posture, so the crossing was raised rather than waived. This ADR is the
decision the hedge points to.

## Decision

**Soft-delete is domain state, not a query-layer concern.** Specifically:

- `TaskItem` gains a nullable `DeletedAt` (`DateTimeOffset?`), serialized as `deletedAt`.
  Deletion state is a property of the task, not of a request.
- `TaskStore` owns the soft-delete transition (`SoftDelete(id)`) and the default visibility
  rule: `All()` returns **active** tasks only; `All(includeDeleted: true)` returns everything.
  `Get(id)` returns active tasks only. The store's public shape therefore changes.
- The endpoint layer stays a translation layer: it binds `includeDeleted` from the query
  string and maps store results to status codes. No deletion predicate is duplicated there.

## Alternatives considered

- **Keep the store shape untouched; filter in the endpoint.** This is what the posture line
  literally prefers. Rejected: the store would have to expose every task unconditionally, and
  *every* current and future reader would have to remember to exclude soft-deleted rows. A
  default that must be re-applied at each call site is the failure mode the "single source of
  truth" posture exists to prevent, and it would make `Get(id)` returning a deleted task the
  default — the opposite of the contract.
- **A separate deleted-tasks collection.** Rejected: it duplicates identity, breaks the
  creation-order guarantee of `All()`, and makes `includeDeleted=true` a merge/sort problem
  for no benefit at this scale.
- **Hard delete + an audit log.** Rejected: the contract explicitly requires the task to be
  *retained and retrievable* via `includeDeleted=true`, which a log does not provide.

## Consequences

- The architecture's boundary line about "the store's public shape" is now qualified: *query
  filtering* stays at the endpoint boundary, but *lifecycle state* (existence/deletion) is
  domain state and lives in the store. Later filtering work (`?status=`, `?priority=`) is
  unaffected and still belongs at the endpoint.
- `All()` keeps returning creation order; only its membership narrows. Callers that want the
  old total-membership behaviour must opt in explicitly.
- R-004 is preserved: `Domain/**` gains no ASP.NET reference — `includeDeleted` is bound in
  `Endpoints/TaskEndpoints.cs` and passed to the store as a plain `bool`.
- R-005 is preserved: `TaskState` naming is untouched; `DeletedAt` is a new field, not a state
  value, so an existing task's `Status` still means what it meant.
- No new non-goal is crossed: this adds **no** persistence/durability (the store is still
  in-memory and still lost on restart), no auth, and no scale-out assumption. The
  "backward-compatible migration" in the intent is a *model* migration — pre-existing rows
  materialize with `deletedAt = null` because the field is nullable and the seeder does not
  set it.

## Follow-up

- `chaos:sync` should reconcile the boundary paragraph in `.chaos/architecture.md` with this
  ADR (`sync-action: CREATE_ADR` on `RUN-DEC-001`). Not done inside this change: the
  architecture doc is repository posture, outside the approved subject scope
  (`src/TaskTracker.Api`, `tests/TaskTracker.Tests`).
