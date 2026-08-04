---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: filter-tasks-by-status
  mode: None
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T09:10:18Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T09:10:18Z"
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
    bodyHash: "sha256:cfe8c67e90d200da1b5ce221d2553abf14ea2da6e24193ae9f3501f068bdb02b"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-04T09:04:40Z", run: "RUN-2026-08-04-chaos-run-filter-tasks-by-status", mode: None, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-04T09:10:18Z", run: "RUN-2026-08-04-chaos-run-filter-tasks-by-status", mode: None, verdict: APPLIED }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "13/13"
      contract: "7/7"
      decisions: 2
      traceability: null
      syncState: null
      archiveReadiness: null
---

# filter-tasks-by-status — Filter GET /tasks by status

## Intent

GET /tasks currently returns every task. Add an optional query-parameter filter on task status. This is a query-shaping convenience: no authentication, no persistence-model change. GET /tasks?status=<state> returns only tasks whose status equals <state>, where <state> is one of the TaskState names: Open, InProgress, Done. The match is case-insensitive: ?status=open behaves identically to ?status=Open. GET /tasks with no status parameter returns all tasks (unchanged behaviour). An unrecognised status value (e.g. ?status=Bogus) returns HTTP 400 Bad Request and returns no task list. Existing seeded data: of the four seeded tasks, exactly two are Open, one is InProgress, and one is Done. A filtered response must contain only tasks of the requested status. Constraints: keep dotnet build and dotnet test green (the existing 5 tests must still pass; the unfiltered GET /tasks test must keep working); do not change unrelated behaviour of the other CRUD endpoints; work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Endpoint**

- [x] `GET /tasks?status=<state>` returns HTTP 200 with only those tasks whose status equals `<state>`, where `<state>` is one of the `TaskState` names `Open`, `InProgress`, `Done`.
- [x] The `status` match is case-insensitive: `GET /tasks?status=open` behaves identically to `GET /tasks?status=Open`.
- [x] `GET /tasks` with no `status` query parameter returns all tasks — behaviour unchanged from the baseline.
- [x] An unrecognised `status` value (e.g. `GET /tasks?status=Bogus`) returns HTTP 400 Bad Request and no task list in the body.

**Invariants**

- [x] A filtered response contains only tasks of the requested status — no task of any other status appears, for each of the three `TaskState` names against the four seeded tasks (two `Open`, one `InProgress`, one `Done`).
- [x] Filtering is applied at the endpoint/query boundary: `TaskStore`'s public shape is unchanged and `Domain/**` references no ASP.NET Core type (R-004, R-005, architecture boundary posture).

**Non-regression**

- [x] The other CRUD endpoints (`GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`) are behaviourally unchanged, the five baseline tests still pass, and `dotnet build` / `dotnet test` stay green (R-003).

OpenSpec: `openspec/changes/filter-tasks-by-status/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Actual invocation: openspec CLI 1.6.0, driven directly per the OpenSpec gate: `openspec new change filter-tasks-by-status` (created openspec/changes/filter-tasks-by-status/) -> `openspec status --change filter-tasks-by-status --json` (read the returned artifactPaths; specs outputPath specs/**/*.md) -> `openspec instructions specs --change filter-tasks-by-status --json` (followed the MODIFIED workflow: copy the entire existing requirement block, then edit) -> authored openspec/changes/filter-tasks-by-status/specs/task-api/spec.md as a MODIFIED delta against the existing `task-api` 'List Tasks' requirement -> `openspec validate filter-tasks-by-status --strict` => 'Change filter-tasks-by-status is valid', exit 0. Depth 1 owes the delta spec only, so proposal.md / design.md / tasks.md were deliberately not authored; `openspec status` accordingly reports isComplete: false with applyRequires: [tasks], which is the expected reading at depth 1 and not degraded mode.

Classified depth: **1 — delta spec only**

Confidence impact: None. The gate was invoked through a first-class path and strict validation passed. The delta deliberately leaves the requirement's normative text intact rather than narrowing it, and records in its header note that `priority` filtering and AND-combination remain unimplemented after this change (RUN-DEC-002 option A), so the outstanding gap stays visible instead of being papered over.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | agent entrypoint: pre-edit behaviour, protected files, rule pointers | FACT |
| `.chaos/constitution.md` | behavioural principles + confidence doctrine applied to every verdict here | FACT |
| `.chaos/rules/index.md` | R-003 green baseline, R-004 domain-to-HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/architecture.md` | boundary model, API strategy (names ?status= filtering as the known extension point), non-goals; its OQ-002 is stale — see the decision log below | FACT |
| `openspec/specs/task-api/spec.md` | the existing main-spec requirement this delta modifies; already requires status+priority+AND filtering and 400-on-unrecognized | FACT |
| `docs/decision-log/2026-07-19-task-filter-validation.md` | accepted decision mandating 400 on unrecognized filter values, case-insensitive parsing, and an Enum.IsDefined guard against numeric-out-of-range input; records 'Requires ADR: No' | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the filter joins; GET /tasks today returns store.All() unfiltered | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | the TaskState enum (Open/InProgress/Done) — the filter's value domain | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | in-memory store and its four seeded tasks (two Open, one InProgress, one Done) | FACT |
| `src/TaskTracker.Api/Program.cs` | JsonStringEnumConverter registration — enums travel as names on the wire | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green 5-test integration baseline this change must preserve and extend | FACT |

