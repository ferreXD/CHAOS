---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: filter-tasks-by-status
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T00:00:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T00:00:00Z"
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
    bodyHash: "sha256:4cb3b04a39a1d7f943c0ba795a421c8dd418fca676f9fc62c8f621316daf283d"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T23:24:19Z", run: "RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T23:33:27Z", run: "RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T23:31:54Z", run: "RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "13/13"
      contract: "6/6"
      decisions: 2
      traceability: "4/0/1"
      syncState: null
      archiveReadiness: READY
---

# filter-tasks-by-status — Filter GET /tasks by status

## Intent

GET /tasks currently returns every task. Add an optional query-parameter filter on task status. This is a query-shaping convenience: no authentication, no persistence-model change. GET /tasks?status=<state> returns only tasks whose status equals <state>, where <state> is one of the TaskState names: Open, InProgress, Done. The match is case-insensitive: ?status=open behaves identically to ?status=Open. GET /tasks with no status parameter returns all tasks (unchanged behaviour). An unrecognised status value (e.g. ?status=Bogus) returns HTTP 400 Bad Request and returns no task list. Existing seeded data: of the four seeded tasks, exactly two are Open, one is InProgress, and one is Done. A filtered response must contain only tasks of the requested status. Constraints: keep dotnet build and dotnet test green (the existing 5 tests must still pass; the unfiltered GET /tasks test must keep working); do not change unrelated behaviour of the other CRUD endpoints; work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Endpoint**

- [x] `GET /tasks?status=<state>` returns HTTP 200 with only those tasks whose `Status` equals `<state>`, where `<state>` is one of the `TaskState` names `Open`, `InProgress`, `Done`.
- [x] The `status` match is case-insensitive: `?status=open` returns exactly the same set as `?status=Open`.
- [x] `GET /tasks` with no `status` query parameter returns all tasks, in the existing creation order — behaviour unchanged.
- [x] `GET /tasks?status=<unrecognised>` (e.g. `?status=Bogus`) returns HTTP 400 Bad Request and no task list in the response body.

**Invariants**

- [x] Filtering is applied at the endpoint/query boundary; `TaskStore`'s public shape and the `Domain/**` layer are unchanged, so the domain keeps no dependency on the HTTP layer (R-004) and the `TaskState` naming is preserved (R-005).

**Non-regression**

- [x] All other `/tasks` CRUD behaviour is unchanged: the 5 existing integration tests still pass, `dotnet build` and `dotnet test` stay green (R-003), and no file outside `src/TaskTracker.Api/**` and `tests/TaskTracker.Tests/**` is modified.

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Actual invocation: skipped, openspec dimension 0 — the classification owes no OpenSpec artifact; the contract of record is change.md §Contract. This is the classified outcome, not degraded mode.

Classified depth: **0 — none owed**

Confidence impact: None. Depth 0 is the classified obligation.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint, pre-edit behaviour, protected files (R-006) | FACT |
| `.chaos/constitution.md` | behavioural principles + confidence doctrine | FACT |
| `.chaos/rules/index.md` | executable constraints R-001..R-007 | FACT |
| `.chaos/architecture.md` | boundary model, API strategy (filtering named as the known extension point), non-goals, OQ-002 | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the status filter joins | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | the TaskState enum names the filter accepts | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | seeded data and All() ordering the filter narrows | FACT |
| `src/TaskTracker.Api/Program.cs` | JsonStringEnumConverter registration; enum names on the wire | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline the change must preserve | FACT |

## Risk (strict)

Risk class: **LOW** — Additive, read-only query shaping on one existing route. No auth surface, no persistence-model change, no change to the domain layer's public shape, and no other endpoint touched.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | Binding `status` directly as the `TaskState` enum would turn an unrecognised value into a framework-level 400 with an unspecified body, or into a silent default, instead of the contract's explicit 400. | Medium | Medium | Bind `status` as a nullable string and parse it explicitly with Enum.TryParse(ignoreCase: true), returning Results.BadRequest with an error object; covered by a test asserting 400 on ?status=Bogus. |
| RK-2 | Enum.TryParse also accepts numeric strings (e.g. ?status=0), which would widen the contract beyond the three TaskState names. | Medium | Low | Reject input that is not one of the defined enum names by re-checking Enum.IsDefined on the parsed value and rejecting numeric input; covered by a test. |
| RK-3 | Tests asserting exact seeded counts would be fragile: the suite shares one WebApplicationFactory, and therefore one singleton store, across tests that POST new tasks. | High | Low | Assert the filter invariant — every returned item carries the requested status, and the known seeded item of that status is present — rather than absolute counts. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `status filtering on GET /tasks (no OpenSpec artifact owed at depth 0)` | — | C-001, C-002, C-003, C-004, C-005, C-006 (6) | 1 work unit: add the optional status query parameter with explicit parsing at the endpoint, plus integration tests for the filtered, unfiltered, case-insensitive and invalid-value paths. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation for this measurement arm: no live human is reachable, so the S1 frame-approval stop (and any later stop) is recorded in decision-events.md and immediately resolved with an explicit maintainer-style rationale, tagged resolved-in-arm (no live human; lever-run mechanized run) with status RESOLVED-IN-ARM. Answering the approves-change decision IS the approval for this run. Second note: openspec depth is 0, so no OpenSpec artifact is authored at all — the contract of record is change.md §Contract. The openspec CLI's availability is irrelevant here and this is not degraded mode. Governance reading followed the L2 protocol: digest.py --check exited 0, so the governance digest was read once and none of its source references were opened.

