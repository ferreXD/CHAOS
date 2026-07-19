# Pair 03 — Optimistic concurrency (`optimistic-concurrency-updates`)

Task statement (verbatim to both arms): [`../oracles/task3-concurrency.md`](../oracles/task3-concurrency.md).
Held-out oracle: [`../oracles/ConcurrencyOracleTests.cs`](../oracles/ConcurrencyOracleTests.cs) (5 traps).

## Metrics

| | Arm A — CHAOS | Arm B — plain | notes |
|---|---|---|---|
| Held-out oracle | **5/5 pass** (0 defects) | **5/5 pass** (0 defects) | Observed |
| Own tests | 10/0 green | 10/0 green | both green |
| Conformance (blind judge) | **95** | **95** | `betterConformance = tie`, `materialDifference = false` |
| R-003/R-004/R-005/R-006 | all pass | all pass | no violations either arm |
| Time (self-reported) | 728 s | 158 s | **4.61×** |
| Output tokens (proxy) | 58,223 | 12,698 | 4.59× |
| Governance artifacts read+used | 6 | 0 | Reported (author) |
| Material decisions recorded | 6 | 0 | |

Artifacts: [`armA-chaos.src-tests.diff`](armA-chaos.src-tests.diff),
[`armB-plain.src-tests.diff`](armB-plain.src-tests.diff),
[`oracle-armA-chaos.txt`](oracle-armA-chaos.txt),
[`oracle-armB-plain.txt`](oracle-armB-plain.txt),
governed artifact set in [`chaos-artifacts/`](chaos-artifacts/).

## What each arm did

- **Both** arms added `Version` (starting at 1) to the domain record, an optional
  `ExpectedVersion` to `UpdateTaskRequest`, and made the **domain** own the compare-and-increment,
  returning a **plain outcome type** (Arm A: `TaskUpdateResult` record struct + `TaskUpdateOutcome`
  enum; Arm B: `UpdateResult` enum + `out TaskItem?`) that the endpoint maps to `Ok/Conflict/
  NotFound`. No HTTP types in `Domain/**` (R-004 held). Convergent designs from the same model.
- **Concurrency safety:** Arm A used an explicit `lock` around check-and-increment; Arm B used a
  lock-free `ConcurrentDictionary.TryUpdate` CAS retry loop (correct — monotonic `Version` rules
  out ABA). Both prevent the lost-update race.
- **Arm A (CHAOS)** recorded 6 decisions including **`PROP-DEC-004`: accept + surface a
  non-durable version (resets on restart) — persistence is an architecture non-goal**, plus the
  atomicity and result-type decisions, and produced the full artifact set.
- **Arm B (plain)** shipped the same behaviour with 5 tests, no governance artifacts.

## Held-out oracle result (Observed)

Both arms: **5/5 pass**. Both correctly return **409 on a stale `expectedVersion`** and leave
the task **unchanged**, increment on success, start at version 1, and keep the version-less PUT
working (back-compat).

## Conformance (blind judge, same rubric)

Anonymized X=Arm A (CHAOS), Y=Arm B (plain). Judge: X=95, Y=95, **tie**, **materialDifference
= false**. Both fully conform; both own-test quality `strong`. The judge noted only stylistic
differences (lock vs CAS; result struct vs enum+out).

## Honest read

**No material catch attributable to CHAOS — this pair is a dead-heat conformance tie.** The most
safety-sensitive task (a genuine lost-update race) is exactly where you'd expect governance to
earn its keep, yet the same-model plain arm independently produced a correct, atomic, rule-clean
implementation with equally strong tests — at 4.6× less time.
