---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: require-api-key-auth
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T22:06:40Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T22:06:40Z"
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
    bodyHash: "sha256:136a08a46d6c3a4736ed02611b9ad50ead806ddafddc8f41bc6988f06ae5f748"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T21:53:24Z", run: "RUN-2026-08-03-chaos-run-require-api-key-auth", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T22:06:40Z", run: "RUN-2026-08-03-chaos-run-require-api-key-auth", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T22:04:50Z", run: "RUN-2026-08-03-chaos-run-require-api-key-auth", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "28/28"
      contract: "11/11"
      decisions: 2
      traceability: "6/0/0"
      syncState: null
      archiveReadiness: READY
---

# require-api-key-auth — Require API-key authentication on the task endpoints

## Intent

Require API-key authentication on the task endpoints. The Task Tracker API is currently open (no authentication). Add API-key authentication to the /tasks endpoints. Every request to any /tasks route - GET /tasks, GET /tasks/{id}, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id} - must present a valid API key in the X-Api-Key request header. The valid API key is the string value of configuration key ApiKey, defaulting to test-secret-key when that configuration value is not set. A request to a /tasks route with a missing or incorrect X-Api-Key header must be rejected with HTTP 401 Unauthorized, and must not read or mutate any task (the auth check happens before existence/validation checks). The root health endpoint GET / must stay public (no key required). Update the existing visible test suite as needed so it supplies the key and stays green. Constraints: keep dotnet build and dotnet test green; do not change unrelated behaviour of the CRUD endpoints; work only inside src/TaskTracker.Api and tests/TaskTracker.Tests.

## Contract

**Enforcement**

- [x] Every `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}` — requires a valid API key in the `X-Api-Key` request header.
- [x] A request to a `/tasks` route with a **missing** `X-Api-Key` header is rejected with HTTP 401 Unauthorized.
- [x] A request to a `/tasks` route with an **incorrect** `X-Api-Key` header value is rejected with HTTP 401 Unauthorized.

**Configuration**

- [x] The valid API key is the string value of configuration key `ApiKey`.
- [x] When configuration key `ApiKey` is not set, the valid API key defaults to `test-secret-key`.

**Ordering**

- [x] The authentication check runs before existence checks: an unauthenticated `GET /tasks/{id}`, `PUT /tasks/{id}` or `DELETE /tasks/{id}` for a non-existent id returns 401, never 404.
- [x] The authentication check runs before payload validation: an unauthenticated `POST /tasks` or `PUT /tasks/{id}` with a blank title returns 401, never 400.
- [x] A rejected request reads no task and mutates no task: the store is unchanged after an unauthenticated `POST`/`PUT`/`DELETE`, and no task data appears in the 401 response.

**Public surface**

- [x] The root health endpoint `GET /` stays public and returns 200 with no `X-Api-Key` header present.

**Non-regression**

- [x] With a valid key supplied, all pre-existing CRUD behaviour of the `/tasks` endpoints is unchanged (list, get-by-id, create, update, delete, blank-title 400).
- [x] `dotnet build` and `dotnet test` stay green (R-003), the domain layer gains no dependency on the HTTP layer (R-004), `TaskState` naming is preserved (R-005), and no protected file is edited (R-006).

OpenSpec: `openspec/changes/require-api-key-auth/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Actual invocation: Depth 1 = delta spec only. Authored by hand at openspec/changes/require-api-key-auth/specs/task-api/spec.md, matching the shape of the repository's own prior delta (openspec/changes/archive/2026-07-19-add-task-query-filters/specs/task-api/spec.md): an `## ADDED Requirements` block with one SHALL requirement and eight WHEN/THEN scenarios. The openspec CLI is installed (v1.6.0) but `openspec new change` scaffolds proposal.md + design.md + tasks.md, i.e. depth 2; invoking it would have over-authored past the classified obligation. No proposal.md, design.md or tasks.md was written.

Classified depth: **1 — delta spec only**

