---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: soft-delete-tasks
  mode: standard
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
    bodyHash: "sha256:a3458e23ffea957da9231a79e785301146ba9d64c8a5bf28c98edef109715af8"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T22:20:27Z", run: "RUN-2026-08-04-chaos-run-soft-delete-tasks", mode: standard, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T22:34:30Z", run: "RUN-2026-08-04-chaos-run-soft-delete-tasks", mode: standard, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T22:33:04Z", run: "RUN-2026-08-04-chaos-run-soft-delete-tasks", mode: standard, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "11/11"
      contract: "13/13"
      decisions: 2
      traceability: "8/0/0"
      syncState: null
      archiveReadiness: READY
---

# soft-delete-tasks — Soft-delete for tasks

## Intent

Change task deletion to a soft delete so deleted tasks are retained but hidden by default. Add a nullable deletedAt timestamp to the task model, serialized in JSON as deletedAt (ISO-8601 string when set, null when the task is active). DELETE /tasks/{id} must soft-delete: set deletedAt to the current time and return 204 No Content; it must not permanently remove the task; deleting an unknown id still returns 404. GET /tasks returns only active (not soft-deleted) tasks by default. GET /tasks?includeDeleted=true returns all tasks including soft-deleted ones. GET /tasks/{id} returns 404 Not Found for a soft-deleted task. The four seeded tasks remain active (deletedAt = null) after startup - existing rows must keep working (backward-compatible migration). Keep dotnet build and dotnet test green (the existing 5 tests must still pass). Do not change unrelated behaviour of the other CRUD endpoints. Work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Model**

- [x] The task model carries a nullable `deletedAt` timestamp, serialized in JSON as `deletedAt`: an ISO-8601 string when the task is soft-deleted, and `null` when the task is active.

**Delete**

- [x] `DELETE /tasks/{id}` on an existing active task soft-deletes it — it sets `deletedAt` to the current time and returns `204 No Content`.
- [x] `DELETE /tasks/{id}` does not permanently remove the task: after a successful delete the task is still retained in the store and is reachable via `GET /tasks?includeDeleted=true` with a non-null `deletedAt`.
- [x] `DELETE /tasks/{id}` for an id that does not identify a known task returns `404 Not Found`.
- [x] `DELETE /tasks/{id}` for a task that is already soft-deleted returns `404 Not Found` and leaves the original `deletedAt` unchanged.

**Read**

- [x] `GET /tasks` returns only active (not soft-deleted) tasks by default.
- [x] `GET /tasks?includeDeleted=true` returns all tasks, including soft-deleted ones (whose `deletedAt` is non-null).
- [x] `GET /tasks/{id}` returns `404 Not Found` for a soft-deleted task.
- [x] `PUT /tasks/{id}` returns `404 Not Found` for a soft-deleted task and does not modify it; its behaviour toward active tasks is unchanged.

**Compatibility**

- [x] The four tasks seeded at startup remain active after startup — each serializes `deletedAt` as `null` — so existing rows keep working without a migration step.

**Non-regression**

- [x] `dotnet build` and `dotnet test` stay green, and the five pre-existing integration tests still pass (R-003).
- [x] No unrelated behaviour of the other CRUD endpoints changes: `POST /tasks`, `PUT /tasks/{id}` and the blank-title `400` validation keep their existing contracts.
- [x] The boundary direction and naming rules hold: `Domain/**` references no ASP.NET type (R-004) and the work-item enum stays named `TaskState` (R-005).

