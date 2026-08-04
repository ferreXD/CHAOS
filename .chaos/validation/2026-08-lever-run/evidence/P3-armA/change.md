---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: optimistic-concurrency-updates
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
    bodyHash: "sha256:2b7237aca5d03c09c6d97950e3455382eaf67253dd7da39c4ba6dde93f098a22"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T22:48:53Z", run: "RUN-2026-08-04-occ-a1", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T22:59:14Z", run: "RUN-2026-08-04-occ-a1", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T22:57:21Z", run: "RUN-2026-08-04-occ-a1", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "14/14"
      contract: "13/13"
      decisions: null
      traceability: "3/0/0"
      syncState: null
      archiveReadiness: READY
---

# optimistic-concurrency-updates — Optimistic concurrency on task updates

## Intent

Task 3 - Optimistic concurrency on task updates. PUT /tasks/{id} currently overwrites a task unconditionally, so a client working from a stale copy can silently clobber someone else's update (lost-update race). Add optimistic concurrency control. Contract (implement exactly this - behaviour is checked against it): Add an integer version to the task, serialized as version. New and seeded tasks start at version 1. Every successful PUT /tasks/{id} increments the task's version by 1 (1 -> 2 -> 3 ...). UpdateTaskRequest gains an optional integer field expectedVersion: when expectedVersion is provided and does not equal the task's current version, the update must be rejected with HTTP 409 Conflict and the task must be left unchanged (no field updated, version not bumped); when expectedVersion is provided and matches, the update succeeds (200) and the version increments; when expectedVersion is omitted (null), the update proceeds unconditionally (backward-compatible last-writer-wins) and the version increments. POST /tasks returns a task with version = 1. Constraints: Keep dotnet build and dotnet test green - the existing PUT test omits expectedVersion and must keep working. Do not change unrelated behaviour of the other CRUD endpoints. Work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Task shape**

- [x] Every task representation carries an integer `version`, serialized as `version`.
- [x] `POST /tasks` returns HTTP 201 with a task whose `version` is 1.
- [x] Tasks seeded into the store at startup start at `version` 1.

**Update semantics**

- [x] Every successful `PUT /tasks/{id}` increments the task's `version` by exactly 1 (1 -> 2 -> 3 ...).
- [x] `UpdateTaskRequest` accepts an optional integer field `expectedVersion`; omitting it is valid.
- [x] When `expectedVersion` is omitted (null), the update proceeds unconditionally (backward-compatible last-writer-wins) and returns HTTP 200 with the version incremented.
- [x] When `expectedVersion` is provided and equals the task's current `version`, the update succeeds with HTTP 200 and the version increments.

**Conflict semantics**

- [x] When `expectedVersion` is provided and does not equal the task's current `version`, the update is rejected with HTTP 409 Conflict.
- [x] A rejected (409) update leaves the task entirely unchanged: no field is updated and the version is not bumped.
- [x] The version comparison and the version increment are performed atomically inside `TaskStore`, so two concurrent writers cannot both succeed from the same observed version (ADR 2026-08-04-optimistic-concurrency-in-the-store).

**Non-regression**

- [x] The existing PUT integration test, which omits `expectedVersion`, keeps passing unchanged; `dotnet build` and `dotnet test` stay green (R-003).
- [x] `GET /tasks`, `GET /tasks/{id}`, `DELETE /tasks/{id}`, the blank-title 400 validation, and the 404-on-unknown-id behaviour of PUT are unchanged.
- [x] The domain layer gains no dependency on the HTTP layer (R-004) and `TaskState` naming is preserved (R-005).

OpenSpec: `openspec/changes/optimistic-concurrency-updates/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Actual invocation: `openspec new change optimistic-concurrency-updates` (CLI 1.6.0, first-class path) -> `openspec status --change optimistic-concurrency-updates --json` for the resolved artifact paths -> authored the owed delta spec at openspec/changes/optimistic-concurrency-updates/specs/task-api/spec.md -> `openspec validate optimistic-concurrency-updates --strict` returned "Change 'optimistic-concurrency-updates' is valid" (exit 0). Depth 1 owes the delta spec only; proposal.md/design.md/tasks.md are deliberately absent, so `openspec status` reads isComplete: false with applyRequires [tasks]. That is the classified depth, not degraded mode.

Classified depth: **1 — delta spec only**

Confidence impact: None. The owed depth was authored and strictly validated before the frame stop.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | agent entrypoint, protected files, minimum pre-edit behaviour | FACT |
| `.chaos/constitution.md` | human-ownership and confidence doctrine | FACT |
| `.chaos/rules/index.md` | R-001..R-007; R-003 green baseline, R-004 domain/HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/architecture.md` | boundary model, data-access posture, non-goals — the posture M1 crosses | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | the record that gains the Version component | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | the singleton ConcurrentDictionary store where the compare-and-swap must be atomic | FACT |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | UpdateTaskRequest, which gains optional expectedVersion | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the PUT handler that maps the conflict outcome to 409 | FACT |
| `src/TaskTracker.Api/Program.cs` | JSON policy (JsonStringEnumConverter) that determines how `version` serializes | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green five-test baseline, including the PUT test that omits expectedVersion | FACT |
| `openspec/specs/task-api/spec.md` | the main task-api spec the delta extends | FACT |

