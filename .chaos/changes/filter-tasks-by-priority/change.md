---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: filter-tasks-by-priority
  mode: None
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T12:50:18Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T12:50:18Z"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: records
    confidence: MEDIUM
    bodyHash: "sha256:c59225208842dbea4f0d80401b38e89de208c85abce20ab43e31dbb041c161db"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-04T12:32:11Z", run: "RUN-2026-08-04-chaos-run-6f447e", mode: None, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-04T12:50:18Z", run: "RUN-2026-08-04-chaos-run-6f447e", mode: None, verdict: APPLIED }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "42/42"
      contract: "7/7"
      decisions: 2
      traceability: null
      syncState: null
      archiveReadiness: null
---

# filter-tasks-by-priority — Optional ?priority= filter on GET /tasks

## Intent

Add an optional ?priority= query filter to GET /tasks, accepting Low, Medium or High. Omitting the parameter keeps today's behaviour of returning everything. An unrecognised value is a 400. Keep the filtering in the endpoint layer over the existing store.All() result - do not change TaskStore.

## Contract

**Endpoint**

- [x] `GET /tasks?priority=<recognised value>` returns HTTP 200 with a JSON array containing exactly those tasks whose `Priority` equals that value, preserving the creation order `store.All()` already guarantees.
- [x] `GET /tasks` with no `priority` query parameter returns HTTP 200 and every task in the store — behaviour identical to today's.
- [x] `GET /tasks?priority=<unrecognised value>` returns HTTP 400 and no task data, using the same error body shape the endpoint group already uses for validation failures (`{ "error": "…" }`).
- [x] Value matching is case-insensitive: `?priority=high`, `?priority=High` and `?priority=HIGH` are all the recognised `High` value — consistent with how `JsonStringEnumConverter` already accepts enum names in request bodies. (Set by the S1 answer; see RUN-DEC-001.)
- [x] A present-but-empty value (`?priority=`) is an unrecognised value and returns HTTP 400, not the unfiltered list. (Set by the S1 answer; see RUN-DEC-001.)

**Invariants**

- [x] Filtering is applied in the endpoint layer over the result of `store.All()`. `Domain/TaskStore.cs` and `Domain/TaskItem.cs` are byte-unchanged, preserving the domain→HTTP boundary direction (R-004) and the architecture's "filtering belongs at the endpoint/query boundary, not in the store's public shape" posture.

**Non-regression**

- [x] All existing `/tasks` behaviour is unchanged — authentication, rate limiting, the other CRUD routes and the seeded data all still behave as before; the 34-test baseline stays green and `dotnet build` stays clean (R-003).

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
| `.chaos/architecture.md` | boundary posture (filtering belongs at the endpoint/query boundary) and the named GET /tasks filtering extension point | FACT |
| `.chaos/context.md` | domain shape, the unfiltered-GET gap, open question OQ-002 on invalid filter values | FACT |
| `.chaos/rules/index.md` | R-003 green baseline, R-004 domain→HTTP boundary, R-005 TaskState naming | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the filter joins; the route being changed | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | store.All() — the source the filter runs over; explicitly not to be changed | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | TaskPriority enum (Low/Medium/High) — the accepted value set | FACT |
| `src/TaskTracker.Api/Program.cs` | JsonStringEnumConverter registration — the existing precedent for how enum names are accepted | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green CRUD test baseline the new tests join | FACT |

## Risk (strict)

Risk class: **LOW** — Additive, read-only, single-route change inside one endpoint file. No auth, persistence-model, dependency or domain-shape change; the omitted-parameter path is required to be byte-identical to today's behaviour, so the blast radius on existing callers is nil by contract.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | A naive `Enum.TryParse<TaskPriority>(value)` accepts numeric strings and out-of-range numbers — `?priority=2` and `?priority=7` would both parse successfully, the latter to an undefined enum value that matches no task. That silently violates C-003 (unrecognised → 400). | Medium | Medium | Match against the declared name set explicitly (or reject non-letter input before parsing) and cover `?priority=2` / `?priority=7` with tests asserting 400. |
| RK-2 | The query path and the request-body path could disagree on case: `JsonStringEnumConverter` already accepts `{"priority": "high"}` on POST, so a case-sensitive query filter would make the same string valid in one place and a 400 in another. | Medium | Low | RUN-DEC-001 settles the matching boundary explicitly; C-004 pins it and a test covers the chosen behaviour. |
| RK-3 | A repeated parameter (`?priority=High&priority=Low`) binds as a multi-value string in ASP.NET Core; unconsidered, it could throw or silently take the first value. | Low | Low | Bind as a single `string?` (minimal-API binding takes the first value) and treat any non-matching composite as an unrecognised value — 400 per C-003. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `priority filtering on GET /tasks (no OpenSpec artifact owed at depth 0; contract of record is change.md §Contract)` | — | C-001, C-002, C-003, C-004, C-005, C-006, C-007 (7) | 1 work unit: add the optional query parameter, endpoint-layer filtering and validation in TaskEndpoints.cs, plus integration tests in TaskEndpointsTests.cs. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Context OQ-002 asked what an invalid filter value should return once filtering is added — `400` vs ignore. The intent answers it directly (`400`), so that is not re-asked here; it is recorded as settled by the intent and carried as C-003. What the intent does not settle is the narrower matching boundary — case sensitivity and the present-but-empty value — which is what RUN-DEC-001 folds. Worth flagging for the implementation: `Enum.TryParse<TaskPriority>` accepts numeric strings and even out-of-range numbers (`?priority=7` parses to an undefined enum value and returns true), so a naive parse would silently violate C-003.

