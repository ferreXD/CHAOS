---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: add-priority-filter
  mode: None
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T21:38:31Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T21:38:31Z"
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
    bodyHash: "sha256:e39e12ba008c3c6e730bde3cc61c133df45d145eaa97b7d4e1f235ded0a30e34"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-04T21:33:42Z", run: "RUN-2026-08-04-chaos-run-20b9a2", mode: None, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-04T21:38:31Z", run: "RUN-2026-08-04-chaos-run-20b9a2", mode: None, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-04T21:38:26Z", run: "RUN-2026-08-04-chaos-run-20b9a2", mode: None, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "47/47"
      contract: "7/7"
      decisions: 1
      traceability: "4/0/0"
      syncState: null
      archiveReadiness: READY
---

# add-priority-filter — Optional ?priority= filter on GET /tasks

## Intent

Add an optional ?priority= query filter to GET /tasks, accepting Low, Medium or High. Omitting the parameter keeps today's behaviour of returning everything. An unrecognised value is a 400. Keep the filtering in the endpoint layer over the existing store.All() result - do not change TaskStore.

## Contract

**Filter behaviour**

- [x] `GET /tasks` with no `priority` query parameter returns HTTP 200 and the full `store.All()` result in creation order — identical to today's behaviour.
- [x] `GET /tasks?priority=Low`, `?priority=Medium` and `?priority=High` each return HTTP 200 with exactly the tasks whose `Priority` equals the requested value, in creation order. A filter that matches nothing returns HTTP 200 with an empty array, never 404.
- [x] `GET /tasks?priority=<anything else>` returns HTTP 400 with a JSON error body and no task data. "Anything else" explicitly includes comma-separated lists (`Low,High`), numeric enum values (`0`, `2`), and any name outside the three accepted ones.
- [x] The three accepted values are matched **case-insensitively**: `?priority=low`, `?priority=LOW` and `?priority=Low` are equivalent and all return the Low tasks. This refines C-002 and narrows C-003's "any name outside the three" to a case-insensitive comparison, matching how the request-body path already deserializes the same enum.
- [x] An empty value — `GET /tasks?priority=` — returns HTTP 400 under C-003, and is NOT treated as if the parameter had been omitted. Only an absent `priority` parameter reaches C-001's return-everything path.

**Boundary**

