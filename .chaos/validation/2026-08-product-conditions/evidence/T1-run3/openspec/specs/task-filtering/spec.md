## ADDED Requirements

### Requirement: Listing tasks without a filter is unchanged

`GET /tasks` SHALL continue to return every task in the store, in creation order, when no `priority` query parameter is supplied. Adding the filter SHALL NOT change the unfiltered response.

Contract statements: C-001.

#### Scenario: No priority parameter supplied

- **WHEN** an authenticated client calls `GET /tasks` with no `priority` query parameter
- **THEN** the API responds `200 OK`
- **AND** the body contains every task held by the store, in creation order

### Requirement: Tasks can be filtered by priority

`GET /tasks` SHALL accept an optional `priority` query parameter naming one of the three `TaskPriority` values — `Low`, `Medium` or `High` — and SHALL return only the tasks whose priority equals the requested value, preserving creation order. The comparison SHALL be case-insensitive, consistent with how the same enum is deserialized on the request-body path.

Contract statements: C-002, C-006.

#### Scenario: Filtering by a valid priority

- **WHEN** an authenticated client calls `GET /tasks?priority=High`
- **THEN** the API responds `200 OK`
- **AND** the body contains exactly the tasks whose priority is `High`, in creation order
- **AND** no task of another priority appears in the body

#### Scenario: Value casing does not matter

- **WHEN** an authenticated client calls `GET /tasks?priority=low`, `GET /tasks?priority=LOW` or `GET /tasks?priority=Low`
- **THEN** all three responses are `200 OK`
- **AND** all three bodies contain the same set of `Low` tasks

#### Scenario: A filter that matches nothing

- **WHEN** an authenticated client filters by a valid priority that no task currently carries
- **THEN** the API responds `200 OK` with an empty array
- **AND** the response is not `404 Not Found`

### Requirement: An unrecognised priority value is rejected

`GET /tasks` SHALL respond `400 Bad Request` with a JSON error body, and no task data, when the `priority` query parameter is present but does not name one of the three accepted values. Rejection SHALL be based on an exact case-insensitive match against the three names, so that values which a permissive enum parse would otherwise accept — comma-separated lists and numeric enum values — are also rejected. An empty value SHALL be rejected rather than treated as if the parameter were absent.

This resolves open question OQ-002 (invalid filter value: `400` versus ignore) in favour of `400`.

Contract statements: C-003, C-007.

#### Scenario: An unknown priority name

- **WHEN** an authenticated client calls `GET /tasks?priority=Urgent`
- **THEN** the API responds `400 Bad Request`
- **AND** the body is a JSON error object carrying no task data

#### Scenario: A comma-separated list of otherwise valid values

- **WHEN** an authenticated client calls `GET /tasks?priority=Low,High`
- **THEN** the API responds `400 Bad Request`
- **AND** the response is not `200 OK` with the `Low` tasks

#### Scenario: A numeric enum value

- **WHEN** an authenticated client calls `GET /tasks?priority=0` or `GET /tasks?priority=2`
- **THEN** the API responds `400 Bad Request`

#### Scenario: An empty priority value

- **WHEN** an authenticated client calls `GET /tasks?priority=`
- **THEN** the API responds `400 Bad Request`
- **AND** the response is not the full unfiltered task list

### Requirement: Filtering stays in the HTTP layer

The filter SHALL be parsed, validated and applied in the endpoint layer over the result of the store's existing `All()` query. The store's public shape SHALL NOT change, preserving the `domain → HTTP` boundary direction (rule R-004) and the architecture posture that new filtering behaviour belongs at the endpoint/query boundary.

Contract statements: C-004, C-005.

#### Scenario: The store is untouched

- **WHEN** the change's diff is inspected
- **THEN** `src/TaskTracker.Api/Domain/TaskStore.cs` and `src/TaskTracker.Api/Domain/TaskItem.cs` are unmodified
- **AND** the filtering logic appears in `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`

#### Scenario: Existing route protections still apply

- **WHEN** an unauthenticated client calls `GET /tasks?priority=High`
- **THEN** the API responds `401 Unauthorized`
- **AND** the rate-limiting policy attached to the `/tasks` group still applies to the filtered route