## Risk (strict)

Risk class: **LOW** — An additive, read-only query parameter on one existing GET route. No auth surface, no persistence-model change, no change to the store's public shape, and the unfiltered path is contractually unchanged. Blast radius is two files inside the declared subject.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | Binding the query parameter directly as a TaskState enum would let ASP.NET's own parameter binding decide the unrecognised-value behaviour, which does not guarantee the contracted 400 with no task list. | Medium | Medium | Bind status as a nullable string and parse it explicitly, returning Results.BadRequest on failure. Covered by the C-004 test. |
| RK-2 | Enum.TryParse accepts numeric strings (e.g. ?status=99), which would widen the contracted value domain beyond the three TaskState names and bypass validation. | Medium | Medium | Guard the parse with Enum.IsDefined so numeric-out-of-range input is rejected with 400. This is not merely a prudent mitigation: it is mandated by the accepted decision log at docs/decision-log/2026-07-19-task-filter-validation.md, and is now an explicit scenario in the delta spec. |
| RK-3 | The integration tests share one WebApplicationFactory fixture, so tasks created by sibling tests persist in the singleton store; a filter test asserting exact counts against the four seeded tasks would be order-dependent and flaky. | High | Low | Assert the contracted invariant (every returned task carries the requested status, and the known seeded task of that status is present) rather than an exact list length — which is precisely what C-005 states. |
| RK-4 | The delivered code satisfies only the status half of the main spec's 'List Tasks' requirement; priority filtering and AND-combination stay unimplemented, so the spec remains ahead of the code after this change. | High | Low | Accepted knowingly under RUN-DEC-002 option A and recorded in writing in the delta spec's header note, so the gap is discoverable rather than silent. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-api — status filtering on GET /tasks (delta spec at depth 1: openspec/changes/filter-tasks-by-status/specs/task-api/spec.md, MODIFIED 'List Tasks')` | — | C-001, C-002, C-003, C-004, C-005, C-006, C-007 (7) | 1 work unit: add the explicit status parse + filter at the endpoint, with integration tests covering the filtered, case-insensitive, unfiltered, rejected-name and rejected-numeric paths. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Two things are worth recording plainly for whoever reads this next. First, the re-frame is not a change of mind about the work: it exists because obligations in this system are authored when they fire, and this one fired at K2 — after pass 1 was complete and approved. Pass 1 is left intact as the record of what was approved at S1; this pass records what the classification then demanded. Second, an honest cost observation. M4 fired because RUN-DEC-001 folded two material questions, and the second of those — whether settling the architecture's OQ-002 at HTTP 400 was acceptable — turned out to be a question the repository had already answered in an accepted decision log outside the read set I was scoped to. Asking it cost an OpenSpec delta. The direction of the answer was right and the delta is a genuinely useful artifact, but the cheaper path existed: read `openspec/specs/<capability>/spec.md` and `docs/decision-log/` before deciding a question is open. Same mechanization deviation as pass 1: no live human, decisions resolved in-arm with documented rationale and tagged 'resolved-in-arm (no live human; lever-run mechanized run)'.

Confidence limiters:

- `[FACT · HIGH]` Re-frame pass: the K2 scan after RUN-DEC-001 fired M4 decision-density (TRG-001, cite 'ledger scan rule: 2 material question(s) across 1 entry >= threshold 2'), raising the vector to stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0. Pass 1 framed against openspec 0; this pass records the owed depth-1 artifact actually authored.
- `[FACT · HIGH]` The contract statements C-001..C-007 are unchanged from pass 1 and remain the approved contract; this re-frame changes the classification record and the OpenSpec proof, not the behaviour being delivered.
- `[FACT · HIGH]` Evidence found after pass 1 strengthens it: docs/decision-log/2026-07-19-task-filter-validation.md (status Accepted) already mandates 400-on-unrecognized, case-insensitive parsing and an Enum.IsDefined guard against numeric-out-of-range input, and records 'Requires ADR: No' — independently confirming adr 0. .chaos/architecture.md's OQ-002 is stale, not open. Recorded in full on RUN-DEC-002.
- `[FACT · HIGH]` No live human is available in this measurement run: every decision is recorded and then resolved with a documented maintainer-style rationale, status RESOLVED-IN-ARM. This is a recorded deviation from R-001's Decision-Center path, not a silent bypass.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 13/13 (5 baseline tests unmodified and green + 8 added (two xUnit theories contributing 3 cases each, plus two facts) covering the status filter contract) |
| contract | 7/7 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 8 scan(s) — derived from classification-state.json

status: Delivered · 2026-08-04 · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 13/13, 0 failed. The five baseline tests are unmodified — the diff adds 84 lines to the test file and removes 0 — and all five still pass, including the unfiltered GET /tasks test the intent named explicitly. |
| R-004 | No Domain/** file appears in the C-15-scoped diff, and grep for Microsoft.AspNetCore / IResult / Results. under src/TaskTracker.Api/Domain/ returns no match. The filter runs at the endpoint boundary over store.All(), which is the direction the architecture's boundary posture prescribes for new filtering behaviour. |
| R-005 | TaskState naming preserved throughout; the new parse helper is TryParseTaskState and enumerates Enum.GetNames<TaskState>(). grep for TaskStatus over src/ and tests/ finds only the pre-existing explanatory doc comment in Domain/TaskItem.cs — no reintroduction of the colliding name. |
| R-006 | AGENTS.md and the root README.md are untouched — neither appears in git diff --stat, and no patch preview was needed because no edit to a protected file was attempted. |

### Coverage honesty — how each contract statement was evidenced

6 of 7 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| Filtering is applied at the endpoint/query boundary: `TaskStore`'s public shape is unchanged and `Domain/**` references no ASP.NET Core type (R-004, R-005, architecture boundary posture). | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — filtering is `store.All().Where(t => t.Status == state)` at the endpoint lambda; no store method was added; src/TaskTracker.Api/Domain/** — absent from the diff (git diff --stat -- src tests lists only Endpoints/TaskEndpoints.cs and the test file); grep for Microsoft.AspNetCore / IResult / Results. under Domain/ returns no match; R-005: grep for TaskStatus across src/ and tests/ returns only the pre-existing doc comment in Domain/TaskItem.cs explaining why the name is avoided | This is a structural invariant about which layer holds the logic and which types a layer may reference — it is not observable through the HTTP surface, so an integration test cannot distinguish filtering done at the endpoint from filtering pushed into TaskStore. The checkable evidence is the diff itself plus a negative grep over Domain/**, both of which are recorded above; a test asserting it would be asserting the shape of the source tree, not the behaviour of the API. |

### Deviations

1. **The main spec's 'List Tasks' requirement demands status AND priority filtering combined with logical AND; this change delivers the status half only, leaving priority filtering and AND-combination unimplemented. The delta spec's header note records the gap in writing rather than narrowing the requirement to hide it.** (RUN-DEC-002).
2. **No live human was available in this run, so both material decisions were recorded in the ledger and then resolved in-arm with documented maintainer-style rationale (status RESOLVED-IN-ARM) instead of being answered through the interaction runtime's Decision Center as R-001 prescribes. Answering the approves-change entry is what stands in for the approval.** (RUN-DEC-001).

### Delivery notes

All seven contract statements are delivered and covered — five by direct integration tests, two by inspected code evidence with the reason a test would be redundant recorded. Build is clean (0 warnings, 0 errors), the suite is 13/13 with the five baseline tests unmodified and still green, the C-15-scoped diff is exactly the two files declared at K1, and M5 never fired across eight scans. The single deviation — delivering the status half of a main-spec requirement that also demands priority filtering and AND-combination — is knowing, decision-backed and written into the delta spec rather than hidden.

Three things a later reader should know, none of which rose to a stop.

First, the implementation deliberately does not use `Enum.TryParse` alone. `Enum.TryParse<TaskState>("99", ignoreCase: true, out _)` succeeds and yields the undefined value `(TaskState)99`, and even guarded by `Enum.IsDefined` an in-range numeric like `?status=0` would still be accepted as `Open`. The contract says `<state>` is one of the `TaskState` *names*, so the parse matches the input against `Enum.GetNames<TaskState>()` case-insensitively and rejects everything else. That is the stricter 'or equivalent' guard the accepted decision at docs/decision-log/2026-07-19-task-filter-validation.md asks for, and it is why `?status=99` is in the test theory alongside `?status=banana`.

Second, a context note rather than a decision: `GET /tasks?status=` (the parameter present but empty) binds as the empty string, not null, and is therefore rejected with 400 as an unrecognised value. The contract does not specify this edge. Rejecting it is consistent with the fail-fast convention the decision log establishes, and treating it as material would have meant interrupting a human for an edge the repository's own posture already answers by analogy.

Third, on scope: the K1 prediction listed a possible new test file `tests/TaskTracker.Tests/TaskFilterTests.cs`. The delivered tests went into the existing `TaskEndpointsTests.cs` instead, because they share the `WebApplicationFactory` fixture that makes the shared-store invariants tractable. That is narrower than the declared scope, never wider, which is why no spill fired and why it is recorded here as a note rather than as a deviation.
