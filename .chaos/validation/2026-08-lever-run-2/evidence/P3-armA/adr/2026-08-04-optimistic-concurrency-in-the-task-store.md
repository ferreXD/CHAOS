# ADR — Optimistic concurrency lives in the task store, not at the endpoint

Status: Accepted
Date: 2026-08-04
Source: RUN-DEC-001
Related change: optimistic-concurrency-updates
Trigger: TRG-002 (M1 posture-crossing, surface `data-store`, raised by adjudication at K1)

## Context

`.chaos/architecture.md` §"Module / boundary model" records a boundary posture
`[INFERENCE · MEDIUM]`:

> Boundary posture: endpoints depend on domain (`TaskStore`) and contracts; domain has no
> dependency on the HTTP layer. Keep that direction — new behaviour (e.g. filtering) belongs
> at the **endpoint/query boundary, not in the store's public shape**, unless a decision says
> otherwise.

§"Data access posture" further records that `Update` replaces via `record with { … }` and that
the store is "the single source of truth in memory", thread-safe via `ConcurrentDictionary`.

The change adds optimistic concurrency control to `PUT /tasks/{id}`: a `version` integer on
the task, incremented on every successful update, and an optional `expectedVersion` on the
update request that must match or the update is rejected with `409 Conflict` leaving the task
untouched. Both halves of that contract touch the store's public shape: `TaskItem` gains a
field, and `Update` gains a *conditional* outcome it did not previously have.

Two placements were available:

- **(A) Endpoint-side check-then-write.** The endpoint reads the task via `store.Get(id)`,
  compares `expectedVersion`, then calls the existing `store.Update(...)`. The store's public
  shape is untouched except for the record field, honouring the letter of the posture line.
- **(B) Store-side conditional update.** `TaskStore.Update` takes the optional
  `expectedVersion` and performs the compare-and-set itself, returning a result that
  distinguishes not-found from version-conflict.

## Decision

Take **(B)**: the compare-and-set lives inside `TaskStore`, and `TaskItem` carries `Version`.
This deliberately crosses the hedged boundary posture, which is exactly what the posture line's
own escape clause ("unless a decision says otherwise") contemplates — hence this ADR.

## Rationale

The posture line's purpose is to stop *query/presentation* concerns (its own example is
filtering) from leaking into the store. Optimistic concurrency is not a query concern: it is a
**write-atomicity invariant of the store itself**. Option (A) implements lost-update protection
with a read, a comparison and a write that are not atomic with respect to each other — it
reintroduces the very race the change exists to close, on the store the architecture explicitly
documents as concurrent (`ConcurrentDictionary`, singleton, shared by all requests). A
concurrency control that is itself racy is a defect, not a compliant design.

Placing the compare-and-set in the store also keeps the invariant "every successful update
increments `Version` by exactly 1" enforceable in one place, so any future caller of
`Update` inherits it rather than being trusted to re-implement it.

The domain→HTTP direction (R-004) is **not** affected: `TaskStore` and `TaskItem` still
reference no ASP.NET type. The endpoint maps the store's outcome onto `200` / `404` / `409`;
HTTP status codes remain entirely an endpoint concern.

## Consequences

- `TaskItem` gains `Version` (int); the serialized task shape gains `version` on **every**
  endpoint that returns a task. This is additive — existing clients ignoring the field are
  unaffected — but it is a public contract change, recorded in the delta spec.
- `TaskStore.Update` gains an `expectedVersion` parameter and returns an outcome that
  distinguishes *not found* from *version conflict*; the endpoint translates that outcome to
  HTTP. Any future caller of `Update` must handle the conflict outcome.
- `.chaos/architecture.md` §"Module / boundary model" should be amended at sync time to record
  that **write-atomicity invariants** are an explicit exception to the "not in the store's
  public shape" line. Until that amendment lands, this ADR is the authorization.
- The posture is crossed **narrowly**: this ADR authorizes store-side placement for
  concurrency/atomicity invariants only. Query, filtering and presentation concerns remain at
  the endpoint boundary as before.

## Sync metadata

Requires ADR: Yes (this document)
Requires rule update: No
Requires gate update: No
Requires architecture amendment: Yes — `.chaos/architecture.md` §"Module / boundary model"
Created by: chaos:run (change `optimistic-concurrency-updates`)
Promotion source: RUN-DEC-001
