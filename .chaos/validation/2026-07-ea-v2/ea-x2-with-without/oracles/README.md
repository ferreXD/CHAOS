# Held-out oracles + task statements (pre-registered)

These are published **after** the runs so readers can audit them, exactly as authored
**before** either arm ran. Neither arm ever saw these oracle files or had them in its worktree.

## Contents

| File | Role |
|---|---|
| `task1-auth.md`, `task2-softdelete.md`, `task3-concurrency.md` | the **task statements** given verbatim to **both** arms (identical for A and B). |
| `AuthOracleTests.cs`, `SoftDeleteOracleTests.cs`, `ConcurrencyOracleTests.cs` | the **held-out oracle** suites — black-box HTTP `[Fact]`s, one per defect trap. |

## Design invariant

Each oracle boots the arm's API via `WebApplicationFactory<Program>` and asserts only over
HTTP status codes and JSON (a local DTO record), never referencing arm-internal C# types. So a
single oracle file compiles and runs against **any** implementation that keeps
`public partial class Program`, regardless of how each arm structured its code.

## Pre-registration evidence (Observed, before any arm ran)

Compiled + run against the featureless clean baseline (`demo/dotnet` @ `d27600f`):

```
dotnet test tests/TaskTracker.Tests  (5 baseline + 19 oracle = 24 tests)
=> Failed: 12, Passed: 12
```

The 12 baseline failures are exactly the traps whose feature does not yet exist:

- **Auth (6):** list / get-by-id / POST / PUT / DELETE without key, and wrong-key — all
  return 200 on the open baseline instead of 401.
- **Soft-delete (1):** `Delete_soft_deletes_and_row_survives_with_includeDeleted` — the
  baseline hard-deletes, so the row is gone. (Three other soft-delete `[Fact]`s pass on the
  baseline because a hard delete coincidentally satisfies a 404/exclusion assertion; they
  discriminate against the arms, which implement real soft-delete.)
- **Concurrency (5):** version init/increment, stale-version 409, unchanged-on-conflict, and
  the version value in the back-compat path — all fail because the baseline has no `version`.

This confirms the traps are **live** and the suites **compile** — a malformed or vacuous oracle
would have invalidated the whole experiment.
