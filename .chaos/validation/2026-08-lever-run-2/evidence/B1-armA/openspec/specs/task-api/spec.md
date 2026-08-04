# task-api Specification Delta — task-count

Delta authored at the M3 firing (`TRG-001`, surface `contract-dependency`), which raised the
`openspec` dimension to 1. Depth 1 owes this delta spec only; the change's full contract of
record is `.chaos/changes/task-count/change.md` §Contract.

## ADDED Requirements

### Requirement: Task Count
The `GET /tasks/count` endpoint SHALL return `200 OK` with a JSON object `{ "count": <integer> }`,
where `count` is the total number of tasks currently in the store. The value SHALL equal the
number of items `GET /tasks` returns for the same store at the same moment, and SHALL move by
exactly one when a task is created or deleted. The endpoint SHALL NOT require authentication and
SHALL NOT alter the persistence model.

#### Scenario: Count reports the number of tasks
- **WHEN** a client sends `GET /tasks/count`
- **THEN** the API returns 200 with a JSON object carrying an integer `count` field

#### Scenario: Count agrees with the task list
- **WHEN** a client sends `GET /tasks` and `GET /tasks/count` against the same store
- **THEN** `count` equals the number of items in the returned task list

#### Scenario: Creating a task increases the count by one
- **WHEN** a client creates a task with `POST /tasks` and receives 201
- **THEN** the next `GET /tasks/count` reports a count exactly one higher than before

#### Scenario: Deleting a task decreases the count by one
- **WHEN** a client deletes an existing task with `DELETE /tasks/{id}` and receives 204
- **THEN** the next `GET /tasks/count` reports a count exactly one lower than before

#### Scenario: Existing endpoints are unaffected
- **WHEN** a client sends `GET /` or any existing `/tasks` CRUD request
- **THEN** the response is unchanged from the behaviour before this change
