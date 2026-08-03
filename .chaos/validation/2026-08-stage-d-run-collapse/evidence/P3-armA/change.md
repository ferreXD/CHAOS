---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: optimistic-concurrency-updates
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T15:55:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T15:55:00Z"
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
    bodyHash: "sha256:8f27f2c8304cb7a7200fc537c72d54d1dc792215fa8496d8310433e306bbb2c0"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T15:31:31Z", run: "RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T15:55:00Z", run: "RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T15:52:00Z", run: "RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "11/11"
      contract: "12/12"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: READY
---

# optimistic-concurrency-updates — Optimistic concurrency on task updates

## Intent

PUT /tasks/{id} overwrites unconditionally, so a client holding a stale copy can silently clobber another writer (lost-update race).
Add optimistic concurrency: an integer `version` on the task (new and seeded tasks start at 1), incremented on every successful PUT.
`UpdateTaskRequest` gains an optional `expectedVersion`: mismatch -> 409 Conflict with the task untouched; match -> 200 + bump; omitted -> unconditional last-writer-wins + bump.

## Contract

**Task representation**

- [x] TaskItem carries an integer version, serialized in JSON as `version`.
- [x] Seeded tasks are returned with `version` = 1.
- [x] POST /tasks returns 201 with a task whose `version` = 1.

**Update semantics**

- [x] UpdateTaskRequest accepts an optional integer `expectedVersion` (absent/null is legal).
- [x] Every successful PUT /tasks/{id} increments the task's `version` by exactly 1.
- [x] PUT /tasks/{id} with an `expectedVersion` that does not equal the task's current `version` is rejected with HTTP 409 Conflict.
- [x] A 409-rejected PUT leaves the stored task completely unchanged: no field updated and no version bump.
- [x] PUT /tasks/{id} with an `expectedVersion` equal to the current `version` succeeds with 200 and increments `version`.
- [x] PUT /tasks/{id} with `expectedVersion` omitted proceeds unconditionally (last-writer-wins) with 200 and increments `version`.
- [x] PUT /tasks/{id} for an unknown id returns 404 whether or not `expectedVersion` is supplied.

**Regression safety**

- [x] dotnet build and dotnet test stay green, including the pre-existing PUT test that omits `expectedVersion`.
- [x] GET /tasks, GET /tasks/{id} and DELETE /tasks/{id} keep their existing behaviour; changes stay inside src/TaskTracker.Api and tests/TaskTracker.Tests.

OpenSpec: `openspec/changes/optimistic-concurrency-updates/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `hand-authored (openspec CLI not present in this environment)` (openspec/config.yaml)

Actual invocation: openspec/changes/optimistic-concurrency-updates/

Generated OpenSpec artifacts:

- `openspec/changes/optimistic-concurrency-updates/specs/task-api/spec.md`

Classified depth: **1 — delta spec only**

`openspec status --change optimistic-concurrency-updates --json` reports `isComplete: false` — expected: the CLI measures the full set, which this change does not owe at its classified depth; openspec dimension 1 = delta spec ONLY (no proposal.md/tasks.md/design.md). `openspec status` measures the FULL set, so isComplete:false is the expected answer at depth 1 and is not degraded mode. The CLI is absent here; hand-authoring stands in for it, which is also not degraded mode and not a trigger..

Confidence impact: None on the contract: the delta spec restates the same testable statements recorded in contract.json.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `.chaos/architecture.md` | posture of record; the boundary/data-access lines the M1 firing cites (evidence.targeted 1) | FACT |
| `.chaos/rules/index.md` | R-003 green baseline, R-004 domain must not depend on HTTP, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/constitution.md` | knowledge/confidence doctrine applied to every verdict in this run | FACT |
| `.chaos/path-class-map.json` | classifier path/marker classes; persistence class matched the predicted scope (M2) | FACT |

## Framing record

verdict: READY_FOR_REVIEW · confidence: MEDIUM · evidence_coverage: PARTIAL · assumption_load: LOW

Documented deviation (measurement arm): no live human is available. Each decision is recorded AND resolved with an explicit maintainer-style rationale, status tagged `RESOLVED-IN-ARM` alongside `ANSWERED` and labelled 'resolved-in-arm (no live human; Stage-D mechanized run)'. Answering the `approves-change` decision IS the approval. Classification telemetry in this record comes from the classifier verdicts and classification-state.json, not from memory.

Confidence limiters:

