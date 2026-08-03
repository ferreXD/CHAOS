---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: require-api-key-auth
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T14:50:54Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T14:50:54Z"
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
    bodyHash: "sha256:efda673babe730b17965d1f15c916497fb1b021c0aaca0f2ee895541989a8b48"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T14:50:54Z", run: "RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T14:50:54Z", run: "RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T14:50:54Z", run: "RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7", mode: light, verdict: READY_WITH_DEBT }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "21/21"
      contract: "7/7"
      decisions: 1
      traceability: "7/0/0"
      syncState: null
      archiveReadiness: READY_WITH_DEBT
---

# require-api-key-auth — Require API-key authentication on the task endpoints

## Intent

The Task Tracker API is currently open (no authentication); add API-key authentication to the `/tasks` endpoints.
Every `/tasks` route must present a valid `X-Api-Key` header (config key `ApiKey`, default `test-secret-key`) or be rejected with 401 before any task is read or mutated.
`GET /` stays public and the existing visible test suite is updated so it supplies the key and stays green.

## Contract

**Enforcement**

- [x] Every `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}` — requires a valid API key in the `X-Api-Key` request header.
- [x] A request to a `/tasks` route with a missing or incorrect `X-Api-Key` header is rejected with HTTP 401 Unauthorized.
- [x] The 401 is returned before any existence or validation check: an unauthenticated request reads no task and mutates no task.
- [x] The root health endpoint `GET /` stays public — no API key required.

**Configuration**

- [x] The valid API key is the string value of configuration key `ApiKey`, defaulting to `test-secret-key` when that configuration value is not set.

**Non-regression**

- [x] `dotnet build` and `dotnet test` stay green: the existing visible test suite supplies the key and the CRUD endpoints keep their unrelated behaviour (R-003).
- [x] Enforcement lives in the HTTP layer only: `Domain/**` gains no dependency on ASP.NET types and `TaskState` naming is untouched (R-004, R-005).

OpenSpec: `openspec/changes/require-api-key-auth/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `hand-authored delta spec (openspec CLI not installed in this environment)` (openspec/config.yaml)

Actual invocation: openspec/changes/require-api-key-auth/

Generated OpenSpec artifacts:

- `openspec/changes/require-api-key-auth/specs/task-api/spec.md`

Classified depth: **1 — delta spec only**

`openspec status --change require-api-key-auth --json` reports `isComplete: false` — expected: the CLI measures the full set, which this change does not owe at its classified depth; `openspec status` measures the FULL set; at classified depth 1 (delta spec only) isComplete:false is the expected answer, not degraded mode. CLI absence is not a trigger — hand-authoring stands in, as in every prior measured row..

Confidence impact: None. Depth 1 is what C-13 owes here: M1 and M2 both cite the `auth` surface, so they are correlated, not distinct, and the full set is not owed.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `.chaos/architecture.md` | crossed posture — Non-goals + auth posture section (evidence.targeted 1) | FACT |
| `.chaos/rules/index.md` | rules in play: R-003 test baseline, R-004 domain→HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/constitution.md` | confidence doctrine + §6 ADR/decision compliance (drives ADR-001) | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the `/tasks` route group that enforcement attaches to | FACT |
| `src/TaskTracker.Api/Program.cs` | host composition; the public `GET /` health endpoint that must stay open | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline that must supply the key and stay green | FACT |

## Risk (strict)