## Risk (strict)

Risk class: **MEDIUM** — Not an additive read-only surface: the change alters the shape of the persisted domain record and the semantics of an existing mutating endpoint, and it introduces a new failure status (409) on a route clients already use. Two triggers fired on the data-store surface. Blast radius stays small — four subject files plus tests, no auth, no durability, no new dependency — which is why this is MEDIUM rather than HIGH.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | A check-then-write implementation would leave the lost-update race in place under concurrent writers — the exact bug the change exists to fix. | Medium | High | ADR 2026-08-04 mandates the compare-and-swap inside TaskStore via ConcurrentDictionary.TryUpdate against the read snapshot; contract statement C-010 pins it. |
| RK-2 | Adding a component to the TaskItem record could break the existing PUT/POST paths or the test DTO, turning a green baseline red. | Medium | Medium | Version is set by the store's own construction paths, never by request binding; C-011/C-012 and the untouched existing tests are the oracle, and the emitter's verify pass re-runs build+tests independently. |
| RK-3 | A rejected update could partially mutate the task (write fields, then fail the version check), violating the leave-unchanged guarantee. | Low | High | The store compares before it writes and returns a conflict outcome without touching the dictionary; C-009 is covered by a dedicated test asserting every field and the version after a 409. |
| RK-4 | Serialization drift — `version` might not appear in the JSON payload under the configured serializer policy. | Low | Medium | Tests assert the field through the real HTTP surface via WebApplicationFactory, not against the in-process object, so a serialization miss fails the suite. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `Task Version Field (openspec delta spec, ADDED Requirement)` | — | C-001, C-002, C-003 (3) | Work unit 1: add the Version component to TaskItem and initialise it to 1 on every store construction path. |
| `Optimistic Concurrency On Task Update (openspec delta spec, ADDED Requirement)` | — | C-004, C-005, C-006, C-007, C-008, C-009, C-010 (7) | Work unit 1: expectedVersion on UpdateTaskRequest, the atomic compare-and-swap in TaskStore.Update, the 409 mapping in the PUT handler. Work unit 2: integration tests over the real HTTP surface. |
| `Unrelated CRUD Behaviour Is Preserved (openspec delta spec, ADDED Requirement)` | — | C-011, C-012, C-013 (3) | Work unit 2: keep the five baseline tests untouched and green; assert 404-on-unknown-id and blank-title 400 still hold; the verify pass re-runs build+tests independently. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Two things are worth flagging to a reviewer. First, the posture crossing is genuine and unavoidable rather than a matter of taste: the architecture prefers new behaviour at the endpoint boundary, but an endpoint-side check-then-write against a shared singleton store is racy by construction, so honouring the posture literally would ship the very lost-update bug this change exists to remove. The ADR records that argument and the rejected alternatives (ETag/If-Match, endpoint-level check) rather than waving the hedge through. Second, the documented deviation: no live human is available in this lever-run measurement, so each decision is recorded in the ledger and then resolved in-arm with an explicit maintainer-style rationale, tagged 'resolved-in-arm (no live human; lever-run mechanized run)' with status RESOLVED-IN-ARM. Answering the approves-change decision constitutes the approval for this run. Nothing else about the loop is relaxed: obligations are authored at the firing, the audit gate still has to pass, and the verify record is produced by the emitter's independent re-run.

Confidence limiters:

