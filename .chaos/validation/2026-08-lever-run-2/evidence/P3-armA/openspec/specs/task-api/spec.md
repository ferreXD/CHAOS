## ADDED Requirements

### Requirement: Task Version Field
Every task returned by the API SHALL carry an integer `version` field, serialized as `version`.
Newly created tasks and tasks seeded at store construction SHALL start at `version` 1. Each
successful `PUT /tasks/{id}` SHALL increment that task's `version` by exactly 1.

#### Scenario: Created task starts at version 1
- **WHEN** a client sends `POST /tasks` with a valid body
- **THEN** the API returns 201 and the created task has `version` equal to 1

#### Scenario: Seeded tasks start at version 1
- **WHEN** a client sends `GET /tasks` against a freshly started store
- **THEN** every seeded task in the response has `version` equal to 1

#### Scenario: Successful update increments the version
- **WHEN** a client sends a successful `PUT /tasks/{id}` against a task at `version` 1
- **THEN** the API returns 200 and the returned task has `version` equal to 2

#### Scenario: Repeated successful updates keep incrementing
- **WHEN** a client sends two successive successful `PUT /tasks/{id}` requests against a task at `version` 1
- **THEN** the task's `version` is 2 after the first and 3 after the second

### Requirement: Optimistic Concurrency On Task Update
The `PUT /tasks/{id}` request body SHALL accept an optional integer field `expectedVersion`.
When `expectedVersion` is supplied and does not equal the task's current `version`, the API
SHALL reject the update with `409 Conflict` and SHALL leave the task entirely unchanged — no
field updated and no version increment. When `expectedVersion` is supplied and equals the
task's current `version`, the update SHALL succeed with `200 OK` and the version SHALL
increment. When `expectedVersion` is omitted or null, the update SHALL proceed unconditionally
(backward-compatible last-writer-wins) and the version SHALL increment.

#### Scenario: Stale expectedVersion is rejected with 409
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` 1 against a task already at `version` 2
- **THEN** the API returns 409 Conflict

#### Scenario: Rejected update leaves the task unchanged
- **WHEN** a `PUT /tasks/{id}` is rejected with 409 because `expectedVersion` is stale
- **THEN** a subsequent `GET /tasks/{id}` returns the task with its original title, status and priority, and its `version` unchanged

#### Scenario: Matching expectedVersion succeeds
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` equal to the task's current `version`
- **THEN** the API returns 200 and the returned task has `version` incremented by 1

#### Scenario: Omitted expectedVersion updates unconditionally
- **WHEN** a client sends `PUT /tasks/{id}` with no `expectedVersion` field against a task at any `version`
- **THEN** the API returns 200, the task's fields are updated, and its `version` is incremented by 1

#### Scenario: Conflict check precedes update on a missing task
- **WHEN** a client sends `PUT /tasks/{id}` with any `expectedVersion` for an id that does not exist
- **THEN** the API returns 404 Not Found

### Requirement: Concurrency Control Does Not Alter Other Endpoints
Adding optimistic concurrency SHALL NOT change the behaviour of `GET /tasks`,
`GET /tasks/{id}`, `DELETE /tasks/{id}`, or the existing `Title` validation on create and
update, beyond the addition of the `version` field to the serialized task shape.

#### Scenario: Blank title is still rejected
- **WHEN** a client sends `POST /tasks` or `PUT /tasks/{id}` with a blank title
- **THEN** the API returns 400 Bad Request, regardless of `expectedVersion`

#### Scenario: Delete is unaffected
- **WHEN** a client sends `DELETE /tasks/{id}` for an existing task
- **THEN** the API returns 204 No Content as before
