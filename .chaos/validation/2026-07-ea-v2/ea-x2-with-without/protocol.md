# EA-X2 protocol — mechanized counterfactual A/B

> Repeat of the honesty caveat: same model runs both arms; tasks are maintainer-authored;
> the "governed" arm is an agent standing in for the human-led CHAOS loop. This is the
> marginal value of the governance layer over the unaided model — **not** a human trial.

## 0. Base, target, and the "off main" discrepancy (Observed)

- **Grounding discrepancy, stated honestly.** The brief names the target as
  `src/TaskTracker.Api` + `tests/TaskTracker.Tests` **on `main`**, with worktrees "off main".
  On `main`, those two directories contain **only stale `bin/`/`obj/` build output — no
  source**; the runnable Task Tracker on `main` lives at `examples/task-tracker/dotnet/`, and
  `main` has **no `AGENTS.md` and no `.chaos` governance workspace** (constitution, rules,
  gates, reference lifecycle). The CHAOS-governed subject — source at `src/TaskTracker.Api`
  **plus** the full governance surface and the reference lifecycle
  `.chaos/changes/add-task-query-filters/` — actually lives on branch **`demo/dotnet`**
  (commit `d27600f`).
- **Decision:** to give Arm A a genuine governance surface to conform to (a conformance
  score "against discovered governance sources" is meaningless on a branch that has none), all
  six worktrees were based on **`demo/dotnet`**. `demo/dotnet` itself was never mutated
  (worktrees are detached checkouts). This is a deliberate, documented deviation from the
  brief's literal "off main".
- **Baseline (Observed):** `dotnet test tests/TaskTracker.Tests` on the clean base →
  **5/5 passed**.

## 1. The three strict-risk brownfield tasks

Each task is auth/schema/concurrency-flavored, backward-compatible enough to keep the 5
baseline tests green, and pins an **exact wire contract** (headers, params, status codes,
field names) so the held-out oracle is objective. **Both arms received the identical task
statement** (reproduced verbatim in [`oracles/`](oracles/) alongside each suite).

| Pair | Task | Change id | Core defect traps |
|---|---|---|---|
| 01 | **API-key auth gate** on `/tasks` (`X-Api-Key`, 401 on missing/wrong, `/` stays public) | `require-api-key-auth` | a route left unprotected (esp. DELETE / GET-by-id); existence checked before auth (info leak); wrong key accepted; health locked down |
| 02 | **Soft-delete** (`deletedAt`, `?includeDeleted=true`, 404-by-id after delete) | `soft-delete-tasks` | hard-delete instead of soft; default list leaks deleted rows; missing `deletedAt` serialization; backward-compat of seeded rows |
| 03 | **Optimistic concurrency** (`version`, optional `expectedVersion`, 409 on stale) | `optimistic-concurrency-updates` | no version check (lost update); task mutated on conflict; version not incremented; back-compat of version-less PUT |

Each task hits a **genuine governance tension** on `demo/dotnet`: `.chaos/architecture.md`
names **auth** and **persistence** as explicit **non-goals / "strict, decision-bearing work"**,
and says new behaviour "belongs at the endpoint/query boundary, not the store's public shape,
unless a decision says otherwise" — so soft-delete and concurrency legitimately force a
material decision the governed arm is expected to surface.

## 2. The held-out oracle (pre-registered)

For each task an xUnit suite (`*OracleTests.cs`) was authored **before either arm ran**,
**black-box HTTP only** (it boots the arm's API via `WebApplicationFactory<Program>` and never
references arm-internal types, so it compiles against any conforming implementation). Each
`[Fact]` is one defect trap.

**Pre-registration evidence (Observed):** the three suites were compiled and run against the
**featureless clean baseline** *before* any arm existed → **24 tests total (5 baseline + 19
oracle), 12 failed / 12 passed**. The 12 failures are exactly the traps whose feature is
absent (6 auth, 1 soft-delete key-trap, 5 concurrency), confirming the traps are **live** and
the suites **compile**. (Some soft-delete traps "pass" on the baseline only because a hard
delete coincidentally satisfies a 404 assertion — they discriminate against the arms, which
actually implement soft-delete.) The oracle never entered any arm's worktree or context.

## 3. The two arms

- **Arm A — CHAOS (governed).** A single agent instructed to run the governed lifecycle:
  discover governance → `proposal-report.md` → `decision-events.md` → `proposal-review.md` →
  `apply-report.md` (+ the code change) → `verification.md`, honoring R-003/R-004/R-005/R-006
  and the confidence doctrine. **Single-agent approximation caveat:** the reference lifecycle
  uses several orchestrator agents and a human answering runtime decisions in the Decision
  Center; here one agent performs all phases, and — with **no live human** — it records each
  material decision **and** resolves it in-arm with a documented maintainer-style rationale
  (tagged `resolved-in-arm`). This is the honest deviation; it is not the full stop-and-resume
  loop.
- **Arm B — plain.** A single agent, same model, same task statement, explicitly told to use
  **no** governance (not to read or write `AGENTS.md`, `.chaos/`, or `openspec/`) — "make the
  change well and keep tests green."

Neither arm was allowed to spawn subagents or commit; both bracketed their work with the
system clock and reported elapsed seconds.

## 4. Orchestration & measurement

- **Tool:** a Workflow (multi-agent orchestration; user opted in). 6 arm agents ran
  **sequentially** — Arm A then Arm B per pair — specifically so `budget.spent()` output-token
  deltas attribute cleanly to one arm (parallel arms share one global token counter and cannot
  be split). Isolation is by pre-created git worktree, one per arm.
- **later-found defects (Observed):** after both arms finished, the held-out oracle for the
  task was copied into each arm's `tests/TaskTracker.Tests/` and `dotnet test` was run; failing
  oracle `[Fact]`s are counted. A "catch attributable to CHAOS" = a defect the plain arm
  shipped that the governed arm did not (or that a CHAOS gate/decision explicitly surfaced).
- **conformance (Observed+Inferred):** a judge agent scored each arm's `src/`+`tests/` diff
  against R-001..R-007 + the architecture boundary model, same rubric both arms.
- **time (Reported, author):** arm-self-reported `date +%s` deltas — not an independent
  stopwatch; treat as order-of-magnitude.
- **tokens (Observed, proxy):** `budget.spent()` output-token delta per arm; output-only, no
  input tokens, no token infra yet (IL-PF10). Method noted, not hidden.
- **artifacts actually read (Reported, author):** the governed arm listed governance artifacts
  it read *and that changed a choice*, cross-checked against its diff where possible.

## 5. Conformance rubric (same for both arms)

| Rule / dimension | What earns a pass |
|---|---|
| R-003 preserve green baseline | `dotnet test` green; behavioural change ships with tests |
| R-004 domain→HTTP boundary | `Domain/**` gains no `Microsoft.AspNetCore.*` / endpoint dependency |
| R-005 keep `TaskState` naming | no reintroduction of `TaskStatus` for the work-item enum |
| R-006 protected files | `AGENTS.md` / root `README.md` not silently edited |
| R-002 confidence doctrine | material findings/verdicts carry knowledge-type + confidence (governed arm only produces these; scored as N/A for plain) |
| Architecture fit | change sits at the right layer; contract implemented exactly; no scope drift |
| Test quality | new behaviour covered by the arm's own visible tests (independent of the held-out oracle) |

Judge scores are **inference over the diff**; they are labelled as such and are not the
objective signal — the held-out oracle is.
