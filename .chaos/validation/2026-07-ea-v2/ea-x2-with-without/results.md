# EA-X2 results — scorecard vs §15.2 thresholds

> **Mechanized-counterfactual caveat (repeated).** Same underlying model ran both arms; the
> tasks are maintainer-authored with pre-pinned wire contracts; the "governed" arm is a single
> agent standing in for the human-led CHAOS loop (it recorded *and* resolved its own decisions,
> no live human). This isolates the **marginal value of the governance layer over the same model
> unaided** — it is **not** the unbiased human EA-X2 trial. A null result here legitimately
> shifts weight to **EA-D3**; it does **not** prove governance is valueless (see §Interpretation).

## Headline

**The value claim is UNSUPPORTED by this mechanized counterfactual, on both thresholds.**

| §15.2 threshold | Target | Observed | Verdict |
|---|---|---|---|
| Material defect/conformance catch **per CHAOS run** | **≥ 1** | **0 / 3 pairs** | ❌ **NOT MET** |
| CHAOS time vs plain | **≤ 2×** | **3.94× aggregate** (2.52× / 5.86× / 4.61×) | ❌ **NOT MET** |

Both arms shipped **defect-free, rule-clean** implementations of all three strict-risk tasks.
The governed arm cost **~3.9× the wall-time** and **~4.75× the output tokens** and produced no
defect or conformance-violation that the plain arm did not also avoid on its own.

## Scorecard (per pair + aggregate)

### later-found defects — held-out oracle (Observed; the objective signal)

| Pair | Task | Arm A CHAOS | Arm B plain | Defects caught **attributable to CHAOS** |
|---|---|---|---|---|
| 01 | auth gate | **9/9 pass** (0 defects) | **9/9 pass** (0 defects) | **0** |
| 02 | soft-delete | **5/5 pass** (0 defects) | **5/5 pass** (0 defects) | **0** |
| 03 | optimistic concurrency | **5/5 pass** (0 defects) | **5/5 pass** (0 defects) | **0** |
| **Total** | | **19/19** | **19/19** | **0** |

A "catch attributable to CHAOS" = a defect the plain arm shipped that the governed arm did not.
The plain arm (same model) shipped **zero** oracle-detectable defects, including on the subtle
traps: auth evaluated **before** existence/validation, soft-delete that **retains** the row,
and a stale-version PUT that returns **409** with the task **unchanged**.

### architecture conformance — blind judge, same rubric (Observed + Inferred)

Arms were anonymized (X/Y, order varied per pair) and scored on R-003/R-004/R-005/R-006 +
architecture fit + own-test quality.

| Pair | CHAOS score | plain score | Rule violations (either arm) | **Material** difference? |
|---|---|---|---|---|
| 01 | 94 | 86 | none | **No** |
| 02 | 95 | 90 | none | **No** |
| 03 | 95 | 95 | none | **No** |

`materialDifference = false` on **all three** pairs. Both arms passed every hard rule (R-004
domain→HTTP boundary held, R-005 `TaskState` naming kept, R-006 protected files untouched,
R-003 baseline green). The CHAOS arm scored marginally higher on 2 of 3 pairs **solely on its
own-test thoroughness** (it wrote more edge-case tests), not on any rule the plain arm broke.

### time & tokens (time = Reported/author; tokens = Observed output-proxy)

| Pair | CHAOS time | plain time | **time ratio** | CHAOS out-tok | plain out-tok | token ratio |
|---|---:|---:|---:|---:|---:|---:|
| 01 | 642 s | 255 s | **2.52×** | 62,597 | 16,331 | 3.83× |
| 02 | 779 s | 133 s | **5.86×** | 64,556 | 9,967 | 6.48× |
| 03 | 728 s | 158 s | **4.61×** | 58,223 | 12,698 | 4.59× |
| **Σ** | **2,149 s** | **546 s** | **3.94×** | **185,376** | **38,996** | **4.75×** |

Time is arm-self-reported (`date +%s`), not an independent stopwatch. Tokens are workflow
`budget.spent()` **output-token** deltas measured with arms run sequentially (output-only proxy;
no input tokens; no token infra exists yet — IL-PF10). Both threshold-relevant: **no pair met
≤2×**.

### artifacts actually read (Reported, author; cross-checked against diffs)

The governed arm listed governance artifacts it read **and that changed a choice**:

| Pair | governance artifacts read+used | material decisions recorded | artifacts produced |
|---|---:|---:|---:|
| 01 | 8 | 3 | 11 |
| 02 | 6 | 6 | 11 |
| 03 | 6 | 6 | 11 |