Confidence impact: None. Depth 1 is the classified obligation and it is satisfied. `openspec status --change require-api-key-auth` will read isComplete: false at depth 1; that is the expected answer, not degraded mode.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | agent entrypoint, protected-file list, minimum pre-edit behaviour | FACT |
| `.chaos/constitution.md` | human ownership of material decisions (§1), posture-contradiction duty (§6), confidence doctrine | FACT |
| `.chaos/rules/index.md` | R-003 green baseline, R-004 domain→HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/architecture.md` | the posture this change crosses: §Authentication / authorization posture and §Non-goals; also the boundary model that constrains where enforcement may live | FACT |
| `src/TaskTracker.Api/Program.cs` | host composition; where the public GET / lives and where the /tasks group is wired | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the five /tasks routes the key will guard, and their current validation ordering | FACT |
| `src/TaskTracker.Api/appsettings.json` | configuration surface where ApiKey may be set | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green five-test integration baseline that must keep passing with the key supplied | FACT |
| `openspec/specs/task-api/spec.md` | the main spec the delta extends | FACT |

## Risk (strict)

Risk class: **MEDIUM** — Not additive: this change makes five existing, previously-open routes fail closed, and it crosses a recorded architecture non-goal. Blast radius inside the repository is small and fully covered by tests, but the failure modes of an auth change are asymmetric — an enforcement gap is silent, whereas a bug in the happy path is loud and caught by the baseline suite.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | Enforcement leaks: a /tasks route escapes the check (e.g. a future route added outside the guarded group, or a path-prefix match that misses a casing/trailing-slash variant). | Medium | High | Attach the filter to the /tasks route group itself rather than matching request paths in global middleware, so membership in the group is what confers protection and a new route in the group inherits it automatically. All five routes are covered by explicit 401 tests. |
| RK-2 | Ordering defect: the auth check runs after existence or validation, letting an unauthenticated caller distinguish 404 from 401 or trigger validation behaviour. | Medium | Medium | An endpoint filter runs before the handler delegate by construction. Pinned by dedicated tests asserting 401 (not 404) for a non-existent id and 401 (not 400) for a blank title, both without a key. |
| RK-3 | The committed default key `test-secret-key` is mistaken for a production-safe fallback. | Low | High | The default is required verbatim by the contract, so it cannot be removed here. It is labelled a demo default in the ADR consequences, with removal named as a prerequisite to any real hosting. Recorded as a todo candidate rather than silently accepted. |
| RK-4 | The public GET / is accidentally gated, breaking the documented liveness signal. | Low | Medium | Group-scoped enforcement cannot reach the root endpoint; a test asserts GET / returns 200 with no key. |
| RK-5 | R-004 violation: authentication concepts leak into Domain/**, coupling the domain to the HTTP layer. | Low | Medium | Enforcement is confined to a new Auth/ file plus the endpoint wiring; Domain/TaskItem.cs and Domain/TaskStore.cs are not touched. Asserted in the deliver record's rule mapping and re-checked by the diff scan. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `Task Endpoint API-Key Authentication (openspec/changes/require-api-key-auth/specs/task-api/spec.md, ADDED Requirements)` | — | C-001, C-002, C-003, C-004, C-005, C-006, C-007, C-008, C-009 (9) | Work unit 1: add the API-key endpoint filter, attach it to the /tasks group, read the key from configuration with the documented default. |
| `Preserved baseline behaviour and rule compliance (no OpenSpec delta owed — this is non-regression, not new contract)` | — | C-010, C-011 (2) | Work unit 2: supply the key in the existing five integration tests and add the negative/ordering/public-surface tests; keep build and tests green. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

**Documented deviation — mechanized human stop.** No live human is available in this measurement run. Every decision in `decision-events.md` is recorded exactly as it would be surfaced to the Decision Center, and is then resolved in-arm with an explicit maintainer-style rationale, carrying `status: RESOLVED-IN-ARM` and the tag `resolved-in-arm (no live human; lever-run mechanized run)`. Answering `RUN-DEC-001` (`approves-change: true`) IS the approval for this run. No other element of the loop is mechanized: classification, adjudication, artifact obligations and the audit gate all ran for real.

Two notes on how this change was framed. First, the M1 firing was mine, not the scanner's: the deterministic layer saw only the `auth` path class. The posture crossing is a *textual* contradiction — the intent commits to a concrete mechanism while `.chaos/architecture.md` lists "Authentication / authorization / multi-tenant concerns" among its non-goals with no `[UNKNOWN]` hedge — and that is exactly the class of thing the adjudication layer exists to catch. Second, I deliberately did not raise M3: no route is added, no dependency is introduced, and requiring a header on existing routes is enforcement, which M2 already covers. Stretching M3 over it would have double-counted one surface.

OpenSpec depth 1 was hand-authored as a delta spec. The `openspec` CLI is present (v1.6.0) but its `new change` scaffold produces the full proposal/design/tasks set, which exceeds the classified depth; authoring the delta directly is the first-class path at depth 1 and is not degraded mode.

**Note on the `mode` field.** This run was invoked with **no preset flag**, i.e. zero floors: `classification-state.json` records `mode: null` and `floors` all zero except the C-11 stops floor of 1. The record schema's `mode` enum admits only `light|standard|strict`, so `light` is written as the nearest representable value. It is a serialization artifact, not a preset: nothing in this run was floored, and every non-zero dimension in the vector was inferred by the classifier.

Confidence limiters:

- `[FACT · HIGH]` K1 classification fired M2 sensitive-surface (scan, surface auth, TRG-001) and M1 posture-crossing (adjudication, surface auth, TRG-002) at scanSeq 2; the owed vector is stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2. No preset floor was supplied: every dimension above zero is inferred by the classifier, not imposed.
- `[FACT · HIGH]` The L1 easy gate never opened for implementation: M2 fired on the first scan, so every step of this run — including implementation — is performed at ceiling.
- `[ASSUMPTION · MEDIUM]` The committed fallback key `test-secret-key` is treated as a demo default rather than a secret, because the governed subject has no production hosting defined (.chaos/architecture.md §Runtime / deployment model, [UNKNOWN]). If this API is ever hosted, the fallback becomes a real vulnerability and must be removed in a follow-up change.
- `[INFERENCE · MEDIUM]` Requiring a header on five previously-open routes is breaking for any client outside this repository. Only the visible test suite is in scope, so unknown external consumers cannot be assessed here.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 28/28 |
| contract | 11/11 statements covered |
| rules | R-001 ✅ · R-002 ✅ · R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Auth/ApiKeyAuthentication.cs` (new), `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `src/TaskTracker.Api/Program.cs`, `tests/TaskTracker.Tests/ApiKeyAuthenticationTests.cs` (new), `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 10 scan(s) — derived from classification-state.json

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-run-require-api-key-auth
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-001 | Both material questions were surfaced as ledger entries at the moment they arose - RUN-DEC-001 (posture crossing, folds 3) before any code was written, RUN-DEC-002 (enforcement placement) the moment the tests contradicted the accepted ADR - rather than decided silently in prose. Resolved in-arm under the documented no-live-human deviation recorded in the frame record's commentary. |
| R-002 | Every verdict in this run (frame READY_FOR_REVIEW, deliver APPLIED, verify READY) carries confidence, evidenceCoverage and assumptionLoad; every verify finding and every ledger entry carries knowledge type and confidence; the frame record's confidenceLimiters label the one live ASSUMPTION explicitly. |
| R-003 | dotnet build: 0 warnings, 0 errors. dotnet test: 28 passed / 28 total, 0 failed - re-run independently by the verify emitter with the same result. The five pre-existing tests keep their original assertions; only the client they use now supplies the key. |
| R-004 | No file under src/TaskTracker.Api/Domain/ is modified (git status), and a grep for AspNetCore/ApiKey across that folder returns 0 matches. Enforcement lives in src/TaskTracker.Api/Auth/ plus the wiring in Program.cs and TaskEndpoints.cs; the domain gained no knowledge of authentication, so the domain->HTTP direction is preserved. |
| R-005 | No new TaskStatus identifier was introduced. The only two occurrences across src/ and tests/ are pre-existing doc-comment lines in the untouched Domain/TaskItem.cs explaining why the enum is named TaskState. |
| R-006 | AGENTS.md and root README.md are unmodified in git status. Neither was edited nor proposed for edit; nothing in this change required touching a protected file. |

