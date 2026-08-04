## Context

The Task Tracker API is a single-project ASP.NET Core Minimal API (`net8.0`). Routes are mapped
functionally in `Endpoints/TaskEndpoints.cs` under a `/tasks` group; the data layer is a
process-lifetime `TaskStore` wrapping a `ConcurrentDictionary<Guid, TaskItem>`, registered as a
singleton and seeded at construction. `TaskStore.All()` is the projection `GET /tasks` returns,
ordered by creation time.

`.chaos/architecture.md` records the boundary posture explicitly: *"endpoints depend on domain
(`TaskStore`) and contracts; domain has no dependency on the HTTP layer. Keep that direction —
new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public
shape, unless a decision says otherwise."* It also lists persistence and authentication among
the project's non-goals.

This change was classified by the CHAOS Stage-D classifier with no preset floor. M2
(data-store) fired at intent from the predicted scope, M4 (decision-density) fired at the
answered frame decision, and M3 (contract-surface) fired at the first diff scan on the additive
route delta — which is what raised the OpenSpec obligation to full depth and produced this
document.

## Goals / Non-Goals

**Goals:**

- Expose the total number of tasks as a single integer over HTTP, cheaply.
- Guarantee the reported number can never disagree with what `GET /tasks` returns at the same
  moment.
- Land the change without touching any existing endpoint's behaviour or the green test baseline.

**Non-Goals:**

- Filtered counts (`/tasks/count?status=open`). The contract asks for the total only; a filtered
  variant would need the filter-validation semantics already specified for `GET /tasks` and is
  deliberately deferred.
- Authentication or authorization on the new route — the API is open by design
  (`.chaos/architecture.md`, non-goals), and this change explicitly introduces none.
- Any persistence or durability change. The store remains in-memory and non-durable.
- Caching, metrics, or an O(1) maintained counter.

## Decisions

**D1 — Compute the count at the endpoint boundary, not in the store's public shape.**
The route body is `Results.Ok(new { count = store.All().Count })`. The alternative — adding a
`Count` member to `TaskStore` — was rejected: the architecture posture reserves the store's
public shape for decisions that need it, and this one does not. Keeping `Domain/**` untouched
means R-004 (domain must not reference the HTTP layer) and R-005 (`TaskState` naming) hold
trivially, and the M2 data-store firing resolves as a scope-prediction artefact rather than a
real persistence-model change. Recorded as `RUN-DEC-001` (option A).

**D2 — Derive from the same projection rather than maintaining a counter.**
`store.All().Count` reads the identical projection `GET /tasks` serializes. A separately
maintained counter would be O(1) instead of O(n), but it introduces a second source of truth
that can drift from the store under concurrent mutation — directly weakening the contract's
central invariant. At the demo's scale the projection cost is irrelevant; correctness is not.

**D3 — Rely on the `:guid` route constraint for disambiguation rather than route ordering.**
`GET /tasks/{id:guid}` cannot match the literal segment `count`, so `GET /tasks/count` is
unambiguous regardless of registration order. The route is nevertheless registered before the
by-id route so a reader sees the specific case first. A test asserts 200 from the count route to
lock this in rather than trusting routing precedence silently.

**D4 — Test in a separate class for store isolation.**
`TaskCountEndpointTests` takes its own `IClassFixture<WebApplicationFactory<Program>>`, giving it
its own host, DI container and therefore its own singleton `TaskStore`. Count assertions are
sensitive to concurrent mutation, and xUnit runs distinct test classes in parallel; a separate
fixture keeps the create/delete delta assertions deterministic while xUnit's sequential
within-class execution keeps each before/after pair stable. Delta assertions (`before + 1`)
are used rather than absolute numbers so the tests do not encode the seed count.

## Risks / Trade-offs

- **O(n) per request.** `All()` materializes and sorts the full task list to return one integer.
  Accepted: the store is a single-instance in-memory demo store, and correctness of the
  list/count invariant is worth more than the allocation. If the store ever grows or gains
  persistence, an O(1) count becomes a legitimate follow-up — and, per the posture, a
  decision-bearing one.
- **Route shadowing.** Low risk given the `:guid` constraint, but a future change that relaxes
  that constraint to `{id}` would silently swallow `/tasks/count`. The integration test asserting
  200 is the regression guard.
- **Count semantics are "total", not "active".** The task title says "active-task count" while
  the contract says total. The contract wins — it is explicit that `count` equals the number of
  items returned by unfiltered `GET /tasks` — and the spec records "total" unambiguously so no
  later reader has to guess.
- **No concurrency guarantee across two calls.** `GET /tasks` and `GET /tasks/count` are separate
  requests; a mutation between them can change the answer. The invariant is specified
  "same store, same moment", which is what a single projection read delivers; it is not a
  distributed-snapshot promise.