Cross-check (Observed): the "read+used" claims are corroborated by the diffs — e.g. R-004 is
visibly honored (auth in an endpoint filter; version/soft-delete state in the domain with no
HTTP types), and each pair's decision log surfaced the exact architecture **non-goal** the task
crosses (auth → `AUTH-DEC-001`; persistence → `MDEC-003` / `PROP-DEC-004`). So the artifacts
were genuinely consumed, not merely produced — but that consumption did not translate into a
defect or conformance-violation the plain arm actually shipped.

## What CHAOS *did* buy here (real, but not threshold-satisfying)

Labelled honestly so the null result isn't over-read:

- **Decision traceability (Observed):** 15 material decisions recorded across 3 runs, including
  3 explicit **architecture-non-goal-crossing** posture flags (`AUTH-DEC-001` auth,
  `MDEC-003`/`PROP-DEC-004` persistence) that the plain arm crossed **silently**. Under the
  metric's parenthetical ("…or that a CHAOS decision explicitly surfaced"), this is ≥1 surfaced
  *decision* per run — but it surfaced a **governance/sign-off** item, not a **defect or
  rule-violation** the plain arm shipped, so it does not satisfy the "material catch" threshold
  as an outcome difference. Both readings are stated; the objective oracle+judge show 0.
- **Marginally stronger tests (Observed):** judge rated CHAOS own-tests `strong` vs plain
  `adequate` on pairs 01–02 (CHAOS covered before-existence auth, PUT/DELETE, the GET/{id}-404
  soft-delete clause, and a serialization-shape assertion the plain arm implemented but left
  untested).
- **One sub-material robustness edge (Observed, closest to a "catch"):** on pair 01 the plain
  arm's config read null-coalesces only (`?? default`), so an **empty-string** `ApiKey` config
  value would authenticate a header-less request; the CHAOS arm's `IsNullOrWhiteSpace` guard
  avoids it. The judge labelled this **not material** and it is **not oracle-detected** (the
  pinned contract never sets an empty `ApiKey`). Reported as a marginal quality edge, **not** a
  material defect catch.

## Interpretation — why this null result, and what it does / doesn't mean

- **Same model on both arms** is the dominant factor: on well-specified tasks the base model
  produced correct, rule-clean code unaided, leaving little defect surface for governance to
  catch. This is exactly the confound §15.1 warns about — the creator/agent cannot run an
  unbiased with/without.
- **Contract-pinning bias (design limitation, states plainly):** to make the oracle *objective*,
  each task pinned the exact wire contract (headers, status codes, field names, the
  `?includeDeleted`/`expectedVersion` semantics). Pinning **removes the ambiguity that governance
  is designed to surface** — in real strict-risk work the human has *not* pre-decided "should
  auth cover reads too?", "soft or hard delete?", "409 or last-writer-wins?". CHAOS's value is
  partly in **forcing a human to decide** those. By handing both arms the answers, this design
  **structurally under-measures** governance value and **biases toward null**. A fair reading:
  this experiment tested "given a fully-specified task, does governance prevent defects the same
  model would otherwise make?" — and found no, for n=3 — **not** "is governance valueless."
- **Small n (3), maintainer-authored** tasks (selection bias), and a **single-agent
  approximation** of the governed lifecycle (decisions recorded *and* resolved in-arm, no human
  in the Decision Center — a documented deviation).
- **Cost is real and large:** ~3.9× time, ~4.75× output tokens, for governance value that here
  was traceability/documentation + marginally better tests, not prevented defects.

## Routing (per the brief)

A null/negative result on the §15.2 value thresholds **shifts weight to EA-D3**. Recorded
without retouching. This does not, on its own, kill the value claim — it says the *unaided model
was already competent on these fully-specified tasks*, and that a fair test of governance value
needs (a) **under-specified / genuinely ambiguous** strict-risk tasks where the material decision
is not pre-pinned, (b) ideally a **different or weaker executor** in the plain arm, and (c) the
**real human-in-the-loop** trial that only EA-X2-proper (with recruited humans) can provide.

## Report-back line (for `results-summary.md`)

> **EA-X2 (mechanized counterfactual, n=3):** material defect/conformance catches per CHAOS run
> = **0** (per pair 0/0/0; held-out oracle 19/19 clean **both** arms; blind conformance judge
> `materialDifference=false` all 3); time ratio **3.94×** aggregate (2.52/5.86/4.61, all > 2×).
> **Value claim UNSUPPORTED on both §15.2 thresholds → weight shifts to EA-D3.** Caveat: same
> model both arms + pinned contracts structurally under-measure governance value; a fair test
> needs under-specified tasks and the real human trial.

---

# Stage-B standard re-run — results (2026-08-02)

