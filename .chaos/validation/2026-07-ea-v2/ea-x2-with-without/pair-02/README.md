# Pair 02 — Soft-delete (`soft-delete-tasks`)

Task statement (verbatim to both arms): [`../oracles/task2-softdelete.md`](../oracles/task2-softdelete.md).
Held-out oracle: [`../oracles/SoftDeleteOracleTests.cs`](../oracles/SoftDeleteOracleTests.cs) (5 traps).

## Metrics

| | Arm A — CHAOS | Arm B — plain | notes |
|---|---|---|---|
| Held-out oracle | **5/5 pass** (0 defects) | **5/5 pass** (0 defects) | Observed |
| Own tests | 10/0 green | 8/0 green | both green |
| Conformance (blind judge) | **95** | **90** | `materialDifference = false` |
| R-003/R-004/R-005/R-006 | all pass | all pass | no violations either arm |
| Time (self-reported) | 779 s | 133 s | **5.86×** |
| Output tokens (proxy) | 64,556 | 9,967 | 6.48× |
| Governance artifacts read+used | 6 | 0 | Reported (author) |
| Material decisions recorded | 6 | 0 | |

Artifacts: [`armA-chaos.src-tests.diff`](armA-chaos.src-tests.diff),
[`armB-plain.src-tests.diff`](armB-plain.src-tests.diff),
[`oracle-armA-chaos.txt`](oracle-armA-chaos.txt),
[`oracle-armB-plain.txt`](oracle-armB-plain.txt),
governed artifact set in [`chaos-artifacts/`](chaos-artifacts/).

## What each arm did

- **Both** arms added a **trailing-defaulted** `DeletedAt` to the `TaskItem` domain record (so
  existing seeds/`Add` keep compiling — backward-compatible migration, R-003), kept the store
  logic in the **domain** (`All(includeDeleted)` / `Get()` hiding deleted / `SoftDelete`), and
  wired thin endpoints (`?includeDeleted=true`, `DELETE` → 204/404). R-004 held in both; no HTTP
  types leaked into `Domain/**`.
- **Arm A (CHAOS)** recorded 6 decisions including **`MDEC-003`: scope retention to the in-memory
  store only — do NOT cross the persistence non-goal** (the architecture decision-bearing area
  the task touches), plus the 404-for-deleted and re-delete-semantics decisions, and produced the
  full artifact set. Its `SoftDelete(id, deletedAt)` takes the clock at the boundary.
- **Arm B (plain)** implemented the same shape (`SoftDelete` generates `UtcNow` internally), 3
  new tests, no governance artifacts.

## Held-out oracle result (Observed)

Both arms: **5/5 pass**. Both soft-delete correctly — the row survives, is exposed only via
`?includeDeleted=true` with a non-null `deletedAt`, hidden from the default list, and 404s by id.

## Conformance (blind judge, same rubric)

Anonymized X=Arm B (plain), Y=Arm A (CHAOS). Judge: X=90, Y=95, better=Y, **materialDifference
= false**. "Architecturally identical." The only real difference: Arm A's tests are `strong`
(they additionally assert the `GET /tasks/{id}` 404-for-deleted clause and the `"deletedAt":null`
camelCase serialization shape), Arm B's are `adequate` (implements both, tests neither). A
test-coverage difference, not a rule violation.

## Honest read

**No material catch attributable to CHAOS.** This pair has the **worst time ratio (5.86×)** —
the governed arm spent ~13 minutes producing 11 artifacts + 6 decision records for a change the
plain arm shipped correctly in ~2 minutes. CHAOS's marginal value: the persistence-non-goal flag
+ the two extra test assertions.
