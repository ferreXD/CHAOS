## MODIFIED Requirements

### Requirement: Task Representation Carries a Version
A task SHALL carry an integer `version`, serialized as `version`. Newly created tasks and
seeded tasks SHALL start at version `1`. The `version` SHALL increment by exactly 1 on every
successful update of that task.

#### Scenario: Created task starts at version 1
- **WHEN** a client sends `POST /tasks` with a valid body
- **THEN** the API returns 201 with a task whose `version` is 1

#### Scenario: Seeded tasks start at version 1
- **WHEN** a client sends `GET /tasks` against a freshly started API
- **THEN** every seeded task in the response has `version` 1

### Requirement: Update Tasks With Optimistic Concurrency
The `PUT /tasks/{id}` endpoint SHALL accept an optional integer `expectedVersion` on
`UpdateTaskRequest`. When `expectedVersion` is supplied and does not equal the task's current
`version`, the update SHALL be rejected with `409 Conflict` and the stored task SHALL be left
unchanged — no field updated and no version bump. When `expectedVersion` is supplied and equals
the current `version`, the update SHALL succeed with `200 OK` and the `version` SHALL increment
by 1. When `expectedVersion` is omitted (null), the update SHALL proceed unconditionally
(backward-compatible last-writer-wins) and the `version` SHALL increment by 1.

#### Scenario: Update without expectedVersion still succeeds
- **WHEN** a client sends `PUT /tasks/{id}` with a valid body and no `expectedVersion`
- **THEN** the API returns 200 and the returned task's `version` is the previous version + 1

#### Scenario: Update with a matching expectedVersion succeeds
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` equal to the task's current version
- **THEN** the API returns 200 and the returned task's `version` is the previous version + 1

#### Scenario: Update with a stale expectedVersion is rejected
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` different from the task's current version
- **THEN** the API returns 409 Conflict and a subsequent `GET /tasks/{id}` shows the task unchanged, including its `version`

#### Scenario: Conflict check runs before validation-independent side effects
- **WHEN** a stale `PUT /tasks/{id}` is rejected with 409
- **THEN** no field of the stored task is modified and the version is not incremented

#### Scenario: Unknown task is still 404
- **WHEN** a client sends `PUT /tasks/{id}` for an id that does not exist, with or without `expectedVersion`
- **THEN** the API returns 404 Not Found