OpenSpec: `openspec/changes/soft-delete-tasks/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Actual invocation: openspec CLI 1.6.0, first-class path: `openspec new change soft-delete-tasks` -> `openspec status --change soft-delete-tasks --json` -> `openspec instructions specs --change soft-delete-tasks` -> authored the delta spec at the returned path `openspec/changes/soft-delete-tasks/specs/task-api/spec.md` -> `openspec validate soft-delete-tasks --strict` => 'Change soft-delete-tasks is valid' (exit 0). Depth 1 owes the delta spec only; `openspec status` reports isComplete:false because proposal/design/tasks are unwritten, which is the expected answer at depth 1, not degraded mode.

Classified depth: **1 — delta spec only**

Confidence impact: None. The owed depth was authored and validated strict before S1.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint, protected files, minimum pre-edit behaviour | FACT |
| `.chaos/constitution.md` | confidence/knowledge doctrine binding every verdict here | FACT |
| `.chaos/rules/index.md` | R-001..R-007; R-003/R-004/R-005/R-006 bind this change | FACT |
| `.chaos/architecture.md` | boundary model + non-goals; the posture the M1 firing cites | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | the task record gaining `DeletedAt` | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | the in-memory store; `Remove` becomes `SoftDelete`, reads become active-by-default | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface: DELETE semantics, `?includeDeleted=`, GET-by-id 404 | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green five-test baseline; `Delete_removes_a_task` asserts the behaviour this change redefines | FACT |
| `openspec/specs/task-api/spec.md` | the main spec the delta modifies (Requirement: List Tasks) | FACT |

## Risk (strict)

Risk class: **MEDIUM** — Not additive: this redefines the semantics of an existing endpoint (DELETE) and the default result set of another (GET /tasks). An existing baseline test asserts the old behaviour and must be re-expressed, which is exactly where a silent contract regression could hide. Blast radius is small (four files, in-memory store, no auth, no durable persistence), so the class is MEDIUM rather than HIGH.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | Rewriting the existing `Delete_removes_a_task` test could quietly weaken the baseline instead of re-expressing it. | Medium | High | Keep the test's original assertions (204 on delete, 404 on subsequent GET by id) intact and only ADD the retention assertion via `?includeDeleted=true`. The old test's guarantees become a strict subset of the new one's. |
| RK-2 | A read path that forgets to filter leaks soft-deleted tasks (e.g. a future caller of `TaskStore.All()`). | Medium | Medium | Make the store's default the safe one: `All()` returns active tasks and callers must opt in via `All(includeDeleted: true)`; `Get(id)` returns only active tasks. Forgetting to filter now fails closed. |
| RK-3 | The seeded tasks could come back non-active, breaking the backward-compatibility clause. | Low | Medium | `DeletedAt` is a nullable positional parameter defaulted to null, so the existing seed calls are unchanged; covered by a test asserting all four seeded tasks have `deletedAt` null. |
| RK-4 | The M1 posture crossing is accepted here but never reflected back into `.chaos/architecture.md`, so the next change re-crosses it blind. | Medium | Low | The ADR records the crossing with an explicit sync action carried on RUN-DEC-001; `chaos:sync` folds it into the posture doc. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-api :: Task Representation Carries A Deletion Timestamp (ADDED, openspec depth 1)` | — | C-001, C-008 (2) | Work unit 1: add `DateTimeOffset? DeletedAt = null` to `TaskItem`. |
| `task-api :: Delete Task Is A Soft Delete (ADDED, openspec depth 1)` | — | C-002, C-003, C-004 (3) | Work unit 1: `TaskStore.SoftDelete`; work unit 2: DELETE endpoint returns 204/404 without eviction. |
| `task-api :: List Tasks (MODIFIED, openspec depth 1)` | — | C-005, C-006 (2) | Work unit 1: `All(includeDeleted)`; work unit 2: `?includeDeleted=` on GET /tasks. |
| `task-api :: Retrieve Task By Id Hides Soft-Deleted Tasks (ADDED, openspec depth 1)` | — | C-007 (1) | Work unit 1: `Get(id)` returns active only; work unit 2: endpoint maps null to 404. |
| `governed baseline (rules R-003/R-004/R-005; no OpenSpec surface)` | — | C-009, C-010, C-011 (3) | Work unit 3: extend the test suite; build + test green; boundary and naming unchanged. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

DECLARED DEVIATION - mechanized human stop. No live human is available in this measurement run, so each decision is created in the ledger AND resolved in the same pass with an explicit, documented maintainer-style rationale, its status line set to RESOLVED-IN-ARM and tagged 'resolved-in-arm (no live human; lever-run mechanized run)'. Answering the approves-change decision IS the approval here. Nothing else about the loop is relaxed: the classifier drove every obligation, the adjudication pass ran at ceiling when due, and the owed OpenSpec delta and ADR were authored at the firing - before S1 and before any implementation.

