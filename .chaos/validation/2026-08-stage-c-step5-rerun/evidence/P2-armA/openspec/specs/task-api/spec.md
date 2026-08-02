## MODIFIED Requirements

### Requirement: List Tasks
The `GET /tasks` endpoint SHALL return the list of tasks and SHALL accept optional `status`
and `priority` query-param filters. When multiple filters are supplied they SHALL combine with
logical AND. An unrecognized `status` or `priority` value SHALL result in a `400 Bad Request`.
The endpoint SHALL return only **active** (not soft-deleted) tasks by default, and SHALL return
every task — including soft-deleted ones — when `includeDeleted=true` is supplied.

#### Scenario: List all active tasks unfiltered
- **WHEN** a client sends `GET /tasks` with no query parameters
- **THEN** the API returns 200 with every task in the store whose `deletedAt` is null

#### Scenario: List including soft-deleted tasks
- **WHEN** a client sends `GET /tasks?includeDeleted=true`
- **THEN** the API returns 200 with every task in the store, including those whose `deletedAt` is non-null

#### Scenario: Filter by status
- **WHEN** a client sends `GET /tasks?status=open`
- **THEN** the API returns 200 with only tasks whose status equals Open

#### Scenario: Filter by priority
- **WHEN** a client sends `GET /tasks?priority=high`
- **THEN** the API returns 200 with only tasks whose priority equals High

#### Scenario: Combined filters use AND
- **WHEN** a client sends `GET /tasks?status=inprogress&priority=high`
- **THEN** the API returns 200 with only tasks that are both InProgress and High priority

#### Scenario: Invalid status value is rejected
- **WHEN** a client sends `GET /tasks?status=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

#### Scenario: Invalid priority value is rejected
- **WHEN** a client sends `GET /tasks?priority=banana`
- **THEN** the API returns 400 Bad Request and does not return a task list

## ADDED Requirements

### Requirement: Soft Delete Task
The `DELETE /tasks/{id}` endpoint SHALL soft-delete an active task: it SHALL stamp the task's
`deletedAt` with the current time, SHALL retain the task in the store, and SHALL return
`204 No Content`. It SHALL NOT permanently remove the task. For an id that is unknown, or that
refers to an already soft-deleted task, the endpoint SHALL return `404 Not Found`.

#### Scenario: Soft-delete an active task
- **WHEN** a client sends `DELETE /tasks/{id}` for an active task
- **THEN** the API returns 204 No Content and the task is still present in `GET /tasks?includeDeleted=true` with a non-null `deletedAt`

#### Scenario: Delete an unknown id
- **WHEN** a client sends `DELETE /tasks/{id}` for an id that is not in the store
- **THEN** the API returns 404 Not Found

#### Scenario: Delete an already soft-deleted task
- **WHEN** a client sends `DELETE /tasks/{id}` for a task whose `deletedAt` is already set
- **THEN** the API returns 404 Not Found and `deletedAt` is unchanged

### Requirement: Task Deletion Timestamp
The task resource SHALL carry a nullable `deletedAt` field, serialized in JSON as `deletedAt`:
an ISO-8601 timestamp string when the task has been soft-deleted, and `null` while the task is
active. Tasks that existed before this change — including the seeded tasks — SHALL remain active
(`deletedAt` = `null`) with no migration step.

#### Scenario: Active task serializes deletedAt as null
- **WHEN** a client reads an active task via `GET /tasks/{id}`
- **THEN** the JSON body contains `"deletedAt": null`

#### Scenario: Seeded tasks stay active after startup
- **WHEN** the API starts and a client sends `GET /tasks`
- **THEN** all four seeded tasks are returned and each has `deletedAt` equal to null

### Requirement: Retrieve Task Hides Soft-Deleted
The `GET /tasks/{id}` endpoint SHALL return `404 Not Found` for a task whose `deletedAt` is
non-null, and SHALL otherwise return `200 OK` with the task.

#### Scenario: Retrieve a soft-deleted task
- **WHEN** a client sends `GET /tasks/{id}` for a soft-deleted task
- **THEN** the API returns 404 Not Found

#### Scenario: Retrieve an active task
- **WHEN** a client sends `GET /tasks/{id}` for an active task
- **THEN** the API returns 200 OK with the task and `deletedAt` null
