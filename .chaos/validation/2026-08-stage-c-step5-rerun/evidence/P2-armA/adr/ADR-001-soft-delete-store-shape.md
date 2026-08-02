# ADR-001 — Soft delete changes the task store's public shape at the mutator only

Status: Accepted
Date: 2026-08-02
Source: PROP-DEC-001 (change `soft-delete-tasks`)
Trigger: TRG-002 — M1 posture-crossing (Stage-C classifier, `adr` dimension 2)
Related change: soft-delete-tasks

## Context

`.chaos/architecture.md` (Module / boundary model) states, hedged `[INFERENCE · MEDIUM]`:

> endpoints depend on domain (`TaskStore`) and contracts; domain has no dependency on the HTTP
> layer. Keep that direction — new behaviour (e.g. filtering) belongs at the endpoint/query
> boundary, not in the store's public shape, unless a decision says otherwise.

The `soft-delete-tasks` contract requires a `deletedAt` field on the task model and requires
`DELETE /tasks/{id}` to retain the row instead of removing it. Both obligations land inside the
domain layer, so the change cannot be delivered without moving the store's public shape. The
Stage-C classifier raised M1 on exactly this line (surface `data-store`), which set `adr` to 2:
no READY verdict until the crossing is recorded here.

## Decision

Accept the crossing, confined to the **mutator**:

1. `TaskItem` gains a nullable positional member `DateTimeOffset? DeletedAt = null`. The default
   keeps every existing 5-argument construction compiling, which is the whole backward-compatible
   "migration" for an in-memory store.
2. `TaskStore.Remove(Guid)` is replaced by `TaskStore.SoftDelete(Guid)`, which stamps
   `DeletedAt = DateTimeOffset.UtcNow` and returns `false` for an unknown **or already
   soft-deleted** id.
3. `TaskStore.All()` and `TaskStore.Get(Guid)` keep their existing shapes and keep returning
   every stored row. **Visibility filtering stays at the endpoint/query boundary** — the
   `includeDeleted` query parameter and the `404` for a soft-deleted id are implemented in
   `Endpoints/TaskEndpoints.cs`, exactly where the posture wants query behaviour.

Rejected: `All(bool includeDeleted)` / a `Get` that hides deleted rows. That would push the
query semantics into the store's public shape — a larger crossing than the contract requires.

## Consequences

- The posture line above is now qualified for this repository: *state* required by a contract may
  live in the domain record; *query/visibility* behaviour still may not live in the store.
- Any future caller of `TaskStore.All()` sees soft-deleted rows and must filter them itself. That
  is a deliberate trade: the store stays a dumb container, the endpoint owns policy.
- `PUT /tasks/{id}` continues to operate on a soft-deleted row (unchanged behaviour of the other
  CRUD endpoints, per the change constraints). If that becomes undesirable it is a follow-up
  decision, not a silent fix here.
- Soft-deleted rows are retained for the process lifetime with no purge/TTL, consistent with the
  non-durable, process-lifetime store posture. Introducing a purge is out of scope.
- `.chaos/architecture.md` should be reconciled to cite this ADR on the boundary-posture line.
  That reconciliation is `chaos:sync`'s job and is **not** performed by this change.

## Compliance

- R-004 (domain must not depend on the HTTP layer): upheld — `Domain/**` references no
  `Microsoft.AspNetCore.*` type; `SoftDelete` takes only a `Guid`.
- R-005 (`TaskState` naming): untouched.
- R-003 (green baseline): the five pre-existing integration tests still pass.
