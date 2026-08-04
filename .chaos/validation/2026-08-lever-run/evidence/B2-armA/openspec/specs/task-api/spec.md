# task-api — delta spec for `filter-tasks-by-status`

Delta authored at the firing of M4 (TRG-001), which raised the `openspec` dimension to 1.
Scope of this change: the `status` filter on `GET /tasks` only. The `priority` and
AND-combination clauses of the requirement below were already recorded and already
unimplemented before this change began; per APP-DEC-002 they are restated unchanged and
carried as accepted debt, **not** removed.

## MODIFIED Requirements

### Requirement: List Tasks

The `GET /tasks` endpoint SHALL return the list of tasks and SHALL accept optional `status`
and `priority` query-param filters. When multiple filters are supplied they SHALL combine with
logical AND. An unrecognized `status` or `priority` value SHALL result in a `400 Bad Request`.

The `status` filter value SHALL be matched case-insensitively against the `TaskState` names
(`Open`, `InProgress`, `Done`), so `?status=open` and `?status=Open` select the same tasks.
A value that is not one of those names — including a numeric value such as `?status=0` — is
unrecognized and SHALL be rejected. When `status` is absent the endpoint SHALL return every
task, in the existing creation order.

#### Scenario: List all tasks unfiltered
- **WHEN** a client sends `GET /tasks` with no query parameters
- **THEN** the API returns 200 with every task in the store

#### Scenario: Filter by status
- **WHEN** a client sends `GET /tasks?status=open`
- **THEN** the API returns 200 with only tasks whose status equals Open

#### Scenario: Status matching is case-insensitive
- **WHEN** a client sends `GET /tasks?status=Open` and `GET /tasks?status=open`
- **THEN** both requests return 200 with the same set of tasks

#### Scenario: Filter by priority
- **WHEN** a client sends `GET /tasks?priority=high`
- **THEN** the API returns 200 with only tasks whose priority equals High

#### Scenario: Combined filters use AND
- **WHEN** a client sends `GET /tasks?status=inprogress&priority=high`
- **THEN** the API returns 200 with only tasks that are both InProgress and High priority

#### Scenario: Invalid status value is rejected
- **WHEN** a client sends `GET /tasks?status=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Numeric status value is rejected
- **WHEN** a client sends `GET /tasks?status=0`
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Invalid priority value is rejected
- **WHEN** a client sends `GET /tasks?priority=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

## Delivery note — what this change implements

Implemented here: the `status` filter, its case-insensitive matching, the unfiltered default,
and 400 on an unrecognized `status`. Still unimplemented after this change (pre-existing,
accepted as debt under APP-DEC-002, `sync-action: RECORD_ACCEPTED_RISK`): the `priority`
filter, AND-combination, and 400 on an unrecognized `priority`.
