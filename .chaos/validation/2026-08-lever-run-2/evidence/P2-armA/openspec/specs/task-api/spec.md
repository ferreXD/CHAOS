## MODIFIED Requirements

### Requirement: List Tasks
The `GET /tasks` endpoint SHALL return the list of tasks and SHALL accept optional `status`
and `priority` query-param filters. When multiple filters are supplied they SHALL combine with
logical AND. An unrecognized `status` or `priority` value SHALL result in a `400 Bad Request`.

The endpoint SHALL, by default, return only **active** tasks — those whose `deletedAt` is
`null`. It SHALL accept an optional `includeDeleted` query parameter; when `includeDeleted=true`
the endpoint SHALL return all tasks, including soft-deleted ones. Soft-delete exclusion SHALL
combine with any `status`/`priority` filtering by logical AND.

#### Scenario: List all tasks unfiltered
- **WHEN** a client sends `GET /tasks` with no query parameters
- **THEN** the API returns 200 with every **active** task in the store, and no soft-deleted task

#### Scenario: Soft-deleted tasks are hidden by default
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks`
- **THEN** the API returns 200 and the response does not contain that task

#### Scenario: Soft-deleted tasks are returned on request
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks?includeDeleted=true`
- **THEN** the API returns 200 and the response contains that task with a non-null `deletedAt`

#### Scenario: Filter by status
- **WHEN** a client sends `GET /tasks?status=open`
- **THEN** the API returns 200 with only active tasks whose status equals Open

#### Scenario: Filter by priority
- **WHEN** a client sends `GET /tasks?priority=high`
- **THEN** the API returns 200 with only active tasks whose priority equals High

#### Scenario: Combined filters use AND
- **WHEN** a client sends `GET /tasks?status=inprogress&priority=high`
- **THEN** the API returns 200 with only active tasks that are both InProgress and High priority

#### Scenario: Invalid status value is rejected
- **WHEN** a client sends `GET /tasks?status=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Invalid priority value is rejected
- **WHEN** a client sends `GET /tasks?priority=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

## ADDED Requirements

### Requirement: Task Deletion Timestamp
The task resource SHALL carry a nullable deletion timestamp serialized in JSON as `deletedAt`.
It SHALL be `null` for an active task and an ISO-8601 timestamp string once the task has been
soft-deleted. The field SHALL be present on every task representation returned by the API.

#### Scenario: Active task exposes a null deletedAt
- **WHEN** a client retrieves a task that has never been deleted
- **THEN** the task representation contains `deletedAt` with the value `null`

#### Scenario: Soft-deleted task exposes a timestamp
- **WHEN** a client retrieves a soft-deleted task via `GET /tasks?includeDeleted=true`
- **THEN** that task's `deletedAt` is a non-null ISO-8601 timestamp

### Requirement: Soft-Delete a Task
The `DELETE /tasks/{id}` endpoint SHALL soft-delete the task: it SHALL set the task's
`deletedAt` to the current time, SHALL retain the task in the store, and SHALL return
`204 No Content`. It SHALL NOT permanently remove the task. Deleting an id that does not
exist SHALL return `404 Not Found`.

#### Scenario: Deleting an existing task soft-deletes it
- **WHEN** a client sends `DELETE /tasks/{id}` for an existing active task
- **THEN** the API returns 204 No Content and the task is retained with a non-null `deletedAt`

#### Scenario: Deleted task is retained, not removed
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks?includeDeleted=true`
- **THEN** the response still contains that task

#### Scenario: Deleting an unknown id is not found
- **WHEN** a client sends `DELETE /tasks/{id}` for an id that is not in the store
- **THEN** the API returns 404 Not Found

### Requirement: Retrieve a Single Task Excludes Soft-Deleted
The `GET /tasks/{id}` endpoint SHALL return `404 Not Found` for a task whose `deletedAt` is
non-null, so that a soft-deleted task is indistinguishable from an absent one on this endpoint.

#### Scenario: Soft-deleted task is not retrievable by id
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks/{id}` for it
- **THEN** the API returns 404 Not Found

#### Scenario: Active task is still retrievable by id
- **WHEN** a client sends `GET /tasks/{id}` for an active task
- **THEN** the API returns 200 with that task and a `deletedAt` of `null`

### Requirement: Existing Tasks Migrate As Active
Tasks that predate the soft-delete field SHALL be treated as active. The store's seeded tasks
SHALL have a `deletedAt` of `null` after startup, so that existing rows keep working without
migration action.

#### Scenario: Seeded tasks are active after startup
- **WHEN** the application starts and a client sends `GET /tasks`
- **THEN** the API returns 200 with all four seeded tasks, each with `deletedAt` of `null`