### Coverage honesty — how each contract statement was evidenced

10 of 11 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| `dotnet build` and `dotnet test` stay green (R-003), the domain layer gains no dependency on the HTTP layer (R-004), `TaskState` naming is preserved (R-005), and no protected file is edited (R-006). | dotnet build - 0 warnings, 0 errors; dotnet test - 28/28, 0 failed (R-003); src/TaskTracker.Api/Domain/ - unmodified in git status; a grep for AspNetCore/ApiKey across the folder returns 0 matches (R-004); src/TaskTracker.Api/Domain/TaskItem.cs - the only two TaskStatus occurrences in src/ and tests/ are pre-existing doc comments in this untouched file (R-005); AGENTS.md and root README.md - unmodified in git status (R-006) | This statement is about tooling output and rule compliance, not runtime behaviour, so no test in the suite can assert it: a test cannot observe its own build's warning count, and R-004/R-005/R-006 are properties of the diff rather than of the running system. The evidence is therefore tool output plus targeted diff inspection, with each command and its result named in the refs so the claim is reproducible. Left as honest non-test evidence rather than dressed up with a proxy assertion. |

### Deviations

1. **Enforcement was delivered as routing-aware middleware gated on endpoint metadata, not as the `IEndpointFilter` recorded in the ADR that RUN-DEC-001 approved, and the auth source file's path changed from the predicted `Auth/ApiKeyEndpointFilter.cs` to `Auth/ApiKeyAuthentication.cs`. Falsified by evidence rather than preference: minimal-API parameter binding completes before the endpoint-filter pipeline runs, so `POST /tasks` and `PUT /tasks/{id}` with an absent body returned 400 before the filter ever inspected the key - four failing tests and a direct violation of C-007. The contradiction with the accepted ADR was surfaced as a stop rather than resolved silently, the ADR's Decision clause 1 was amended in place to record middleware-after-routing and why both the filter and a path-matching alternative were rejected, and the scope change was authorized in advance by the same decision and applied via `scan.py update-scope --decision RUN-DEC-002` - which is why M5 never fired.** (RUN-DEC-002).

