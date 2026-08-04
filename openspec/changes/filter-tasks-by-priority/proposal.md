## Why

`GET /tasks` returns every task, unfiltered. A client that only cares about high-priority work has to fetch the whole list and filter it locally. `.chaos/context.md` names this as the deliberate gap in the API, and `.chaos/architecture.md` names query filtering on `GET /tasks` as the known extension point.

The change is additive and read-only. Its one genuinely open question — what an unrecognised filter value should do — was open question OQ-002 in `.chaos/context.md`; the change intent answers it (`400`), and the residual matching boundary (case sensitivity, present-but-empty value) was settled by `RUN-DEC-001` before implementation.

This artifact exists because the CHAOS classifier raised the `openspec` dimension to 1 at checkpoint K2 (trigger M4, decision-density). It is scoped to the delta spec the classification owes.

## What Changes

- `GET /tasks` accepts an **optional** `priority` query parameter.
- With a recognised value (`Low`, `Medium`, `High`, matched case-insensitively), the response contains only tasks at that priority, in the creation order the store already guarantees.
- With **no** `priority` parameter, the response is every task — identical to today's behaviour. This is not a breaking change for any existing caller.
- With an unrecognised value — including a present-but-empty one (`?priority=`) — the response is `400 Bad Request`, using the error body shape the endpoint group already uses for validation failures.
- Filtering is applied in the endpoint layer over the result of `store.All()`.

**Non-goals** (deliberately excluded):

- **`?status=` filtering.** The architecture names `?status=` as part of the same extension point, and combining the two with AND. This change delivers `priority` only; `status` is a separate change.
- **Any change to `TaskStore` or `TaskItem`.** An explicit constraint of the intent, and consistent with the architecture's boundary posture that filtering belongs at the endpoint/query boundary and not in the store's public shape.
- **Pagination, sorting or field selection.** Not requested; the response shape and order are unchanged.

## Capabilities

### New Capabilities

- `task-filtering`: query-parameter filtering of the task list — which parameters `GET /tasks` accepts, how values are matched, what an omitted parameter means, and how an unrecognised value is answered.

### Modified Capabilities

<!-- None. openspec/specs/ contains api-authentication and api-edge-hardening only; the
     unfiltered list behaviour of GET /tasks has never been captured as an OpenSpec
     requirement, so there is no existing requirement block to restate as MODIFIED. -->

## Impact

**Code**

- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — the `GET /tasks` handler gains the optional query parameter, value validation and the filtering step.

**Tests**

- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` — new integration tests for the filtered, unfiltered, case-variant, empty-value and unrecognised-value paths. The 5 existing CRUD tests are unaffected and must stay green.

**Dependencies**

- None. No new package; `TaskPriority` already exists in the domain.

**Operations**

- None. No configuration, startup or deployment change.

**Governance**

- No ADR owed (`adr` dimension 0). The matching boundary is recorded as `RUN-DEC-001` in `.chaos/changes/filter-tasks-by-priority/decision-events.md`; it promotes no rule.
- Closes the filtering half of open question OQ-002 in `.chaos/context.md`.
