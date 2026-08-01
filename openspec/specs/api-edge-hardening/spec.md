# api-edge-hardening Specification

## Purpose
TBD - created by archiving change secure-task-api. Update Purpose after archive.
## Requirements
### Requirement: Rate limiting applies to unauthenticated traffic

Because the exposed surface faces untrusted callers, the rate limiter SHALL see every request to `/tasks`, including those that will be rejected as unauthenticated. A request that fails authentication SHALL still consume a permit, so that the credential-validation path cannot be flooded for free.

#### Scenario: Unauthenticated flood is throttled

- **WHEN** a caller with no credential issues more requests to `/tasks` within the window than the configured permit count
- **THEN** the excess requests receive `429 Too Many Requests` rather than `401 Unauthorized`

#### Scenario: Rejected requests consume permits

- **WHEN** a caller exhausts the window using requests that each fail authentication
- **THEN** a subsequent request from that caller is rejected with `429`, even if it carries a valid token

#### Scenario: Rate limiting precedes authentication in the pipeline

- **WHEN** the middleware pipeline is inspected
- **THEN** the rate limiter is registered before authentication and authorization, so that no request reaches credential validation without first consuming a permit

### Requirement: The liveness endpoint is rate limited

`GET /` is anonymous and therefore reachable by any caller. It SHALL carry its own rate limit, which MAY be looser than the `/tasks` limit.

#### Scenario: Liveness flood is throttled

- **WHEN** a caller exceeds the configured liveness limit on `GET /`
- **THEN** the API responds `429 Too Many Requests`

#### Scenario: Normal health checking is unaffected

- **WHEN** a monitoring system polls `GET /` at its configured interval
- **THEN** every poll receives `200 OK`

### Requirement: Task routes are rate limited per caller

The API SHALL enforce a fixed-window rate limit on the `/tasks` surface, partitioned per caller, and SHALL reject requests that exceed it rather than serving them. The partition key SHALL be the authenticated caller when one is available and the remote IP address otherwise.

#### Scenario: Caller exceeds the configured limit

- **WHEN** a caller issues more requests to `/tasks` within the window than the configured permit count
- **THEN** the API responds `429 Too Many Requests` to the excess requests
- **AND** no task is created, modified or deleted by a rejected request

#### Scenario: Caller stays within the limit

- **WHEN** a caller issues requests to `/tasks` within the configured permit count
- **THEN** every request is served normally

#### Scenario: Limit is configurable

- **WHEN** the permit count or window is changed in configuration
- **THEN** the enforced limit changes accordingly, with no code change

### Requirement: Cross-origin access is an explicit allow-list

The API SHALL apply a CORS policy whose allowed origins come from configuration. It SHALL NOT combine a wildcard origin with credentialed requests.

#### Scenario: Request from an allowed origin

- **WHEN** a browser client on a configured allowed origin makes a cross-origin request to `/tasks`
- **THEN** the response carries the matching `Access-Control-Allow-Origin` header

#### Scenario: Request from an origin that is not allowed

- **WHEN** a browser client on an origin absent from the allow-list makes a cross-origin request to `/tasks`
- **THEN** the response does not carry an `Access-Control-Allow-Origin` header for that origin

#### Scenario: No wildcard origin on a credentialed endpoint

- **WHEN** the CORS configuration is inspected
- **THEN** the policy does not allow any origin (`*`) together with credentials

### Requirement: Security headers are present on every response

The API SHALL set defensive response headers on all responses, including error responses.

#### Scenario: Headers on a successful response

- **WHEN** a client receives any `2xx` response
- **THEN** the response includes `X-Content-Type-Options: nosniff`
- **AND** the response includes a restrictive `Referrer-Policy`

#### Scenario: Headers on an error response

- **WHEN** a client receives a `401`, `429` or `413` response
- **THEN** the same defensive headers are present

### Requirement: Transport is secured by the application

The application terminates TLS itself. It SHALL redirect plaintext requests to HTTPS and SHALL emit HSTS. It SHALL NOT register forwarded-headers middleware.

#### Scenario: Plaintext request is redirected

- **WHEN** a client makes a plaintext HTTP request
- **THEN** the API redirects it to the HTTPS equivalent

#### Scenario: HSTS is emitted

- **WHEN** a client receives an HTTPS response outside the development environment
- **THEN** the response includes a `Strict-Transport-Security` header

#### Scenario: Forwarded headers are not honoured (rule R-008)

- **WHEN** the middleware pipeline is inspected
- **THEN** `UseForwardedHeaders` is not registered
- **AND** consequently no trusted-proxy set exists that could be left empty
- **AND** an `X-Forwarded-For` header supplied by a caller does not change the client IP the rate limiter partitions on

### Requirement: Oversized request bodies are rejected

The API SHALL enforce a maximum request body size and reject larger payloads without buffering them into memory.

#### Scenario: Body exceeds the maximum size

- **WHEN** a client sends a `POST /tasks` or `PUT /tasks/{id}` body larger than the configured maximum
- **THEN** the API responds `413 Payload Too Large`
- **AND** no task is created or modified

#### Scenario: Body within the maximum size

- **WHEN** a client sends a request body within the configured maximum
- **THEN** the request is processed normally

