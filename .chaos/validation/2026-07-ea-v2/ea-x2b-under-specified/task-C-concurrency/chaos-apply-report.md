---
chaosMetadata:
  schemaVersion: 1
  artifactType: apply-report
  artifactScope: change
  changeId: prevent-concurrent-edit-loss
  sourceCommand: "chaos:resume"
  lastWrittenAt: "2026-07-21T22:45:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:45:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "prevent-concurrent-edit-loss (worktree tC-chaos)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:pending-metadata-hook"
---

# CHAOS Apply Report — prevent-concurrent-edit-loss

## 1. Metadata

- Command: `chaos:resume --change prevent-concurrent-edit-loss` (→ apply phase)
- Mode: strict
- Resume source: interaction-runtime answered decision + pass-1 artifacts (NOT chat memory)
- Change ID: `prevent-concurrent-edit-loss`
- Command run: `RUN-2026-07-21-chaos-propose-prevent-concurrent-edit-loss-89b9ee` (resumed)
- Date/time: 2026-07-21
- Apply status: **APPLIED — build clean, tests green (10/10)**
- Decision incorporated: **PROP-DEC-001 = `opt-optimistic`** (human-answered, authoritative)

## 2. Human decision implemented (authoritative)

> Selected option `opt-optimistic` — OPTIMISTIC concurrency, reject stale writes. Add a version
> token to tasks (starts at 1, increments on each successful update). A PUT that carries a
> stale/expected version that no longer matches the current version must be rejected with **409
> Conflict** and leave the task unchanged, so a client working from an out-of-date copy cannot
> silently clobber a newer edit; it must refetch and retry. Keep the existing version-less update
> path working for backward compatibility, and keep the build and tests green.

The implementation follows this answer **exactly**. Where the pass-1 advisory recommendation (ETag/
`If-Match` transport) differed from the answer, the **answer wins**: the token is carried as a body
`version` field and the failure status is `409 Conflict`, per the maintainer's explicit wording.

## 3. What was implemented (mapped to the answer)

| Answer clause | Implementation | Location |
|---|---|---|
| "Add a version token to tasks" | `TaskItem` gains `long Version` | `Domain/TaskItem.cs:24-31` |
| "starts at 1" | `Version = 1` default; new tasks created via `Add`/`AddAt` inherit it | `Domain/TaskItem.cs:31`, `Domain/TaskStore.cs` |
| "increments on each successful update" | every successful `Update` writes `Version = existing.Version + 1` (both the checked and grandfathered paths) | `Domain/TaskStore.cs:Update` |
| "stale/expected version … rejected with 409 Conflict … task unchanged" | domain returns `UpdateOutcome.VersionConflict` without mutating the store; endpoint maps it to `Results.Conflict(...)` (HTTP 409) | `Domain/TaskStore.cs:Update`, `Endpoints/TaskEndpoints.cs:PUT` |
| "must refetch and retry" | 409 body returns `currentVersion` (and echoes `expectedVersion`) so the client can re-fetch/retry | `Endpoints/TaskEndpoints.cs:PUT` |
| "keep the existing version-less update path working (backward compatibility)" | `expectedVersion` is optional/nullable; a `null` token skips the check → last-write-wins (grandfathered) | `Contracts/TaskRequests.cs`, `Domain/TaskStore.cs:Update` |
| "keep build and tests green" | `dotnet build` clean (0 warn / 0 err); `dotnet test` 10/10 pass | see `verification.md` |

## 4. Files changed

| File | Change | Rule touchpoint |
|---|---|---|
| `src/TaskTracker.Api/Domain/TaskItem.cs` | Added optimistic-concurrency token `long Version = 1` to the `TaskItem` record (+ doc). | R-005 preserved (`TaskState` unchanged; no `TaskStatus`). |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | `Update` now takes optional `expectedVersion`, performs the stale-version check and an **atomic compare-and-swap** (`ConcurrentDictionary.TryUpdate` retry loop), increments `Version` on success, and returns a domain `UpdateResult`/`UpdateOutcome`. Added those pure-domain result types. | R-004: conflict decision lives in the **domain**, HTTP-agnostic. Addresses REV-004 (atomic check-then-write). |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | PUT handler passes `request.ExpectedVersion` to the store and maps the domain outcome → `200 Ok` / `409 Conflict` / `404 NotFound`. | R-004: endpoint (HTTP layer) owns the status translation only. |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | Re-documented the previously-inert `ExpectedVersion` field as now-WIRED per the human decision (field itself unchanged; optional/nullable for back-compat). | — |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | Added `Version` to the test DTO; added 5 concurrency tests (starts-at-1, increments, matching-version succeeds, **stale→409 + task unchanged**, version-less→backward-compatible). | R-003: green baseline preserved + extended. |

## 5. Rule compliance (apply-time)

| Rule | Status | Evidence |
|---|---|---|
| R-001 Human owns material decisions | **HONORED** | The strategy was chosen by the maintainer (`opt-optimistic`); the agent only executed it. No material choice was made in code/chat. |
| R-003 Preserve green test baseline | **HONORED** | Build clean; `dotnet test` = 10/10 (5 pre-existing + 5 new). |
| R-004 Domain must not depend on HTTP | **HONORED** | `grep` of `Domain/**` finds no `AspNetCore`/`Results`/HTTP types; conflict logic + `UpdateResult`/`UpdateOutcome` are pure domain; the 200/404/**409** mapping is confined to the endpoint. |
| R-005 Keep `TaskState` naming | **HONORED** | No `TaskStatus` reintroduced for the work-item enum (only the existing explanatory doc reference remains). |
| R-006 Protected files previewed-only | **HONORED** | `AGENTS.md` / root `README.md` untouched. |

## 6. Correctness note (REV-004 discharged)

The stale check and the write are made atomic: `Update` reads the record, evaluates the version
precondition, then commits with `ConcurrentDictionary.TryUpdate(id, updated, existing)` — a
compare-and-swap against the exact record read. If a concurrent writer commits in between, the swap
fails and the loop re-reads and re-checks, so two racing requests cannot both pass a stale check and
lose an update. `[INFERENCE · HIGH]`

## 7. Scope control

- In scope and changed: the five files in §4 only.
- Out of scope / untouched: `Program.cs`, seed data, GET/POST/DELETE behaviour, persistence/auth
  (still NON-GOALs), and any ETag/HTTP-header transport (the maintainer chose the body-version
  transport, so no header plumbing was added).
- No OpenSpec spec authoring was performed in this apply step (kept to code + tests + governance per
  the resume instruction); the normative contract is captured here and in `decision-events.md`.

## 8. Confidence summary

- Apply verdict: **APPLIED (success)**
- Confidence: **HIGH** — the implementation is a direct, mechanical realization of an explicit human
  answer; build + tests confirm behaviour.
- Evidence coverage: COMPLETE · Assumption load: LOW.
- `implementedMatchesAnswer = true`.

## 9. Next command

```text
chaos:verify --change prevent-concurrent-edit-loss   # done inline — see verification.md
# then: chaos:archive / chaos:sync (CREATE_DECISION_LOG for the concurrency-control convention)
```