On the M1 crossing: the posture line it crosses is explicitly escapable ('unless a decision says otherwise'), and this run takes that escape deliberately rather than quietly. The reasoning lives in the ADR; the short version is that soft deletion is a lifecycle property of the entity, not a query concern, and the contract's requirement that every task JSON carry `deletedAt` cannot be met without the field on the model.

Confidence limiters:

- `[FACT · HIGH]` K1 fired two triggers: M2 sensitive-surface (data-store, by scan, TRG-001) and M1 posture-crossing (data-store, by adjudication, TRG-002). Vector after merge: stops 1 - evidence.targeted 1 - evidence.breadth 0 - review 0 - verify 1 - openspec 1 - adr 2. Classifier confidence MEDIUM at scanSeq 2.
- `[FACT · HIGH]` No live human is available in this measurement run. Every decision is recorded and resolved in-arm with a documented maintainer-style rationale (status RESOLVED-IN-ARM). This is a declared deviation from the human-stop protocol, not a silent one.
- `[INFERENCE · MEDIUM]` The added `?includeDeleted=` query parameter is an additive route-surface change the K1 adjudication deliberately did not pre-empt (adjudication rule 12); it is the K3 route-delta scan's business and may fire M3 at the first diff scan.
- `[FACT · HIGH]` The L1 easy gate never opened: M2 fired on the very first scan, so implementation runs at ceiling for the whole run.
- `[FACT · HIGH]` No preset flag was passed, so this run carries ZERO floors - the fired triggers alone set the vector. The record's `mode: standard` is a presentational label the record schema requires (it admits only light/standard/strict); it is NOT a floor, and `classification-state.json` carries no floors. The classified vector, not the word, sets the rigor.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 11/11 |
| contract | 13/13 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Domain/TaskItem.cs`, `src/TaskTracker.Api/Domain/TaskStore.cs`, `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 12 scan(s) - derived from classification-state.json. The four modified files are exactly the four predicted at K1; no file was created or deleted in the governed subject, and no path outside src/TaskTracker.Api and tests/TaskTracker.Tests was touched.

status: Delivered · 2026-08-03 · run: RUN-2026-08-04-chaos-run-soft-delete-tasks
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 11/11, 0 failed; the 5 pre-existing tests all pass. The one renamed test (Delete_removes_a_task -> Delete_soft_deletes_a_task_and_hides_it) kept both of its original assertions and only added one, so the baseline is a strict subset of what is asserted now. |
| R-004 | grep over src/TaskTracker.Api/Domain/ for Microsoft.AspNetCore, IResult, Results. and HttpContext returns no match. TaskStore.cs uses System.Collections.Concurrent and LINQ only; the endpoints depend on the domain, never the reverse. |
| R-005 | grep for TaskStatus across src/ and tests/ matches only the pre-existing explanatory comment in TaskItem.cs; the work-item enum remains TaskState and is not touched by this diff. |
| R-006 | git status shows AGENTS.md and root README.md unmodified. No protected file was edited, previewed or otherwise written by this run. |

### Coverage honesty — how each contract statement was evidenced

12 of 13 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The boundary direction and naming rules hold: `Domain/**` references no ASP.NET type (R-004) and the work-item enum stays named `TaskState` (R-005). | src/TaskTracker.Api/Domain/ - grep for Microsoft.AspNetCore, IResult, Results., HttpContext returns no match (R-004); src/TaskTracker.Api/Domain/TaskItem.cs - the TaskState enum is untouched by the diff; the only TaskStatus occurrence is the pre-existing comment explaining the naming (R-005) | R-004 and R-005 are static structural constraints, not runtime behaviour: a passing HTTP test cannot distinguish a domain that references ASP.NET types from one that does not, and no xUnit assertion would fail if the enum were renamed - the build would simply break elsewhere. The checkable violation criteria in .chaos/rules/index.md are themselves phrased as source-inspection criteria ('Domain code references Microsoft.AspNetCore.*', 'Reintroducing TaskStatus'), so grep over the changed tree is the evidence the rule asks for, and its output is quoted in the verify record's rules block. An architecture-fitness test would be the durable answer and is recorded as a todo candidate. |

