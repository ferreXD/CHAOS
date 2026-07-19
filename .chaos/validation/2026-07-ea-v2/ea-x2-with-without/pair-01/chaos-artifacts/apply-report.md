---
chaosMetadata:
  schemaVersion: 1
  artifactType: apply-report
  artifactScope: change
  changeId: require-api-key-auth
  sourceCommand: "chaos:apply"
  lastWrittenAt: "2026-07-19T17:49:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T17:49:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f (EA-X2 mechanized worktree p1-armA)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:hook-managed-pending"
---

# CHAOS Apply Report — require-api-key-auth

## 1. Summary

Change ID: `require-api-key-auth`
Mode: `strict`
Mode source: `inferred` (decision-bearing — architecture NON-GOAL crossing)
Result: `APPLIED`
Implementation specialist: `none` (self-implemented; do-not-spawn-subagents directive for this run)
Execution confidence: `HIGH`
Validation evidence: `COMPLETE`
Scope drift risk: `LOW`
Assumption load: `LOW`

## 2. Source Manifest

| Source | Found | Used | Notes |
|---|---|---|---|
| OpenSpec proposal/design/spec/tasks | yes | yes | `require-api-key-auth`; validated `--strict` |
| CHAOS proposal report | yes | yes | NON-GOAL notice; blast radius |
| CHAOS decision events | yes | yes | AUTH-DEC-001/002/003 honored |
| CHAOS review | yes | yes | READY_FOR_APPROVAL (in-arm) |
| CHAOS rules | yes | yes | R-001..R-006 enforced |
| ADRs / decisions | no | n/a | none pre-exist |
| Archaeology | no | n/a | not applicable (current behavior evidenced) |

## 3. Preflight Result

- Toolchain: dotnet 10.0.300; `openspec` 1.6.0; baseline `dotnet test` green (5/5) before changes.
- OpenSpec validation availability: yes (`openspec validate --strict`).
- C# project detected: yes (`src/TaskTracker.Api`, net8.0).
- Direct blockers: none. Continuable gaps: R-001 human approval substituted in-arm (disclosed).

## 4. Implementation Boundary

### Allowed
- `src/TaskTracker.Api/Endpoints/ApiKeyEndpointFilter.cs` (new)
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` (attach filter to group)
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` (auth key + new tests)

### Not allowed (and untouched)
- `Domain/**` (R-004/R-005), `Contracts/**`, `Program.cs`, `appsettings.json`
- `AGENTS.md`, root `README.md` (R-006)
- Any CRUD/filtering behaviour for authenticated callers

## 5. Apply Plan

- [x] 2.1 Add `ApiKeyEndpointFilter` (`IEndpointFilter`) reading `ApiKey` (default `test-secret-key`)
- [x] 2.2 Reject missing/incorrect `X-Api-Key` with `401` before handler (R-004)
- [x] 2.3 Attach filter to `MapGroup("/tasks")`
- [x] 2.4 Keep `GET /` outside the group (public)
- [x] 3.1 Existing CRUD tests supply the valid key (baseline preserved, R-003)
- [x] 3.2–3.7 New auth tests (missing/incorrect key, before-existence, before-validation+no-mutation, PUT/DELETE, public root)

## 6. Task Execution Log

Status: `COMPLETE`

Files changed:
- `src/TaskTracker.Api/Endpoints/ApiKeyEndpointFilter.cs` (NEW) — `IEndpointFilter` reading
  `IConfiguration["ApiKey"]` (default `test-secret-key` when null/whitespace), header `X-Api-Key`,
  ordinal compare, returns `Results.Unauthorized()` before calling `next(context)` (AUTH-DEC-002/003).
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — `group.AddEndpointFilter<ApiKeyEndpointFilter>()`
  on `MapGroup("/tasks")`; CRUD handlers unchanged (AUTH-DEC-002).
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` — added `CreateAuthenticatedClient()` helper;
  the 5 pre-existing tests now use it (R-003); 8 new tests for the auth contract.

Tests added (8):
- `Get_tasks_without_api_key_returns_unauthorized` (401, missing key)
- `Get_tasks_with_incorrect_api_key_returns_unauthorized` (401, wrong key)
- `Get_task_by_id_without_api_key_is_unauthorized_before_existence_check` (401 not 404)
- `Post_without_api_key_is_unauthorized_before_validation` (401 not 400, blank title)
- `Post_without_api_key_does_not_create_the_task` (401 + store unchanged)
- `Put_without_api_key_returns_unauthorized` (401)
- `Delete_without_api_key_returns_unauthorized` (401)
- `Root_health_endpoint_stays_public_without_api_key` (200)

Decisions honored: AUTH-DEC-001 (posture), AUTH-DEC-002 (filter), AUTH-DEC-003 (config/default).
No new apply-time decisions discovered.

## 7. Controlled Amendments

| ID | Classification | Description | Sync action |
|---|---|---|---|
| (none) | — | Implementation matched the approved design exactly | — |

No SPEC_DRIFT or ARCHITECTURE_DRIFT beyond the already-decided, explicit NON-GOAL crossing
(AUTH-DEC-001). Auth placed in the HTTP layer, so no domain drift (R-004).

## 8. Decision Events

Recorded in `.chaos/changes/require-api-key-auth/decision-events.md`:
- AUTH-DEC-001 — posture change (sync UPDATE_ARCHITECTURE_POSTURE)
- AUTH-DEC-002 — group-level endpoint filter (sync NONE)
- AUTH-DEC-003 — config/default handling (sync NONE)

## 9. Validation

Commands run:
- `openspec validate require-api-key-auth --strict` → **valid** ("Change 'require-api-key-auth' is valid")
- `dotnet build src/TaskTracker.Api/TaskTracker.Api.csproj` → **Build succeeded, 0 Warning(s), 0 Error(s)**
- `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` → **Passed! Failed: 0, Passed: 13, Skipped: 0, Total: 13**

Rule greps:
- `grep -rn "Microsoft.AspNetCore" src/TaskTracker.Api/Domain/` → **no matches** (R-004 clean)
- `grep -rn "enum TaskStatus" src/` → **no matches** (R-005 clean; `TaskState` intact)

Results: all validations pass. 8 new tests added (13 total); the 5 pre-existing tests remain green
(R-003 preserved) after being updated to supply the key.

Confidence impact: validation evidence COMPLETE → execution confidence HIGH.

## 10. Scope Drift Assessment

Scope drift class: `NO_DRIFT`
Rationale: All edits confined to the 3 approved files. Auth enforcement lives in the HTTP layer
(R-004); `TaskState` naming preserved (R-005); protected files untouched (R-006); no other
endpoints/persistence/contracts changed. The NON-GOAL crossing is explicit and pre-decided
(AUTH-DEC-001), not silent drift.

## 11. Open Questions / Follow-ups

- AUTH-DEC-001 → at `chaos:sync`, update `.chaos/architecture.md` auth posture (currently "None").
- Recommend a human re-confirmation of the posture change before real merge (R-001).

## 12. Recommended Next Command

```text
chaos:verify require-api-key-auth
```
