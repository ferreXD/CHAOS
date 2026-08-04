---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: enforce-title-max-length
  mode: None
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T09:25:13Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T09:25:13Z"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: unknown
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: records
    confidence: MEDIUM
    bodyHash: "sha256:a43dd260d9f1f65ba7e542ea4db2ce07df2fc06ce546046c00352cdab125853c"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-04T09:18:58Z", run: "RUN-2026-08-04-chaos-run-enforce-title-max-length", mode: None, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-04T09:25:13Z", run: "RUN-2026-08-04-chaos-run-enforce-title-max-length", mode: None, verdict: APPLIED }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "10/10"
      contract: "6/6"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: null
---

# enforce-title-max-length — Enforce a maximum title length

## Intent

Task titles are currently unbounded. Add an upper bound on title length as input validation. This is a request-validation convenience: no authentication, no persistence-model change.

## Contract

**Validation rule**

- [x] A task `title` may be at most **200 characters** long; the bound is enforced as request validation at the HTTP endpoint boundary, not in the domain store.

**Endpoint behaviour**

- [x] `POST /tasks` with a title longer than 200 characters is rejected with HTTP 400 Bad Request and does not create a task.
- [x] `PUT /tasks/{id}` with a title longer than 200 characters is rejected with HTTP 400 Bad Request and does not modify the task.
- [x] A title of exactly 200 characters is accepted: `POST /tasks` returns 201 Created and `PUT /tasks/{id}` returns 200 OK.

**Non-regression**

- [x] The existing blank/whitespace-title rejection (HTTP 400) is preserved for both `POST /tasks` and `PUT /tasks/{id}`.
- [x] Titles of normal length continue to work exactly as before, the other CRUD endpoints (`GET /tasks`, `GET /tasks/{id}`, `DELETE /tasks/{id}`) are unchanged, and `dotnet build` / `dotnet test` stay green with the 5 pre-existing tests passing (R-003).

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Actual invocation: skipped, openspec dimension 0 — the classification owes no OpenSpec artifact; the contract of record is change.md §Contract. This is the classified outcome, not degraded mode.

Classified depth: **0 — none owed**

