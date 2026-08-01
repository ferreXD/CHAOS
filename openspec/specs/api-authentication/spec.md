# api-authentication Specification

## Purpose
TBD - created by archiving change secure-task-api. Update Purpose after archive.
## Requirements
### Requirement: Task routes require an authenticated caller

The API SHALL require a valid JWT bearer token on every route under `/tasks`. Requests without a credential SHALL be rejected before reaching any handler, and SHALL NOT disclose whether the addressed resource exists.

#### Scenario: Request with no credential

- **WHEN** a client calls any of `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}` or `DELETE /tasks/{id}` with no `Authorization` header
- **THEN** the API responds `401 Unauthorized`
- **AND** no task is created, modified or deleted

#### Scenario: Request for a non-existent task with no credential

- **WHEN** a client calls `GET /tasks/{id}` with no `Authorization` header, for an id that does not exist
- **THEN** the API responds `401 Unauthorized` and not `404 Not Found`

#### Scenario: Request with a valid credential

- **WHEN** a client calls a `/tasks` route with a valid, unexpired bearer token
- **THEN** the request reaches the existing handler
- **AND** the response status and body are identical to the behaviour before this change

### Requirement: Invalid and expired credentials are rejected

The API SHALL reject a bearer token that fails signature validation, is expired, or carries an unexpected issuer or audience.

#### Scenario: Token with an invalid signature

- **WHEN** a client presents a bearer token signed with a key other than the configured signing key
- **THEN** the API responds `401 Unauthorized`

#### Scenario: Expired token

- **WHEN** a client presents a bearer token whose `exp` claim is in the past
- **THEN** the API responds `401 Unauthorized`

#### Scenario: Token from an unexpected issuer or audience

- **WHEN** a client presents a correctly signed token whose `iss` or `aud` claim does not match the configured values
- **THEN** the API responds `401 Unauthorized`

### Requirement: The liveness endpoint stays anonymous

The API SHALL continue to serve `GET /` without a credential, so that health checking does not require secret material.

#### Scenario: Anonymous liveness probe

- **WHEN** a client calls `GET /` with no `Authorization` header
- **THEN** the API responds `200 OK` with `{ "service": "task-tracker", "status": "ok" }`

### Requirement: Credential configuration is external and validated at startup

The API SHALL read its signing key, issuer and audience from configuration supplied outside the repository, and SHALL fail to start when any of them is missing. No secret or signing material SHALL be committed to the repository.

#### Scenario: Missing signing key at startup

- **WHEN** the application starts with no signing key configured
- **THEN** startup fails with an error naming the missing configuration
- **AND** the application does not begin listening

#### Scenario: No secret material in the repository

- **WHEN** the repository is inspected
- **THEN** `appsettings.json` contains only non-secret settings such as issuer and audience
- **AND** no signing key, token or credential value is present in any tracked file

### Requirement: A development-only token issuance endpoint exists behind two independent gates

The API SHALL expose a token issuance endpoint **only** when the hosting environment is Development **and** an explicit configuration flag is enabled. The flag SHALL default to disabled, so that either gate alone is sufficient to keep the endpoint absent. The endpoint SHALL be absent from routing — not merely rejecting — when either gate is not satisfied.

#### Scenario: Both gates satisfied

- **WHEN** the app runs in the Development environment with the issuance flag explicitly enabled, and a client calls the issuance endpoint
- **THEN** the API returns a signed bearer token valid for the configured lifetime
- **AND** that token is accepted by the `/tasks` routes

#### Scenario: Not in Development

- **WHEN** the app runs in any environment other than Development, and a client calls the issuance endpoint
- **THEN** the API responds `404 Not Found`
- **AND** the route is absent from the routing table, regardless of the configuration flag

#### Scenario: Flag not enabled

- **WHEN** the app runs in the Development environment with the issuance flag absent or disabled, and a client calls the issuance endpoint
- **THEN** the API responds `404 Not Found`
- **AND** the route is absent from the routing table

#### Scenario: Flag defaults to disabled

- **WHEN** the application starts in Development with no issuance flag configured at all
- **THEN** the issuance endpoint is not registered

### Requirement: Production token issuance is out of scope

The API SHALL NOT expose any token issuance, refresh or revocation capability outside the development-gated endpoint above. Issuing credentials for a real deployment remains the responsibility of a separate change.

#### Scenario: No refresh or revocation surface

- **WHEN** the routing table is inspected in any environment
- **THEN** no route refreshes or revokes a bearer token

