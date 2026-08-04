# ADR — Soft delete lives in the domain model and the store's public shape

- Date: 2026-08-04
- Status: Accepted
- Change: `soft-delete-tasks`
- Driven by: `TRG-001` (M2 sensitive-surface · data-store), `TRG-002` (M1 posture-crossing · data-store)
- Decision record: `RUN-DEC-001` in `.chaos/changes/soft-delete-tasks/decision-events.md`

## Context

`DELETE /tasks/{id}` today calls `TaskStore.Remove(id)`, which evicts the entry from the
in-memory `ConcurrentDictionary`. The change makes deletion *retentive*: the task stays in the
store and is hidden from the default read paths.

Two classifier triggers fired at intent:

- **M2 (data-store)** — the change alters persistence semantics. "Deleted" stops meaning "gone"
  and starts meaning "retained but hidden". Anything holding a `TaskItem` must now know the
  difference between absent and soft-deleted.
- **M1 (data-store)** — `.chaos/architecture.md` §"Module / boundary model" states, with an
  `[INFERENCE · MEDIUM]` hedge: *"Keep that direction — new behaviour (e.g. filtering) belongs
  at the endpoint/query boundary, not in the store's public shape, unless a decision says
  otherwise."* Adding `DeletedAt` to `TaskItem` and teaching `TaskStore` to distinguish active
  from deleted tasks moves behaviour **into** the store's public shape. Per the adjudication
  contract's rule 8, a hedged posture line is still crossable posture — so the crossing needs a
  decision, which is exactly the escape hatch the posture line names.

## Decision

Model soft deletion **in the domain**, not at the HTTP boundary:

1. `TaskItem` gains a nullable `DateTimeOffset? DeletedAt`, defaulted to `null`, serialized as
   `deletedAt` (`null` for active tasks, ISO-8601 for deleted ones).
2. `TaskStore` gains `SoftDelete(Guid id)` and exposes reads that are *active by default*:
   `All()` returns active tasks; `All(includeDeleted: true)` returns everything; `Get(id)`
   returns only active tasks. The dictionary keeps every row — nothing is evicted.
3. The endpoint layer carries only the HTTP concerns: parsing `?includeDeleted=true`, mapping
   the store's answers to `204` / `404`, and nothing about what "deleted" means.

`TaskStore.Remove` is superseded by `SoftDelete`; hard removal is no longer reachable from the
HTTP surface.

## Rationale — why the posture crossing is accepted rather than avoided

The posture line's purpose is to stop *query concerns* (which subset does this caller want?)
from calcifying into the store. Soft deletion is not a query concern; it is a **lifecycle
property of the entity**. Its `null`/timestamp state has to live on `TaskItem` for the contract
(`"deletedAt": null` on every task JSON) to be satisfiable at all — that requirement is
non-negotiable in the task contract.

The alternative — keeping `TaskItem` clean and holding a side table of deleted ids at the
endpoint layer — was rejected: it splits one entity's state across two owners, makes
`deletedAt` serialization an endpoint-layer projection concern, and leaves the store able to
hand out a "deleted" task to any future caller that does not consult the side table. It would
honour the letter of the posture line while making the invariant *less* enforceable.

Defaulting the store's reads to **active** rather than making every caller filter is the same
argument: the safe default is the one where forgetting to filter cannot leak deleted rows.

## Consequences

- **Boundary direction is preserved.** `Domain/**` still references no ASP.NET type (R-004
  holds); the dependency arrow endpoints → domain is unchanged. What moved is *what the domain
  knows*, not *what it depends on*.
- **The posture doc is now out of date** on one clause. The `unless a decision says otherwise`
  escape is exercised here; `chaos:sync` should fold this ADR into
  `.chaos/architecture.md` §"Module / boundary model" and §"Data access posture" so the next
  change classifies against the amended posture rather than re-crossing this one.
- **Backward compatibility is free**, not migrated: the store is in-memory and rebuilt at every
  process start, and `DeletedAt` defaults to `null`, so the four seeded tasks are active with no
  migration step. There is no on-disk schema to migrate — the "backward-compatible migration"
  requirement is satisfied by the nullable default. Were persistence ever introduced (an
  architecture non-goal today), that column would need a real nullable-with-default migration.
- **Hard delete is no longer offered.** Storage grows monotonically for the process lifetime.
  Acceptable for a single-instance, process-lifetime demo store; a purge/retention policy would
  be its own change.
- **`TaskStore.All()` changes meaning** for any existing caller. Today the only callers are the
  `/tasks` endpoints and the test suite, both updated in this change.

## Alternatives considered

| Option | Why not |
|---|---|
| Deleted-id set held at the endpoint layer | Splits entity state across owners; `deletedAt` becomes a projection; store can still leak deleted rows to future callers. |
| `TaskState.Deleted` enum member | Violates the contract (`deletedAt` must be a timestamp, and status is orthogonal — a Done task can be deleted); would also churn `TaskState`, which R-005 guards. |
| Keep `Remove` and add soft delete alongside | Two deletion semantics on one entity with no caller for the hard one; invites the wrong call site later. |
