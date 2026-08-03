## MODIFIED Requirements

### Requirement: List Tasks
The `GET /tasks` endpoint SHALL return only **active** (not soft-deleted) tasks by default, and
SHALL accept an optional `includeDeleted` query parameter. When `includeDeleted=true` is supplied
the endpoint SHALL return all tasks, including soft-deleted ones. Every returned task SHALL carry
a `deletedAt` field: `null` for an active task, an ISO-8601 timestamp string for a soft-deleted one.

#### Scenario: List active tasks by default
- **WHEN** a client sends `GET /tasks` with no query parameters
- **THEN** the API returns 200 with only tasks whose `deletedAt` is null

#### Scenario: List all tasks including soft-deleted
- **WHEN** a client sends `GET /tasks?includeDeleted=true`
- **THEN** the API returns 200 with every task, soft-deleted ones carrying a non-null `deletedAt`

#### Scenario: Seeded tasks are active after startup
- **WHEN** a client sends `GET /tasks` on a freshly started process
- **THEN** the API returns the four seeded tasks, each with `deletedAt` null

### Requirement: Delete Task
The `DELETE /tasks/{id}` endpoint SHALL **soft-delete** the task: it SHALL set the task's
`deletedAt` to the current time, SHALL retain the task in the store, and SHALL return
`204 No Content`. A `DELETE` for an id that does not exist SHALL return `404 Not Found`.

#### Scenario: Delete soft-deletes and returns 204
- **WHEN** a client sends `DELETE /tasks/{id}` for an existing active task
- **THEN** the API returns 204 and the task is retained with a non-null `deletedAt`

#### Scenario: Delete of an unknown id returns 404
- **WHEN** a client sends `DELETE /tasks/{id}` for an id that is not in the store
- **THEN** the API returns 404 Not Found

### Requirement: Get Task By Id
The `GET /tasks/{id}` endpoint SHALL return `404 Not Found` for a soft-deleted task, and SHALL
return `200 OK` with the task (including its `deletedAt: null`) for an active task.

#### Scenario: Get a soft-deleted task returns 404
- **WHEN** a client sends `GET /tasks/{id}` for a task whose `deletedAt` is non-null
- **THEN** the API returns 404 Not Found

#### Scenario: Get an active task returns it
- **WHEN** a client sends `GET /tasks/{id}` for an active task
- **THEN** the API returns 200 with the task and `deletedAt` null

### Requirement: Soft-Deleted Tasks Are Absent From Id-Addressed Operations
A soft-deleted task SHALL read as absent to every id-addressed operation — `GET`, `PUT` and a
repeat `DELETE` SHALL each return `404 Not Found` — so that the only way to observe it is the
explicit `GET /tasks?includeDeleted=true` opt-in. (Decided by APPLY-DEC-001.)

#### Scenario: Repeat delete of a soft-deleted task returns 404
- **WHEN** a client sends `DELETE /tasks/{id}` for a task that is already soft-deleted
- **THEN** the API returns 404 Not Found and the task's original `deletedAt` is unchanged

#### Scenario: Update of a soft-deleted task returns 404
- **WHEN** a client sends `PUT /tasks/{id}` for a task that is already soft-deleted
- **THEN** the API returns 404 Not Found and the task is not modified