- `[FACT · HIGH]` K1 fired M2 (scan, surface data-store, TRG-001) and M1 (adjudication, surface data-store, TRG-002) at scanSeq 2; vector stops 1 / evidence.targeted 1 / evidence.breadth 0 / review 0 / verify 1 / openspec 1 / adr 2. The classifier reports confidence MEDIUM after the adjudication merge.
- `[FACT · HIGH]` The M1 firing closed the L1-D11 easy gate at the first scan of the run, so no implementation unit is delegable at mid tier; all implementation runs at ceiling.
- `[FACT · HIGH]` This run carries NO preset flag, so the floor vector is all zeros and the fired triggers alone set the rigor. The record's `mode` field is constrained to light|standard|strict and is recorded as `light` to denote the absence of any preset floor; it is vestigial under Stage C/D, where the dimension vector — not a mode word — sets what is owed.
- `[INFERENCE · MEDIUM]` The K1 adjudication deliberately did not pre-empt the deterministic scan on the additive `expectedVersion` request field (adjudication rule 12); any contract-surface firing it warrants belongs to the first K3 diff scan.
- `[FACT · HIGH]` No live human is available in this measurement run; every stop is resolved in-arm with a documented maintainer-style rationale (status RESOLVED-IN-ARM). This is a recorded deviation from the human-ownership contract, not a silent one.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 14/14 |
| contract | 13/13 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Contracts/TaskRequests.cs`, `src/TaskTracker.Api/Domain/TaskItem.cs`, `src/TaskTracker.Api/Domain/TaskStore.cs`, `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 8 scan(s) — derived from classification-state.json

status: Delivered · 2026-08-03 · run: RUN-2026-08-04-occ-a1
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet build: 0 errors, 0 warnings. dotnet test: 14/14 passed, 0 failed. The five baseline tests are unmodified in body — only the shared private TaskDto record gained a Version component so the new assertions can read it — and ::Put_updates_an_existing_task, which omits expectedVersion entirely, still passes. Independently re-run by the verify emitter (L4-D4) with identical results. |
| R-004 | grep over src/TaskTracker.Api/Domain/ for Microsoft.AspNetCore, IResult, Results., HttpContext returns no match. The new domain types (UpdateOutcome enum, UpdateResult record struct) express the outcome in domain vocabulary; Endpoints/TaskEndpoints.cs owns the 200/409/404 mapping. The domain->HTTP direction is unchanged. |
| R-005 | grep for TaskStatus over src/ and tests/ matches only the pre-existing doc comment in Domain/TaskItem.cs that explains why the name is avoided. No enum was renamed; TaskState is intact and still used throughout. |
| R-006 | git diff --name-only -- AGENTS.md README.md is empty. Neither protected file was read-modify-written, previewed or patched by this run. |

### Coverage honesty — how each contract statement was evidenced

11 of 13 statements are covered by a passing test. 2 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The version comparison and the version increment are performed atomically inside `TaskStore`, so two concurrent writers cannot both succeed from the same observed version (ADR 2026-08-04-optimistic-concurrency-in-the-store). | src/TaskTracker.Api/Domain/TaskStore.cs::Update; tests/TaskTracker.Tests/TaskEndpointsTests.cs::Concurrent_updates_from_the_same_version_let_exactly_one_writer_win | A test can make an atomicity claim very likely but cannot prove it: ::Concurrent_updates_from_the_same_version_let_exactly_one_writer_win drives ten simultaneous writers all holding version 1 and asserts exactly one 200, nine 409s and a final version of 2 — which a check-then-write implementation would fail — but no finite number of scheduling interleavings establishes the invariant. The proof is structural and is recorded as such: TaskStore.Update commits via ConcurrentDictionary.TryUpdate(id, updated, existing) where `existing` is the very snapshot whose version was compared, and TaskItem is a record whose value equality includes Version, so any interleaved write invalidates the comparand and the swap fails rather than clobbering. Counted as code evidence with the test as strong corroboration, rather than as test evidence. |
| The domain layer gains no dependency on the HTTP layer (R-004) and `TaskState` naming is preserved (R-005). | src/TaskTracker.Api/Domain/TaskStore.cs; src/TaskTracker.Api/Domain/TaskItem.cs; src/TaskTracker.Api/Endpoints/TaskEndpoints.cs | Both halves assert the ABSENCE of something, which a runtime integration test cannot observe. R-004 is the absence of an HTTP dependency in the domain: verified by grep over src/TaskTracker.Api/Domain/ for Microsoft.AspNetCore, IResult, Results. and HttpContext, which returns no match — the new UpdateOutcome/UpdateResult types carry no HTTP vocabulary and the status mapping stays in the endpoint. R-005 is the absence of a TaskStatus reintroduction: verified by grep over src/ and tests/, which matches only the pre-existing explanatory doc comment. A compile-time architecture test could enforce R-004 mechanically, but adding one is outside this change's approved scope. |

### Delivery notes

