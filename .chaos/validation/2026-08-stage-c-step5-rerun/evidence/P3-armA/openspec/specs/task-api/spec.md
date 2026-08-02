# task-api — delta spec (optimistic-concurrency-updates)

> Delta spec only. The `openspec` rigor dimension for this change is **1** (M1 posture-crossing +
> M2 sensitive-surface, both on the `data-store` surface — correlated, so C-13's distinct-surface
> rule does not raise the full set). No proposal/design/tasks artifacts are owed.

## ADDED Requirements

### Requirement: Task Version
Every task SHALL carry an integer `version`, serialized as `version`. A task created via
`POST /tasks` and every seeded task SHALL start at version `1`. Every successful
`PUT /tasks/{id}` SHALL increment the task's `version` by exactly 1.

#### Scenario: Created task starts at version 1
- **WHEN** a client sends `POST /tasks` with a valid body
- **THEN** the API returns 201 and the created task has `version` 1

#### Scenario: Seeded tasks start at version 1
- **WHEN** a client sends `GET /tasks` on a fresh process
- **THEN** every seeded task has `version` 1

#### Scenario: A successful update increments the version
- **WHEN** a client updates a task at version 1 successfully
- **THEN** the API returns 200 and the returned task has `version` 2

### Requirement: Conditional Update (Optimistic Concurrency)
`UpdateTaskRequest` SHALL accept an optional integer `expectedVersion`. When `expectedVersion`
is supplied and does not equal the task's current `version`, the API SHALL reject the update
with `409 Conflict` and SHALL leave the task completely unchanged (no field updated, version not
incremented). When `expectedVersion` is supplied and equals the current `version`, the update
SHALL succeed with `200 OK` and the version SHALL increment. When `expectedVersion` is omitted
(null), the update SHALL proceed unconditionally (last-writer-wins) and the version SHALL
increment. The compare-and-swap SHALL be atomic in the store, not a check-then-act in the
endpoint.

#### Scenario: Stale expectedVersion is rejected
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` 1 while the task is at version 2
- **THEN** the API returns 409 Conflict and the task's fields and version are unchanged

#### Scenario: Matching expectedVersion succeeds
- **WHEN** a client sends `PUT /tasks/{id}` with `expectedVersion` equal to the task's version
- **THEN** the API returns 200 and the task's version increments by 1

#### Scenario: Omitted expectedVersion is unconditional
- **WHEN** a client sends `PUT /tasks/{id}` without `expectedVersion`
- **THEN** the API returns 200, the task is updated, and the version increments by 1

#### Scenario: Other endpoints are unaffected
- **WHEN** a client uses `GET /tasks`, `GET /tasks/{id}`, `POST /tasks` or `DELETE /tasks/{id}`
- **THEN** their behaviour is unchanged apart from the added `version` field on task payloads
