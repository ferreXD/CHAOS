## MODIFIED Requirements

### Requirement: List Tasks
The `GET /tasks` endpoint SHALL return the list of tasks and SHALL accept optional `status`
and `priority` query-param filters. When multiple filters are supplied they SHALL combine with
logical AND. An unrecognized `status` or `priority` value SHALL result in a `400 Bad Request`.
All of this behaviour SHALL be reachable only by an authenticated caller: the request SHALL
carry a valid `X-Api-Key` header (see the `task-api-auth` capability), and an unauthenticated
request SHALL be rejected with `401 Unauthorized` before any filter parsing or validation.

#### Scenario: List all tasks unfiltered
- **WHEN** a client sends `GET /tasks` with a valid `X-Api-Key` header and no query parameters
- **THEN** the API returns 200 with every task in the store

#### Scenario: Filter by status
- **WHEN** a client sends `GET /tasks?status=open` with a valid `X-Api-Key` header
- **THEN** the API returns 200 with only tasks whose status equals Open

#### Scenario: Filter by priority
- **WHEN** a client sends `GET /tasks?priority=high` with a valid `X-Api-Key` header
- **THEN** the API returns 200 with only tasks whose priority equals High

#### Scenario: Combined filters use AND
- **WHEN** a client sends `GET /tasks?status=inprogress&priority=high` with a valid
  `X-Api-Key` header
- **THEN** the API returns 200 with only tasks that are both InProgress and High priority

#### Scenario: Invalid status value is rejected
- **WHEN** a client sends `GET /tasks?status=banana` with a valid `X-Api-Key` header
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Invalid priority value is rejected
- **WHEN** a client sends `GET /tasks?priority=banana` with a valid `X-Api-Key` header
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Unauthenticated list is rejected before filtering
- **WHEN** a client sends `GET /tasks?status=banana` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized (not 400 Bad Request)