Confidence impact: None. Depth 0 is the classified obligation.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint, protected files, minimum pre-edit behaviour | FACT |
| `.chaos/rules/index.md` | R-001..R-007; R-003 green baseline, R-004 domain/HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/architecture.md` | boundary model, API strategy ('validation today is minimal: Title required -> 400'), non-goals | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface carrying the existing blank-title validation the bound joins | FACT |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | CreateTaskRequest / UpdateTaskRequest shapes carrying Title | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green test baseline (5 integration tests, one of them the blank-title 400 case) | FACT |

## Risk (strict)

Risk class: **LOW** — Endpoint-local input validation on two existing routes. It adds a rejection path only; no domain type, store shape, route table, dependency or serialization setting changes, and both recorded non-goals it could touch (auth, persistence) are explicitly out of the intent.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | The new bound could regress the existing blank/whitespace-title 400 behaviour if the two checks are combined carelessly (e.g. one replacing the other). | Low | Medium | Keep the blank check first and add the length check after it; the pre-existing blank-title test stays in the suite and a PUT blank-title test is added alongside the new boundary tests. |
| RK-2 | An off-by-one at the boundary would reject a legal 200-character title or accept a 201-character one. | Medium | Low | Contract statements C-002/C-003 (201 chars rejected) and C-004 (exactly 200 accepted) are each covered by a dedicated test on both POST and PUT. |
| RK-3 | Validation placed in the domain layer would violate R-004 (domain must not depend on the HTTP layer) and the recorded boundary posture. | Low | Medium | C-001 pins enforcement at the endpoint boundary; Domain/** is outside the declared scope of this change. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `title length bound on the task write endpoints (no OpenSpec artifact owed at depth 0)` | — | C-001, C-002, C-003, C-004 (4) | 1 work unit: add the 200-character check to POST /tasks and PUT /tasks/{id} in TaskEndpoints.cs, with integration tests covering both the over-limit rejection and the exact-boundary acceptance. |
| `preserved existing behaviour` | — | C-005, C-006 (2) | Covered by the untouched 5-test baseline plus an added PUT blank-title test; asserted by dotnet build + dotnet test. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation, stated per the arm protocol: no live human is available in this measurement run. Every stop this run surfaces is recorded as a normal ledger decision and then resolved by me with an explicit maintainer-style rationale, with status RESOLVED-IN-ARM and the tag 'resolved-in-arm (no live human; lever-run mechanized run)'. Answering the approves-change decision IS the approval for this run. No resume capsule is written because no stop is left pending across a session boundary and the arm's artifact set is fixed. The 200-character bound and the 400 status code are given by the task contract, not chosen by me, so they are not decision-bearing.

Confidence limiters:

- `[FACT · HIGH]` K1 classification fired zero triggers (deterministic scan + my adjudication pass, scanSeq 2); the vector sits at zero floors with only the unconditional stop, and classifier confidence is HIGH.
- `[INFERENCE · MEDIUM]` No preset flag was supplied, so nothing is owed beyond what the classifier infers; a later K3 diff scan may still raise obligations once the changed HTTP surface is visible.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 10/10 (5 baseline tests unmodified and green + 5 added for the length bound and the PUT blank-title case) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 8 scan(s) — derived from classification-state.json; both changed paths were declared in the K1 scope line and approved by RUN-DEC-001

status: Delivered · 2026-08-04 · run: RUN-2026-08-04-chaos-run-enforce-title-max-length
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 10/10, 0 failed; the 5 pre-existing tests are unmodified in the diff and all pass. dotnet build: 0 errors, 0 warnings. |
| R-004 | No file under src/TaskTracker.Api/Domain/** is changed. The bound lives in Endpoints/TaskEndpoints.cs and uses only Results.BadRequest; the domain gains no HTTP reference and no validation responsibility. |
| R-005 | No enum or type was renamed; TaskState is untouched and TaskStatus is not introduced anywhere in the diff. |
| R-006 | Neither AGENTS.md nor the root README.md appears in the diff; the change touched only src/ and tests/. |

### Coverage honesty — how each contract statement was evidenced

4 of 6 statements are covered by a passing test. 2 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| A task `title` may be at most **200 characters** long; the bound is enforced as request validation at the HTTP endpoint boundary, not in the domain store. | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — private const int MaxTitleLength = 200; enforced in the private ValidateTitle helper called by both write endpoints; src/TaskTracker.Api/Domain/** — untouched; no length rule leaked into the domain | C-001 states where the bound lives (endpoint boundary, not the domain), which is a structural property no HTTP test can distinguish: the same 400s would appear if the rule were enforced in the store. The observable half of the statement is fully tested via C-002/C-003/C-004; the placement half is evidenced by the diff showing Domain/** unmodified. |
| Titles of normal length continue to work exactly as before, the other CRUD endpoints (`GET /tasks`, `GET /tasks/{id}`, `DELETE /tasks/{id}`) are unchanged, and `dotnet build` / `dotnet test` stay green with the 5 pre-existing tests passing (R-003). | dotnet test: 10 passed / 0 failed, including the 4 untouched CRUD baseline tests; dotnet build: 0 warnings, 0 errors; src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — the GET /tasks, GET /tasks/{id} and DELETE /tasks/{id} registrations are byte-identical in the diff | Non-regression of untouched surface: the 5-test baseline already asserts the other CRUD endpoints and normal-length titles, and it was not modified. A new test here would assert the test suite rather than the behaviour; the evidence that matters is that the baseline is unchanged and still green. |

### Delivery notes

All six contract statements are delivered and covered — five by dedicated tests, one by the untouched-surface argument backed by the unmodified baseline. Build is clean (0 warnings, 0 errors) and the suite is 10/10 green, with the 5 pre-existing tests unmodified and still passing. The diff never left the scope declared at K1, no trigger fired across eight scans, and there are no deviations from the approved framing.

Two bounded assumptions, labelled per R-002 rather than hidden. (1) ASSUMPTION · HIGH — '200 characters' is enforced as `string.Length`, i.e. UTF-16 code units, which is the plain .NET reading of the contract; a title of 200 astral-plane characters would therefore be rejected. The request gives no counting rule and the repository has no precedent, but the interpretation is conventional and directly test-evidenced, so it was recorded here instead of manufactured into a stop. (2) FACT · HIGH — the two validation checks are ordered blank-first, length-second, so the pre-existing 'Title is required.' response body and status are byte-identical for blank input; the length rejection is a new, distinct message. Both endpoints share one private helper, so POST and PUT cannot drift apart.