APPLIED rather than PARTIALLY_APPLIED: every one of the thirteen contract statements is delivered and evidenced, nothing was deferred, and no part of the intent was dropped or renegotiated along the way. Build is clean (0 errors, 0 warnings) and the suite is 14/14 with the five baseline tests unmodified in body — the backward-compatibility requirement is proven by the pre-existing PUT test, which omits expectedVersion and still passes untouched. The diff is exactly the five files predicted at K1, so scope drift is NO_DRIFT by measurement rather than by assertion: M5 never fired across all 8 scans.

The one decision that mattered here was where the concurrency check lives, and it was made explicitly (RUN-DEC-001, ADR 2026-08-04) rather than absorbed into implementation. Everything downstream follows from it: because the compare-and-swap sits inside TaskStore against the snapshot it validated, C-009 and C-010 are properties of the code's structure rather than of careful handling at the call site. Two coverage rows lean on code inspection alongside their tests and carry whyNotTest accordingly — C-010, whose atomicity claim a test can make very likely but not prove, and C-013, which asserts the absence of a dependency and so is verified by grep. Both are stated as such rather than quietly counted as test-covered. No deviations were needed: nothing in the delivered work departs from what RUN-DEC-001 approved, which is why the deviations list is empty rather than merely unfilled.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-04-occ-a1 · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 14/14 — independent re-run by chaos-record (L4-D4) |
| contract | 13/13 ticked; C-001..C-013 all covered: eleven by integration tests over the real HTTP surface, two (C-010 atomicity argument, C-013 rule compliance) by test plus direct code inspection. See the deliver record's coverage rows for the per-statement evidence. |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 3 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 8 scan(s) — derived from classification-state.json |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Task Version Field — every task carries an integer `version`; created and seeded tasks start at 1 | task-api (openspec delta, ADDED Requirement) | src/TaskTracker.Api/Domain/TaskItem.cs — `int Version` component; src/TaskTracker.Api/Domain/TaskStore.cs — AddAt is the single construction path and passes Version: 1, so seeded and created tasks are initialised identically by construction rather than by convention | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Post_returns_a_task_at_version_1, ::Seeded_tasks_start_at_version_1 | SATISFIED | HIGH |
| Optimistic Concurrency On Task Update — omitted expectedVersion updates unconditionally; matching succeeds; mismatched is rejected with 409 and changes nothing; every success increments the version | task-api (openspec delta, ADDED Requirement) | src/TaskTracker.Api/Domain/TaskStore.cs — Update() compares expectedVersion against the read snapshot and commits via ConcurrentDictionary.TryUpdate against that same snapshot; src/TaskTracker.Api/Contracts/TaskRequests.cs — optional `int? ExpectedVersion = null`; src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — maps UpdateOutcome to 200/409/404 | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Put_without_expected_version_succeeds_and_increments_the_version, ::Put_with_a_matching_expected_version_succeeds_and_increments_the_version, ::Put_with_a_stale_expected_version_is_rejected_with_409, ::A_rejected_update_leaves_the_task_completely_unchanged, ::Successive_successful_updates_increment_the_version_monotonically, ::Concurrent_updates_from_the_same_version_let_exactly_one_writer_win | SATISFIED | HIGH |
| Unrelated CRUD Behaviour Is Preserved — GET/DELETE, title validation and 404-on-unknown-id are unchanged | task-api (openspec delta, ADDED Requirement) | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — only the PUT handler body changed; the GET, POST and DELETE registrations are byte-identical, and the Title guard runs before the concurrency check exactly as before | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_returns_the_seeded_tasks, ::Post_creates_a_task_and_get_by_id_returns_it, ::Put_updates_an_existing_task, ::Delete_removes_a_task, ::Post_with_blank_title_is_rejected (all five unmodified) and ::Put_against_an_unknown_id_is_still_404 | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Persistence-semantics safeguard: the version token initialises to 1 on every path, by construction**
Attributed to TRG-001 (M2 sensitive-surface, data-store) and TRG-002 (M1 posture-crossing, data-store). TaskStore has exactly one construction path for a TaskItem — the private AddAt helper — and both the four seed calls and the public Add() route through it. Version: 1 is therefore not repeated at each call site where a seed could drift out of step with a create; there is structurally no second path to get wrong. Confirmed by ::Post_returns_a_task_at_version_1 and ::Seeded_tasks_start_at_version_1.

