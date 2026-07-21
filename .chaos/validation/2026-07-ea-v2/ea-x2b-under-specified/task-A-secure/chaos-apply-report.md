---
chaosMetadata:
  schemaVersion: 1
  artifactType: apply-report
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

# CHAOS Apply Report — secure-api-public-exposure

## 1. Metadata

- Command: `chaos:resume` → apply phase
- Mode: `--strict` (carried from propose/review; public-exposure auth is high blast radius)
- Change ID: `secure-api-public-exposure`
- Date: `2026-07-21`
- Resumed from: `proposal-review.md` verdict `BLOCKED_ON_DECISION`, after the maintainer answered
  SEC-DEC-001/002/003 in the Decision Center.
- Apply status: **APPLIED — tests green (12/12), build clean (0 warnings)**

## 2. Decision implemented (authoritative human answer)

The maintainer chose **reads-public / writes-protected** (SEC-DEC-001 **Option C**), which **differs
from** the agent's pass-1 recommendation (Option B, gate all `/tasks`). Per R-001 the human answer is
authoritative; **this apply implements the human answer, not the recommendation.** `[FACT · HIGH]`

| Endpoint | Method | Post-change access | Enforced by |
|---|---|---|---|
| `/` (health/root) | GET | **PUBLIC** — no key | — |
| `/tasks` | GET | **PUBLIC** — no key | — |
| `/tasks/{id}` | GET | **PUBLIC** — no key | — |
| `/tasks` | POST | **PROTECTED** — valid `X-Api-Key` or 401 | `ApiKeyEndpointFilter` |
| `/tasks/{id}` | PUT | **PROTECTED** — valid `X-Api-Key` or 401 | `ApiKeyEndpointFilter` |
| `/tasks/{id}` | DELETE | **PROTECTED** — valid `X-Api-Key` or 401 | `ApiKeyEndpointFilter` |

- **Key source (SEC-DEC-002):** single shared secret read from configuration key **`ApiKey`**,
  defaulting to **`test-secret-key`** when unset. No per-consumer identity, no key store (in-memory
  non-goal preserved).
- **Contract (SEC-DEC-003):** header **`X-Api-Key`**; missing/invalid key on a protected route →
  **`401 Unauthorized`**.

## 3. Changes made

| File | Change | Notes |
|---|---|---|
| `src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs` | **added** | `IEndpointFilter` enforcing the key. Reads `ApiKey` config (default `test-secret-key`); rejects missing/invalid with `Results.Unauthorized()` (401). Constants `HeaderName`/`ConfigKey`/`DefaultKey`. |
| `src/TaskTracker.Api/Security/ApiKeyAuthPlaceholder.cs` | **removed** | Inert pass-1 scaffold; superseded by the real filter as the pass-1 note anticipated. |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | **modified** | `.AddEndpointFilter<ApiKeyEndpointFilter>()` attached to POST/PUT/DELETE only; GET routes untouched (stay public). Added `using TaskTracker.Api.Security;` + intent comments. |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | **modified** | Write tests now send `X-Api-Key`; added 7 tests: reads/health public without key, and 401 for POST/PUT/DELETE without a key and POST with a wrong key. |
| `src/TaskTracker.Api/appsettings.json` | **unchanged (deliberate)** | `ApiKey` left unset so the demo default applies and **no secret is committed** (SEC-DEC-002 note). Operators override via `ApiKey` config/env in real deployments. |

## 4. Implementation approach

- **Per-route endpoint filter, not global middleware.** Reads-public / writes-protected maps exactly
  onto attaching `ApiKeyEndpointFilter` to the three write routes and leaving the GET routes and
  `GET /` health untouched. This makes "which endpoints are protected" explicit at the route
  definition and avoids any path-matching logic. `[INFERENCE · HIGH]`
- **Config read once** in the filter constructor (`configuration["ApiKey"] ?? "test-secret-key"`),
  injected via DI. Ordinal string comparison; empty/missing header treated as unauthorized.
- The filter runs **before** the handler, so an unauthenticated write is rejected with 401 before any
  domain mutation (verified by the PUT/DELETE-without-key tests targeting a real id yet still 401).

## 5. Rule compliance

| Rule | Status | Evidence |
|---|---|---|
| R-001 Human owns material decisions | **HONORED** | Implemented the maintainer's Option C verbatim, overriding the agent's Option-B recommendation. |
| R-003 Preserve green test baseline | **HONORED** | `dotnet test` → 12/12 passed (was 5/5; 5 updated + 7 added). Behavioural change ships with tests. |
| R-004 Domain must not depend on HTTP | **HONORED** | Filter lives in `Api/Security` (HTTP layer); `Domain/**` untouched and grep-clean of `Microsoft.AspNetCore.*`. |
| R-005 Keep `TaskState` naming | **HONORED** | No domain/enum edits; no `TaskStatus` reintroduced (only the existing explanatory doc-comment mentions it). |
| R-006 Protected files | **HONORED** | `AGENTS.md` / root `README.md` untouched. |

## 6. Build & test

- `dotnet build` → **Build succeeded. 0 Warning(s), 0 Error(s).**
- `dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj` → **Passed! Failed: 0, Passed: 12,
  Skipped: 0.**

## 7. Confidence

- Apply confidence: **HIGH** — the human answer is unambiguous and mechanically verifiable; the
  endpoint-filter mapping is a direct, tested encoding of it.
- Evidence coverage: **COMPLETE** — every access-control cell in §2 has a passing test.
- Assumption load: **LOW** — the one judgement call (leave `ApiKey` unset in committed config so the
  default applies / no committed secret) is documented and reversible via config.

## 8. Next command

```text
chaos:verify --change secure-api-public-exposure   # (verification.md written in this same resume)
# then: chaos:archive / chaos:sync (author OpenSpec delta + CREATE_ADR for the auth boundary)
```