### Delivery notes

APPLIED, not PARTIALLY_APPLIED: all eleven contract statements are delivered and covered, the build is clean (0 warnings, 0 errors), the full suite is green at 28/28, the final diff paths are exactly the approved scope, and nothing was deferred or stubbed. Confidence HIGH because every coverage claim names an executed test or an inspected diff; evidence coverage COMPLETE because the only statement without an asserting test (C-011) is a rules/tooling claim whose evidence is tool output plus diff inspection, recorded with whyNotTest rather than waved through; assumption load LOW because the one live assumption - that the committed default key is acceptable for a demo - is inherited verbatim from the task contract and is recorded, bounded and flagged in VFY-003.

Two things about this delivery are worth stating plainly.

**The approved mechanism did not survive contact with the tests.** RUN-DEC-001 approved an ADR that placed enforcement in an `IEndpointFilter` on the `/tasks` group. Four tests then showed that minimal-API parameter binding runs before the filter pipeline, so an unauthenticated `POST` or `PUT` with no body returned 400 before the key was ever inspected - a direct violation of C-007. Rather than quietly re-engineering around an accepted decision, that contradiction was surfaced as RUN-DEC-002 and the ADR's mechanism clause was amended in place with the falsifying evidence recorded. The deviation below carries that decision id. This is the one place in the run where governance did real work: the defect was invisible from the happy path, and the ordering clause in the contract is what made it a failure rather than a design preference.