**VFY-002 — ADVISORY · FACT · HIGH · Persistence-semantics safeguard: the compare-and-swap is atomic and a rejected update mutates nothing**
Attributed to TRG-002 (M1, data-store) — this is the safeguard the ADR's crossing was authorized for. Update() commits with ConcurrentDictionary.TryUpdate(id, updated, existing), where `existing` is the exact snapshot whose version was validated; because TaskItem is a record with value equality and Version is part of that value, any concurrent write invalidates the comparand and the CAS fails rather than clobbering. The conflict branch returns before any dictionary write, so a 409 cannot leave a partial mutation. Verified behaviourally, not just by reading: ::Concurrent_updates_from_the_same_version_let_exactly_one_writer_win fires ten simultaneous writers all holding version 1 and asserts exactly one 200, nine 409s and a final version of 2 — the check-then-write implementation this change rejected would fail that assertion. ::A_rejected_update_leaves_the_task_completely_unchanged compares the whole record before and after a rejected update.

**VFY-003 — ADVISORY · INFERENCE · MEDIUM · The compare-and-swap retry loop is unbounded**
Attributed to TRG-002 (M1, data-store). When expectedVersion is null the update is unconditional, so a lost CAS re-reads and retries; there is no attempt cap and no backoff. This is correct — the loop only spins while some other writer is making progress, so it cannot deadlock or livelock in the lock-free sense — and it is appropriate for a process-lifetime in-memory demo store where contention on a single task id is negligible. Recorded as a maintainer-facing note rather than a defect: if this store ever became genuinely hot, or were replaced by a backing store where a retry costs I/O, the loop should gain a bounded attempt count that surfaces as a 409 or 503. Not debt against this change's contract — C-004/C-009/C-010 all hold as written.

**VFY-004 — ADVISORY · FACT · HIGH · The X2 firing was a verdict-string artefact, not a failed self-review**
Attributed to TRG-004 (X2 self-review-fail, surface none). The K4 detector is a literal equality test against the token `clean`; I supplied a prose PASS verdict, so it fired. The firing was honoured rather than undone — no re-run of K4 was attempted to launder it, dimensions stayed monotone, and review rose 1 -> 2 with verify held at 1. Process note for the toolkit, not for this change: a passing self-review expressed in prose is indistinguishable from a failing one to this detector, which makes X2 easy to trip accidentally and correspondingly noisy as a signal.

**VFY-005 — ADVISORY · FACT · HIGH · Independent review pass (owed by review 2) found no defect**
Attributed to TRG-004 (X2), which raises review to 2 and routes to an independent pass. Performed at ceiling over the full diff. Checked and clear: the Title guard still precedes the concurrency check so blank-title input remains 400 rather than 409; the version is server-managed and cannot be set through either request record (CreateTaskRequest is unchanged and UpdateTaskRequest exposes only expectedVersion); the ExpectedVersion parameter is optional with a null default so existing clients and the untouched baseline PUT test bind correctly; the 404 branch is reached before any version comparison, so an unknown id cannot be reported as a conflict. One judgement call worth surfacing: the 409 response body is not specified by the task contract, so I followed the repository's existing error convention — an object with an `error` message — and added expectedVersion and currentVersion so a client can resync without a second GET. That is additive to an error path no existing test or spec pins, and no contract statement constrains it.

**VFY-006 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth, deploy and durability safeguards were not run and are not owed**
The fired surfaces are data-store (TRG-001, TRG-002) and process (TRG-003 M4 decision-density); no auth, integration or deploy-ops surface fired at any of the 8 scans. Asserted rather than silently skipped: the diff touches no credential, key or config material, adds no dependency to either .csproj, and introduces no durability — the version counter is in-memory process-lifetime state exactly like the rest of TaskStore, so the architecture's persistence non-goal is untouched and there is no migration to check. The store remains a singleton ConcurrentDictionary; the horizontal-scale non-goal is likewise unaffected, though a reader should note that optimistic concurrency is precisely the mechanism that would still be correct if that non-goal were ever revisited.

### Decision-event audit

0 entries: . No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by the data-store firings (TRG-001 M2, TRG-002 M1) and again mechanically by TRG-004 (X2), and it ran inside the loop. Build and tests were re-run independently by the emitter — 0 errors, 0 warnings, 14/14 — and the OpenSpec delta re-validated strictly. The safeguards the fired surface actually demands are persistence-semantics checks, and all four hold: version initialises to 1 on the store's single construction path, the compare-and-swap is atomic, a rejected update mutates nothing, and no durability or migration surface was introduced. Nothing is deferred and no debt is carried, so this is READY rather than READY_WITH_DEBT.
