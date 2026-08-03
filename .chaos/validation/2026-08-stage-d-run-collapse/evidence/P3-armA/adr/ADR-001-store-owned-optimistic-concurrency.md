# ADR-001 — Optimistic concurrency is owned by `TaskStore`, not the endpoint

- Status: Accepted
- Date: 2026-08-03
- Change: `optimistic-concurrency-updates`
- Decision record: `PROP-DEC-001` (S1 frame approval, `approves-change: true`, folds 3)
- Trigger: `TRG-002` — M1 posture-crossing (surface `data-store`, raised by adjudication),
  which set `adr 2` on the dimension vector
- Owed by: classified vector `stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 ·
  verify 1 · openspec 1 · adr 2`

## Context

`PUT /tasks/{id}` overwrites a task unconditionally. Two clients editing from the same read
silently lose one of the two updates. Closing that requires a compare-and-set: the writer states
the version it believed it was updating, and the write is rejected if reality moved on.

`.chaos/architecture.md` states the boundary posture as `[INFERENCE · MEDIUM]`:

> endpoints depend on domain (`TaskStore`) and contracts; domain has no dependency on the HTTP
> layer. Keep that direction — new behaviour (e.g. filtering) belongs at the endpoint/query
> boundary, not in the store's public shape, **unless a decision says otherwise**.

Adding `version` to `TaskItem` and compare-and-set semantics to `TaskStore.Update` is exactly a
change to "the store's public shape". Per the pinned adjudication contract (rule 8, hedged
posture is still posture) this is a real crossing, so it needs a decision — this one.

## Decision

1. `TaskItem` gains an integer `Version`, serialized as `version`. Seeded and newly created
   tasks start at `1`.
2. `TaskStore.Update` takes an optional `expectedVersion` and performs the version check and the
   increment **inside the store**, returning a three-state outcome:
   `NotFound` · `VersionConflict` · `Updated(task)`.
3. `TaskEndpoints` translates that outcome into HTTP: `404`, `409 Conflict`, `200 OK`. The
   endpoint performs no read-compare-write of its own.
4. The alternative — endpoint reads, compares, writes back — is **rejected**: it is not atomic
   against the shared `ConcurrentDictionary`, so it reintroduces the very lost-update race
   between its read and its write.

## Consequences

- The domain→HTTP direction is preserved (R-004): the store returns a domain-level outcome and
  knows nothing about status codes; only `TaskEndpoints` mentions `409`.
- `TaskStore.Update`'s signature changes. It is internal to this solution (endpoints are its only
  caller), so there is no external consumer to break; the additive HTTP contract stays
  backward-compatible because `expectedVersion` is optional.
- `TaskItem` grows a field, so every task JSON payload now carries `version`. This is additive:
  existing clients that ignore unknown fields are unaffected.
- Durability is **not** introduced. The store stays an in-memory `ConcurrentDictionary`, so the
  architecture non-goal "persistence / durability across restarts" is untouched. Version numbers
  reset with the process, which is correct for a process-lifetime store.
- `TaskState` naming is untouched (R-005).

## Posture reconciliation

`.chaos/architecture.md` "Module / boundary model" and "Data access posture" should be read
together with this ADR: store-public-shape behaviour is permitted where it is the only place the
behaviour can be made atomic, and only with a recorded decision. Promoting that sentence into the
posture doc itself is a `chaos:sync` follow-up, not part of this change.
