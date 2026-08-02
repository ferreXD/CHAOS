## ADDED Requirements

### Requirement: API Key Enforcement On Task Routes
Every request to a `/tasks` route SHALL present a valid API key in the `X-Api-Key` request
header. A request with a missing, blank, or non-matching key SHALL be rejected with
`401 Unauthorized` and SHALL NOT reach the task store. The comparison SHALL be fixed-time and
the response body SHALL NOT reveal the expected key or whether a supplied key was close.
The liveness route `GET /` SHALL remain anonymous (see `PROP-DEC-003`).

#### Scenario: Request without an API key is rejected
- **WHEN** a client sends `GET /tasks` with no `X-Api-Key` header
- **THEN** the API returns 401 Unauthorized and no task list

#### Scenario: Request with a wrong API key is rejected
- **WHEN** a client sends `POST /tasks` with `X-Api-Key: not-the-key`
- **THEN** the API returns 401 Unauthorized and the store is unchanged

#### Scenario: Request with the configured API key succeeds
- **WHEN** a client sends `GET /tasks` with `X-Api-Key` set to the configured key
- **THEN** the API returns 200 with the task list, exactly as before the change

#### Scenario: Liveness route stays anonymous
- **WHEN** a client sends `GET /` with no `X-Api-Key` header
- **THEN** the API returns 200 with the service/status payload

### Requirement: API Key Provisioning
The API key SHALL be read from configuration key `Security:ApiKey`, supplied by the
environment (environment variable or user-secrets). No key value SHALL be committed to the
repository; `appsettings.json` MAY declare the key name with an empty value only. When the
configured key is absent or blank at startup, the application SHALL fail to start rather than
serve requests unauthenticated (see `PROP-DEC-002`).

#### Scenario: Missing configured key fails fast
- **WHEN** the application starts with `Security:ApiKey` absent or blank
- **THEN** startup fails with a clear error and no HTTP listener serves task routes

#### Scenario: No key material in the repository
- **WHEN** the repository is inspected after the change
- **THEN** no committed file contains a usable API key value
