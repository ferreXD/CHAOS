---
chaosMetadata:
  schemaVersion: 1
  artifactType: verification-report
  artifactScope: change
  changeId: optimistic-concurrency-updates
  sourceCommand: "chaos:verify"
  lastWrittenAt: "2026-07-19T18:26:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:26:00+02:00"
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

# CHAOS Verification Report — optimistic-concurrency-updates

## Verification Dashboard

| Area | Status | Confidence | Notes |
|---|---|---:|---|
| OpenSpec validation | Passed | HIGH | `openspec validate optimistic-concurrency-updates --strict` → valid |
| Build | Passed | HIGH | `dotnet build TaskTracker.sln` → 0 warnings, 0 errors |
| Tests | Passed | HIGH | `dotnet test` → 10/10 (5 baseline + 5 new) |
| Rules honored | Yes | HIGH | R-003 (baseline green), R-004 (domain-owned, no HTTP in Domain), R-005 (`TaskState` kept), R-006 (no protected-file edits) |
| Review report | Found | HIGH | READY_FOR_APPROVAL |
| Apply report | Found | HIGH | APPLIED; APP-DEC-001 |
| Decision events | Complete | HIGH | PROP-DEC-001..005 + APP-DEC-001, all resolved-in-arm (EA-X2) |
| Scope drift | None | HIGH | 5 approved files; additive `version`; no other endpoint behavior changed |
| Archive readiness | READY | HIGH | — |

## Scope and Inputs

- Change ID: `optimistic-concurrency-updates`
- Mode: `strict`
- Verification run: `initial`
- Dry run: `no`
- Run context: `EA-X2 mechanized run` (material decisions resolved in-arm; documented deviation
  from Decision-Center stop-and-resume, R-001).

## Toolchain and Validation Evidence

| Tool/Command | Status | Output summary | Confidence impact |
|---|---|---|---|
| `openspec validate optimistic-concurrency-updates --strict` | Passed | "Change 'optimistic-concurrency-updates' is valid" | positive |
| `dotnet build TaskTracker.sln` | Passed | 0 warnings, 0 errors | positive |
| `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` | Passed | Failed: 0, Passed: 10, Skipped: 0 | positive |
| grep `Microsoft.AspNetCore`/`Results.` in `Domain/` | Clean | none found | positive (R-004) |
| grep `TaskStatus` enum | Clean | only pre-existing doc-comment; no rename | positive (R-005) |

## Task Completion Integrity

| Task | Declared | Evidence | Status | Confidence |
|---|---|---|---|---|
| 2.1 `Version` field | `[x]` | `TaskItem` record has `int Version` | VERIFIED | HIGH |
| 2.2 seed/create at 1 | `[x]` | `AddAt(..., Version: 1)`; `Add` → `AddAt` | VERIFIED | HIGH |
| 2.3 atomic check-and-increment | `[x]` | `TaskStore.Update` inside `lock(_updateLock)`, returns `TaskUpdateResult` | VERIFIED | HIGH |
| 2.4 `ExpectedVersion` | `[x]` | `UpdateTaskRequest(..., int? ExpectedVersion = null)` | VERIFIED | HIGH |
| 2.5 endpoint mapping | `[x]` | PUT switch → 200/404/409; Title 400 kept | VERIFIED | HIGH |
| 3.1–3.6 tests | `[x]` | 5 new tests present + passing; 5 baseline green | VERIFIED | HIGH |

No task marked complete without matching implementation/test evidence.

## Spec Traceability Matrix

| Requirement / Scenario | Source | Implementation evidence | Test evidence | Status | Knowledge type | Confidence |
|---|---|---|---|---|---|---|
| New task starts at version 1 | spec (Task Version Field) | `AddAt(..., Version: 1)` | `Post_creates_a_task_at_version_1` | SATISFIED | FACT | HIGH |
| Seeded tasks start at version 1 | spec (Task Version Field) | seed loop via `AddAt` | `Seeded_tasks_start_at_version_1` | SATISFIED | FACT | HIGH |
| Update without expectedVersion increments version | spec (Optimistic Concurrency) | `expectedVersion is null` → proceed; `Version+1` | `Put_without_expected_version_increments_version` | SATISFIED | FACT | HIGH |
| Update with matching expectedVersion succeeds | spec (Optimistic Concurrency) | `expected == existing.Version` → Updated | `Put_with_matching_expected_version_succeeds_and_increments` | SATISFIED | FACT | HIGH |
| Update with stale expectedVersion is rejected (409, unchanged) | spec (Optimistic Concurrency) | `expected != existing.Version` → Conflict, no write | `Put_with_stale_expected_version_conflicts_and_leaves_task_unchanged` | SATISFIED | FACT | HIGH |
| Backward-compat: existing PUT (omits expectedVersion) still 200 | R-003 | omitted → unconditional | `Put_updates_an_existing_task` (baseline) | SATISFIED | FACT | HIGH |

All spec scenarios SATISFIED with direct implementation + passing tests → HIGH.

## Implementation Inspection

- **PUT is thin.** It validates Title (400), calls `store.Update(..., request.ExpectedVersion)`, and
  maps the domain `TaskUpdateOutcome` to `200`/`409`/`404`. The version invariant lives in the
  domain → **R-004 satisfied** (grep confirms no `Microsoft.AspNetCore`/`Results.` in `Domain/`).
