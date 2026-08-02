# task-api — delta spec (change: require-api-key-auth)

Delta only. Emitted at the classified `openspec` depth 1 (Stage-C design §9 / C-10, C-13):
M1 and M2 both fired on the **same** surface class `auth`, so the change owes a delta spec,
not the full set. Shaping decision: `PROP-DEC-001`.

## ADDED Requirements

### Requirement: API-key authentication on task endpoints
Every request to a `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,
`PUT /tasks/{id}`, `DELETE /tasks/{id}` — SHALL present a valid API key in the `X-Api-Key`
request header. The valid key SHALL be the string value of configuration key `ApiKey`,
defaulting to `test-secret-key` when that configuration value is not set. A request with a
missing or incorrect `X-Api-Key` header SHALL be rejected with `401 Unauthorized` and SHALL NOT
read or mutate any task — the key check runs before existence and validation checks. The root
health endpoint `GET /` SHALL remain public.

#### Scenario: Valid key is accepted
- **WHEN** a client sends `GET /tasks` with header `X-Api-Key: test-secret-key`
- **THEN** the API returns 200 with the task list

#### Scenario: Missing key is rejected
- **WHEN** a client sends `GET /tasks` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized

#### Scenario: Incorrect key is rejected
- **WHEN** a client sends `POST /tasks` with header `X-Api-Key: wrong-key`
- **THEN** the API returns 401 Unauthorized and no task is created

#### Scenario: Auth precedes existence checks
- **WHEN** a client sends `GET /tasks/{unknown-id}` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized (not 404) and does not read the store

#### Scenario: Configured key overrides the default
- **WHEN** configuration key `ApiKey` is set to another value and a client sends `GET /tasks`
  with that value in `X-Api-Key`
- **THEN** the API returns 200, and the default `test-secret-key` is no longer accepted

#### Scenario: Health endpoint stays public
- **WHEN** a client sends `GET /` with no `X-Api-Key` header
- **THEN** the API returns 200 with the health payload
