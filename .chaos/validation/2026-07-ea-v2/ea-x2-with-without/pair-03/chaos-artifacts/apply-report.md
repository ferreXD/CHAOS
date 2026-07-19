---
chaosMetadata:
  schemaVersion: 1
  artifactType: apply-report
  artifactScope: change
  changeId: optimistic-concurrency-updates
  sourceCommand: "chaos:apply"
  lastWrittenAt: "2026-07-19T18:25:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:25:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/ea-x2/p3-armA
    reviewRequest: null
    contextSource: git
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
---

# CHAOS Apply Report — optimistic-concurrency-updates

## 1. Summary

Change ID: `optimistic-concurrency-updates`
Mode: `strict`
Mode source: `inferred`
Result: `APPLIED`
Implementation: `self (EA-X2 mechanized run; no subagents spawned)`
Execution confidence: `HIGH`
Validation evidence: `COMPLETE`
Scope drift risk: `LOW`
Assumption load: `LOW`

## 2. Source Manifest

| Source | Found | Used | Notes |
|---|---|---|---|
| OpenSpec proposal | yes | yes | Why/What/Impact |
| OpenSpec design | yes | yes | D1–D5 (domain-owned, atomic, outcome type, no extra 400, non-durable) |
| OpenSpec specs | yes | yes | task-api delta: 2 ADDED requirements, 5 scenarios |
| OpenSpec tasks | yes | yes | impl + test + validation, all checked |
| CHAOS review | yes | yes | READY_FOR_APPROVAL |
| CHAOS decision events | yes | yes | PROP-DEC-001..005 honored; APP-DEC-001 added |
| CHAOS rules | yes | yes | R-003, R-004, R-005, R-006 enforced |
| Approval | n/a | n/a | EA-X2: no human approver; disclosed deviation (in-arm) |

## 3. Preflight Result

- Toolchain: dotnet 10.0.300 (targets net8.0); openspec 1.6.0; baseline `dotnet build` clean +
  `dotnet test` green (5/5) before edits.
- OpenSpec validation availability: yes (`openspec validate --strict`).
- C# project detected: yes (`src/TaskTracker.Api`, net8.0).
- Direct blockers: none.
- Continuable gaps: none.

## 4. Implementation Boundary

### Allowed
- `src/TaskTracker.Api/Domain/TaskItem.cs` (add `Version`)
- `src/TaskTracker.Api/Domain/TaskStore.cs` (seed/create at 1; atomic check-and-increment; outcome type)
- `src/TaskTracker.Api/Contracts/TaskRequests.cs` (`UpdateTaskRequest.ExpectedVersion`)
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` (map outcome to 200/404/409)
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` (versioning/conflict tests + DTO `Version`)

### Not allowed (and untouched)
- `TaskState`/`TaskPriority` enum names (R-005), `Program.cs`, GET/POST/DELETE behavior beyond
  carrying `version`, persistence, auth, `AGENTS.md`/root `README.md` (R-006).

## 5. Apply Plan

- [x] 2.1 `TaskItem.Version` (int)
- [x] 2.2 Seed/create at version 1 (`TaskStore.AddAt` → `Version: 1`)
- [x] 2.3 Atomic `Update(id, title, status, priority, expectedVersion?)` returning `TaskUpdateResult`
- [x] 2.4 `UpdateTaskRequest.ExpectedVersion` (`int? = null`)
- [x] 2.5 PUT maps `Updated→200`, `Conflict→409`, `NotFound→404`; Title-required 400 preserved
- [x] 3.1–3.6 Tests (version-1 create/seed, increment, match, stale→409+unchanged, baseline)

## 6. Files Changed

| File | Change |
|---|---|
| `src/TaskTracker.Api/Domain/TaskItem.cs` | Added `int Version` to the record + doc note on non-durability. |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | Added `TaskUpdateOutcome` enum + `TaskUpdateResult` struct; `AddAt` seeds `Version: 1`; new `Update(..., int? expectedVersion)` performs a **lock-guarded** read → compare → increment → write and returns an outcome (PROP-DEC-001/002/003). |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | `UpdateTaskRequest` gains `int? ExpectedVersion = null`. |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | PUT maps the domain outcome to 200/404/**409**; Title-required 400 unchanged (PROP-DEC-005). |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | `TaskDto` gains `Version`; 5 new tests (create v1, seeded v1, no-expectedVersion increment, matching increment, stale→409+unchanged). |

## 7. Decision Events

Recorded in `decision-events.md`:
- Upstream honored: **PROP-DEC-001** (domain-owned check), **PROP-DEC-002** (atomic lock —
  implemented as `lock(_updateLock)` around the read-compare-write), **PROP-DEC-003** (outcome type
  `TaskUpdateOutcome`/`TaskUpdateResult`, no exceptions), **PROP-DEC-004** (non-durable version,
  surfaced in code doc-comment), **PROP-DEC-005** (no extra 400).
- New at apply: **APP-DEC-001** — rely on the web camelCase JSON policy for `version` /
  `expectedVersion` (no `[JsonPropertyName]`), consistent with the codebase. Sync: NONE.

All decisions carry the EA-X2 `resolved-in-arm` tag (no live human).

## 8. Controlled Amendments

| ID | Classification | Description | Sync action |
|---|---|---|---|
| APP-DEC-001 | LOCAL_DESIGN_DECISION | camelCase policy serializes `version`/`expectedVersion` | NONE |

No SPEC_DRIFT or ARCHITECTURE_DRIFT: the implementation realizes the approved contract exactly; the
lock enforces the approved atomicity; no requirement, public shape, or architecture was changed
beyond the additive `version` field the contract mandates.

## 9. Validation

Commands run:
- `openspec validate optimistic-concurrency-updates --strict` → **valid**
- `dotnet build TaskTracker.sln` → **Build succeeded, 0 Warning(s), 0 Error(s)**
- `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` → **Passed! Failed: 0, Passed: 10,
  Skipped: 0, Total: 10**
- R-004 grep (`Microsoft.AspNetCore` / `Results.` in `Domain/`) → **none** (clean)
- R-005 grep (`TaskStatus` enum) → **none** (only the pre-existing doc-comment mentions the name)

Results: 5 new tests added (10 total); the 5 pre-existing tests — including
`Put_updates_an_existing_task`, which omits `expectedVersion` — remain green (R-003 preserved).

Confidence impact: validation evidence COMPLETE → execution confidence HIGH.

## 10. Scope Drift Assessment

Scope drift class: `NO_DRIFT`
Rationale: all edits confined to the five approved files in `src/TaskTracker.Api` + its tests. The
version check is domain-owned (R-004); `TaskState` naming preserved (R-005); no other endpoint's
behavior changed except that every task response now additively carries `version`; no persistence,
auth, `Program.cs`, or protected-file edits.

## 11. Open Questions / Follow-ups

- PROP-DEC-004: `version` is non-durable — accepted + surfaced; consider a decision-log entry for
  the concurrency posture at sync (advisory, non-blocking).

## 12. Recommended Next Command

```text
chaos:verify optimistic-concurrency-updates
```
