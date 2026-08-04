---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: soft-delete-tasks
  mode: None
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T08:07:41Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T08:07:41Z"
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
    bodyHash: "sha256:b4c0fba3227ba008c5e476dbcb9ec0609c04c70c619b1721a726cf754c7b48fe"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-04T07:54:35Z", run: "RUN-2026-08-04-chaos-run-soft-delete-tasks-01", mode: None, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-04T08:07:41Z", run: "RUN-2026-08-04-chaos-run-soft-delete-tasks-01", mode: None, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-04T08:04:55Z", run: "RUN-2026-08-04-chaos-run-soft-delete-tasks-01", mode: None, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "14/14"
      contract: "12/12"
      decisions: 1
      traceability: "6/0/0"
      syncState: null
      archiveReadiness: READY
---

# soft-delete-tasks — Soft-delete for tasks (schema change + backward-compatible migration)

## Intent

Soft-delete for tasks (schema change + backward-compatible migration). Today DELETE /tasks/{id} permanently removes a task. Change deletion to a soft delete so deleted tasks are retained but hidden by default. Add a nullable deletedAt timestamp to the task model, serialized in JSON as deletedAt (an ISO-8601 string when set, null when the task is active). DELETE /tasks/{id} must soft-delete: set deletedAt to the current time and return 204 No Content. It must not permanently remove the task. Deleting an unknown id still returns 404. GET /tasks returns only active (not soft-deleted) tasks by default. GET /tasks?includeDeleted=true returns all tasks including soft-deleted ones (whose deletedAt is non-null). GET /tasks/{id} returns 404 Not Found for a soft-deleted task. The four seeded tasks remain active (deletedAt = null) after startup - existing rows must keep working (backward-compatible migration). Constraints: keep dotnet build and dotnet test green (the existing 5 tests must still pass); do not change unrelated behaviour of the other CRUD endpoints; work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Model**

- [x] The task model carries a nullable deletion timestamp serialized in JSON as `deletedAt`: an ISO-8601 string once the task is soft-deleted, and `null` while the task is active.

**Deletion**

- [x] `DELETE /tasks/{id}` on an existing task soft-deletes it — it sets `deletedAt` to the current time and returns HTTP 204 No Content.
- [x] `DELETE /tasks/{id}` does not permanently remove the task: after deletion the task is still present in the store and still returned by `GET /tasks?includeDeleted=true`.
- [x] `DELETE /tasks/{id}` for an id that is not in the store returns HTTP 404 Not Found.
- [x] `DELETE /tasks/{id}` for a task that is already soft-deleted returns HTTP 404 Not Found and leaves the original `deletedAt` untouched — a soft-deleted task is treated as absent by every id-addressed endpoint.

**Listing**

- [x] `GET /tasks` returns only active tasks by default: a soft-deleted task does not appear in the response.
- [x] `GET /tasks?includeDeleted=true` returns all tasks, including soft-deleted ones, whose `deletedAt` is non-null.

**Retrieval**

- [x] `GET /tasks/{id}` returns HTTP 404 Not Found for a soft-deleted task.
- [x] `PUT /tasks/{id}` for a soft-deleted task returns HTTP 404 Not Found, consistently with `GET /tasks/{id}` and `DELETE /tasks/{id}`.

**Migration**

- [x] The four seeded tasks remain active after startup: each is returned by `GET /tasks` with `deletedAt` of `null`.

**Non-regression**

- [x] The other CRUD endpoints (`POST /tasks`, `PUT /tasks/{id}`, `GET /tasks/{id}` for active tasks, blank-title rejection) keep their existing behaviour; the 5 baseline tests still pass and `dotnet build` stays clean.
- [x] `Domain/**` gains no dependency on the HTTP layer (R-004) and the `TaskState` naming is unchanged (R-005); the change stays inside `src/TaskTracker.Api` and `tests/TaskTracker.Tests`.

