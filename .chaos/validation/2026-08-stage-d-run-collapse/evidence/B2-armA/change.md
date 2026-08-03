---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: filter-tasks-by-status
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T16:09:30Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T16:09:30Z"
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
    bodyHash: "sha256:a3cb12e2bf53b69413de9d0d689d17a8ba3403a87a4c1611dca7d91c29285a54"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T16:09:30Z", run: "RUN-2026-08-03-chaos-run-filter-tasks-by-status-6c05c9", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T16:09:30Z", run: "RUN-2026-08-03-chaos-run-filter-tasks-by-status-6c05c9", mode: light, verdict: APPLIED }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "13/13"
      contract: "6/6"
      decisions: null
      traceability: null
      syncState: null
      archiveReadiness: null
---

# filter-tasks-by-status — Filter GET /tasks by status

## Intent

`GET /tasks` returns every task; add an optional `?status=<state>` filter over the `TaskState` names (`Open`, `InProgress`, `Done`), matched case-insensitively.
No `status` parameter keeps today's behaviour (all tasks); an unrecognised value returns HTTP 400 and no task list.
Query-shaping convenience only — no authentication, no persistence-model change; work stays in `src/TaskTracker.Api` and `tests/TaskTracker.Tests`.

## Contract

**Filtering behaviour**

- [x] `GET /tasks?status=<state>` returns only tasks whose status equals `<state>`, for each `TaskState` name (`Open`, `InProgress`, `Done`).
- [x] The status match is case-insensitive: `?status=open` returns exactly what `?status=Open` returns.
- [x] An unrecognised status value (e.g. `?status=Bogus`) returns HTTP 400 Bad Request and no task list.

**Preserved behaviour**

- [x] `GET /tasks` with no `status` parameter returns all tasks — unchanged behaviour.
- [x] `dotnet build` and `dotnet test` stay green: the 5 pre-existing tests still pass (R-003).
- [x] The other CRUD endpoints (`GET /tasks/{id}`, `POST`, `PUT`, `DELETE`) keep their behaviour, and filtering lives at the endpoint/query boundary — `Domain/**` is not modified (R-004, R-005).

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Classified depth: **0 — none owed**

Confidence impact: none — skipped, openspec dimension 0 (no trigger fired at K1; C-10). No CLI invocation was owed, so CLI presence/absence is irrelevant here.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the filter is added to | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | `TaskState` names the filter parses against (R-005) | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | `All()` ordering + the four seeded tasks (2 Open, 1 InProgress, 1 Done) | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline the change extends | FACT |
| `.chaos/architecture.md` | posture: filtering is the named extension point and belongs at the endpoint/query boundary; OQ-002 defers invalid-filter-value behaviour to the change | FACT |
| `.chaos/rules/index.md` | R-003 green tests · R-004 domain→HTTP boundary · R-005 `TaskState` naming · R-006 protected files | FACT |

## Risk (strict)

Risk class: **LOW** — One endpoint handler plus its tests; in-memory store untouched; no auth, persistence, dependency or deployment surface. `[INFERENCE · HIGH]`

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | Case-insensitive parsing could silently accept a numeric enum value (`?status=0`) that is not a `TaskState` name. | Medium | Low | Parse against the declared `TaskState` names only and reject anything else with 400; covered by C-003. |
| RK-2 | Filtered assertions could be polluted by tasks other tests POST into the shared singleton store. | Medium | Low | Assert the filter's invariant (every returned task carries the requested status, and the known seeded task is present) rather than absolute counts. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation (measurement arm): no live human is available in this run. Every stop is still surfaced as a ledger decision entry and then resolved with an explicit maintainer-style rationale, tagged `resolved-in-arm (no live human; Stage-D mechanized run)`; answering the `approves-change` entry IS the approval. `[FACT · HIGH]`

OpenSpec: **skipped, openspec dimension 0** — the classifier owed no OpenSpec artifacts (C-10: zero-trigger changes owe none), so `openspec/changes/filter-tasks-by-status/` was deliberately not created and the Contract above is the contract of record. This is the classified depth, not a degraded invocation. `[FACT · HIGH]`

Stage-D run with no preset flag: zero floors. `mode: light` records the level-0 base of the dimension ladder (design §8, the *(none)* / `--light` row), not a mode word driving rigor — the vector does that. `[INFERENCE · HIGH]`

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 13/13 (5 pre-existing + 8 new (two [Theory] sets of 3, two [Fact])) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — The K3 numstat is exactly the two paths approved at S1; M5 did not fire at any scan.

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-run-filter-tasks-by-status-6c05c9
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 13/13; the 5 baseline tests are untouched and green. |
| R-004 | Filtering is implemented in `Endpoints/TaskEndpoints.cs` over `store.All()`; `Domain/**` is not in the diff and gains no ASP.NET reference. |
| R-005 | The filter parses against `TaskState` names via `Enum.GetValues<TaskState>()`; no `TaskStatus` identifier is introduced. |
| R-006 | `AGENTS.md` and root `README.md` are untouched (not in the diff). |

### Coverage honesty — how each contract statement was evidenced

5 of 6 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The other CRUD endpoints (`GET /tasks/{id}`, `POST`, `PUT`, `DELETE`) keep their behaviour, and filtering lives at the endpoint/query boundary — `Domain/**` is not modified (R-004, R-005). | .tmp/scan1.numstat (2 files, +98/-2) | Half of it is test-evidenced — the four untouched baseline tests for GET /tasks/{id}, POST, PUT and DELETE still pass. The other half is a structural claim no runtime test can assert: the change touches no `Domain/**` file and adds no HTTP reference there (R-004), and `TaskState` is unrenamed (R-005). Evidence is the C-15-scoped numstat: exactly `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` and `tests/TaskTracker.Tests/TaskEndpointsTests.cs`. |

### Delivery notes

All six contract statements are delivered and covered; `dotnet build` is 0 warnings / 0 errors and `dotnet test` is 13/13 (the 5 baseline tests plus 8 new cases). The diff is exactly the two approved paths — no scope drift, no `Domain/**` edit, no dependency change. `[FACT · HIGH]`

One work unit, one K3 scan: the whole contract is a single endpoint handler plus its tests, so splitting it would have manufactured scan events without new evidence. The run closed at the K1 vector — zero triggers fired at any of the four checkpoints (scanSeq 6), so `verify 0` means no verification pass was owed and none ran; build + tests are the level-0 base check that DELIVER already carries. `[FACT · HIGH]`
