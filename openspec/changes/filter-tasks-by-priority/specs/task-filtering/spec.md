## ADDED Requirements

### Requirement: Task list can be filtered by priority

`GET /tasks` SHALL accept an optional `priority` query parameter. When the parameter is present and carries a recognised value, the response SHALL contain only those tasks whose priority equals that value. The response body shape, the task representation, and the creation order of the returned tasks SHALL be unchanged from the unfiltered response.

#### Scenario: Filtering by a priority that matches tasks

- **WHEN** an authenticated client calls `GET /tasks?priority=High`
- **THEN** the API responds `200 OK`
- **AND** the body is a JSON array containing every task whose priority is `High`
- **AND** it contains no task of any other priority
- **AND** the tasks appear in creation order

#### Scenario: Filtering by a priority that matches no task

- **WHEN** an authenticated client calls `GET /tasks?priority=<value>` with a recognised priority that no stored task currently carries
- **THEN** the API responds `200 OK`
- **AND** the body is an empty JSON array, not `404 Not Found`

### Requirement: Omitting the filter returns every task

`GET /tasks` SHALL return every task in the store when no `priority` query parameter is supplied. This behaviour SHALL be identical to the behaviour before filtering was introduced, so that existing callers are unaffected.

#### Scenario: Request with no query parameter

- **WHEN** an authenticated client calls `GET /tasks`
- **THEN** the API responds `200 OK`
- **AND** the body contains every task in the store, in creation order

### Requirement: Priority values are matched case-insensitively

The API SHALL match a supplied `priority` value against the declared priority names (`Low`, `Medium`, `High`) without regard to letter case, so that a value accepted in a request body is also accepted in the query string.

#### Scenario: Lowercase value

- **WHEN** an authenticated client calls `GET /tasks?priority=high`
- **THEN** the API responds `200 OK`
- **AND** the body is identical to the response for `GET /tasks?priority=High`

#### Scenario: Mixed-case and uppercase values

- **WHEN** an authenticated client calls `GET /tasks?priority=HIGH` or `GET /tasks?priority=hIgH`
- **THEN** the API responds `200 OK`
- **AND** the body is identical to the response for `GET /tasks?priority=High`

### Requirement: Unrecognised priority values are rejected

The API SHALL reject a `priority` value that is not one of the declared priority names with `400 Bad Request`, and SHALL NOT return task data in that response. A numeric value SHALL NOT be accepted as a priority, even though the underlying representation is an enumeration. A present-but-empty value SHALL be treated as unrecognised rather than as an omitted parameter.

#### Scenario: Value that is not a priority name

- **WHEN** an authenticated client calls `GET /tasks?priority=Urgent`
- **THEN** the API responds `400 Bad Request`
- **AND** the body carries an error message naming the accepted values
- **AND** the body contains no task data

#### Scenario: Numeric value

- **WHEN** an authenticated client calls `GET /tasks?priority=2` or `GET /tasks?priority=7`
- **THEN** the API responds `400 Bad Request`
- **AND** the body contains no task data

#### Scenario: Present but empty value

- **WHEN** an authenticated client calls `GET /tasks?priority=`
- **THEN** the API responds `400 Bad Request`
- **AND** the unfiltered task list is not returned

### Requirement: Filtering does not alter the store

The filtering behaviour SHALL be implemented in the endpoint layer over the list the task store already returns. The store's public surface and the task representation SHALL NOT change, preserving the direction of the dependency between the HTTP layer and the domain.

#### Scenario: Store contract is untouched

- **WHEN** the filtering change is applied
- **THEN** the task store exposes the same public members as before, with the same signatures
- **AND** the task representation returned to clients is unchanged
- **AND** no domain type references an HTTP-layer type

#### Scenario: Existing task routes are unaffected

- **WHEN** an authenticated client calls `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}` or `DELETE /tasks/{id}`
- **THEN** each responds exactly as it did before filtering was introduced