Risk class: **MEDIUM** — Small blast radius (3 predicted files, well under X1's 8-file/400-LOC threshold) but a material posture crossing on the `auth` surface: the change makes a previously open API closed, and a mistake here is a lockout or a bypass rather than a cosmetic defect.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | Enforcement attached too narrowly or too widely — a `/tasks` route left unguarded, or `GET /` accidentally closed. | Medium | High | Attach the filter to the `/tasks` route group (one attachment point, all five routes) and test all five routes plus `GET /` explicitly. |
| RK-2 | Auth check runs after existence/validation, leaking 404/400 to unauthenticated callers. | Medium | Medium | Use an endpoint filter, which runs before the route handler; test `GET /tasks/{unknown-id}` and a blank-title `POST` without a key and assert 401. |
| RK-3 | The committed default key `test-secret-key` is mistaken for a production-safe default. | Low | Medium | Recorded in ADR-001 as an accepted demo risk with the follow-up (require configuration when hosted); carried as a todo candidate, not silently fixed. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation (measurement condition): no live human is available in this Stage-D mechanized run. Every decision this run surfaces is recorded AND resolved by the agent with an explicit maintainer-style rationale, tagged `resolved-in-arm (no live human; Stage-D mechanized run)`. Answering the `approves-change` decision IS the approval. `mode: light` records the zero-floor preset row of design §8 (*(none)* and `--light` share the all-zero floor vector); no preset flag was passed on this run and no mode escalation exists under Stage C/D.

Confidence limiters:

- `[INFERENCE · MEDIUM]` Classifier confidence is MEDIUM at K1 because the M1 posture-crossing came from the adjudication layer, not the deterministic scan (MR: adjudication used ⇒ MEDIUM).
- `[ASSUMPTION · MEDIUM]` The committed default key `test-secret-key` is treated as a demo credential, not a production secret — the contract mandates it and the subject is an in-memory demo API.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build TaskTracker.sln --no-incremental`) |
| tests | 21/21 (5 pre-existing (updated to supply the key) + 16 added enforcement cases.) |
| contract | 7/7 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs` (new), `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — Final C-15-scoped diff: 3 files / 191 added / 5 removed, exactly the three approved paths. M5 never fired; X1 never fired (well under 8 files / 400 LOC).

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 21/21, 0 failed; the 5-test baseline preserved. |
| R-004 | Domain/** and Contracts/** untouched; enforcement lives in Security/ApiKeyEndpointFilter.cs (HTTP layer). |
| R-005 | No `TaskStatus` reintroduced; the only hits are the pre-existing explanatory doc comment. |
| R-006 | AGENTS.md and root README.md untouched (clean git status for both). |

### Coverage honesty — how each contract statement was evidenced

6 of 7 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| Enforcement lives in the HTTP layer only: `Domain/**` gains no dependency on ASP.NET types and `TaskState` naming is untouched (R-004, R-005). | src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs; git diff --numstat -- src/TaskTracker.Api/Domain src/TaskTracker.Api/Contracts (empty) | A boundary claim is about what the code does NOT reference, which no runtime test can assert. Verified mechanically instead: the domain/contracts diff is empty and grep finds no Microsoft.AspNetCore reference under Domain/. An architecture-test package (e.g. NetArchTest) would make it a test, and adding one is outside this change's approved scope. |

### Delivery notes

All seven contract statements are delivered and covered; build 0 warnings / 0 errors, 21/21 tests green; no scope drift across three K3 scans; no deviation from the approved frame. APPLIED, not PARTIALLY_APPLIED.

Delivered in three work units inside one continuous run: (1) the endpoint filter plus wiring, with the five pre-existing tests updated to supply the key; (2) the enforcement test set; (3) the configured-key test, added because the `verify 1` attribution (auth ⇒ credential/enforcement checks) named a safeguard that had code evidence only. Each unit was followed by a C-15-scoped K3 scan.

## Todo Candidates

- **Reconcile `.chaos/architecture.md` auth posture and Non-goals with the delivered API-key enforcement** (ADR-001) — The posture doc still says the API is open and lists auth as a non-goal. Reconciliation is `chaos:sync`'s job; this run may not silently edit repository posture docs.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY_WITH_DEBT · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY_WITH_DEBT
verified: 2026-08-03 · run: RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7 · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — Re-run independently after the final code change. |
| tests | 21/21 — Baseline was 5; the 5 pre-existing tests were updated to supply the key and 16 enforcement cases were added (10 of them theory cases over the five routes × missing/wrong key). |
| contract | 7/7 ticked; C-001..C-006 carry executed-test evidence; C-007 is a boundary claim verified by direct inspection (code evidence). |
| traceability | 7 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — Final C-15-scoped diff touches exactly the three approved paths; M5 never fired across three K3 scans. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| C-001 every /tasks route requires X-Api-Key | task-api | TaskEndpoints.MapTaskEndpoints -> group.AddEndpointFilter<ApiKeyEndpointFilter>() | Every_task_route_rejects_a_missing_api_key (5 theory cases) + Every_task_route_rejects_an_incorrect_api_key (5 theory cases) | SATISFIED | HIGH |
| C-002 missing/incorrect key -> 401 | task-api | ApiKeyEndpointFilter.InvokeAsync -> Results.Unauthorized() | Every_task_route_rejects_a_missing_api_key · Every_task_route_rejects_an_incorrect_api_key | SATISFIED | HIGH |
| C-003 401 precedes existence/validation; nothing read or mutated | task-api | endpoint filter runs before the route handler (group-level attachment) | Unauthenticated_request_is_rejected_before_the_existence_check · Unauthenticated_request_is_rejected_before_the_validation_check · Unauthenticated_post_does_not_mutate_the_store | SATISFIED | HIGH |
| C-004 GET / stays public | task-api | Program.cs maps GET / outside the /tasks group | Root_health_endpoint_stays_public | SATISFIED | HIGH |
| C-005 key = config ApiKey, default test-secret-key | task-api | ApiKeyEndpointFilter ctor: configuration["ApiKey"] ?? "test-secret-key" | Valid_api_key_from_the_default_configuration_is_accepted · Configured_api_key_replaces_the_default | SATISFIED | HIGH |
| C-006 build + tests stay green, CRUD behaviour unchanged | task-api | no handler bodies changed; only the group gained a filter | the 5 pre-existing CRUD tests, unchanged in assertions | SATISFIED | HIGH |
| C-007 enforcement stays in the HTTP layer (R-004/R-005) | task-api | src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs; Domain/** and Contracts/** untouched | none | SATISFIED | HIGH |

### Findings

**VFY-001 — MINOR · FACT · HIGH · `.chaos/architecture.md` now contradicts the delivered behaviour**
Refs TRG-002 (M1 posture-crossing, surface auth). The posture doc still reads "Authentication / authorization posture — None. The API is open." and lists auth under Non-goals, while `/tasks` is now closed. The crossing itself is approved (PROP-DEC-001) and recorded (ADR-001); what remains is the document.
Recommend Reconcile the posture document via `chaos:sync` at archive. This run may not silently rewrite repository posture docs, so it is carried as debt rather than fixed here.

**VFY-002 — MINOR · FACT · HIGH · A working default credential is committed to the repository**
Refs TRG-001 (M2 sensitive-surface, surface auth). `ApiKeyEndpointFilter.DefaultApiKey = "test-secret-key"` means an unconfigured deployment ships with a publicly known key. The change contract mandates exactly this default, and ADR-001 accepts it as a demo risk (RK-3).
Recommend If this API is ever hosted, make `ApiKey` a required configuration value and fail startup when it is absent.

**VFY-003 — ADVISORY · FACT · MEDIUM · Key comparison is ordinal, not constant-time**
Refs TRG-001 (M2 sensitive-surface, surface auth). `string.Equals(..., StringComparison.Ordinal)` short-circuits, so it is theoretically timing-distinguishable. ADR-001 puts hashing/constant-time comparison explicitly out of scope; confidence is MEDIUM because the practical exploitability over HTTP against an in-memory demo is not measured, only reasoned.
Recommend Use `CryptographicOperations.FixedTimeEquals` over the UTF-8 bytes if this ever guards a real credential.

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`, `AMEND_OPENSPEC_SPEC`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY_WITH_DEBT and not READY

`verify 1` was owed and ran inside the loop, attributed to M2@K1 (TRG-001) and M1@K1 (TRG-002), both on the `auth` surface — so the safeguard family is credential/enforcement, not persistence or contract. Every enforcement claim in the contract is covered by an executed test (all five `/tasks` routes × missing key and × wrong key, auth-before-existence, auth-before-validation, no-mutation-on-reject, public root, default key accepted, configured key replaces the default). Build 0/0 and 21/21 tests were re-run independently after the last code change. Not clean READY: three findings are carried as accepted debt rather than fixed here — the posture document now contradicts the delivered behaviour, and the committed default credential plus the non-constant-time comparison are deliberately out of scope per ADR-001.