Confidence limiters:

- `[FACT · HIGH]` K1 classification fired zero triggers across scan and adjudication (scanSeq 2); the vector sits at floors — stops 1, evidence 0/0, review 0, verify 0, openspec 0, adr 0 — with classifier confidence HIGH.
- `[INFERENCE · MEDIUM]` The K1 adjudication declined M3 under rule 12: an added query parameter on an existing route is the K3 route-delta scan's business, so a contract-surface firing is expected once the diff exists.
- `[FACT · HIGH]` No live human is available in this measurement arm; every stop is recorded and resolved in-arm with a documented maintainer-style rationale (status RESOLVED-IN-ARM). Approval is therefore documented, not interactively obtained.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 13/13 (the 5 baseline tests unchanged and green + 8 added for the status filter (2 Theory rows expand to 6 cases)) |
| contract | 6/6 statements covered |
| rules | R-001 ✅ · R-002 ✅ · R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json; the C-15-scoped diff covers two of the three paths declared at K1 and nothing else.

status: Delivered · 2026-08-03 · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-001 | Two material questions arose and both became ledger entries before being acted on — APP-DEC-001 (frame approval, approves-change: true) and APP-DEC-002 (the spec-vs-contract discordance). Neither was decided silently in prose. |
| R-002 | Every verdict in this run carries confidence, evidenceCoverage and assumptionLoad; every ledger entry and VFY finding carries a knowledge type and confidence. |
| R-003 | dotnet test 13/13, 0 failed; the 5 baseline tests are unmodified. The one intermediate red cycle was repaired inside the loop before the checkpoint. |
| R-004 | No file under Domain/** appears in the diff; the domain references no Microsoft.AspNetCore type, and filtering is applied at the endpoint/query boundary as the architecture's boundary posture requires. |
| R-005 | TaskState is consumed by TryParseState and the Where predicate; no TaskStatus identifier is introduced anywhere in the diff. |
| R-006 | AGENTS.md and root README.md are absent from the diff — neither was edited, previewed or otherwise. |

### Coverage honesty — how each contract statement was evidenced

5 of 6 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| Filtering is applied at the endpoint/query boundary; `TaskStore`'s public shape and the `Domain/**` layer are unchanged, so the domain keeps no dependency on the HTTP layer (R-004) and the `TaskState` naming is preserved (R-005). | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — the filter is a Where over store.All() inside the MapGet lambda; the C-15-scoped diff contains no file under src/TaskTracker.Api/Domain/**; TaskStore and TaskState are read, never modified | This is a boundary invariant about which files may change, not a runtime behaviour: a passing test cannot distinguish filtering done at the endpoint from the same filtering pushed into TaskStore. The checkable evidence is the diff itself — Domain/** is absent from it — which is exactly what R-004 and R-005 name as their violation criteria. |

### Deviations

1. **The requirement 'List Tasks' in openspec/specs/task-api/spec.md is left partially unimplemented: the priority filter and AND-combination clauses are not delivered. The gap predates this change (no filtering existed at all) and was explicitly bounded rather than closed or edited away.** (APP-DEC-002).
2. **Tests were added to the existing tests/TaskTracker.Tests/TaskEndpointsTests.cs rather than the separately predicted TaskFilterTests.cs, so one predicted scope path was never created. Narrowing within the approved scope, not drift — the endpoint's tests stay in one file with the shared WebApplicationFactory fixture they depend on.** (APP-DEC-001).

### Delivery notes

All six contract statements are delivered and covered — five by test, one by code evidence with whyNotTest — build and tests are green at 13/13, the two material decisions are recorded and resolved, and the C-15-scoped diff never left the approved scope (M5 never fired across 7 scans). APPLIED rather than PARTIALLY_APPLIED: nothing in the approved contract was deferred.

Two notes the facts alone do not carry. (1) The openspec dimension moved after the frame record was written: S1 approved depth 0, then M4 fired at the K2 scan and raised it to 1. The obligation was authored at the firing — openspec/changes/filter-tasks-by-status/specs/task-api/spec.md, before any code was written — not deferred to close. The frame record's depth-0 statement is left standing rather than rewritten, because a record is emitted for a completed pass and is never revised; this is the pass that carries the correction. (2) The single unit needed two test cycles. The first failed on '?status=Open,Done', which Enum.TryParse OR-combined into a defined value and returned as HTTP 200. That is the strongest evidence in this run that the invalid-value contract needed an explicit parser rather than framework binding, and it is recorded rather than quietly repaired.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 13/13 — independent re-run by chaos-record (L4-D4); 5 baseline tests preserved, 8 added |
| contract | 6/6 ticked; C-001..C-006, each covered; C-005 carries code evidence with whyNotTest, the other five are test-covered |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 4 SATISFIED / 0 PARTIAL / 1 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json; the diff paths are exactly two of the three predicted scope paths |
| rules | R-001 ✅ · R-002 ✅ · R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| List Tasks — status filter (delta spec: Filter by status) | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — MapGet("/") filters store.All() by the parsed TaskState | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_filtered_by_status_returns_only_that_status (3 cases: Open, InProgress, Done) | SATISFIED | HIGH |
| List Tasks — status matching is case-insensitive (delta spec scenario added by this change) | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — TryParseState uses Enum.TryParse(ignoreCase: true) | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Status_filter_is_case_insensitive | SATISFIED | HIGH |
| List Tasks — unfiltered default returns every task | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — a null status short-circuits to store.All() | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_without_status_returns_every_task and the untouched baseline Get_tasks_returns_the_seeded_tasks | SATISFIED | HIGH |
| List Tasks — an unrecognized status value is rejected with 400 (incl. the numeric-value scenario added by this change) | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — TryParseState rejects non-letter-initial, comma-combined and undefined values; the handler returns Results.BadRequest with an error object | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Unrecognised_status_value_is_rejected (3 cases: Bogus, 0, Open,Done) | SATISFIED | HIGH |
| List Tasks — priority filter and AND-combination | task-api | not implemented; pre-existing gap, out of this change's approved contract | none | **MISSING** | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Process safeguard: both material decisions are complete, and the delivered diff stays inside what they authorized**
Attributed to TRG-001 (M4 decision-density, surface process). The ledger holds exactly two decision entries under the §2 scan rule; both are resolved, both carry folds (3 and 2), a why-material line and a sync-action. The delivered diff matches APP-DEC-002 option A precisely: status filtering only, no priority code, and no edit that narrows openspec/specs/task-api/spec.md.

**VFY-002 — ADVISORY · FACT · HIGH · Independent review pass (review 2): the parser is stricter than a bare Enum.TryParse, by test-proven necessity**
Attributed to TRG-002 (X2, review→2). The first test cycle failed on '?status=Open,Done': Enum.TryParse OR-combines a comma list into Open|Done == Done, a value Enum.IsDefined then accepts, so a malformed value silently returned the Done bucket with HTTP 200. The guard now rejects comma-bearing and non-letter-initial input before parsing, and the case is pinned by an InlineData row. Reviewed with fresh eyes against the final diff: ordering is preserved (Where over the already-ordered store.All()), no other endpoint is touched, and the 400 body follows the endpoint's existing { error = ... } convention.

**VFY-003 — ADVISORY · INFERENCE · MEDIUM · Deliberate reading: an empty '?status=' is treated as an unrecognized value, not as an absent parameter**
Attributed to TRG-002 (independent review). 'GET /tasks?status=' binds to the empty string rather than null, so it returns 400 while 'GET /tasks' returns every task. The contract states the no-parameter case and the unrecognized-value case but not the present-but-empty case; the empty string is not one of the three TaskState names, so it is rejected. Recorded as a judgement call rather than a silent behaviour, since a caller could reasonably have expected the unfiltered list.

**VFY-004 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth, data-store and contract-dependency safeguards were not run, and are not owed**
Only surfaces 'process' (M4) and 'none' (X2) fired across 7 scans; M1, M2, M3, M5, X1 and X3 never fired. Asserted, not skipped silently: the diff touches no Domain/** file, no credential or config key, no dependency manifest (no .csproj change), and adds no route registration — GET /tasks already existed and its unfiltered behaviour is byte-for-byte preserved.

**VFY-005 — ADVISORY · FACT · HIGH · Residual: the priority/AND half of requirement 'List Tasks' remains unimplemented — pre-existing, not incurred here**
Attributed to TRG-001 (process) via APP-DEC-002, sync-action RECORD_ACCEPTED_RISK. openspec/specs/task-api/spec.md required status+priority AND-combined filtering before this change began, with no filtering implemented at all. This run closes the status half and leaves the requirement's priority clauses intact in both the main spec and the delta. A follow-up change is owed; archiveReadiness is READY because this run introduced no gap of its own.

### Decision-event audit

2 entries: 2 `APP-DEC`. No OPEN entry. Sync actions declared and syncable: `RECORD_ACCEPTED_RISK`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 became owed when X2 fired at K4 and was run inside the loop, attributed to the surfaces that actually fired: process (M4 decision-density) and the X2-driven independent review pass. Build and tests were re-run independently by the emitter — 0 errors, 13/13 — all six contract statements carry evidence, the OpenSpec delta validates strict, and the independent review found no defect above ADVISORY. Nothing is deferred and no debt is created by this change, so READY rather than READY_WITH_DEBT: the one outstanding item, the unimplemented priority/AND half of requirement 'List Tasks', predates this change and is carried by APP-DEC-002 as pre-existing accepted risk, not as debt this run incurred.