**Two deliberate non-actions.** `src/TaskTracker.Api/appsettings.json` was predicted in scope but left untouched on purpose: writing `ApiKey` there would mean the documented default path (C-005) never executes in practice or in the tests. And the pre-existing CRUD tests were changed in exactly one respect - the client they build now sends the header - so that C-010's non-regression claim rests on genuinely unmodified assertions.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-03-chaos-run-require-api-key-auth · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 28/28 — independent re-run by chaos-record (L4-D4); 5 pre-existing CRUD tests (key supplied) + 23 new auth assertions |
| contract | 11/11 ticked; C-001..C-011, each covered; C-011 alone rests on tool output plus diff inspection rather than an asserting test |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 6 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 10 scan(s) — derived from classification-state.json. The one scope change (the auth file's path, after the mechanism changed) was authorized in advance by RUN-DEC-002 and applied via `scan.py update-scope --decision RUN-DEC-002`, so the final diff paths are exactly the approved scope. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Every /tasks route requires a valid X-Api-Key header (C-001) | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — `app.MapGroup("/tasks").RequireApiKey()` marks all five routes; src/TaskTracker.Api/Auth/ApiKeyAuthentication.cs enforces the marker | tests/TaskTracker.Tests/ApiKeyAuthenticationTests.cs::Every_task_route_rejects_a_missing_key and ::Every_task_route_rejects_an_incorrect_key (theories over all five routes) | SATISFIED | HIGH |
| Missing or incorrect key is rejected with 401 (C-002, C-003) | task-api | src/TaskTracker.Api/Auth/ApiKeyAuthentication.cs — ordinal comparison, StatusCodes.Status401Unauthorized with no body | ApiKeyAuthenticationTests::Every_task_route_rejects_a_missing_key, ::Every_task_route_rejects_an_incorrect_key, ::Key_comparison_is_exact, ::Rejected_list_request_returns_no_task_data | SATISFIED | HIGH |
| The key comes from configuration key ApiKey, defaulting to test-secret-key (C-004, C-005) | task-api | src/TaskTracker.Api/Auth/ApiKeyAuthentication.cs::ResolveExpectedKey — configuration["ApiKey"], falling back to the default when null or empty | ApiKeyAuthenticationTests::Configured_key_overrides_the_default, ::Default_key_is_accepted_when_configuration_is_not_set, ::Empty_configured_key_falls_back_to_the_default | SATISFIED | HIGH |
| Authentication precedes existence, binding and validation checks and mutates nothing (C-006, C-007, C-008) | task-api | src/TaskTracker.Api/Program.cs — UseRouting() then UseApiKeyAuthentication(), so the check runs after endpoint selection but before the endpoint delegate binds anything | ApiKeyAuthenticationTests::Unauthenticated_request_for_a_missing_task_returns_401_not_404, ::Unauthenticated_post_with_a_blank_title_returns_401_not_400, ::Unauthenticated_put_with_a_blank_title_returns_401_not_400, ::Unauthenticated_post_creates_no_task, ::Unauthenticated_delete_does_not_remove_the_task, ::Unauthenticated_put_does_not_update_the_task | SATISFIED | HIGH |
| The root health endpoint stays public (C-009) | task-api | src/TaskTracker.Api/Program.cs — GET / is mapped outside the /tasks group and carries no RequireApiKeyMetadata | ApiKeyAuthenticationTests::Root_health_endpoint_stays_public, ::Root_health_endpoint_ignores_an_incorrect_key | SATISFIED | HIGH |
| Pre-existing CRUD behaviour is unchanged and the rules hold (C-010, C-011) | task-api | no CRUD handler body was modified; the only edit to TaskEndpoints.cs is the group marker and a comment | tests/TaskTracker.Tests/TaskEndpointsTests.cs — all 5 baseline tests, unchanged except for the authenticated client; plus build/test tool output and diff inspection for the rule claims | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Credential-enforcement safeguard: protection is conferred by endpoint metadata, not by a path string**
Attributed to TRG-001 (M2 sensitive-surface, surface auth) and TRG-002 (M1 posture-crossing, surface auth). The enforcement predicate is `context.GetEndpoint()?.Metadata.GetMetadata<RequireApiKeyMetadata>()`, and the marker is applied once to the /tasks group. No request path is ever compared, so casing, trailing slashes and future routes added to the group cannot silently escape the check — this is the mitigation for RK-1, verified by reading the delivered code rather than assumed.

**VFY-002 — ADVISORY · FACT · HIGH · Ordering safeguard: the 401 precedes model binding, which an endpoint filter could not guarantee**
Attributed to TRG-001 (M2, surface auth). The originally approved mechanism — an IEndpointFilter on the group — was falsified by four failing tests: minimal-API parameter binding completes before the filter pipeline runs, so `POST /tasks` and `PUT /tasks/{id}` with no body returned 400 before the key was inspected. Enforcement was moved after UseRouting() and before the endpoint delegate under RUN-DEC-002, and the ADR's mechanism clause was amended in place. This is the single most valuable thing this verify pass covers: the failure was silent from the happy path and only the ordering-specific tests exposed it.

**VFY-003 — ADVISORY · FACT · HIGH · Residual: the fallback key `test-secret-key` is committed in source and in the spec**
Attributed to TRG-001 (M2, surface auth). The task contract requires this exact default when configuration key `ApiKey` is unset, so it cannot be removed inside this change; RUN-DEC-001 option B (fail closed when unset) was considered and rejected on that ground. It is safe only while the governed subject remains a demo with no production hosting (.chaos/architecture.md §Runtime / deployment model, [UNKNOWN]). Removing the fallback is a prerequisite to any real hosting and is recorded in the ADR consequences and as a todo candidate — not accepted silently.

**VFY-004 — ADVISORY · FACT · MEDIUM · Bounded gap: unmatched methods and unmatched paths under /tasks answer before the key check**
Attributed to TRG-001 (M2, surface auth). Enforcement keys off the selected endpoint, so a request that selects no /tasks endpoint — an unroutable method such as PATCH /tasks (405), or a non-GUID id such as GET /tasks/abc (404) — is answered by routing without consulting the key. No task is read or mutated and no task data is returned, so C-008 holds and the contract (which speaks of /tasks routes) is not violated. The observable cost is that an anonymous caller can learn the route table's shape. Recorded as a bounded, accepted gap rather than left undiscovered; closing it would mean reintroducing path matching, which RK-1 argues against.

**VFY-005 — ADVISORY · FACT · MEDIUM · Bounded gap: the key comparison is not constant-time and the 401 carries no WWW-Authenticate header**
Attributed to TRG-001 (M2, surface auth). `string.Equals(..., StringComparison.Ordinal)` short-circuits on the first differing character, so it is theoretically timing-observable; and RFC 7235 says a 401 SHOULD carry WWW-Authenticate, which this response omits because no auth scheme is registered. Neither is required by the contract and both are immaterial for a single-instance in-memory demo, but both would matter if the residual in VFY-003 were ever closed for real hosting. Recorded as todo candidates.

**VFY-006 — ADVISORY · FACT · HIGH · N/A as a positive claim: persistence, deploy and dependency safeguards were not run, and are not owed**
Only the auth surface fired (M2, M1). Persistence and migration safeguards are N/A — asserted, not skipped silently: git status shows no file under Domain/ modified and the store's shape is untouched. Deploy/ops safeguards are N/A: no deployment material, no CI config and no secret store is in the diff. Dependency safeguards are N/A: neither .csproj changed, so no direct dependency was added.

### Decision-event audit

2 entries: 2 `RUN-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`, `RECORD_ACCEPTED_RISK`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed and ran inside the loop, attributed to the auth surface that fired (TRG-001 M2, TRG-002 M1). Build and tests were re-run independently by the emitter: 0 warnings, 0 errors, 28/28 passing. Every contract statement is covered, the enforcement safeguards specific to an auth surface were exercised rather than assumed, the OpenSpec delta validates strict, and no rule is in violation. Nothing is deferred and no debt is carried, so READY rather than READY_WITH_DEBT. Confidence is HIGH because each claim rests on an executed check or an inspected diff; the one residual — the committed default key — is a property of the requested contract, recorded and bounded, not an unknown.
