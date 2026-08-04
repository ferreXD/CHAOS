## ADDED Requirements

### Requirement: Task Version Field
Every task representation returned by the API SHALL carry an integer `version` field. A task
created via `POST /tasks` SHALL be returned with `version` equal to `1`, and every task seeded
into the store at startup SHALL start at `version` `1`.

#### Scenario: Created task starts at version 1
- **WHEN** a client sends `POST /tasks` with a valid body
- **THEN** the API returns 201 and the created task's `version` is 1

#### Scenario: Seeded tasks start at version 1
- **WHEN** a client sends `GET /tasks` against a freshly started API
- **THEN** every returned seeded task has `version` equal to 1

### Requirement: Optimistic Concurrency On Task Update
The `PUT /tasks/{id}` endpoint SHALL increment the task's `version` by 1 on every successful
update. `UpdateTaskRequest` SHALL accept an optional integer `expectedVersion` field. When
`expectedVersion` is supplied and does not equal the task's current `version`, the API SHALL
reject the update with `409 Conflict` and SHALL leave the task entirely unchanged — no field
updated and no version increment. When `expectedVersion` is supplied and equals the current
`version`, the update SHALL succeed with `200 OK` and the version SHALL increment. When
`expectedVersion` is omitted, the update SHALL proceed unconditionally (backward-compatible
last-writer-wins) and the version SHALL increment.

#### Scenario: Update without expectedVersion still succeeds and bumps the version
- **WHEN** a client sends `PUT /tasks/{id}` with a valid body and no `expectedVersion`
- **THEN** the API returns 200 and the returned task's `version` is the previous version plus 1

#### Scenario: Update with a matching expectedVersion succeeds
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` equal to the task's current version
- **THEN** the API returns 200 and the returned task's `version` is the previous version plus 1

#### Scenario: Update with a stale expectedVersion is rejected
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` lower than the task's current version
- **THEN** the API returns 409 Conflict

#### Scenario: A rejected update leaves the task unchanged
- **WHEN** an update is rejected with 409 Conflict
- **THEN** a subsequent `GET /tasks/{id}` returns the task with its fields and `version` exactly as they were before the rejected update

#### Scenario: Repeated successful updates increment monotonically
- **WHEN** a client sends two successive successful `PUT /tasks/{id}` requests against a task at version 1
- **THEN** the task's `version` is 2 after the first and 3 after the second

### Requirement: Unrelated CRUD Behaviour Is Preserved
Adding optimistic concurrency SHALL NOT change the behaviour of `GET /tasks`,
`GET /tasks/{id}`, `DELETE /tasks/{id}`, or the existing `Title` validation on create and
update.

#### Scenario: Blank title is still rejected
- **WHEN** a client sends `POST /tasks` with a blank title
- **THEN** the API returns 400 Bad Request

#### Scenario: Update of an unknown id is still 404
- **WHEN** a client sends `PUT /tasks/{id}` for an id that does not exist
- **THEN** the API returns 404 Not Found
