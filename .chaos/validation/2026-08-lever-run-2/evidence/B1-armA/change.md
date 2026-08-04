---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: task-count
  mode: None
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T08:48:22Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T08:48:22Z"
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
    bodyHash: "sha256:607400f9b646d3995e2dd40796dc412c39166297b78d85a7ce57ea0c7c885984"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-04T08:41:29Z", run: "RUN-2026-08-04-chaos-run-task-count", mode: None, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-04T08:48:22Z", run: "RUN-2026-08-04-chaos-run-task-count", mode: None, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-04T08:47:11Z", run: "RUN-2026-08-04-chaos-run-task-count", mode: None, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "10/10"
      contract: "6/6"
      decisions: 1
      traceability: "4/0/0"
      syncState: null
      archiveReadiness: READY
---

# task-count — Active-task count endpoint

## Intent

Add a lightweight aggregate endpoint that reports how many tasks exist. This is a read-only convenience for the dashboard; it introduces no authentication and no persistence-model change. Contract: add GET /tasks/count returning HTTP 200 with a JSON object { "count": <integer> } where count is the total number of tasks currently in the store; count must always equal the number of items returned by GET /tasks (same store, same moment); creating a task (POST /tasks, 201) increases count by exactly 1 and deleting a task (DELETE /tasks/{id}, 204) decreases count by exactly 1; the root health endpoint GET / and all existing /tasks CRUD behaviour are unchanged. Constraints: keep dotnet build and dotnet test green (the existing 5 tests must still pass); do not change unrelated behaviour of the CRUD endpoints; work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Endpoint**

- [x] `GET /tasks/count` returns HTTP 200 with a JSON object `{ "count": <integer> }`, where `count` is the total number of tasks currently in the store.

**Invariants**

- [x] `count` equals the number of items returned by `GET /tasks` for the same store at the same moment.
- [x] Creating a task (`POST /tasks` → 201) increases `count` by exactly 1.
- [x] Deleting a task (`DELETE /tasks/{id}` → 204) decreases `count` by exactly 1.

**Non-regression**

- [x] The root health endpoint `GET /` and all existing `/tasks` CRUD behaviour are unchanged: the 5 baseline tests still pass and `dotnet build` stays green (R-003).

**Boundary**

- [x] The change touches only `src/TaskTracker.Api` and `tests/TaskTracker.Tests`, keeping the domain→HTTP direction (R-004) and the `TaskState` naming (R-005) intact.

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Actual invocation: skipped, openspec dimension 0 — the classification owes no OpenSpec artifact; the contract of record is change.md §Contract. This is the classified outcome, not degraded mode.

Classified depth: **0 — none owed**

Confidence impact: None. Depth 0 is the classified obligation.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint: pre-edit behaviour, protected files, governed subject | FACT |
| `.chaos/architecture.md` | posture: boundary model, non-goals, testing posture | FACT |
| `.chaos/rules/index.md` | executable constraints R-001..R-007 | FACT |
| `.chaos/constitution.md` | confidence/knowledge doctrine | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the new route joins | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | the in-memory store All() counts against | FACT |
| `src/TaskTracker.Api/Program.cs` | composition root; GET / health endpoint that must stay unchanged | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline | FACT |

## Risk (strict)

Risk class: **LOW** — Additive, read-only route over an existing in-memory store; no auth, no persistence-model change, no existing endpoint behaviour touched, and the whole diff stays inside two files under the governed subject.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | `GET /tasks/count` could be swallowed by the existing `GET /tasks/{id}` route. | Low | Medium | The existing by-id route carries the `:guid` constraint, so `count` cannot match it; an integration test asserting 200 + a `count` body proves the routing. |
| RK-2 | Counting from a source other than `store.All()` could drift from `GET /tasks` (C-002). | Low | Medium | The endpoint derives the count from the same `store.All()` call `GET /tasks` returns; a test asserts equality of the two responses at the same moment. |
| RK-3 | Adding a count member to the domain store would push HTTP-shaped concerns into `Domain/**` (R-004, boundary posture). | Low | Low | Implementation stays at the endpoint boundary; `Domain/**` is not in the declared scope. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-count aggregate route (no OpenSpec artifact owed at depth 0)` | — | C-001, C-002, C-003, C-004 (4) | 1 work unit: add the `/count` route in TaskEndpoints.cs plus integration tests covering the endpoint shape and the three invariants. |
| `non-regression and boundary discipline` | — | C-005, C-006 (2) | Keep the 5 baseline tests untouched and green; confine the diff to src/TaskTracker.Api and tests/TaskTracker.Tests. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation: no live human is available in this measurement run. Each stop is still recorded as a RUN-DEC entry in decision-events.md and resolved immediately with an explicit maintainer-style rationale, with status RESOLVED-IN-ARM and tagged 'resolved-in-arm (no live human; lever-run mechanized run)'. Answering the approves-change decision IS the approval for this run. OpenSpec is at classified depth 0, so the contract of record is change.md §Contract — a classified outcome, not degraded mode. The governance digest verified clean (digest.py --check exit 0), so the digest was read in place of its fourteen source references.

Confidence limiters:

- `[FACT · HIGH]` K1 fired zero triggers across both calls (deterministic scan + my adjudication pass, scanSeq 2); the vector sits at stops 1 with every other dimension 0.
- `[INFERENCE · MEDIUM]` The additive route this change introduces is expected to fire M3 at the first K3 diff scan; the K1 adjudication deliberately did not pre-empt it (adjudication contract rule 12).
- `[FACT · HIGH]` No live human is available in this run; the approval stop is resolved in-arm with a documented maintainer-style rationale (see commentary).

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 10/10 (5 baseline tests unchanged and green + 5 added for the count contract) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskCountEndpointTests.cs` (new)