- **Atomicity.** `TaskStore.Update` runs the read → compare `expectedVersion` → increment → write
  inside `lock(_updateLock)`, so two concurrent PUTs with the same `expectedVersion` cannot both
  succeed (PROP-DEC-002; prevents the TOCTOU that would otherwise re-introduce the lost update the
  feature targets). Reads (`Get`, `All`) stay lock-free.
- **Outcome type.** `TaskUpdateOutcome { NotFound, Conflict, Updated }` + `TaskUpdateResult`
  (PROP-DEC-003) keep the domain HTTP-agnostic; no exceptions for control flow.
- **Naming/serialization.** `Version`/`ExpectedVersion` serialize as `version`/`expectedVersion`
  via the web camelCase policy (APP-DEC-001), asserted on the wire by the new tests.
- **R-005.** `TaskState`/`TaskPriority` unchanged (only `Version` added).
- **Untouched.** GET (list/by-id), POST body contract (now returns version 1), DELETE, `Program.cs`,
  persistence, protected files.

## Scope Drift Analysis

| Drift item | Category | Evidence | Decision event | Severity |
|---|---|---|---|---|
| Lock-guarded check-and-increment | NO_DRIFT | required to honor the approved concurrency guarantee | PROP-DEC-002 | — |
| `version` on every task response | NO_DRIFT | mandated by the contract; additive | PROP-DEC (field) | — |
| camelCase serialization | NO_DRIFT | existing policy; no attribute added | APP-DEC-001 | — |

No SPEC_DRIFT / ARCHITECTURE_DRIFT / OUT_OF_SCOPE.

## Decision Event Audit

| Decision ID | Source | Status | Sync action | Issue |
|---|---|---|---|---|
| PROP-DEC-001 | chaos:propose | resolved-in-arm | NONE | none — domain-owned check |
| PROP-DEC-002 | chaos:propose | resolved-in-arm | NONE | none — atomic lock implemented |
| PROP-DEC-003 | chaos:propose | resolved-in-arm | NONE | none — outcome type implemented |
| PROP-DEC-004 | chaos:propose | resolved-in-arm | CONSIDER_DECISION_LOG | non-durable version — surfaced (advisory) |
| PROP-DEC-005 | chaos:propose | resolved-in-arm | NONE | none — no extra 400 |
| APP-DEC-001 | chaos:apply | resolved-in-arm | NONE | none — camelCase policy |

All decisions recorded, classified, and labelled. **EA-X2 note:** every decision carries the
`resolved-in-arm (no live human; EA-X2 mechanized run)` tag — a disclosed deviation from R-001's
Decision-Center stop-and-resume, not a silent chat decision.

## Findings Register

No BLOCKING or MAJOR findings.

### VFY-001 — `version` is non-durable (ADVISORY, FACT, HIGH)

The version counter lives only in the in-memory store, so it resets on process restart; a client
holding a pre-restart `expectedVersion` could get a spurious 409 or a coincidental match. Inherent
to the architecture's persistence non-goal; accepted and surfaced (PROP-DEC-004). No impact on this
change's correctness or archive-readiness.
Required action: consider promoting the concurrency posture to a decision log at sync.

### VFY-002 — R-001 stop-and-resume bypassed in EA-X2 (ADVISORY, PROCESS, MEDIUM)

No live human was available; material decisions were resolved in-arm with documented rationale and
an explicit tag. Disclosed deviation, not a defect of the change.

## Waivers / Accepted Risks

- Non-durable `version` (VFY-001) — accepted for the demo posture.
- EA-X2 in-arm decision resolution (VFY-002) — accepted per the mechanized-run protocol.
No R-004/R-005/R-006 waivers taken (all honored outright).

## Confidence Caps Applied

| Cap | Reason | Resulting max confidence |
|---|---|---|
| (none on correctness) | validation COMPLETE; all scenarios tested + passing | HIGH |
| posture | non-durability is an accepted architectural limitation | HIGH (surfaced, not a correctness gap) |

## Archive Readiness

Status: `READY`

- OpenSpec validation: PASSED (`--strict`)
- Build: PASSED (0/0)
- Tests: PASSED (10/10; baseline preserved)
- Task completion: complete with evidence
- Scope drift: NONE
- Decision event syncability: all syncable (1 advisory CONSIDER_DECISION_LOG)
- Remaining blockers: none

## Final Verdict

Verdict: `VERIFIED`
Confidence: `HIGH`
Evidence coverage: `COMPLETE`
Assumption load: `LOW`
Validation evidence: `COMPLETE`
Scope drift risk: `LOW`
Archive readiness: `READY`

Reason:
The implementation satisfies every approved spec scenario with direct code + passing tests; the
optimistic-concurrency guarantee is enforced atomically in the domain (not just via a version
field); OpenSpec `--strict` is valid; build/tests are green with the 5-test baseline preserved
(including the `expectedVersion`-omitting PUT test); rules R-003/R-004/R-005/R-006 are honored; all
six decision events are recorded, classified, and labelled. The two advisories (non-durability,
EA-X2 in-arm resolution) are surfaced accepted-limitations, not blockers.

## Recommended next command

```text
chaos:archive optimistic-concurrency-updates
```
