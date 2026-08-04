## ADDED Requirements

### Requirement: API-Key Authentication On Task Endpoints
Every request to a `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,
`PUT /tasks/{id}`, `DELETE /tasks/{id}` — SHALL present a valid API key in the `X-Api-Key`
request header. A request with a missing or incorrect `X-Api-Key` header SHALL be rejected
with `401 Unauthorized`.

#### Scenario: Valid key is accepted
- **WHEN** a client sends `GET /tasks` with header `X-Api-Key: test-secret-key` and that is the
  configured key
- **THEN** the API processes the request normally and returns 200

#### Scenario: Missing key is rejected
- **WHEN** a client sends `GET /tasks` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized and no task list

#### Scenario: Incorrect key is rejected
- **WHEN** a client sends `GET /tasks` with header `X-Api-Key: wrong-key`
- **THEN** the API returns 401 Unauthorized and no task list

#### Scenario: Every task route is protected
- **WHEN** a client sends `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}` or
  `DELETE /tasks/{id}` without a valid `X-Api-Key` header
- **THEN** each of those requests returns 401 Unauthorized

### Requirement: Configured API Key With Default
The valid API key SHALL be the string value of configuration key `ApiKey`. When that
configuration value is not set, the valid API key SHALL default to `test-secret-key`.

#### Scenario: Default key applies when unconfigured
- **WHEN** no `ApiKey` configuration value is present and a client sends `GET /tasks` with
  header `X-Api-Key: test-secret-key`
- **THEN** the API returns 200

#### Scenario: Configured key overrides the default
- **WHEN** configuration supplies `ApiKey` as `configured-key` and a client sends `GET /tasks`
  with header `X-Api-Key: configured-key`
- **THEN** the API returns 200

#### Scenario: Default key is refused once a key is configured
- **WHEN** configuration supplies `ApiKey` as `configured-key` and a client sends `GET /tasks`
  with header `X-Api-Key: test-secret-key`
- **THEN** the API returns 401 Unauthorized

### Requirement: Authentication Precedes Task Access
The API-key check SHALL run before any existence or payload-validation check on a `/tasks`
route. An unauthenticated request SHALL NOT read or mutate any task, and SHALL NOT reveal
whether a task id exists.

#### Scenario: Unknown id without a key returns 401, not 404
- **WHEN** a client sends `GET /tasks/{a-nonexistent-guid}` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized (not 404 Not Found)

#### Scenario: Invalid payload without a key returns 401, not 400
- **WHEN** a client sends `POST /tasks` with a blank title and no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized (not 400 Bad Request)

#### Scenario: Unauthenticated delete does not mutate state
- **WHEN** a client sends `DELETE /tasks/{id}` for an existing task with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized and the task is still retrievable with a valid key

### Requirement: Public Health Endpoint
The root health endpoint `GET /` SHALL remain public and SHALL NOT require an API key.

#### Scenario: Root endpoint without a key
- **WHEN** a client sends `GET /` with no `X-Api-Key` header
- **THEN** the API returns 200 with the health payload