Confidence limiters:

- `[FACT · HIGH]` K1 classification fired zero triggers (scan + adjudication, scanSeq 2); the vector sits at its floors and classifier confidence is HIGH. No preset flag was passed, so no floor is imposed.
- `[INFERENCE · MEDIUM]` The query-parameter delta is expected to fire M3 (contract-surface) at the first K3 diff scan; the K1 adjudication deliberately declined to pre-empt the deterministic route-delta scan (adjudication rule 12). The vector may therefore rise once the diff exists.
- `[FACT · HIGH]` The `chaos-interaction` MCP server is not reachable in this session; the interaction runtime was driven through its documented CLI fallback (tools/chaos-interaction-runtime). This is the configured fallback, not a bypass — decisions still live in the file-backed runtime.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 42/42 (34 baseline tests unchanged and green + 8 added for the priority filter contract) |
| contract | 7/7 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — the C-15-scoped diff covers exactly the two paths approved at S1 (TaskEndpoints.cs 35+/5-, TaskEndpointsTests.cs 109+/0-); M5 fired on the scope string's prose form, not on the diff, and was human-confirmed as NO_DRIFT under RUN-DEC-002

status: Delivered · 2026-08-04 · run: RUN-2026-08-04-chaos-run-6f447e
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 42/42, 0 failed; the 34 baseline tests are unmodified and green; build clean |
| R-004 | no Domain/** file changed; filtering runs at the endpoint boundary over store.All(); no domain type references an HTTP-layer type |
| R-005 | TaskState/TaskPriority naming untouched; no TaskStatus introduced; the new helper is typed on TaskPriority |

### Coverage honesty — how each contract statement was evidenced

6 of 7 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| Filtering is applied in the endpoint layer over the result of `store.All()`. `Domain/TaskStore.cs` and `Domain/TaskItem.cs` are byte-unchanged, preserving the domain→HTTP boundary direction (R-004) and the architecture's "filtering belongs at the endpoint/query boundary, not in the store's public shape" posture. | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — filtering applied over store.All() inside the endpoint handler; git status — Domain/TaskStore.cs and Domain/TaskItem.cs not in the diff | A structural claim about which files changed, not a runtime behaviour: the evidence is the diff itself. A test asserting 'TaskStore was not edited' would assert the test suite rather than the system. The behavioural half — that the other CRUD routes still work through the untouched store — is carried by the 34 baseline tests under C-007. |

### Deviations

1. **M5 scope-spill fired at the first K3 rescan against the K1 scope string. The delivered diff never left the approved scope — the scope had been supplied as annotated prose the scan's path matcher does not read as a path list. Confirmed by the human, then re-baselined to a plain path list via `scan.py update-scope`; the trigger itself stays fired (the classifier is monotone).** (RUN-DEC-002).

### Delivery notes

Every contract statement is delivered and covered, build and tests are green (42/42, up from a 34-test baseline), the diff never left the approved scope, and both material decisions are answered, consumed and recorded. The one non-test coverage row (C-006) is structural and carries its whyNotTest.

The substantive engineering finding of this run is RK-1 turning out to be wider than framed. The frame anticipated that `Enum.TryParse` accepts numeric strings; it also ORs comma-separated names together for enums that are not [Flags], so `?priority=Low,High` parses to `High` (0|2) and `Enum.IsDefined` then confirms it as declared. A digit-prefix guard plus `Enum.IsDefined` — the T0 implementation — passes every test that was asked for and still violates C-003. The delivered code matches the declared names explicitly instead, which closes the whole class rather than the two instances that had tests. Note this also fixes repeated parameters for free: `?priority=High&priority=Low` binds as the single string 'High,Low' and is now correctly a 400.
