# task-api delta — filter-tasks-by-status

> Delta authored at the classified depth (`openspec 1`) for change `filter-tasks-by-status`.
> Scope note, recorded per RUN-DEC-002: this change implements the **`status`** half of the
> existing "List Tasks" requirement only. `priority` filtering and AND-combination of filters
> remain **unimplemented** after this change; the requirement's normative text is deliberately
> left intact rather than narrowed, so the outstanding gap stays visible to the change that
> eventually closes it.

## MODIFIED Requirements

### Requirement: List Tasks
The `GET /tasks` endpoint SHALL return the list of tasks and SHALL accept optional `status`
and `priority` query-param filters. When multiple filters are supplied they SHALL combine with
logical AND. An unrecognized `status` or `priority` value SHALL result in a `400 Bad Request`.
Filter values SHALL be parsed case-insensitively, and a value that is not one of the defined
enum names SHALL be rejected even when it is numerically parseable
(`docs/decision-log/2026-07-19-task-filter-validation.md`).

#### Scenario: List all tasks unfiltered
- **WHEN** a client sends `GET /tasks` with no query parameters
- **THEN** the API returns 200 with every task in the store

#### Scenario: Filter by status
- **WHEN** a client sends `GET /tasks?status=open`
- **THEN** the API returns 200 with only tasks whose status equals Open

#### Scenario: Status filtering is case-insensitive
- **WHEN** a client sends `GET /tasks?status=open` and `GET /tasks?status=Open`
- **THEN** the API returns 200 for both and the two responses contain the same tasks

#### Scenario: Filter by priority
- **WHEN** a client sends `GET /tasks?priority=high`
- **THEN** the API returns 200 with only tasks whose priority equals High

#### Scenario: Combined filters use AND
- **WHEN** a client sends `GET /tasks?status=inprogress&priority=high`
- **THEN** the API returns 200 with only tasks that are both InProgress and High priority

#### Scenario: Invalid status value is rejected
- **WHEN** a client sends `GET /tasks?status=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Numeric out-of-range status value is rejected
- **WHEN** a client sends `GET /tasks?status=99`
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Invalid priority value is rejected
- **WHEN** a client sends `GET /tasks?priority=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list
