## ADDED Requirements

### Requirement: Count Tasks
The `GET /tasks/count` endpoint SHALL return `200 OK` with a JSON object of the shape
`{ "count": <integer> }`, where `count` is the total number of tasks currently held in the
store. The value SHALL be derived from the same enumeration that backs `GET /tasks`, so the
two SHALL never disagree for the same store at the same moment. The endpoint is read-only:
it SHALL NOT require authentication and SHALL NOT alter the persistence model.

#### Scenario: Count returns the store total
- **WHEN** a client sends `GET /tasks/count`
- **THEN** the API returns 200 with `{ "count": <integer> }`

#### Scenario: Count agrees with the task list
- **WHEN** a client sends `GET /tasks/count` and `GET /tasks` against the same store
- **THEN** `count` equals the number of items returned by `GET /tasks`

#### Scenario: Creating a task increments the count
- **WHEN** a client successfully sends `POST /tasks` and receives `201 Created`
- **THEN** a subsequent `GET /tasks/count` reports a `count` exactly one greater than before

#### Scenario: Deleting a task decrements the count
- **WHEN** a client successfully sends `DELETE /tasks/{id}` and receives `204 No Content`
- **THEN** a subsequent `GET /tasks/count` reports a `count` exactly one less than before

#### Scenario: Existing endpoints are unaffected
- **WHEN** the count endpoint is added
- **THEN** `GET /` and every existing `/tasks` CRUD behaviour respond exactly as before