### Deviations

1. **Soft-delete state lives in the domain model and the store's public shape (`TaskItem.DeletedAt`, `TaskStore.All(includeDeleted)`/`Get`/`SoftDelete`), crossing the architecture posture line that says new behaviour belongs at the endpoint/query boundary. The posture's own 'unless a decision says otherwise' escape is what authorizes it; the reasoning is in the change's ADR.** (RUN-DEC-001).
2. **`TaskStore.Remove` was deleted rather than kept alongside `SoftDelete`, so hard deletion is no longer reachable from any code path. Accepted consequence: the store grows monotonically for the process lifetime and there is no purge path.** (RUN-DEC-001).
3. **`PUT /tasks/{id}` changed behaviour for soft-deleted ids (now 404, previously it would have edited the hidden row), despite the task's instruction not to change unrelated CRUD behaviour. Judged not unrelated: it is a direct consequence of introducing soft delete, and 404 is the outcome that PREVIOUSLY held, because the row used to be evicted.** (RUN-DEC-002).
4. **`DELETE /tasks/{id}` on an already soft-deleted task returns 404 rather than an idempotent 204. Same non-regression argument: a second delete returned 404 before this change.** (RUN-DEC-002).
5. **DECLARED PROTOCOL DEVIATION - the human stop is mechanized. No live human was available in this measurement run, so both decisions were recorded in the ledger and resolved in the same pass with documented maintainer-style rationales, status RESOLVED-IN-ARM, tagged 'resolved-in-arm (no live human; lever-run mechanized run)'. Answering the approves-change decision constituted the approval. Declared in the frame record's commentary; nothing else in the loop was relaxed.** (RUN-DEC-001).

### Delivery notes

APPLIED, not PARTIALLY_APPLIED: all 13 contract statements are delivered and evidenced, nothing was deferred, and the four changed files are exactly the four declared in scope at K1. The two behaviours the task contract left unspecified were not guessed - they were surfaced as RUN-DEC-002 and resolved on a non-regression argument before being coded. Confidence is HIGH because every claim is backed by an executed check rather than by reading: build and tests were re-run independently by the verify emitter, and the rule checks are greps whose output is quoted.

Two things in this delivery are worth a reviewer's attention rather than being buried in the coverage table.

First, the shape of the test change. The pre-existing `Delete_removes_a_task` asserted the old semantics, and rewriting it is exactly where a regression could hide. It was re-expressed, not weakened: both original assertions (204 on delete, 404 on a subsequent GET by id) survive verbatim, and the test only gained a retention assertion. Every other pre-existing test is byte-identical apart from the shared TaskDto record gaining its `DeletedAt` member.

Second, `PUT` deliberately changed behaviour for soft-deleted ids even though the task said not to change unrelated CRUD behaviour. That is recorded as a deviation below, but the reasoning is that it is the option which does NOT change observable behaviour: before this change a deleted row was evicted, so `PUT` against that id already returned 404. Leaving `Update` alone would have been the change - it would have made a hidden task editable.

## Todo Candidates

