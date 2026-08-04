## ADDED Requirements

### Requirement: Count Tasks
The `GET /tasks/count` endpoint SHALL return `200 OK` with a JSON object of the shape
`{ "count": <integer> }`, where `count` is the total number of tasks currently held in the
store. The value SHALL always equal the number of items returned by `GET /tasks` for the same
store at the same moment, and SHALL be derived from that same store projection rather than from
a separately maintained counter. Creating a task via `POST /tasks` (`201 Created`) SHALL
increase `count` by exactly 1; deleting a task via `DELETE /tasks/{id}` (`204 No Content`) SHALL
decrease `count` by exactly 1. The endpoint SHALL be read-only: it SHALL NOT require
authentication, SHALL NOT mutate the store, and SHALL NOT alter the behaviour of the root health
endpoint `GET /` or of any existing `/tasks` CRUD endpoint.

#### Scenario: Count returns the total number of tasks
- **WHEN** a client sends `GET /tasks/count`
- **THEN** the API returns 200 with a JSON object carrying an integer `count` field

#### Scenario: Count agrees with the task list
- **WHEN** a client sends `GET /tasks` and `GET /tasks/count` against the same store at the same moment
- **THEN** `count` equals the number of items in the list returned by `GET /tasks`

#### Scenario: Creating a task increments the count
- **WHEN** a client reads `GET /tasks/count`, then creates a task via `POST /tasks` receiving 201, then reads `GET /tasks/count` again
- **THEN** the second `count` is exactly 1 greater than the first

#### Scenario: Deleting a task decrements the count
- **WHEN** a client creates a task, reads `GET /tasks/count`, then deletes that task via `DELETE /tasks/{id}` receiving 204, then reads `GET /tasks/count` again
- **THEN** the second `count` is exactly 1 less than the first

#### Scenario: The by-id route is not shadowed
- **WHEN** a client sends `GET /tasks/count` while `GET /tasks/{id}` is also mapped
- **THEN** the API returns 200 from the count endpoint and does not return 404 from the by-id route