> Model `claude-opus-5[1m]`, workflow `wf_b431fa27-e79` (6 arms, sequential, 0 errors, ~54 min,
> 610k subagent tokens). Harness `harness/stage-b-standard-arms.workflow.js`: governed arm emits
> records + renders; **plain-arm prompt byte-identical to the frozen row**; tasks, oracles and
> scoring frozen; worktrees pinned to `d27600f`. Raw data:
> `evidence-stage-b-standard-arms.json`. **Model differs from the 2026-07-19 baseline — ratios,
> not absolutes.**

## Headline

**This was the run Stage B was supposed to win, and it did not.** On the standard path — where
artifact prose was 45.5% of governed output and four narrative reports collapse into one rendered
file — the governed premium **widened** from 4.75× to **5.87×** tokens, and governed absolute cost
moved only **−9%**. The prose reduction is real (authored artifact bytes 45.5% → 23.9%, roughly
halving artifact-authoring tokens) but it did not become savings: the non-artifact half of the work
grew ~28% to absorb it. Combined with the light-path result (3.47× → 4.15×), **the ledger-first
inversion does not reduce governed cost on any measured path.**

## Cost

| Pair | task | Stage-B time | plain time | time ratio | Stage-B out-tok | plain out-tok | tok ratio | oracle (both) |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 718 s | 122 s | 5.89× | 55,193 | 8,830 | 6.25× | 9/9 clean |
| 2 | soft-delete | 1,019 s | 135 s | 7.55× | 65,304 | 8,981 | 7.27× | 5/5 clean |
| 3 | concurrency | 758 s | 182 s | 4.16× | 49,089 | 11,056 | 4.44× | 5/5 clean |
| **Σ** | | **2,495 s** | **439 s** | **5.68×** | **169,586** | **28,867** | **5.87×** | **19/19 both** |

| | frozen baseline (old standard) | Stage-B standard | delta |
|---|---:|---:|---|
| governed | 2,149 s / 185,376 tok | 2,495 s / 169,586 tok | **+16% time / −9% tok** |
| plain | 546 s / 38,996 tok | 439 s / 28,867 tok | −20% / −26% (model/session) |
| **ratio** | **3.94× / 4.75×** | **5.68× / 5.87×** | **worse** |

The plain arm is the control: it got ~26% cheaper this session. Governed did not track it — the
ratio moved the wrong way by ~24%.

## Where the output went — prose fell, cost did not

| | frozen (prose) | Stage-B (records + ledger + OpenSpec) |
|---|---:|---:|
| authored artifact share of governed output | **45.5%** | **23.9%** |
| implied authored tokens | ~84,300 | ~40,500 |
| implied everything-else tokens | ~101,000 | ~129,100 (**+28%**) |

Per governed arm: **100.7 KB of JSON records** + 25.5 KB ledger + 35.9 KB OpenSpec authored, to
render **73.3 KB change.md** + 4.7 KB lifecycle.md for free. The projection's *input* is not cheaper
than the prose it replaced — and the freed budget was consumed by schema reading, record authoring
and more thorough implementation (governed arms wrote 16/12/11 tests vs the plain arms' 9/8/12).

## What held (mechanical claims — 2 for 2 across both measured paths)

| Claim | Evidence |
|---|---|
| Agents emit schema-valid records unaided | **15 render invocations, 0 failures** (light run: 14/0) |
| Writer discipline | `handWroteRenderedArtifact = false` on 3/3 governed arms |
| Idempotent renders | `--check` **CLEAN on 6/6** rendered artifacts |
| No quality regression | oracle **19/19 both arms**, matching the frozen row exactly |
| Governance caught a real gap | the p1 arm reported **R-001 unmet** (no decision passed through the interaction runtime in a mechanized run) and held its verdict at READY_WITH_DEBT instead of claiming a clean READY |

## Verdict

- **Stage B's cost case is falsified on both paths.** Light: 3.47× → 4.15×. Standard: 4.75× →
  5.87×. It should not be adopted as a cost measure, and the roadmap's "~1× is only reachable via
  B" needs retracting against this evidence.
- **Stage B's correctness case is intact and now twice-measured**: drift structurally impossible,
  provenance automatic, counts derived, zero writer-discipline failures across 9 governed arms.
  That is a real property with a real price — **+24% on the ratio**. Whether to pay it is a
  creator call, and it is now an informed one.
- **The residual cost is not artifact prose and never mainly was.** With authored artifacts at
  23.9%, the dominant cost is governance reading, decision records and the OpenSpec set kept in
  every mode. Reopening **OpenSpec-on-light/standard** is the next lever with real headroom —
  bigger than anything the renderer can reach.