OpenSpec: `openspec/changes/soft-delete-tasks/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Actual invocation: openspec CLI, first-class path (not degraded mode): `openspec new change soft-delete-tasks --json` -> `openspec status --change soft-delete-tasks --json` -> `openspec instructions specs --change soft-delete-tasks --json` -> authored the delta spec at the path status returned (openspec/changes/soft-delete-tasks/specs/task-api/spec.md, reusing the existing task-api capability folder) -> `openspec validate soft-delete-tasks --strict` => `Change 'soft-delete-tasks' is valid`, exit 0. Depth 1 owes the delta spec only, so proposal.md/design.md/tasks.md were deliberately NOT authored; `openspec status` therefore reads isComplete: false with applyRequires: [tasks], which is the expected answer at depth 1, not a failure.

Classified depth: **1 — delta spec only**

Confidence impact: None on the delta itself — validation PASSED under --strict. One recorded conflict: the main spec it deltas describes query filtering the code does not implement (see confidenceLimiters), which caps confidence in the MAIN spec's fidelity, not in this change's.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | agent entrypoint: pre-edit behaviour, protected files, governed subject | FACT |
| `.chaos/constitution.md` | behavioural principles + confidence doctrine (knowledge/confidence labelling) | FACT |
| `.chaos/rules/index.md` | R-001..R-007; R-003 green baseline, R-004 domain/HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/architecture.md` | boundary model + data-access posture + NON-GOALS — the posture M1 crossed | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | the task record gaining the nullable DeletedAt field | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | in-memory store: Remove() becomes a soft-delete transition; All()/Get() gain the visibility rule; the 4-task seeder | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface: DELETE semantics, includeDeleted binding, 404 for soft-deleted ids | FACT |
| `src/TaskTracker.Api/Program.cs` | JSON serialization configuration — checked for deletedAt naming/format, unchanged | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline; its Delete_removes_a_task case pins the behaviour being replaced | FACT |
| `openspec/specs/task-api/spec.md` | the main spec the delta modifies (List Tasks requirement); CONFLICT with the code at this commit — see confidenceLimiters | FACT |

## Risk (strict)

