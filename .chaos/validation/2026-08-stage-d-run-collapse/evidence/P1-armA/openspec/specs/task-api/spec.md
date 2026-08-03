# task-api — delta spec (require-api-key-auth)

Delta spec only (`openspec` dimension 1, C-10/C-13: M1 + M2 both cite the `auth` surface, so
they are correlated and owe a delta, not the full set). Hand-authored: the `openspec` CLI is not
installed in this environment — that is not degraded mode and not a trigger.

## ADDED Requirements

### Requirement: API-key authentication on task endpoints

Every request to any `/tasks` route SHALL present a valid API key in the `X-Api-Key` request
header. The valid key SHALL be the string value of configuration key `ApiKey`, defaulting to
`test-secret-key` when that configuration value is not set. A request with a missing or
incorrect key SHALL be rejected with `401 Unauthorized` before any task is read or mutated.
The root health endpoint `GET /` SHALL remain public.

#### Scenario: Valid key is accepted
- **WHEN** a client sends `GET /tasks` with header `X-Api-Key: test-secret-key`
- **THEN** the API returns 200 with the task list

#### Scenario: Missing key is rejected
- **WHEN** a client sends `GET /tasks` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized and no task is read or mutated

#### Scenario: Incorrect key is rejected
- **WHEN** a client sends `POST /tasks` with header `X-Api-Key: wrong-key`
- **THEN** the API returns 401 Unauthorized and no task is created

#### Scenario: Auth precedes existence and validation checks
- **WHEN** a client sends `GET /tasks/{unknown-id}` or `POST /tasks` with a blank title, in both
  cases without a valid `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized rather than 404 Not Found or 400 Bad Request

#### Scenario: Every task route is covered
- **WHEN** a client sends `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}` or
  `DELETE /tasks/{id}` without a valid `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized for each of them

#### Scenario: Root health endpoint stays public
- **WHEN** a client sends `GET /` with no `X-Api-Key` header
- **THEN** the API returns 200 with the health payload