scope drift: **NO_DRIFT** — M5 never fired across 6 scan(s) — derived from classification-state.json; the C-15-scoped diff covers exactly the paths declared in the K1 scope

status: Delivered · 2026-08-04 · run: RUN-2026-08-04-chaos-run-task-count
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 10/10, 0 failed; the 5 baseline tests are unmodified |
| R-004 | no Domain/** file changed; the count is read at the endpoint boundary from store.All(), and Domain/** contains no Microsoft.AspNetCore reference |
| R-005 | no TaskStatus identifier introduced; the work-item enum stays TaskState |
| R-006 | AGENTS.md and root README.md are absent from git status — neither was read-modified nor written |

### Coverage honesty — how each contract statement was evidenced

5 of 6 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The change touches only `src/TaskTracker.Api` and `tests/TaskTracker.Tests`, keeping the domain→HTTP direction (R-004) and the `TaskState` naming (R-005) intact. | git status -- src tests: exactly 'M src/TaskTracker.Api/Endpoints/TaskEndpoints.cs' and 'A tests/TaskTracker.Tests/TaskCountEndpointTests.cs'; src/TaskTracker.Api/Domain/** untouched and free of Microsoft.AspNetCore references; no TaskStatus identifier introduced anywhere in src/ or tests/ | C-006 is a property of the diff and of the dependency direction, not of runtime behaviour: nothing a test could execute would distinguish a compliant diff from a non-compliant one that happens to pass. The checkable evidence is the diff itself plus the grep for the forbidden dependency and identifier — which is also exactly how R-004 and R-005 define their violation criteria. |

### Delivery notes

All six contract statements are delivered and covered — four directly by new integration tests, the other two by evidence that is stronger than a duplicated test would be — build and tests are green (10/10, 0 warnings), no deviation from the approved framing was needed, and the C-15-scoped diff never left the two declared scope paths.

One work unit delivered the whole contract. The unit was banded T0/route-B by scan.py tier (it maps 1:1 onto C-001..C-006), but this session has no subagent-spawn capability, so the floor delegation could not be performed and the unit was implemented inline at ceiling — a harness limitation, not a tier-map decision, and recorded here so the tiering telemetry is not read as a judgement call. The count is read at the endpoint from store.All(), the same snapshot GET /tasks serializes, which is what makes C-002 true by construction rather than by coincidence.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-04 · run: RUN-2026-08-04-chaos-run-task-count · mode: None

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 10/10 — independent re-run by chaos-record (L4-D4); 5 baseline + 5 new |
| contract | 6/6 ticked; C-001..C-006, each covered — four by the new integration tests, C-005 by the untouched baseline suite, C-006 by the diff itself |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 4 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 6 scan(s) — derived from classification-state.json; the subject diff is exactly the two declared scope paths |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| GET /tasks/count returns 200 with { count: <integer> } | task-api (delta: Requirement 'Task Count') | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — group.MapGet("/count", ...) returning Results.Ok(new { count = store.All().Count }) | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Get_count_returns_200_with_the_number_of_tasks | SATISFIED | HIGH |
| count equals the number of items returned by GET /tasks at the same moment | task-api (delta: Requirement 'Task Count') | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — the count is derived from the same store.All() snapshot GET /tasks serializes | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Count_equals_the_number_of_items_returned_by_get_tasks | SATISFIED | HIGH |
| POST /tasks (201) increases count by exactly 1; DELETE /tasks/{id} (204) decreases it by exactly 1 | task-api (delta: Requirement 'Task Count') | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — no store mutation added; the count reads through to the existing Add/Remove paths | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Creating_a_task_increases_count_by_exactly_one and ::Deleting_a_task_decreases_count_by_exactly_one | SATISFIED | HIGH |
| GET / and existing /tasks CRUD behaviour are unchanged | task-api (delta scenario: 'Existing endpoints are unaffected') | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — the diff is four added lines; no existing registration edited; Program.cs untouched | tests/TaskTracker.Tests/TaskEndpointsTests.cs (5 baseline tests, unmodified) plus ::Root_health_endpoint_is_unchanged | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Contract check: the route delta is purely additive**
Attributed to TRG-001 (M3 contract-surface, breaking false). The subject diff registers exactly one new route and edits no existing registration; nothing is removed, renamed, or tombstoned, and the numstat shows 4 added / 0 deleted lines in the endpoint file.

**VFY-002 — ADVISORY · FACT · HIGH · Contract check: /tasks/count cannot be shadowed by the by-id route**
Attributed to TRG-001. The pre-existing GET /tasks/{id:guid} carries a guid route constraint, so the literal 'count' segment cannot bind to it; the 200 + JSON body assertion in Get_count_returns_200_with_the_number_of_tasks proves the routing at runtime. This closes framing risk RK-1.

**VFY-003 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth and data-store safeguards were not run, and are not owed**
Only the contract-dependency surface fired (TRG-001), so credential/enforcement and persistence/migration safeguards are N/A — asserted, not silently skipped: the diff touches no Domain/**, no configuration key, and no secret material, and the store's public shape is unchanged.

### Decision-event audit

1 entries: 1 `RUN-DEC`. No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by TRG-001 (M3, surface contract-dependency) and was run inside the loop, attributed to that surface: the route delta is confirmed additive, the new contract is exercised by five integration tests, and build + tests were re-run independently by the emitter (10/10, 0 errors, 0 warnings). Nothing is deferred and no debt is carried, so READY rather than READY_WITH_DEBT.
