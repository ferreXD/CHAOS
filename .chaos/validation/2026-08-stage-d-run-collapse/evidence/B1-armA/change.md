---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: task-count
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T16:06:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T16:06:00Z"
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
    bodyHash: "sha256:86830e260ef91a344fb45cfa1086bb33a65d1a5688f82d4d46fc011da0efc4c2"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T15:58:00Z", run: "RUN-2026-08-03-chaos-run-task-count-8b90fa", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T16:06:00Z", run: "RUN-2026-08-03-chaos-run-task-count-8b90fa", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T16:04:00Z", run: "RUN-2026-08-03-chaos-run-task-count-8b90fa", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "8/8"
      contract: "5/5"
      decisions: 1
      traceability: "5/0/0"
      syncState: null
      archiveReadiness: READY
---

# task-count — Active-task count endpoint

## Intent

Add a lightweight aggregate endpoint that reports how many tasks exist.
This is a read-only convenience for the dashboard; it introduces no authentication and no persistence-model change.
Contract: GET /tasks/count -> 200 { "count": <int> }, always equal to the item count of GET /tasks; +1 on POST /tasks (201), -1 on DELETE /tasks/{id} (204); GET / and existing /tasks CRUD unchanged.

## Contract

**Endpoint**

- [x] `GET /tasks/count` returns HTTP 200 with a JSON object `{ "count": <integer> }`.

**Invariants**

- [x] `count` equals the number of items returned by `GET /tasks` for the same store at the same moment.
- [x] A successful `POST /tasks` (201) increases `count` by exactly 1.
- [x] A successful `DELETE /tasks/{id}` (204) decreases `count` by exactly 1.

**Non-regression**

- [x] `GET /` and all existing `/tasks` CRUD behaviour are unchanged: the 5 baseline tests still pass and `dotnet build` stays green.

OpenSpec: `openspec/changes/task-count/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `openspec` CLI 1.6.0 (openspec/config.yaml)

Actual invocation: Delta spec hand-authored at the M3 firing (K3 scan 1), then validated with the installed CLI. Depth 1 owes the delta spec only — no proposal.md, design.md or tasks.md.

Generated OpenSpec artifacts:

- `openspec/changes/task-count/specs/task-api/spec.md`

Classified depth: **1 — delta spec only**

`openspec status --change task-count --json` reports `isComplete: false` — expected: the CLI measures the full set, which this change does not owe at its classified depth; artifacts: specs done; proposal ready; design/tasks blocked on the artifacts depth 1 does not owe.

Validation command: `openspec validate task-count --strict`

Validation result: **PASS** — "Change 'task-count' is valid"

Confidence impact: None. Depth 1 is exactly what the fired M3 owes under Stage-C C-10.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint, protected files, pre-edit behaviour | FACT |
| `.chaos/constitution.md` | knowledge/confidence doctrine | FACT |
| `.chaos/rules/index.md` | R-001..R-007 executable constraints | FACT |
| `.chaos/architecture.md` | boundary model, non-goals, posture (classifier postureFile) | FACT |
| `openspec/specs/task-api/spec.md` | the base capability spec the delta extends | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the new route joins | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | the store whose item count the endpoint reports | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline | FACT |

## Risk (strict)

Risk class: **LOW** — Additive read-only route on an in-memory store; no auth, no persistence-model change, no existing behaviour touched.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | `/tasks/count` could be swallowed by the existing `/tasks/{id:guid}` route. | Low | Medium | The existing route carries a `:guid` constraint, so `count` cannot match it; asserted by a test that expects 200 + a JSON count body. |
| RK-2 | Reading the count off the store could drift from `GET /tasks` if a second enumeration path were introduced. | Low | Low | The endpoint counts the same `TaskStore.All()` enumeration `GET /tasks` returns; C-002 is asserted by test. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-api` | 1 | C-001, C-002, C-003, C-004, C-005 (5) | 1 work unit: add the route in Endpoints/TaskEndpoints.cs + 3 integration tests in tests/TaskTracker.Tests. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Pass 1 recorded the K1 truth honestly: zero triggers, openspec dimension 0, no artifact owed, contract of record in change.md. Pass 2 supersedes only the OpenSpec facts, after M3 fired on the actual route delta at K3 scan 1. The delta spec was authored before the surface was implemented further, never at close. No mode escalation and no ESC-* entry: under Stage C/D a firing raises dimensions, it does not change the mode.

Confidence limiters:

