# ADR — Optimistic concurrency state and enforcement live in the domain store

- Status: Accepted
- Date: 2026-08-04
- Change: `optimistic-concurrency-updates`
- Run: `RUN-2026-08-04-occ-a1`
- Drivers: TRG-002 (M1 posture-crossing, surface `data-store`), TRG-001 (M2 sensitive-surface,
  surface `data-store` — persistence semantics)
- Decision ref: `RUN-DEC-001`

## Context

`PUT /tasks/{id}` overwrites a task unconditionally. A client holding a stale copy silently
clobbers a concurrent update (lost-update race). The change adds optimistic concurrency
control: an integer `version` on the task, incremented on every successful update, and an
optional `expectedVersion` on `UpdateTaskRequest` that rejects a stale update with
`409 Conflict` and leaves the task untouched.

`.chaos/architecture.md` §"Module / boundary model" states, hedged
(`[INFERENCE · MEDIUM]`, "unless a decision says otherwise"):

> Keep that direction — new behaviour (e.g. filtering) belongs at the endpoint/query
> boundary, not in the store's public shape, unless a decision says otherwise.

Optimistic concurrency cannot honour that preference. The mechanism requires (a) version state
on the persisted entity — `TaskItem` is the store's record type and the only thing the store
persists — and (b) a compare-and-swap that is *atomic with respect to the store*. A check
performed at the endpoint, followed by a separate store write, is a textbook
time-of-check-to-time-of-use race: two concurrent requests can both read `version == 1`, both
pass the endpoint-level check, and both write — reintroducing exactly the lost update the
change exists to prevent. `TaskStore` holds a `ConcurrentDictionary`, so the store is the only
layer that can make the compare-and-swap atomic.

Per the hedged-posture rule, this is a real crossing, and a hedge is not an exemption — it is
an instruction to record a decision. This ADR is that decision.

## Decision

**Version state and the compare-and-swap enforcement both live in the domain layer.**
Specifically:

1. `TaskItem` gains an `int Version` component. It is domain state, not an HTTP concern, and
   it is serialized as `version` by the existing default JSON policy — no HTTP-layer mapping
   is introduced.
2. `TaskStore.Update` gains an optional `expectedVersion` parameter and performs the version
   comparison and the increment atomically inside the store, using
   `ConcurrentDictionary.TryUpdate` with the previously-read snapshot as the comparison value
   so a lost update is impossible even under concurrent writers.
3. The store reports the outcome as a domain-level result (updated / not-found / conflict).
   The endpoint's only job is the transport mapping: conflict → `409`, not-found → `404`,
   updated → `200`.

## Consequences

- **The store's public shape changes.** `TaskItem` gains a component and `TaskStore.Update`
  gains a parameter and a richer return. This is the crossing this ADR authorizes; it is
  bounded to the concurrency mechanism and does not open the store to further HTTP-shaped
  behaviour. The filtering precedent in the posture line — presentation concerns belong at the
  endpoint — is unaffected and still stands.
- **R-004 is preserved.** The domain gains no reference to `Microsoft.AspNetCore.*` or to any
  endpoint type; the conflict outcome is expressed as a domain enum/result, and the HTTP status
  mapping stays in `Endpoints/TaskEndpoints.cs`.
- **R-005 is preserved.** No enum is renamed; `TaskState` naming is untouched.
- **Correctness is materially better than the endpoint-side alternative**, which was rejected
  precisely because it cannot be made race-free against a shared singleton store.
- **Backward compatibility holds.** `expectedVersion` is optional (nullable); when omitted the
  store performs the unconditional last-writer-wins update it performs today, plus the version
  bump. The pre-existing PUT integration test, which omits the field, keeps passing.
- **Persistence non-goal is untouched.** The version counter is in-memory, process-lifetime
  state like the rest of the store. Nothing here introduces durability, and the architecture's
  persistence non-goal is not crossed.

## Alternatives considered

- **ETag / `If-Match` header instead of a body field.** More RESTful, and the conventional way
  to do this over HTTP. Rejected: the task contract pins the mechanism to a body field
  (`expectedVersion`) and a `version` property, and behaviour is checked against that contract.
  Recorded here as the idiomatic option a future change could migrate to.
- **Endpoint-level check-then-write.** Would have honoured the posture line literally.
  Rejected as incorrect: it is racy against a shared singleton store, as argued above.
- **A separate concurrency-token type (e.g. a `RowVersion` value object).** Rejected as
  unjustified ceremony for a demo-scale in-memory store; an `int` is exactly the contract.
