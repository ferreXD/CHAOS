# ADR — Optimistic concurrency lives in the task store's public shape

- Status: Accepted
- Date: 2026-08-03
- Change: `optimistic-concurrency-updates`
- Decision: `.chaos/changes/optimistic-concurrency-updates/decision-events.md` → `PROP-DEC-001`
- Trigger: `TRG-002` — M1 posture-crossing (adjudication, surface `data-store`), which raised the
  `adr` rigor dimension to 2 under Stage-C progressive rigor
- Rules in play: R-004 (domain→HTTP boundary), R-005 (`TaskState` naming)

## Context

`PUT /tasks/{id}` overwrote a task unconditionally. A client working from a stale copy silently
clobbered another writer — a classic lost-update race. The fix is optimistic concurrency: a
monotonically increasing `version` on the task plus an optional `expectedVersion` on the update
request, rejected with `409 Conflict` when stale.

`.chaos/architecture.md` (Module / boundary model) states:

> Boundary posture `[INFERENCE · MEDIUM]`: endpoints depend on domain (`TaskStore`) and
> contracts; domain has no dependency on the HTTP layer. Keep that direction — new behaviour
> (e.g. filtering) belongs at the endpoint/query boundary, **not in the store's public shape**,
> unless a decision says otherwise.

Adding `Version` to `TaskItem` and making `TaskStore.Update` conditional puts new behaviour
squarely in the store's public shape. Per the pinned adjudication contract (rule 8), a hedged
`[INFERENCE]` posture guarded by "unless a decision says otherwise" is still crossable posture,
so the crossing must be decided explicitly rather than absorbed silently. This ADR is that
decision — the "otherwise".

## Options considered

| Option | Summary | Outcome |
|---|---|---|
| **A** | `Version` on `TaskItem`; atomic compare-and-swap inside `TaskStore.Update`; the endpoint maps a conflict to `409` | **Chosen** |
| B | Store shape untouched: the endpoint reads the task, compares versions, then calls the existing `Update` | Rejected |
| C | Do not add concurrency control | Rejected |

## Decision

Option A. The version token and the conditional update are part of the store's contract.
`TaskStore.Update(id, title, status, priority, expectedVersion)` returns an
`UpdateResult(UpdateOutcome, TaskItem?)`; the compare and the write happen inside a single
`ConcurrentDictionary.TryUpdate`, and a lost race is retried against freshly observed state.

## Rationale

- Option B re-creates the very defect being fixed: an endpoint-level check-then-act leaves a
  window between reading the version and writing the update, so two concurrent writers can both
  observe version *n* and both write. Only a store-level compare-and-swap closes it.
- Concurrency control is a property of the state that is being mutated, so the invariant
  ("a write is accepted only against the version it was based on") belongs where the state lives.
- Option C declines the change's purpose.

## Consequences

- **Accepted:** the store's public shape now carries a concurrency token and a conditional
  update overload. The boundary posture in `.chaos/architecture.md` should be read together
  with this ADR from now on.
- **Preserved:** the direction of the dependency is unchanged — `Domain/**` still references no
  ASP.NET types (R-004); the `409` status mapping and the conflict payload stay in
  `Endpoints/TaskEndpoints.cs`. `TaskState` naming is untouched (R-005).
- **Backward compatible:** `expectedVersion` is optional. Clients that omit it keep today's
  last-writer-wins behaviour, which is why the pre-existing PUT test passes unmodified.
- **Bounded:** the crossing is one integer plus one conditional-update path. Anything wider
  (persistence, durable versioning) remains out of scope and would be a new decision.