- [x] The parsing, validation and filtering all live in `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` and operate over the result of `store.All()`. `Domain/TaskStore.cs` and `Domain/TaskItem.cs` are not modified (R-004 domain→HTTP boundary; the intent's explicit constraint).

**Non-regression**

- [x] The existing test baseline stays green and `dotnet build` stays clean. Every other `/tasks` route is unchanged, and the group's `RequireAuthorization()` + `RequireRateLimiting()` still apply to the filtered GET.

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Actual invocation: skipped, openspec dimension 0 — the K1 classification fired no trigger, so no OpenSpec artifact is owed and the contract of record is change.md §Contract. This is the classified outcome, not degraded mode.

Classified depth: **1 — delta spec only**

Confidence impact: None. Depth 0 is the classified obligation.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint, pre-edit behaviour, protected files | FACT |
| `.chaos/architecture.md` | boundary posture and API strategy; names GET /tasks query filtering as the known extension point | FACT |
| `.chaos/rules/index.md` | R-003 green baseline, R-004 domain→HTTP boundary, R-005 TaskState naming | FACT |
| `.chaos/context.md` | open question OQ-002 — invalid filter value: 400 vs ignore | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the GET /tasks handler this change modifies | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | supplies All(); explicitly not modified | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | TaskPriority enum defining the three accepted values | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the green integration-test baseline the new cases join | FACT |

## Risk (strict)

Risk class: **LOW** — An additive, optional, read-only query filter on an existing authenticated route. No auth, persistence or contract-type change; the unfiltered path is preserved by C-001.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | A naive `Enum.TryParse` guard silently accepts comma-separated lists (`?priority=Low,High`) and numeric values (`?priority=0`), returning 200 where C-003 requires 400. | High | Medium | C-003 pins both shapes explicitly; the handler validates against an exact allow-list of the three names rather than delegating to Enum.TryParse, and tests cover the list and numeric forms. This exact defect shipped once before on this exact feature (model-tier-map, route B closure 2026-08-04). |
| RK-2 | Regressing the unfiltered `GET /tasks` response while adding the filter. | Low | Medium | C-001 pins the omitted-parameter path; the existing baseline tests already assert it and stay green (R-003). |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `priority-filter on GET /tasks (no OpenSpec artifact owed at depth 0)` | — | C-001, C-002, C-003, C-004, C-005 (5) | 1 work unit: parse + validate + filter in the GET /tasks handler, with integration tests for the omitted, valid, empty-result and rejected forms. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

The intent also settles context OQ-002 ("what should an invalid filter value return once filtering is added — 400 vs ignore?") in favour of 400. That open question was recorded as deferred to the first proposal on this surface; this run is that surface, so closing OQ-002 in context.md and the architecture API-strategy section is owed as a sync action, not a silent side effect.

Confidence limiters:

- `[FACT · HIGH]` K1 classification fired zero triggers with the architecture posture attached (deterministic scan + adjudication pass, scanSeq 1); the dimension vector sits at its floors.
- `[INFERENCE · MEDIUM]` The added query parameter is expected to fire M3 contract-surface at the first K3 diff scan; the K1 adjudication deliberately declined to pre-empt it per adjudication rule 12 (an announced additive parameter is the route-delta scan's job).
- `[FACT · HIGH]` Two contract points are unresolved by the repository and are folded into S1 rather than decided here: whether `?priority=low` is accepted, and whether an empty `?priority=` is a 400 or behaves as omitted.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 47/47 |
| contract | 7/7 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json

status: Delivered · 2026-08-04 · run: RUN-2026-08-04-chaos-run-20b9a2
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 47/47, 0 failed. The 34 baseline tests are unmodified — the diff adds tests and changes none. |
| R-004 | No file under src/TaskTracker.Api/Domain/ changed. Parsing, validation and filtering all sit in Endpoints/TaskEndpoints.cs, consuming the store's existing All(); the store gained no query surface. |
| R-005 | No enum was renamed or introduced. TryParsePriority reads Enum.GetNames<TaskPriority>(); TaskState is not referenced by this change. |

### Coverage honesty — how each contract statement was evidenced

6 of 7 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The parsing, validation and filtering all live in `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` and operate over the result of `store.All()`. `Domain/TaskStore.cs` and `Domain/TaskItem.cs` are not modified (R-004 domain→HTTP boundary; the intent's explicit constraint). | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — TryParsePriority + the filter applied to store.All() inside the GET handler; deliver facts: 2 files touched, neither under src/TaskTracker.Api/Domain/; git status --porcelain src tests — only TaskEndpoints.cs and TaskEndpointsTests.cs modified | This statement asserts a property of the diff, not of the running system: that the filtering lives in the endpoint layer and that TaskStore.cs / TaskItem.cs were left alone. A black-box HTTP test cannot observe which file the logic sits in — identical responses would be produced by a store-level filter, which is exactly what the statement forbids. The evidence is therefore the file list, which the classifier's C-15 diff and the deliver record derive mechanically rather than take on my word. |

### Delivery notes

All seven contract statements are delivered and evidenced, six of them by tests that fail against the pre-change handler. The C-15-scoped diff is exactly the two files declared at K1, so M5 never fired. The classifier's own confidence sits at MEDIUM because the M3 contract-surface firing came from adjudication rather than the deterministic scan; that qualifies how the change was *classified*, not how it was *evidenced* — build and tests were re-run independently by the tool at close, 47/47.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-04 · run: RUN-2026-08-04-chaos-run-20b9a2 · mode: None

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 47/47 — independent re-run by chaos-record (L4-D4) |
| contract | 7/7 ticked; join against deliver.pass-01.facts.json — derived, same rule the renderer ticks by |
| traceability | 4 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Listing tasks without a filter is unchanged | task-filtering | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — `priority is null` returns Results.Ok(store.All()) before any validation runs | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_without_priority_returns_every_priority | SATISFIED | HIGH |
| Tasks can be filtered by priority | task-filtering | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — tasks.Where(t => t.Priority == requested) over store.All(), preserving creation order | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_filtered_by_priority_returns_only_that_priority, ::Get_tasks_priority_filter_ignores_casing, ::Get_tasks_filter_matching_nothing_returns_an_empty_list | SATISFIED | HIGH |
| An unrecognised priority value is rejected | task-filtering | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — TryParsePriority matches whole enum names case-insensitively; anything else returns Results.BadRequest | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_with_an_unrecognised_priority_is_rejected (6 cases) | SATISFIED | HIGH |
| Filtering stays in the HTTP layer | task-filtering | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — the only production file changed; Domain/ untouched | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_with_a_priority_filter_still_requires_authentication, plus the unmodified 34-test baseline | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Contract check: the route delta is additive, and the pre-change call shape is preserved**
Attributed to TRG-002 (M3 contract-surface, breaking false). The route template MapGet("/") is byte-identical; the delta is one added optional query parameter plus a 400 status that is unreachable unless the parameter is supplied. Every existing caller of GET /tasks — which by definition sends no priority parameter — takes the same code path and receives the same 200 and the same body as before, asserted by the unmodified baseline test Get_tasks_returns_the_seeded_tasks.

**VFY-002 — ADVISORY · FACT · HIGH · Contract check: the permissive-parse failure mode that closed tier route B is covered by a failing-first test**
The handler binds the parameter as string? and matches whole enum names, rather than binding TaskPriority? and delegating to Enum.TryParse. That is deliberate: Enum.TryParse accepts comma-separated lists and numeric values, so ?priority=Low,High would return 200 with the Low tasks. Both shapes are asserted to return 400 (InlineData "Low,High", "0", "2"). This is the exact defect recorded in the model-tier-map route-B closure of 2026-08-04, and the reason this unit was not run at the floor tier.

**VFY-003 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth, data-store and deploy safeguards were not run, and are not owed**
Only the contract-dependency surface fired (TRG-002), so credential, persistence and deploy safeguards are N/A — asserted rather than silently skipped. The diff touches no Domain/** file, no secrets path, no appsettings key and no composition root: the two changed files are Endpoints/TaskEndpoints.cs and the test file. The M4 firing at K2 carried surface 'process' (decision density), which owes no runtime safeguard.

**VFY-004 — ADVISORY · FACT · HIGH · OpenSpec isComplete:false is the expected reading at classified depth 1**
openspec validate add-priority-filter --strict returns valid. openspec status reports isComplete:false with applyRequires:[tasks], because the CLI measures the full spec-driven artifact set (proposal, design, specs, tasks) while depth 1 owes only the delta spec. This is the classified obligation met, not a degraded or partial invocation.

**VFY-005 — ADVISORY · FACT · HIGH · Follow-up owed outside this change: OQ-002 is now answered**
RUN-DEC-001 settles context open question OQ-002 ('what should an invalid filter value return once filtering is added — 400 vs ignore?') in favour of 400, and the delta spec records it. Closing OQ-002 in .chaos/context.md and updating the .chaos/architecture.md API-strategy section are source-of-truth edits owed to chaos:sync, carried on the ledger entry as sync-action UPDATE_CHAOS_RULES. They are deliberately not made here: this run governs src/ and tests/, not the repository's own posture documents.

### Decision-event audit

1 entries: 1 `RUN-DEC`. No OPEN entry. Sync actions declared and syncable: `UPDATE_CHAOS_RULES`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by the M3 contract-dependency firing and was run inside the loop, attributed to that surface: the route delta is confirmed additive, the new 400 path is reachable only when the parameter is supplied, and the omitted-parameter response is byte-compatible with the baseline. Build and tests were re-run independently of my own run. Nothing is deferred and no debt is recorded, so READY rather than READY_WITH_DEBT.