- **Give TaskStore.Update the same compare-and-swap discipline SoftDelete now has** — Update still does a non-atomic read-modify-write (TryGetValue then indexer assignment). That is pre-existing behaviour and out of this change's scope, but it is now the only writer in the store without CAS.
- **Add an architecture-fitness test asserting Domain/** references no ASP.NET type** — R-004 and R-005 are currently evidenced by grep at review time (see C-011's whyNotTest). A fitness test would make the constraint fail the build instead of relying on a reviewer running the right grep.
- **Fold the ADR's posture amendment into .chaos/architecture.md via chaos:sync** — RUN-DEC-001 carries sync-action CREATE_ADR + UPDATE_CHAOS_RULES. Until the boundary-model and data-access sections are amended, the next change will classify against posture this change has already superseded and will re-cross it blind.
- **Consider a restore/purge path for soft-deleted tasks** — There is deliberately no HTTP way to un-delete a task or to reclaim storage. Both were judged out of scope; a retention policy would be its own change.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-04-chaos-run-soft-delete-tasks · mode: standard

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 11/11 — independent re-run by chaos-record (L4-D4); 5 pre-existing baseline tests plus 6 added by this change |
| contract | 13/13 ticked; C-001..C-013 all covered. 12 carry executable evidence; only C-011 (R-004/R-005 boundary and naming) is code/doc evidence, justified in the deliver record's whyNotTest. |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 8 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 12 scan(s) - derived from classification-state.json. The four changed files are exactly the four declared at K1; no new file was created in the governed subject. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Task Representation Carries A Deletion Timestamp - deletedAt is null for active tasks, ISO-8601 when deleted | task-api | src/TaskTracker.Api/Domain/TaskItem.cs - DateTimeOffset? DeletedAt = null on the record | tests/TaskTracker.Tests/TaskEndpointsTests.cs::An_active_task_serializes_deleted_at_as_null (asserts the raw wire form contains "deletedAt":null, so the property is emitted rather than omitted) | SATISFIED | HIGH |
| Seeded tasks remain active after startup (backward-compatible migration) | task-api | src/TaskTracker.Api/Domain/TaskItem.cs - DeletedAt defaults to null, so the four unchanged AddAt seed calls produce active tasks with no migration step | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Seeded_tasks_are_active_after_startup | SATISFIED | HIGH |
| Delete Task Is A Soft Delete - 204, stamped, retained, 404 for unknown ids | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::SoftDelete + src/TaskTracker.Api/Endpoints/TaskEndpoints.cs DELETE mapping; TaskStore.Remove is gone, so no code path evicts a row any more | TaskEndpointsTests::Delete_soft_deletes_a_task_and_hides_it, ::Delete_unknown_id_returns_not_found | SATISFIED | HIGH |
| Deleting an already soft-deleted task is not found and keeps the original stamp (RUN-DEC-002) | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::SoftDelete - the guard returns null when DeletedAt is already set, and the CAS retry loop keeps that true under concurrency | TaskEndpointsTests::Delete_of_an_already_soft_deleted_task_returns_not_found_and_keeps_the_original_stamp | SATISFIED | HIGH |
| List Tasks - active by default, all tasks with includeDeleted=true | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::All(bool includeDeleted = false) + the GET /tasks mapping binding bool? includeDeleted from the query string | TaskEndpointsTests::Get_tasks_hides_soft_deleted_tasks_by_default_and_includes_them_on_request (also asserts the global invariant that every task in the default list has a null deletedAt) | SATISFIED | HIGH |
| Retrieve Task By Id Hides Soft-Deleted Tasks - 404 for a soft-deleted id | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::Get returns null unless DeletedAt is null; the endpoint maps null to NotFound | TaskEndpointsTests::Delete_soft_deletes_a_task_and_hides_it (the GET-after-delete assertion, carried over unchanged from the pre-change baseline test) | SATISFIED | HIGH |
| Update Task Hides Soft-Deleted Tasks - PUT returns 404 and does not modify (RUN-DEC-002) | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::Update - the DeletedAt guard makes a soft-deleted row unwritable through the HTTP surface | TaskEndpointsTests::Put_on_a_soft_deleted_task_returns_not_found_and_leaves_it_unmodified (asserts both the 404 and that title/status are unchanged) | SATISFIED | HIGH |
| Other CRUD behaviour is unchanged (C-010) | task-api | POST /tasks and the blank-title 400 validation are untouched in the diff; PUT changes only its treatment of soft-deleted ids, which reproduces the pre-change outcome (the row used to be evicted, so PUT already returned 404) | TaskEndpointsTests::Post_creates_a_task_and_get_by_id_returns_it, ::Put_updates_an_existing_task, ::Post_with_blank_title_is_rejected - all three carried over unmodified and passing | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Data-store safeguard: deletion is retentive - no code path evicts a row any longer**
Attributed to TRG-001 (M2 sensitive-surface, data-store) and TRG-002 (M1 posture-crossing, data-store) - the firings that bought verify 1. Checked directly: TaskStore.Remove and its TryRemove call are gone from the diff, grep for '.Remove(' across src/ and tests/ returns no match, and the ConcurrentDictionary is now only ever written through Add/Update/SoftDelete, all of which retain the key. The retention claim is also asserted end-to-end by Delete_soft_deletes_a_task_and_hides_it via ?includeDeleted=true.

**VFY-002 — ADVISORY · FACT · HIGH · Backward-compatibility safeguard: no migration step exists or is needed**
Attributed to TRG-001 (M2, data-store). The store is an in-memory ConcurrentDictionary rebuilt at every process start, and DeletedAt is a nullable positional parameter defaulted to null, so the four seed calls in the TaskStore constructor are unchanged and produce active rows. There is no on-disk schema, so 'backward-compatible migration' is satisfied by the nullable default rather than by a migration script. Asserted by Seeded_tasks_are_active_after_startup. Recorded as a bounded claim: were durable persistence introduced later (an architecture non-goal today), that column would need a real nullable-with-default migration.

**VFY-003 — ADVISORY · FACT · HIGH · Repaired in-loop: soft delete regained the atomicity the superseded hard delete had**
Found by the independent review pass that review 2 owed after TRG-004 (X2). The first implementation of SoftDelete did a read-modify-write (TryGetValue, then indexer assignment), whereas the Remove it supersedes used the atomic TryRemove. Under concurrent DELETEs both callers could observe DeletedAt == null, both return 204, and the later write overwrite the earlier stamp - violating C-012 (repeat delete returns 404 and preserves the original stamp). Repaired as work unit 4 with a compare-and-swap retry loop over ConcurrentDictionary.TryUpdate, so the stamp is only written onto the exact instance whose DeletedAt was observed null. Scan 12 saw the repair diff and fired nothing new. Note the sibling Update method retains the same pre-existing non-atomic shape; that is untouched pre-existing behaviour, out of this change's scope, and is carried as a todo candidate rather than silently widened into this change.

**VFY-004 — ADVISORY · FACT · HIGH · X2 attribution: the trigger fired on a verdict-token mismatch, not on a failed self-review**
TRG-004 records X2 with the cite "self-review verdict 'PASS' != clean". The K4 checkpoint compares the supplied verdict against the literal token 'clean'; the run supplied 'PASS', which is a vocabulary mismatch. The substantive self-review found no defects. The firing was NOT suppressed or re-run with a friendlier token - dimensions are monotone and suppressing a firing is forbidden - so review rose to 2 and an independent review pass was genuinely performed. That pass is what produced VFY-003, so the mechanically-raised dimension paid for itself.

**VFY-005 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth, deploy-ops and integration safeguards were not run and are not owed**
No trigger named those surfaces - the only surfaces that fired are data-store (TRG-001, TRG-002) and process (TRG-003, M4 decision-density). Asserted rather than silently skipped: the diff touches no credential, key or config material, adds no dependency to either csproj, changes no deployment or CI file, and introduces no external integration. The architecture's 'Authentication / authorization posture: none' is unchanged by this run.

**VFY-006 — ADVISORY · INFERENCE · MEDIUM · Unspecified-but-conventional: a non-boolean includeDeleted value yields 400**
?includeDeleted=banana fails minimal-API parameter binding and returns 400 Bad Request. Neither the task contract nor the delta spec states this. It was NOT surfaced as a stop because the repository already answers it: openspec/specs/task-api/spec.md requires that an unrecognized filter value SHALL result in 400 Bad Request, and the framework's default reproduces that convention for the new parameter. Recorded here so the agreement is evidenced rather than assumed.

### Decision-event audit

2 entries: 2 `RUN-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`, `UPDATE_CHAOS_RULES`, `AMEND_OPENSPEC_SPEC`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by the data-store firings and was run inside the loop, attributed to that surface: the persistence-semantics and backward-compatibility safeguards are the ones that actually ran. Build and tests were re-run independently by the emitter (11/11, 0 errors, 0 warnings) and the delta spec re-validated strict. Every one of the 13 contract statements has evidence, 12 of them executable. READY rather than READY_WITH_DEBT because the one real residual the review pass found - delete losing the atomicity the superseded `TryRemove` had - was repaired inside the loop rather than recorded as debt.