Risk class: **MEDIUM** — Not additive: this redefines an existing endpoint's semantics (DELETE stops removing) and narrows the default membership of GET /tasks, so it can break existing readers rather than merely extend them. It crosses a recorded posture line (M1, data-store) and touches the domain model shape. It is held below HIGH because the blast radius is four files in one in-memory single-instance demo service, there is no durable data to migrate, no auth surface, and every contract statement is reachable from the existing WebApplicationFactory integration-test harness.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | The baseline test `Delete_removes_a_task` asserts 204 then 404 on GET by id — it passes only if GET /tasks/{id} 404s for a soft-deleted task. If the 404 rule were implemented at the store but not for the id route (or vice versa), the baseline would silently keep passing while C-003 (retention) is unmet. | Medium | High | C-003 gets its own assertion via includeDeleted=true rather than relying on the baseline's 404, so retention is proved positively and not inferred from the absence of the task. |
| RK-2 | Narrowing All() to active-only silently changes every current and future caller of the store, including any later filtering work. | Medium | Medium | The narrowing is explicit in the ADR and in the delta spec's MODIFIED List Tasks requirement, and the opt-out (includeDeleted) is part of the store's signature rather than a caller-side convention. |
| RK-3 | Adding DeletedAt to the TaskItem positional record changes its constructor arity; the seeder and any positional construction break or, worse, bind the wrong argument. | Medium | Medium | The field is nullable with a default so existing construction sites stay valid (the backward-compatible migration), and C-008 asserts the four seeded tasks come back with deletedAt null — a compile-time break or a mis-bound argument fails that test. |
| RK-4 | R-004 violation: binding includeDeleted or timestamping inside Domain/** could pull ASP.NET types into the domain. | Low | Medium | includeDeleted is bound in the endpoint layer and passed to the store as a plain bool; the store timestamps with DateTimeOffset.UtcNow, which is BCL, not ASP.NET. Asserted as C-010 and re-checked at self-review. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-api — Task Deletion Timestamp (openspec/changes/soft-delete-tasks/specs/task-api/spec.md, ADDED)` | — | C-001 (1) | Work unit 1: add the nullable DeletedAt to TaskItem. |
| `task-api — Soft-Delete a Task (ADDED)` | — | C-002, C-003, C-004 (3) | Work unit 1 (store: SoftDelete transition) + work unit 2 (endpoint: DELETE maps to 204/404). Re-deleting an already-soft-deleted task is unspecified by the intent and is folded into S1 as question 3; the answer adds a statement here. |
| `task-api — List Tasks (MODIFIED)` | — | C-005, C-006 (2) | Work unit 1 (store: All(includeDeleted)) + work unit 2 (endpoint: bind includeDeleted). |
| `task-api — Retrieve a Single Task Excludes Soft-Deleted (ADDED)` | — | C-007 (1) | Work unit 1 (store: Get/Update exclude soft-deleted) + work unit 2 (endpoint: 404 mapping). PUT against a soft-deleted task is unspecified by the intent and is folded into S1 as question 4; the answer adds a statement here. |
| `task-api — Existing Tasks Migrate As Active (ADDED)` | — | C-008 (1) | Work unit 1: the seeder leaves DeletedAt null; covered by an integration test. |
| `non-regression (no OpenSpec requirement — repository rules R-003/R-004/R-005 and the approved scope)` | — | C-009, C-010 (2) | Work unit 3: the test pass — the 5 baseline tests stay green and new tests cover the soft-delete surface. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

DOCUMENTED DEVIATION — mechanized human stop. No live human is available in this measurement run. Every decision is still recorded as a first-class ledger entry and then resolved with an explicit maintainer-style rationale, with `status: RESOLVED-IN-ARM` and the tag `resolved-in-arm (no live human; lever-run mechanized run)`. Answering the `approves-change: true` decision (RUN-DEC-001) IS the approval for this run. Stops are resolved when reached, in order, never batched. This deviation is confined to WHO answers; what fires, what stops and what is owed are untouched.

On the M1 crossing: the architecture's boundary paragraph prefers new behaviour at the endpoint/query boundary rather than in the store's public shape, and hedges it with "unless a decision says otherwise". Soft-delete is lifecycle state rather than a query filter, so pushing the predicate to the endpoint would make every present and future caller responsible for re-applying the default — the failure mode the single-source-of-truth posture exists to prevent. The crossing is therefore taken deliberately and recorded in adr/2026-08-04-soft-delete-lives-in-the-store-shape.md; it is authorized by RUN-DEC-001, not assumed.

Reading protocol: `digest.py --check` exited 0, so the governance digest was read once and none of its source references were opened.

Confidence limiters:

- `[FACT · HIGH]` No preset flag: zero floors. The vector is classification only — M2 (scan, data-store) and M1 (adjudication, data-store) at K1 give stops 1 / evidence.targeted 1 / evidence.breadth 0 / review 0 / verify 1 / openspec 1 / adr 2 at scanSeq 2.
- `[CONFLICT · HIGH]` openspec/specs/task-api/spec.md records `GET /tasks` status/priority filtering (with 400 on unrecognized values) that the code at this commit does not implement — TaskEndpoints.cs maps `GET /tasks` to store.All() unfiltered. Pre-existing spec/code drift from the archived add-task-query-filters change; neither introduced nor repaired here. The delta spec copies the requirement block whole per OpenSpec's MODIFIED rule, so the drift is carried, not widened. Statements C-001..C-012 deliberately claim nothing about filtering.
- `[ASSUMPTION · MEDIUM]` `includeDeleted` is read as a strict boolean query parameter: only `true` opts in; absent, empty or any other value keeps the default active-only view. The intent specifies only `includeDeleted=true`, so the rejection behaviour of a malformed value is assumed rather than specified.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 14/14 (5 baseline tests unchanged and still green + 9 added in SoftDeleteTests.cs for the soft-delete contract) |
| contract | 12/12 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Domain/TaskItem.cs`, `src/TaskTracker.Api/Domain/TaskStore.cs`, `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/SoftDeleteTests.cs` (new)

scope drift: **NO_DRIFT** — M5 never fired across 10 scans. The C-15-scoped diff (git diff -- src tests) is exactly 4 paths, every one declared in the K1 scope line: TaskItem.cs, TaskStore.cs and TaskEndpoints.cs (modified) plus SoftDeleteTests.cs (declared as planned NEW). tests/TaskTracker.Tests/TaskEndpointsTests.cs was predicted in scope but proved unnecessary to touch, which narrows the delivered diff rather than widening it.

status: Delivered · 2026-08-04 · run: RUN-2026-08-04-chaos-run-soft-delete-tasks-01
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet build 0 warnings / 0 errors and dotnet test 14/14, 0 failed. The 5 baseline tests in TaskEndpointsTests.cs are unmodified in the diff and all still pass, so the green baseline was preserved rather than rewritten to fit the change. |
| R-004 | grep over src/TaskTracker.Api/Domain/ for Microsoft.AspNetCore / IResult / HttpContext / Results. returns nothing. The domain gained TaskItem.DeletedAt and the TaskStore SoftDelete/All(bool)/Get/Update changes using only BCL types (DateTimeOffset?, bool); the includeDeleted query parameter is bound in the endpoint layer and crosses the boundary as a plain bool. The dependency direction endpoints -> domain is unchanged. |
| R-005 | the enum is still TaskState; the only TaskStatus occurrences under src/ and tests/ are the two pre-existing doc-comment lines in TaskItem.cs explaining the deliberate avoidance of System.Threading.Tasks.TaskStatus. DeletedAt is a new nullable field, not a new work-item state, so nothing was renamed. |
| R-006 | git status --porcelain AGENTS.md README.md is empty: neither protected file was edited, previewed or otherwise touched by this run. |

### Coverage honesty — how each contract statement was evidenced

10 of 12 statements are covered by a passing test. 2 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The other CRUD endpoints (`POST /tasks`, `PUT /tasks/{id}`, `GET /tasks/{id}` for active tasks, blank-title rejection) keep their existing behaviour; the 5 baseline tests still pass and `dotnet build` stays clean. | tests/TaskTracker.Tests/TaskEndpointsTests.cs - untouched in the diff; all 5 baseline cases (POST create, PUT update, GET by id, blank-title 400, DELETE) pass unmodified within the 14/14 run; src/TaskTracker.Api/Endpoints/TaskEndpoints.cs - the POST, PUT and blank-title branches are unchanged in the diff; only the GET list line, the DELETE line and doc comments moved; src/TaskTracker.Api/Program.cs and src/TaskTracker.Api/Contracts/TaskRequests.cs - absent from the diff entirely | This is a non-regression claim about surface the change deliberately does not touch. The existing baseline suite already asserts that behaviour and passes unmodified, so the honest evidence is the untouched diff plus the green baseline; adding new tests for it would assert the test suite rather than the behaviour. The one intended exception is PUT against a soft-deleted task, which is NOT unrelated behaviour - it could not exist before this change - and is separately contracted as C-012 with its own test. |
| `Domain/**` gains no dependency on the HTTP layer (R-004) and the `TaskState` naming is unchanged (R-005); the change stays inside `src/TaskTracker.Api` and `tests/TaskTracker.Tests`. | R-004: grep over src/TaskTracker.Api/Domain/ for Microsoft.AspNetCore / IResult / HttpContext / Results. returns no match; includeDeleted is bound in TaskEndpoints.cs and passed to the store as a plain bool, and SoftDelete stamps DateTimeOffset.UtcNow (BCL, not ASP.NET); R-005: the only TaskStatus occurrences under src/ and tests/ are the two pre-existing doc-comment lines in TaskItem.cs explaining why the enum is NOT named that; the enum is still TaskState; scope: git status --porcelain over src and tests lists exactly 4 paths, all declared at K1; the same command over AGENTS.md and root README.md is empty (R-006) | A static/structural property of the diff, not a runtime behaviour: no HTTP request can observe 'Domain does not reference ASP.NET' or 'the change stayed in scope'. The checkable form is a grep plus a git-status assertion, both re-run at verify and recorded there as the R-004 / R-005 / R-006 pass rows. |

### Deviations

1. **TaskStore.Remove(Guid) -> bool was REPLACED by SoftDelete(Guid) -> TaskItem? rather than kept alongside it, so the store no longer exposes any hard-delete path at all. This narrows the store's public surface further than the literal contract required (which only said DELETE must stop removing). Chosen because leaving Remove in place would leave a reachable way to defeat retention; the DELETE endpoint was its only caller.** (RUN-DEC-001).
2. **All(), Get() and Update() hide soft-deleted tasks inside the store rather than the predicate being applied at the endpoint layer, which is what the architecture's boundary paragraph nominally prefers. This IS the M1 posture crossing, authorized explicitly and recorded in .chaos/changes/soft-delete-tasks/adr/2026-08-04-soft-delete-lives-in-the-store-shape.md.** (RUN-DEC-001).
3. **Mechanized human stop: no live human was available in this measurement run, so RUN-DEC-001 was recorded as a full ledger entry and then resolved in-arm with a documented maintainer-style rationale (status RESOLVED-IN-ARM). Answering the approves-change decision constitutes the approval for this run. Disclosed in the frame record's commentary; it changes WHO answered, not what fired, what stopped, or what was owed.** (RUN-DEC-001).

### Delivery notes

APPLIED, not PARTIALLY_APPLIED: all twelve contract statements are delivered, and ten of the twelve carry direct HTTP-level test evidence rather than inspection. The two that do not (C-009, C-010) are non-regression and rule-compliance claims about surface the diff deliberately does not touch, and both carry whyNotTest plus a named mechanical check, so weak evidence stays visible instead of being dressed up as a test. Build is 0 warnings / 0 errors and the suite is 14/14 with the five baseline tests unmodified; the diff is exactly the four declared files (NO_DRIFT, M5 never fired across 10 scans); and each of the three deviations from the literal framing is decision-backed by RUN-DEC-001.

Two things are worth flagging to a reviewer rather than leaving implicit.

First, a correction. The frame record's ASSUMPTION that a malformed ?includeDeleted value would fall back to the default active-only view is FALSE: probing the running app showed true/false/absent => 200, and banana / 1 / an empty value => 400 Bad Request from minimal-API bool? binding. No code change was made, because 400 is exactly the convention this repository already recorded for unrecognized query-param values (docs/decision-log/2026-07-19-task-filter-validation.md, carried into openspec/specs/task-api/spec.md), so the repository answers the question and no S3 discordance stop was owed. The completed frame pass is left as written per the never-rewrite rule; the correction is carried here and as VFY-003.

Second, the shape of the evidence for C-003. Retention is asserted POSITIVELY through ?includeDeleted=true rather than inferred from the id route's 404. That matters: the pre-existing baseline test Delete_removes_a_task asserts 204-then-404, which a regression that hard-deleted the row would still satisfy. Only a positive retention assertion distinguishes soft-delete from hard-delete, which is why RK-1 was framed as the change's top risk and why C-003 does not lean on the baseline.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-04 · run: RUN-2026-08-04-chaos-run-soft-delete-tasks-01 · mode: None

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 14/14 — independent re-run by chaos-record (L4-D4) |
| contract | 12/12 ticked; C-001..C-012, each with direct HTTP-level evidence; C-011/C-012 were added by RUN-DEC-001. |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 6 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 10 scan(s) — derived from classification-state.json |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Task Deletion Timestamp - deletedAt is null when active, ISO-8601 when deleted | task-api | src/TaskTracker.Api/Domain/TaskItem.cs - nullable DeletedAt, declared last with a default | tests/TaskTracker.Tests/SoftDeleteTests.cs::Active_task_serializes_deleted_at_as_null and ::Get_tasks_with_include_deleted_returns_soft_deleted_tasks (raw-JSON assertions, incl. round-trip parse) | SATISFIED | HIGH |
| Soft-Delete a Task - DELETE stamps deletedAt, returns 204, retains the task; unknown id 404 | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::SoftDelete + src/TaskTracker.Api/Endpoints/TaskEndpoints.cs MapDelete | tests/TaskTracker.Tests/SoftDeleteTests.cs::Delete_soft_deletes_the_task_and_retains_it, ::Delete_unknown_id_returns_404 | SATISFIED | HIGH |
| List Tasks (MODIFIED) - active-only by default, includeDeleted=true returns all | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::All(bool) + MapGet binding bool? includeDeleted | tests/TaskTracker.Tests/SoftDeleteTests.cs::Get_tasks_hides_soft_deleted_tasks_by_default, ::Get_tasks_with_include_deleted_returns_soft_deleted_tasks | SATISFIED | HIGH |
| Retrieve a Single Task Excludes Soft-Deleted - GET /{id} 404, PUT /{id} 404 | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::Get and ::Update both treat a non-null DeletedAt as absent | tests/TaskTracker.Tests/SoftDeleteTests.cs::Get_by_id_returns_404_for_a_soft_deleted_task, ::Put_on_a_soft_deleted_task_returns_404 | SATISFIED | HIGH |
| Existing Tasks Migrate As Active - the four seeded tasks stay active after startup | task-api | DeletedAt defaults to null, so TaskStore's seeder constructs active tasks with no seeder change at all | tests/TaskTracker.Tests/SoftDeleteTests.cs::Seeded_tasks_are_active_after_startup, corroborated by a live GET /tasks probe showing deletedAt null on the seeded rows | SATISFIED | HIGH |
| Repeat DELETE is 404 and preserves the first timestamp (RUN-DEC-001, C-011) | task-api | src/TaskTracker.Api/Domain/TaskStore.cs::SoftDelete returns null when DeletedAt is already set | tests/TaskTracker.Tests/SoftDeleteTests.cs::Repeat_delete_returns_404_and_keeps_the_original_timestamp | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Migration safeguard: the backward-compatible migration needs no migration code**
Attributed to TRG-001 (M2 sensitive-surface, data-store) and TRG-002 (M1 posture-crossing, data-store). DeletedAt is declared last on the TaskItem positional record with a default of null, so every pre-existing construction site - including TaskStore's four-task seeder, which is unchanged in the diff - keeps compiling and produces ACTIVE tasks. Verified twice, independently: Seeded_tasks_are_active_after_startup asserts all four seeded titles come back with a JSON null deletedAt, and a live probe of the running app returned deletedAt null on the seeded rows.

**VFY-002 — ADVISORY · FACT · HIGH · Persistence safeguard: retention is real and no hard-delete path survives**
Attributed to TRG-001 (M2, data-store). ConcurrentDictionary.TryRemove is gone from the codebase - a grep for TryRemove / .Remove( over src/TaskTracker.Api returns nothing - so no route can permanently drop a task. Retention is proved positively (the deleted task is still returned by ?includeDeleted=true), not inferred from its absence on the id route, which is what keeps C-003 honest: a bug that dropped the row would still satisfy the baseline's 204-then-404 assertion. SoftDelete also refuses to re-stamp an already-deleted task, so the original deletion instant is immutable.

**VFY-003 — ADVISORY · FACT · HIGH · Correction: a framing ASSUMPTION about malformed ?includeDeleted values was false**
Attributed to TRG-002 (M1, data-store) as part of checking the changed query surface. The frame record assumed a malformed includeDeleted value would fall back to the default view. Probing the running app disproved it: true/false/absent => 200, while banana, 1 and an empty value => 400 Bad Request from minimal-API bool? binding. No code change is warranted - 400 matches the repository's recorded convention that an unrecognized query-param value is rejected (docs/decision-log/2026-07-19-task-filter-validation.md), so the repo already answers the question and no stop was owed. Recorded here rather than by rewriting the completed frame pass.

**VFY-004 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth, deploy-ops and integration safeguards were not run, and are not owed**
Only the data-store surface fired (M1, M2), plus M4 on process. Credential/auth safeguards are N/A - the diff adds no auth surface and the API remains open, as the architecture records; deploy-ops safeguards are N/A - no config, workflow or hosting file is in the diff; integration safeguards are N/A - no external call and no dependency change (git diff --stat on both .csproj files is empty). Asserted, not skipped in silence.

**VFY-005 — ADVISORY · FACT · HIGH · Non-goal check: the persistence/durability non-goal is not crossed**
Attributed to TRG-002 (M1, data-store). The M1 crossing authorized by RUN-DEC-001 is about WHERE deletion state lives (the store's public shape), not about introducing durability. A grep for file / sqlite / DbContext / EntityFramework / StreamWriter / persist over src/TaskTracker.Api returns nothing: the store is still a process-lifetime ConcurrentDictionary registered as a singleton, and soft-deleted rows are lost on restart exactly like active ones. The architecture's 'Persistence / durability across restarts' non-goal therefore still holds.

### Decision-event audit

1 entries: 1 `RUN-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by the data-store surface (M1 + M2) and was run inside the loop, not deferred to a follow-up command. The safeguards that surface actually buys were run and passed: the migration claim (pre-existing rows materialize active) is proved by test and by a live HTTP probe of the running app; the retention claim is proved positively via ?includeDeleted=true rather than inferred from a 404; and the persistence NON-GOAL is asserted rather than assumed, by showing no durability mechanism and no dependency change entered the diff. Build and tests were re-run independently by the emitter (0 errors, 14/14) and all 12 contract statements carry direct HTTP-level evidence, so coverage is COMPLETE. READY rather than READY_WITH_DEBT: nothing was deferred, waived, or left to a later pass.
