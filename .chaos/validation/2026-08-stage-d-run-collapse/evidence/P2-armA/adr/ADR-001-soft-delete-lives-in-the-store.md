# ADR-001 — Soft-delete state lives in the domain model and the store

- status: Accepted (2026-08-03) · change: `soft-delete-tasks`
- run: RUN-2026-08-03-chaos-run-soft-delete-tasks-6985f2
- owed by: `adr 2` (M1 posture-crossing, surface `data-store` — see TRG-002)
- approved by: PROP-DEC-001 (frame approval; resolved-in-arm, no live human)

## Context

`.chaos/architecture.md` (Module / boundary model) states, `[INFERENCE · MEDIUM]`:

> endpoints depend on domain (`TaskStore`) and contracts; domain has no dependency on the HTTP
> layer. Keep that direction — new behaviour (e.g. filtering) belongs at the **endpoint/query
> boundary, not in the store's public shape**, unless a decision says otherwise.

The soft-delete contract commits to the opposite direction for this change: it adds a nullable
`deletedAt` to the `TaskItem` record (the store's public shape) and redefines deletion semantics
inside `TaskStore` (`Remove` becomes a state transition, not an eviction). The posture line is
hedged, and a hedge is still posture — so the crossing is explicit, not incidental.

## Decision

Carry soft-delete state **in the domain model and the store**, not at the endpoint boundary:

1. `TaskItem` gains `DateTimeOffset? DeletedAt` (default `null`), serialized as `deletedAt`.
2. `TaskStore` owns the transition (`SoftDelete(id)`) and exposes active-vs-all reads
   (`All(includeDeleted)`, `Get(id, includeDeleted)`); the endpoint layer only maps query params
   and status codes.
3. The posture line's escape hatch ("unless a decision says otherwise") is exercised here, by
   this ADR.

## Rationale

- **Retention is a store property, not a view property.** The task is retained; only its
  visibility changes. Filtering at the endpoint would leave the store's `Remove` free to evict,
  so a second caller could still hard-delete — the contract would be unenforceable.
- **`deletedAt` is part of the serialized task shape** by contract ("`null` when the task is
  active"), so the model must carry it regardless of where filtering happens.
- **R-004 is untouched**: `Domain/**` gains no ASP.NET reference; the dependency direction
  (endpoints → domain) is unchanged. The crossing is about *where behaviour lives*, not about the
  layering rule.
- **R-005 is untouched**: `TaskState` naming is unchanged; `deletedAt` is a separate field, not a
  new state value.

## Consequences

- The default read path changes meaning: `All()` now means "active tasks". Callers that want the
  old semantics must ask for `includeDeleted: true` — an explicit, tested opt-in.
- Backward compatibility for existing rows is trivial by construction: `DeletedAt` is nullable and
  the seeder does not set it, so the four seeded tasks stay active (contract C-007).
- Hard deletion is no longer reachable through the HTTP surface. Purging soft-deleted tasks is out
  of scope for this change and is not implemented.
- The architecture posture line is now qualified by this ADR for the `data-store` surface; a
  future `chaos:sync` may promote it into `.chaos/architecture.md`.

`[FACT]` posture text quoted from `.chaos/architecture.md`. `[INFERENCE · HIGH]` enforceability
argument. `confidence: HIGH` · `evidence_coverage: COMPLETE` · `assumption_load: LOW`.