- `[FACT · HIGH]` M3 contract-surface fired at the first K3 diff scan (scan, surface contract-dependency, additive route delta 'GET /count', breaking false), raising openspec 0->1, adr 0->1, verify 0->1. Recorded as TRG-001.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 8/8 (5 baseline tests unchanged and green + 3 added for the count contract) |
| contract | 5/5 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — the C-15-scoped diff (git diff -- src tests) covers exactly the two paths declared in the approved scope at K1; M5 never fired

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-run-task-count-8b90fa
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 8/8, 0 failed; the 5 baseline tests are unmodified |
| R-004 | no Domain/** file changed; the aggregate is read at the endpoint boundary, so the domain gained no HTTP dependency and TaskStore's public shape did not widen |
| R-005 | no rename of TaskState or any domain type; the only src change is one added route registration |
| R-006 | AGENTS.md and root README.md untouched |

### Delivery notes

Every contract statement is delivered and test-covered, build and tests are green, no deviation was taken and the diff never left the approved scope — APPLIED, not PARTIALLY_APPLIED.

One work unit delivered the whole contract: one added route registration in Endpoints/TaskEndpoints.cs plus three integration tests. The count is computed from the same TaskStore.All() enumeration GET /tasks returns, which is what makes C-002 structural rather than merely tested. Six classifier scans ran across K1/K2/K3/K4; the only firing was M3 at the first diff scan (TRG-001).

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-03-chaos-run-task-count-8b90fa · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run inside the loop |
| tests | 8/8 — 5 baseline + 3 added; independent re-run inside the loop |
| contract | 5/5 ticked; C-001..C-005, each test-covered |
| openspec | `validate --strict` PASS · `isComplete: false` |
| traceability | 5 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — diff paths are exactly the two approved scope paths; M5 never fired at any scan |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Count Tasks — count returns the store total | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — group.MapGet("/count", ...) | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_count_returns_the_number_of_tasks_in_the_store | SATISFIED | HIGH |
| Count Tasks — count agrees with the task list | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — count derived from the same TaskStore.All() enumeration GET /tasks returns | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Get_tasks_count_returns_the_number_of_tasks_in_the_store | SATISFIED | HIGH |
| Count Tasks — creating a task increments the count | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — count is computed per request off the singleton store | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Post_increases_the_count_by_exactly_one | SATISFIED | HIGH |
| Count Tasks — deleting a task decrements the count | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — count is computed per request off the singleton store | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Delete_decreases_the_count_by_exactly_one | SATISFIED | HIGH |
| Count Tasks — existing endpoints are unaffected | task-api | Program.cs and the existing /tasks route registrations are byte-identical to baseline | tests/TaskTracker.Tests/TaskEndpointsTests.cs — the 5 baseline tests | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Contract check: the route delta is purely additive — no public surface removed or renamed**
Attributed to TRG-001 (M3 contract-surface, surface contract-dependency, breaking false). `git diff -- src tests | grep '^[+-].*Map(Get|Post|Put|Delete)('` yields exactly one line, an addition: `group.MapGet("/count", ...)`. No MapGet/MapPost/MapPut/MapDelete registration was deleted, renamed, or re-pointed at a 410 tombstone, so the breaking heuristic's negative verdict is confirmed by direct inspection.

**VFY-002 — ADVISORY · FACT · HIGH · Contract check: the delta spec matches the implemented contract**
Attributed to TRG-001 (M3). `openspec validate task-count --strict` reports "Change 'task-count' is valid". The five scenarios under Requirement: Count Tasks map 1:1 onto contract statements C-001..C-005, and a live request against the running app returned `{"count":4}` with HTTP 200 while `GET /tasks` returned 4 items — the declared shape and the C-002 equality hold in the real process, not only in the test host.

**VFY-003 — ADVISORY · FACT · HIGH · Contract check: no dependency manifest moved**
Attributed to TRG-001 (M3's dependency arm, C-4). `git status --short -- '*.csproj' '**/packages.lock.json'` is empty: no new direct dependency and no version bump, so neither the M3 manifest arm nor X3 has anything to answer for.

**VFY-004 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth and data-store safeguards were not run, and are not owed**
verify 1 runs the safeguards of the surface that fired. Only TRG-001 (contract-dependency) fired, so credential/enforcement checks and persistence/migration checks are N/A — asserted, not skipped silently: the diff touches no `src/**/Domain/**`, no `**/secrets/**`, no `appsettings*.json` key, and no deploy path, and the intent explicitly disclaims auth and persistence-model change. No M2 fired at any of the six scans.

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed and run inside the loop, attributed to TRG-001 (M3, surface contract-dependency), so the safeguard set is the contract checks. Build and tests were re-run independently (0/0, 8/8), the route delta was confirmed purely additive, no dependency manifest moved, the delta spec validates strict against the implemented contract, and a live request returned the declared body verbatim. All five contract statements are covered by tests; nothing is deferred, so READY rather than READY_WITH_DEBT.
