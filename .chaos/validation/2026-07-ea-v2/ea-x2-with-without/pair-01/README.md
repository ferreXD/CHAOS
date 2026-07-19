# Pair 01 — API-key auth gate (`require-api-key-auth`)

Task statement (given verbatim to both arms): [`../oracles/task1-auth.md`](../oracles/task1-auth.md).
Held-out oracle: [`../oracles/AuthOracleTests.cs`](../oracles/AuthOracleTests.cs) (9 traps).

## Metrics

| | Arm A — CHAOS | Arm B — plain | notes |
|---|---|---|---|
| Held-out oracle | **9/9 pass** (0 defects) | **9/9 pass** (0 defects) | Observed |
| Own tests | 13/0 green | 9/0 green | both green |
| Conformance (blind judge) | **94** | **86** | `materialDifference = false` |
| R-003/R-004/R-005/R-006 | all pass | all pass | no violations either arm |
| Time (self-reported) | 642 s | 255 s | **2.52×** |
| Output tokens (proxy) | 62,597 | 16,331 | 3.83× |
| Governance artifacts read+used | 8 | 0 | Reported (author) |
| Material decisions recorded | 3 | 0 | |

Artifacts: [`armA-chaos.src-tests.diff`](armA-chaos.src-tests.diff),
[`armB-plain.src-tests.diff`](armB-plain.src-tests.diff),
[`oracle-armA-chaos.txt`](oracle-armA-chaos.txt),
[`oracle-armB-plain.txt`](oracle-armB-plain.txt),
governed artifact set in [`chaos-artifacts/`](chaos-artifacts/).

## What each arm did

- **Both** arms put auth in the **endpoint layer** as a group-level filter on `MapGroup("/tasks")`,
  so 401 precedes existence/validation; `GET /` stays public; key from config `ApiKey` default
  `test-secret-key`. R-004 held (Domain untouched). Both migrated the existing CRUD tests to an
  authenticated client to keep the baseline green.
- **Arm A (CHAOS)** used a dedicated testable `ApiKeyEndpointFilter : IEndpointFilter`, an
  `IsNullOrWhiteSpace` config guard, and 8 auth tests (before-existence, mutation-safety,
  PUT/DELETE, public root). It surfaced **`AUTH-DEC-001`: adopting auth crosses the architecture
  "authentication = NON-GOAL" posture** and recorded it as an explicit posture-change decision
  (resolved in-arm, no live human), plus `AUTH-DEC-002/003` for the filter placement and config
  strategy — producing the full proposal→review→apply→verify artifact set.
- **Arm B (plain)** used an inline lambda filter (same layer, correct), 4 auth tests, and shipped
  no governance artifacts.

## Held-out oracle result (Observed)

Both arms: **9/9 pass**. No defect. The plain arm correctly rejected missing/wrong keys on all
five routes with 401 **before** existence/validation, and kept `/` public.

## Conformance (blind judge, same rubric)

Anonymized X=Arm A (CHAOS), Y=Arm B (plain). Judge: X=94, Y=86, better=X, **materialDifference
= false**. Both pass every hard rule. The gap is test thoroughness + one **non-material,
non-oracle-detected** robustness edge: Arm B's `?? default` (vs Arm A's `IsNullOrWhiteSpace`)
would authenticate a header-less request **iff** `ApiKey` were configured to an empty string —
a condition the pinned contract never creates. Judge labelled it not material.

## Honest read

**No material catch attributable to CHAOS.** Same-model plain arm produced correct, rule-clean
auth. CHAOS's added value here: an explicit posture-crossing decision record + stronger tests +
a latent empty-key edge avoided — at 2.5× the time and 3.8× the tokens. Marginal, not
threshold-satisfying.
