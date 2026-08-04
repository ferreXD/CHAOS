## MODIFIED Requirements

### Requirement: List Tasks
The `GET /tasks` endpoint SHALL return the list of tasks and SHALL accept optional `status`
and `priority` query-param filters. When multiple filters are supplied they SHALL combine with
logical AND. An unrecognized `status` or `priority` value SHALL result in a `400 Bad Request`.
By default the endpoint SHALL return only **active** tasks (tasks whose `deletedAt` is `null`).
It SHALL additionally accept an optional `includeDeleted` boolean query parameter; when
`includeDeleted=true` the endpoint SHALL return all tasks, including soft-deleted ones.

#### Scenario: List all tasks unfiltered
- **WHEN** a client sends `GET /tasks` with no query parameters
- **THEN** the API returns 200 with every active task in the store

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

#### Scenario: Soft-deleted tasks are hidden by default
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks`
- **THEN** the API returns 200 and the response does not contain that task

#### Scenario: Soft-deleted tasks are visible on request
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks?includeDeleted=true`
- **THEN** the API returns 200 and the response contains that task with a non-null `deletedAt`

## ADDED Requirements

### Requirement: Task Representation Carries A Deletion Timestamp
The JSON representation of a task SHALL carry a `deletedAt` property. `deletedAt` SHALL be
`null` for an active task and an ISO-8601 timestamp string for a soft-deleted task. Tasks that
existed before this change — including the tasks seeded at startup — SHALL remain active, i.e.
SHALL serialize `deletedAt` as `null` without any migration step.

#### Scenario: An active task serializes deletedAt as null
- **WHEN** a client retrieves a task that has never been deleted
- **THEN** the task JSON contains `"deletedAt": null`

#### Scenario: Seeded tasks remain active after startup
- **WHEN** the application starts and a client sends `GET /tasks`
- **THEN** the API returns the four seeded tasks and each has `deletedAt` equal to `null`

### Requirement: Delete Task Is A Soft Delete
The `DELETE /tasks/{id}` endpoint SHALL soft-delete the task: it SHALL set the task's
`deletedAt` to the current time and SHALL return `204 No Content`. It SHALL NOT permanently
remove the task from the store. When the supplied id does not identify a known task, the
endpoint SHALL return `404 Not Found`.

#### Scenario: Deleting an existing task soft-deletes it
- **WHEN** a client sends `DELETE /tasks/{id}` for an existing active task
- **THEN** the API returns 204 No Content and the task is still retained with a non-null `deletedAt`

#### Scenario: A soft-deleted task is retained, not removed
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks?includeDeleted=true`
- **THEN** the API returns 200 and the response still contains that task

#### Scenario: Deleting an unknown id is not found
- **WHEN** a client sends `DELETE /tasks/{id}` for an id that does not exist
- **THEN** the API returns 404 Not Found

#### Scenario: Deleting an already soft-deleted task is not found
- **WHEN** a client sends `DELETE /tasks/{id}` for a task that is already soft-deleted
- **THEN** the API returns 404 Not Found and the task's original `deletedAt` is unchanged

### Requirement: Update Task Hides Soft-Deleted Tasks
The `PUT /tasks/{id}` endpoint SHALL treat a soft-deleted task as absent: it SHALL return
`404 Not Found` and SHALL NOT modify the soft-deleted task. Its behaviour toward active tasks
SHALL be unchanged.

#### Scenario: Updating an active task still succeeds
- **WHEN** a client sends `PUT /tasks/{id}` with a valid body for an existing active task
- **THEN** the API returns 200 with the updated task

#### Scenario: Updating a soft-deleted task is not found
- **WHEN** a task has been soft-deleted and a client sends `PUT /tasks/{id}` for it
- **THEN** the API returns 404 Not Found and the task is left unmodified

### Requirement: Retrieve Task By Id Hides Soft-Deleted Tasks
The `GET /tasks/{id}` endpoint SHALL return `200 OK` with the task for an active task, and
SHALL return `404 Not Found` when the identified task has been soft-deleted or does not exist.

#### Scenario: Retrieving an active task succeeds
- **WHEN** a client sends `GET /tasks/{id}` for an existing active task
- **THEN** the API returns 200 with the task and `"deletedAt": null`

#### Scenario: Retrieving a soft-deleted task is not found
- **WHEN** a task has been soft-deleted and a client sends `GET /tasks/{id}` for it
- **THEN** the API returns 404 Not Found
