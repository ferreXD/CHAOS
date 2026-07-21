---
chaosMetadata:
  schemaVersion: 1
  artifactType: verification
  artifactScope: change
  changeId: secure-api-public-exposure
  sourceCommand: "chaos:resume"
  lastWrittenAt: "2026-07-21T00:00:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T00:00:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: null
---

# CHAOS Verification — secure-api-public-exposure

## 1. Verdict

- Verdict: **VERIFIED — PASS**
- Confidence: **HIGH**
- Evidence coverage: **COMPLETE** (build + full-matrix tests + rule/scope checks all executed)
- Assumption load: **LOW**
- Implements the human answer exactly: **YES** (reads-public / writes-protected, `X-Api-Key`, 401,
  config key `ApiKey` default `test-secret-key`).

## 2. Build / Test dashboard

| Gate | Command | Result | Confidence |
|---|---|---|---|
| Build | `dotnet build` | **PASS** — Build succeeded, 0 Warning(s), 0 Error(s) | HIGH `[FACT]` |
| Tests | `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` | **PASS** — Failed: 0, Passed: 12, Skipped: 0 (238 ms) | HIGH `[FACT]` |
| Baseline delta | — | 5/5 → 12/12 (5 updated for the new contract + 7 added); no regressions | HIGH `[FACT]` |

## 3. Scope / access-control matrix (behaviour verified by test)

| Endpoint | Method | Expected (human answer) | Verifying test(s) | Result |
|---|---|---|---|---|
| `/` | GET | PUBLIC (no key) | `Root_health_is_public_without_api_key` | PASS |
| `/tasks` | GET | PUBLIC (no key) | `Get_tasks_returns_the_seeded_tasks`, `Get_tasks_is_public_without_api_key` | PASS |
| `/tasks/{id}` | GET | PUBLIC (no key) | `Get_task_by_id_is_public_without_api_key` | PASS |
| `/tasks` | POST | 401 without/with wrong key; 201 with valid key | `Post_without_api_key_returns_401`, `Post_with_wrong_api_key_returns_401`, `Post_creates_a_task_and_get_by_id_returns_it` | PASS |
| `/tasks/{id}` | PUT | 401 without key; 200 with valid key | `Put_without_api_key_returns_401`, `Put_updates_an_existing_task` | PASS |
| `/tasks/{id}` | DELETE | 401 without key; 204 with valid key | `Delete_without_api_key_returns_401`, `Delete_removes_a_task` | PASS |
| `/tasks` | POST (blank title, valid key) | 400 (handler validation reachable past the filter) | `Post_with_blank_title_is_rejected` | PASS |

Contract details verified: header **`X-Api-Key`**; rejection status **401 Unauthorized**; valid key =
config `ApiKey` (unset → default `test-secret-key`, which the tests use). `[FACT · HIGH]`

## 4. Rule compliance

| Rule | Severity | Status | Evidence |
|---|---|---|---|
| R-001 Human owns material decisions | blocker | **PASS** | Option C (human) implemented, overriding the agent's Option-B recommendation; recorded RESOLVED in `decision-events.md`. |
| R-002 Label knowledge & confidence | blocker | **PASS** | This report + apply-report label every finding/verdict with knowledge type + confidence. |
| R-003 Preserve green test baseline | blocker | **PASS** | 12/12 green; behavioural change shipped with tests. |
| R-004 Respect domain→HTTP boundary | major | **PASS** | Enforcement is an `IEndpointFilter` in `Api/Security`; `Domain/**` untouched, grep-clean of `Microsoft.AspNetCore.*`. |
| R-005 Keep `TaskState` naming | major | **PASS** | No enum/domain edits; no `TaskStatus` reintroduced. |
| R-006 Protected files | major | **PASS** | `AGENTS.md` / root `README.md` untouched. |

## 5. Change surface (working tree — not committed)

- Added: `src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs`
- Removed: `src/TaskTracker.Api/Security/ApiKeyAuthPlaceholder.cs` (inert pass-1 scaffold)
- Modified: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` (filter on POST/PUT/DELETE only)
- Modified: `tests/TaskTracker.Tests/TaskEndpointsTests.cs` (+7 tests; writes send the key)
- Unchanged (deliberate): `src/TaskTracker.Api/appsettings.json` — `ApiKey` unset so default applies,
  no committed secret.

## 6. Residual risk / follow-ups (non-blocking)

| Item | Type | Confidence | Note |
|---|---|---|---|
| OpenSpec spec delta not authored in this resume | governance gap | HIGH | The normative `SHALL` scenarios (reads-public / writes-protected) should be authored at `chaos:sync`/archive; behaviour is already test-pinned. |
| `CREATE_ADR` for the public-exposure auth boundary | sync action | HIGH | SEC-DEC-001 carried `CREATE_ADR`; route via `chaos:sync`. |
| Default demo key `test-secret-key` is well-known | accepted risk | HIGH | Acceptable for the demo; real deployments MUST set `ApiKey`. Documented in apply-report §2. |
| Timing-safe key comparison | hardening | MEDIUM | Ordinal `==` is fine for a demo shared secret; a constant-time compare is a future hardening if this leaves demo scope. |

## 7. Next command

```text
chaos:sync --change secure-api-public-exposure    # author OpenSpec delta + CREATE_ADR (auth boundary)
chaos:archive --change secure-api-public-exposure # after sync
```
