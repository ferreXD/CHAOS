## Context

`GET /tasks` (`examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`)
returns `store.All()` unfiltered. Filter values map to the `TaskState {Open, InProgress, Done}`
and `TaskPriority {Low, Medium, High}` enums (`Domain/TaskItem.cs`). The store is an in-memory
`ConcurrentDictionary` singleton; there is no persistence, auth, or external side effect.
Rule **R-004** requires endpoints to depend on the domain, not the reverse; **R-003** requires
the green test baseline to hold; **R-005** requires keeping the `TaskState` name.

## Goals / Non-Goals

**Goals:**
- Optional `status` / `priority` filtering on `GET /tasks`, combined with AND.
- A clear, fail-fast contract for invalid filter values (PROP-DEC-001).
- Keep the endpoint thin and the filter logic unit-testable in the domain.

**Non-Goals:**
- Pagination, sorting, free-text search, or field selection.
- A reusable filter/specification abstraction for other endpoints (deferred; over-engineered
  for a ~12-line change).
- Any change to persistence, the store's shape, or the other CRUD endpoints.

## Decisions

- **Invalid filter value → `400 Bad Request` (PROP-DEC-001).** An unrecognized `status` or
  `priority` value is rejected with `400`, not ignored and not returned as an empty list.
  Rationale (human, Decision Center): *"If passed status doesn't exist in the enum or array of
  values, the most safe approach here is returning a 400."* Alternatives considered:
  *ignore the filter* (masks client typos, can return unexpectedly broad results) and
  *empty list* (ambiguous — indistinguishable from a valid no-match filter). This becomes an
  API-wide input-validation convention (routed to a decision-log entry).
- **Domain-owned filtering (Option B).** Add a `TaskStore` query method that applies the
  AND-composed filters over the store; the endpoint only binds/parses/validates query params
  and delegates. Chosen over inline endpoint LINQ so the filter logic is directly unit-testable
  and the HTTP→domain boundary stays clean (R-004).
- **Parse strategy.** Bind `string?` params and parse to the enums; on parse failure return
  `400`. (Case-sensitivity of the parse is an implementation-level detail left to apply.)

## Risks / Trade-offs

- [A stricter `400` contract could surprise a lenient client] → Documented in the spec and
  promoted to a decision-log convention so future list endpoints follow the same rule.
- [Establishing an API-wide convention from one endpoint] → Scope is stated explicitly
  (applies to list-filter inputs); revisit if a future endpoint needs different semantics.

## Open Questions

- None blocking. Enum parse case-sensitivity is deferred to apply as a local implementation
  decision (not spec-level).
