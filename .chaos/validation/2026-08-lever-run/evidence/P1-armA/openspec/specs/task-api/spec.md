## ADDED Requirements

### Requirement: Task Endpoint API-Key Authentication
Every request to a `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,
`PUT /tasks/{id}`, `DELETE /tasks/{id}` — SHALL present a valid API key in the `X-Api-Key`
request header. The valid API key SHALL be the string value of configuration key `ApiKey`,
defaulting to `test-secret-key` when that configuration value is not set. A request to a
`/tasks` route whose `X-Api-Key` header is missing or does not equal the configured key
SHALL be rejected with `401 Unauthorized`, and SHALL NOT read or mutate any task — the
authentication check SHALL run before existence and payload-validation checks. The root
health endpoint `GET /` SHALL remain public and SHALL NOT require a key.

#### Scenario: Valid key is accepted on list
- **WHEN** a client sends `GET /tasks` with header `X-Api-Key: test-secret-key`
- **THEN** the API returns 200 with the task list

#### Scenario: Missing key is rejected
- **WHEN** a client sends `GET /tasks` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized and does not return a task list

#### Scenario: Incorrect key is rejected
- **WHEN** a client sends `GET /tasks` with header `X-Api-Key: wrong-key`
- **THEN** the API returns 401 Unauthorized and does not return a task list

#### Scenario: Authentication precedes existence checks
- **WHEN** a client sends `GET /tasks/{id}` for an id that does not exist, with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized rather than 404 Not Found

#### Scenario: Authentication precedes payload validation
- **WHEN** a client sends `POST /tasks` with a blank title and no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized rather than 400 Bad Request, and no task is created

#### Scenario: Authentication precedes mutation
- **WHEN** a client sends `DELETE /tasks/{id}` for an existing task with an incorrect `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized and the task still exists

#### Scenario: The health endpoint stays public
- **WHEN** a client sends `GET /` with no `X-Api-Key` header
- **THEN** the API returns 200 with the service health payload

#### Scenario: The configured key overrides the default
- **WHEN** configuration key `ApiKey` is set to a value other than `test-secret-key`
- **THEN** only that configured value is accepted on `/tasks` routes and `test-secret-key` is rejected
