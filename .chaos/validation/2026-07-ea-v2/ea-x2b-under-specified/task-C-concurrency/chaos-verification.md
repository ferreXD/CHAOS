---
chaosMetadata:
  schemaVersion: 1
  artifactType: verification
  artifactScope: change
  changeId: prevent-concurrent-edit-loss
  sourceCommand: "chaos:verify"
  lastWrittenAt: "2026-07-21T22:47:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:47:00+02:00"
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

# CHAOS Verification — prevent-concurrent-edit-loss

## 1. Metadata

- Command: `chaos:verify --change prevent-concurrent-edit-loss`
- Mode: strict
- Change ID: `prevent-concurrent-edit-loss`
- Command run: `RUN-2026-07-21-chaos-propose-prevent-concurrent-edit-loss-89b9ee` (resumed)
- Date/time: 2026-07-21
- Decision verified against: **PROP-DEC-001 = `opt-optimistic`** (human-answered)
- **Verdict: PASS** · Confidence: **HIGH** · Evidence coverage: COMPLETE · Assumption load: LOW

## 2. Verification dashboard

| Gate | Result | Evidence |
|---|---|---|
| Build | **PASS** | `dotnet build` → `Build succeeded. 0 Warning(s) / 0 Error(s)` |
| Tests | **PASS** | `dotnet test` → `Passed! Failed: 0, Passed: 10, Skipped: 0, Total: 10` |
| Answer implemented exactly | **PASS** | version token starts at 1, increments on success, stale PUT → 409 + unchanged, version-less PUT still works (see §3) |
| R-001 human owns decision | **PASS** | strategy chosen by maintainer; agent only executed the answer |
| R-003 green baseline | **PASS** | 5 pre-existing tests still green; 5 new tests added, all green |
| R-004 domain ⊄ HTTP | **PASS** | `Domain/**` has no `AspNetCore`/`Results`/HTTP refs; 409 mapping lives only in the endpoint |
| R-005 `TaskState` naming | **PASS** | no `TaskStatus` reintroduced for the work-item enum |
| R-006 protected files | **PASS** | `AGENTS.md` / root `README.md` untouched |
| Scope | **PASS** | only the 5 intended files changed (3 src + 1 contract + 1 test) |

## 3. Behavioural verification (answer clauses → test evidence)

| Requirement (from human answer) | Test | Result |
|---|---|---|
| Task carries a version token that starts at 1 | `Created_task_starts_at_version_1` | PASS |
| Version increments on each successful update | `Version_increments_on_each_successful_update` | PASS |
| A PUT with a matching expected version succeeds | `Put_with_matching_expected_version_succeeds` | PASS |
| A stale expected version → **409 Conflict**, task **unchanged** (no silent clobber) | `Put_with_stale_expected_version_is_rejected_with_409_and_leaves_task_unchanged` | PASS |
| Version-less PUT still works (backward compatibility) | `Put_without_expected_version_is_backward_compatible_and_still_increments` + pre-existing `Put_updates_an_existing_task` | PASS |

The stale-write test is the direct regression guard for the reported incident: writer A saves from
version 1 (task → v2); writer B, still holding v1, is **rejected with 409** and A's edit survives
(title/status assert to A's values; version = 2). The silent lost-update path is closed.

## 4. Command output (evidence)

```text
$ dotnet build
Build succeeded.
    0 Warning(s)
    0 Error(s)

$ dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj
Passed!  - Failed: 0, Passed: 10, Skipped: 0, Total: 10, Duration: 236 ms - TaskTracker.Tests.dll (net8.0)
```

## 5. Rule-alignment detail

- **R-004** — verified by static check: `grep -rn "AspNetCore|Results\.|HttpContext" src/TaskTracker.Api/Domain/`
  returns nothing. The conflict outcome is a pure-domain `UpdateResult`/`UpdateOutcome`; only
  `Endpoints/TaskEndpoints.cs` turns `VersionConflict` into `Results.Conflict(...)` (HTTP 409).
- **R-005** — verified: the work-item enum remains `TaskState`; the only `TaskStatus` text is the
  pre-existing doc comment explaining *why* `TaskState` is used. `[FACT]`
- **REV-004 (apply-time correctness)** — discharged: `TaskStore.Update` uses a compare-and-swap
  (`TryUpdate`) retry loop, so the check-then-write is atomic and racing writers cannot both pass a
  stale check. `[INFERENCE · HIGH]`

## 6. Residual risk / notes

- **Backward-compatibility posture is `grandfather` (by the maintainer's instruction).** A
  version-less PUT still performs last-write-wins, so an un-migrated token-less client *can* still
  overwrite. This is an explicitly chosen, accepted transition posture — not a defect. If a fully
  closed hole is later required, a follow-up decision would flip missing-token to strict-reject.
  `[INFERENCE · HIGH]`
- Persistence and auth remain NON-GOALs; the token is in-memory on the single-instance store, which
  is sufficient here. `[FACT]`
- **Sync follow-up (not done here):** the concurrency-control contract is an API-wide convention —
  route PROP-DEC-001/002 to `chaos:sync` as `CREATE_DECISION_LOG` (per proposal-review REV-005).

## 7. Confidence summary

- Verify verdict: **PASS**
- Confidence: **HIGH** (behaviour asserted by tests that map 1:1 to the answer clauses)
- Evidence coverage: COMPLETE · Assumption load: LOW
- `implementedMatchesAnswer = true`

## 8. Next command

```text
chaos:archive --change prevent-concurrent-edit-loss    # after this verification evidence (R-007)
chaos:sync                                              # CREATE_DECISION_LOG: concurrency-control convention
```