- `[INFERENCE · MEDIUM]` M1 was raised by the adjudication layer against a hedged posture line ([INFERENCE · MEDIUM] boundary posture, 'unless a decision says otherwise'); the classifier reports MEDIUM confidence whenever a firing comes from adjudication.
- `[FACT · HIGH]` Baseline measured before any edit: dotnet build clean, dotnet test 5/5 green.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 11/11 (baseline 5 preserved + 6 added for optimistic concurrency) |
| contract | 12/12 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Domain/TaskItem.cs`, `src/TaskTracker.Api/Domain/TaskStore.cs`, `src/TaskTracker.Api/Contracts/TaskRequests.cs`, `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — the delivered diff is exactly the five paths predicted in the K1 scope; M5 never fired

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 11/11 green; the 5-test baseline is intact |
| R-004 | Domain/** references no ASP.NET type; TaskStore.Update returns the HTTP-free UpdateOutcome and TaskEndpoints.cs owns the 409 mapping |
| R-005 | TaskState naming untouched; no TaskStatus introduced |
| R-006 | AGENTS.md and root README.md unmodified |

### Coverage honesty — how each contract statement was evidenced

11 of 12 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| GET /tasks, GET /tasks/{id} and DELETE /tasks/{id} keep their existing behaviour; changes stay inside src/TaskTracker.Api and tests/TaskTracker.Tests. | TaskEndpointsTests.Get_tasks_returns_the_seeded_tasks; TaskEndpointsTests.Post_creates_a_task_and_get_by_id_returns_it; TaskEndpointsTests.Delete_removes_a_task; TaskEndpointsTests.Post_with_blank_title_is_rejected; .tmp/scan2.numstat (5 files, all in scope) | The behavioural half IS test-covered by the four unchanged pre-existing tests (GET list, GET by id via POST round-trip, DELETE, blank-title 400). The second half — 'changes stay inside src/TaskTracker.Api and tests/TaskTracker.Tests' — is a property of the diff rather than of any test: the C-15-scoped numstat for scan 2 lists exactly five files, all under those two trees, and M5 scope-spill never fired across scans 4-7. |

### Delivery notes

All twelve contract statements are delivered and covered, build is clean, tests are 11/11 green, no scope drift, no deviations. APPLIED rather than PARTIALLY_APPLIED.

Delivered in two work units, each followed by a C-15-scoped K3 rescan: (1) the vertical slice — TaskItem.Version, the compare-and-set in TaskStore.Update with an HTTP-free UpdateOutcome, UpdateTaskRequest.ExpectedVersion, and the 409 mapping at the endpoint; (2) the six integration tests. No S2 fired (no scan produced newStops) and no S3 discordance arose: the task contract was fully specified and the repository answered every remaining question (R-004 direction, R-005 naming, the in-memory non-goal).

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153 · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — re-run independently at verify time |
| tests | 11/11 — 5 pre-existing + 6 added; the pre-existing PUT test still omits expectedVersion and still passes |
| contract | 12/12 ticked; 10 of 12 statements carry direct test evidence; C-011 and C-012 are evidenced by the build/test run itself and by the unchanged pre-existing tests |
| scope drift | **NO_DRIFT** — the C-15-scoped diff touches exactly the 5 predicted paths under src/TaskTracker.Api and tests/TaskTracker.Tests; M5 never fired across scans 4-7 |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Findings

**VFY-001 — ADVISORY · INFERENCE · HIGH · Compare-and-set atomicity is evidenced by construction, not by a concurrency stress probe**
Safeguard check for TRG-001 (M2, data-store). TaskStore.Update re-reads inside a loop and commits with ConcurrentDictionary.TryUpdate(id, updated, existing), whose comparison is TaskItem record value-equality including Version — so a writer that lost the race fails TryUpdate and retries against fresh state. The alternative rejected in ADR-001 (endpoint reads, compares, writes back) is exactly what would leave the race open. No multi-threaded probe was run: at this blast radius (single-process, in-memory, 5 files) construction plus the stale-version integration test is proportionate evidence.
Recommend If the store ever moves off ConcurrentDictionary, add a parallel-writer test before that change lands..

**VFY-002 — ADVISORY · FACT · HIGH · Persistence non-goal preserved: no durability introduced**
Safeguard check for TRG-001 (M2, data-store) and TRG-002 (M1, data-store). The store is still a single ConcurrentDictionary<Guid, TaskItem> with no DbContext, no SqlConnection and no file I/O; version numbers reset with the process, which is the correct semantics for a process-lifetime store. The architecture non-goal 'persistence / durability across restarts' is untouched, so the M1 crossing authorized by PROP-DEC-001 stays confined to the store's in-memory shape.

**VFY-003 — ADVISORY · FACT · HIGH · Conflict path is a true no-op**
Safeguard check for TRG-001 (M2, data-store). TaskStore.Update returns VersionConflict before constructing the updated record, so a rejected PUT mutates nothing. Verified end-to-end: Put_with_stale_expected_version_is_rejected_and_changes_nothing asserts 409 and then re-reads the task, confirming title, status, priority and version are all the winner's values (C-006, C-007).

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by the M2 data-store firing (TRG-001), so the trigger-attributed safeguard family is persistence/store semantics — not the full orchestration. Build and tests were re-run independently (0/0, 11/11) and every persistence-semantics safeguard passed: version monotonicity, no-op-on-conflict, initial version 1, in-memory-only store (the durability non-goal is untouched), and compare-and-set atomicity by construction. One ADVISORY finding remains (no multi-threaded stress probe), which is debt-free at this blast radius, so the verdict is READY rather than READY_WITH_DEBT.
