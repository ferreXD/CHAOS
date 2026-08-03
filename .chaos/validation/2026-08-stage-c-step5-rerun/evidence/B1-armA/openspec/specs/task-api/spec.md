## ADDED Requirements

### Requirement: Count Tasks
The `GET /tasks/count` endpoint SHALL return `200 OK` with a JSON object of the shape
`{ "count": <integer> }`, where `count` is the total number of tasks currently held by the
store. The value SHALL equal the number of items `GET /tasks` returns for the same store at
the same moment, and SHALL be derived at the endpoint boundary from the existing store read
API without changing the store's public shape.

#### Scenario: Count matches the unfiltered task list
- **WHEN** a client sends `GET /tasks/count`
- **THEN** the API returns 200 with `{ "count": N }` where N equals the number of items
  returned by `GET /tasks` at the same moment

#### Scenario: Creating a task increases the count by one
- **WHEN** a client creates a task with `POST /tasks` and receives 201
- **THEN** the next `GET /tasks/count` returns a count exactly one greater than before

#### Scenario: Deleting a task decreases the count by one
- **WHEN** a client deletes a task with `DELETE /tasks/{id}` and receives 204
- **THEN** the next `GET /tasks/count` returns a count exactly one smaller than before
