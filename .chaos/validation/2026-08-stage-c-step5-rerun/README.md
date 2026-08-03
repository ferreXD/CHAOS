# Stage-C step 5 — the frozen-kit re-run (pre-registration + procedure log)

> Toolkit meta-work — **no CHAOS governance** on the measurement itself (memory:
> `chaos-develop-toolkit-without-governance`). CHAOS runs only inside the governed arms; that is
> the measured subject. Execution brief: [`docs/design/2026-08-02-stage-c-step5-run-handoff.md`](../../../docs/design/2026-08-02-stage-c-step5-run-handoff.md)
> (commit `1ccff79`). Design of record: [`docs/design/2026-08-02-stage-c-progressive-rigor.md`](../../../docs/design/2026-08-02-stage-c-progressive-rigor.md)
> (register C-1..C-14). Kit contract: [`RUNKIT.md`](../2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md).

## 1. What this run answers

One run, three questions (brief §0):

1. **C's cost curve** — what progressive rigor costs on the frozen-3 materiality tasks with **no
   preset flag** (zero floors: triggers alone set rigor).
2. **The OpenSpec lever's real size** — C-10 (zero-base, trigger-gated OpenSpec) was adopted
   *pending this measurement*; this run is the condition.
3. **Stage-B's fate** — decided from the **cost attribution** (§6 below), possible because the
   classifier consumes no `records/*.json` (C is not welded to B).

Results are reported **as found**. Two cost hypotheses have already died in this program
(Stage-B light 4.15×, standard 5.87× against 3.47×/4.75× baselines). A negative result here is a
valid outcome and is not designed or narrated around.

## 2. Arm plan — CORE TIER (7 arms, sequential)

| Arm | Kind | Task | Worktree | Staged? |
|---|---|---|---|---|
| `P1-armA` | governed, no preset flag | `require-api-key-auth` (frozen task 1) | `<scratch>/wt/P1-armA` | yes |
| `P1-armB` | plain | same statement, byte-identical frozen prompt | `<scratch>/wt/P1-armB` | **no** |
| `P2-armA` | governed, no preset flag | `soft-delete-tasks` (frozen task 2) | `<scratch>/wt/P2-armA` | yes |
| `P2-armB` | plain | " | `<scratch>/wt/P2-armB` | **no** |
| `P3-armA` | governed, no preset flag | `optimistic-concurrency-updates` (frozen task 3) | `<scratch>/wt/P3-armA` | yes |
| `P3-armB` | plain | " | `<scratch>/wt/P3-armB` | **no** |
| `V1-armA` | ratchet-fidelity, FRAME-only | `secure-api-underspecified` | `<scratch>/wt/V1-armA` | yes |

Extended tier (light-eligible trio `taskB{1,2,3}`, ±6 arms) is **not** part of this row; it is a
separate dated row if run.

All worktrees are detached on base **`d27600f`** (`feat(chaos): CHAOS demo golden path`) — never
the `demo/dotnet` tip (`df26104` already ships JWT auth + 34 tests and would invalidate task 1 and
every oracle) and never `main` (empty `src/TaskTracker.Api`). The frozen posture is each
worktree's own `.chaos/architecture.md` at `d27600f` (auth still in non-goals); it is **not**
overwritten.

**Staged into governed worktrees only:** `tools/chaos-render/`, the full current `.claude/skills/`
tree, `.claude/hooks/scripts/chaos-artifact-metadata-hook.py`, `tools/chaos-classify/`,
`docs/design/2026-08-02-stage-c-progressive-rigor.md`, and
`.chaos/validation/2026-08-stage-c-classifier/assets/path-class-map.json` →
`<worktree>/.chaos/path-class-map.json` (the propose wiring reads exactly that path; the v1 map was
authored FOR `d27600f`).

The harness does **not** classify. The governed arm's own skills run K1..K4 inside the worktree —
that is part of the measured cost.

---

## 3. PRE-REGISTRATION — frozen 2026-08-03, before any arm launched

House discipline (brief §7): the measured act gets pre-registered expectations. **These rows are
never edited to match results.** Any post-run divergence is recorded as a finding in
[`results.md`](results.md), in both error directions.

Sources: the corpus manifest rows that recast these very tasks — `SC-01-frozen-auth`,
`SC-02-frozen-softdelete`, `SC-03-frozen-concurrency`, `SC-07-underspec-secure`
([corpus README §4](../2026-08-stage-c-classifier/README.md)) — plus the design's own C-13
prediction. **The corpus was the calibration set; this is the classifier's first blind test.**

### 3.1 Per-task expectations

Dimension vector order: `stops · evidence.targeted · evidence.breadth · review · verify · openspec · adr`.

#### P1 — `require-api-key-auth` (corpus row SC-01)

| Checkpoint | Expected newly-fired | Family · surface | Expected dims after | openspec | new stops |
|---|---|---|---|---|---|
| K1 | **M1** (by adjudication), **M2** (by scan) | materiality · **auth** (both) | `1·1·0·0·1·1·2` | **1** (delta) | **0** (folds into floor stop) |
| K2 | **M4** *if* ledger has ≥2 `*-DEC-*` entries | materiality · **process** | `1·1·0·1·1·2·2` | **2** (full set) | 0 |
| K3 | none new; `scanEcho: [M2]` | — | unchanged | unchanged | 0 |
| K4 | none (self-review expected clean ⇒ **X2 must not fire**) | — | unchanged | unchanged | 0 |

Must **NOT** fire: **M3** (auth wraps existing routes — no route delta), **X1** (implementation
diff ~5 files / ~112 LOC, below MR-5's ≥8 files / ≥400 LOC), **M5** (scope declared to include
`src/TaskTracker.Api/Security/ (new)`).

#### P2 — `soft-delete-tasks` (corpus row SC-02)

| Checkpoint | Expected newly-fired | Family · surface | Expected dims after | openspec | new stops |
|---|---|---|---|---|---|
| K1 | **M2** (by scan), **M1** (by adjudication) | materiality · **data-store** (both) | `1·1·0·0·1·1·2` | **1** (delta) | **0** |
| K2 | **M4** *if* ≥2 decision entries | materiality · **process** | `1·1·0·1·1·2·2` | **2** | 0 |
| K3 | none new; `scanEcho: [M2]` | — | unchanged | unchanged | 0 |
| K4 | none (X2 must not fire) | — | unchanged | unchanged | 0 |

Must **NOT** fire: **M3** (`deletedAt` is an additive response field, no route delta), **X1**, **M5**.

#### P3 — `optimistic-concurrency-updates` (corpus row SC-03)

| Checkpoint | Expected newly-fired | Family · surface | Expected dims after | openspec | new stops |
|---|---|---|---|---|---|
| K1 | **M2** (by scan), **M1** (by adjudication) | materiality · **data-store** (both) | `1·1·0·0·1·1·2` | **1** (delta) | **0** |
| K2 | **M4** *if* ≥2 decision entries | materiality · **process** | `1·1·0·1·1·2·2` | **2** | 0 |
| K3 | none new; `scanEcho: [M2]` | — | unchanged | unchanged | 0 |
| K4 | none (X2 must not fire) | — | unchanged | unchanged | 0 |

Must **NOT** fire: **M3** (`expectedVersion` + 409 on an existing route are additive), **X1**, **M5**.
Known design gap carried, not resolved: concurrency/shared-state has no M2 class of its own
(observation O-2) — coverage comes from the persistence path + M1, deliberately.

#### V1 — `secure-api-underspecified`, FRAME-only (corpus row SC-07)

| Checkpoint | Expected newly-fired | Family · surface | Expected dims after | openspec | new stops |
|---|---|---|---|---|---|
| K1 | **M1** (adjudication), **M2** (adjudication) | materiality · **auth** (both) | `1·1·0·0·1·1·2` | **1** (delta) | **0** |

Confidence expected **MEDIUM** at K1 (adjudication raised). The arm stops after FRAME; K2/K3/K4
are out of scope for this seed. Under Stage C there is **no mode escalation** — the pass criterion
is that the *ratchet* fires (M1/M2 recorded as `TRG-*` events with raised dimensions), not that a
`light → standard` escalation is announced. An `ESC-*` entry or an `escalatedFrom` frontmatter key
would be a **regression** (legacy behaviour leaking through).

### 3.2 The M4 conditional — registered explicitly, because it decides the headline

The corpus registered SC-01/02/03 at **K1 and K3 only** (synthetic fixtures with no ledger), so
M4 was structurally out of its scope. In the wild K2 exists and the governed arm writes a real
ledger. M4's rule is deterministic: **≥2 `## <PREFIX>-DEC-<nnn>` entries ⇒ fire, surface
`process`**. Every prior measured run of these three tasks recorded ≥2 decision entries (Stage-A
light: 3 on soft-delete; Stage-B light: 2 per Cost-B arm; frozen standard: up to 6).

Therefore the **primary registered expectation is that M4 fires on all three frozen tasks**, and
because `process` is a **distinct surface** from `auth`/`data-store`, C-13 takes `openspec` to
**2 — the full set**. Consequence, registered before the run:

> **On the frozen-3, the C-10 OpenSpec lever is predicted to be ~zero.** The saving C-10 promises
> lands on *zero-trigger* changes (the extended-tier light-eligible trio), not on these three.
> If the run shows openspec 1 on any frozen task, that is a *better-than-predicted* result and is
> reported as such; if it shows openspec 2 everywhere, C-10's lever on this kit is measured at
> zero and reported as such.

The secondary (fallback) expectation, if an arm records ≤1 decision entry: M4 does not fire,
`openspec` stays **1**, `review` stays **0**.

### 3.3 Cost prediction (directional; not an acceptance bar)

Registered so it cannot be retrofitted. Against the §7 comparison ledger, with the collapsed
Stage-C FRAME→DELIVER path, delta-or-full OpenSpec, plus new classifier + adjudication overhead:

- **Predicted:** token ratio lands between the Stage-B light row (**4.15×**) and the Stage-A light
  row (**3.47×**) — i.e. Stage C does not by itself reach ≤2×, and the classifier overhead is
  partly offset only where openspec drops to 1.
- **Falsification is expected to be informative either way.** A ratio ≥ 4.15× means C adds cost
  without buying a lever on this band; a ratio ≤ 3.47× would be the first cost win in three stages.

### 3.4 Instrumentation risk registered in advance

**X1 over-fire hazard.** MR-5 fires X1 at ≥8 files or ≥400 changed LOC. The *implementation* diff
on each frozen task is ~4–5 files / ~110–160 LOC (well below). But a governed arm also writes
`.chaos/changes/<id>/**` and `openspec/changes/<id>/**`. If the arm feeds the classifier a numstat
covering governance artifacts as well as source, X1 will fire and `review` will rise. Registered
position: **X1 firing on a governance-inflated numstat is an instrumentation/wiring finding, not a
classifier error** — it is recorded in both the fidelity scorecard (as an over-detection) and in
the findings list, with the numstat that caused it.

---

## 4. Non-negotiables observed by this run

- Toolkit meta-work runs **without** CHAOS governance (no `chaos:propose`, no decision runtime).
- Classifier inputs: ledger + git + frontmatter only. **Never `records/*.json`.**
- **Plain-arm prompts byte-identical** to the frozen run (lifted from the prior workflow js, not
  retyped); plain worktrees get **no** staging.
- Corpus expectations are frozen; misfires are recorded as findings here, never as corpus edits.
- RUNKIT rows are **append-only** — a new dated row, never an overwrite.
- Arms run **sequentially** so `budget.spent()` deltas attribute to one arm.
- Oracles never enter a worktree except during their scoring window (`score-arm.sh` handles it).
- `python` (3.12.3); BOM-less JSON; no `Select-Object -First` over python stdout.

## 5. Caveats that travel with every table in this kit

- **Tokens are an output-only proxy** (`budget.spent()` deltas; no input tokens — IL-PF10).
- **Time is arm-self-reported** (`date +%s` bracketing), not an independent stopwatch.
- **Compare ratios, not absolutes, across model rows.** This run is `claude-opus-5[1m]`; the
  2026-07-19 and 2026-07-24 rows are Opus 4.8.
- Same-model both arms; pinned contracts; a single agent stands in for the human-led loop. This
  kit measures the **cost of producing the traceability**, not governance **value** (EA-X2b/EA-D3).

## 6. What gets recorded (brief §8)

1. A new dated row in [`RUNKIT.md`](../2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md).
2. **Cost attribution per governed arm** — governed output split into: OpenSpec artifacts · JSON
   records authored · rendered markdown (renderer output, ~free) · ledger/decisions ·
   classifier + adjudication overhead · implementation. Compared against Stage-B's finding
   (100 KB JSON → 78 KB markdown). **This decides Stage-B's fate.**
3. **Classification fidelity in the wild**, both error directions, against §3.1, cited from the
   arms' `TRG-*` ledger events and `classification-state.json` (archived under `evidence/`
   before worktree cleanup).
4. The caveats in §5, verbatim, on every table.

## 7. Comparison ledger (ratios, never absolutes across models)

| Row | date · model | time × | tok × |
|---|---|---:|---:|
| Frozen baseline (standard) | 07-19 · Opus 4.8 | 3.94× | 4.75× |
| Stage-A `--light` | 07-24 · Opus 4.8 | 3.35× | 3.47× |
| Stage-B light | 08-02 · Opus 5 | 3.79× | 4.15× |
| Stage-B standard | 08-02 · Opus 5 | 5.68× | 5.87× |
| Stage-B Cost-B (light-eligible) | 08-02 · Opus 5 | 2.93× | 3.38× |

Oracle: 19/19 clean both arms on every row. **Any oracle regression in this run is a
stop-the-analysis finding, not a footnote.**

## 8. Files

| File | Role |
|---|---|
| `README.md` | this file — pre-registration (§3, frozen) + procedure |
| `harness/setup-stage-c-worktrees.sh` | creates the 7 detached worktrees on `d27600f` and stages the toolkit under test into governed arms only |
| `harness/stage-c-arms.workflow.js` | the 7-arm workflow (3 governed/plain pairs + the FRAME-only ratchet seed), sequential |
| `results.md` | scorecard: cost, cost attribution, classification fidelity, findings |
| `evidence/` | archived `classification-state.json`, `decision-events.md`, records, byte inventories per arm |

---

## 8b. EXTENDED TIER — the light-eligible band (added 2026-08-03, after the core row)

The core tier measured C's **expensive end**: the frozen-3 are posture-crossing by construction,
so every arm fired M1+M2 and owed a delta spec, an ADR and a verify phase. This tier measures
C's **cheap end** — the band where C-10's saving is maximal, because a zero-trigger change owes
**no OpenSpec artifacts at all**, no ADR and no verify phase. It is the direct test of the "start
small" promise, and it is a **separate dated RUNKIT row** (brief §5).

Tasks: the three light-eligible statements from
[`ea-x2-stage-a-light/tasks/`](../2026-07-ea-v2/ea-x2-stage-a-light/tasks/) — `task-count`,
`filter-tasks-by-status`, `enforce-title-max-length`. Held-out oracles:
`ea-x2-stage-a-light/oracles/{Count,StatusFilter,TitleLength}OracleTests.cs` (5/6/5 = 16 facts).

| Arm | Kind | Task | Staged? |
|---|---|---|---|
| `B1-armA` / `B1-armB` | governed (no preset flag) / plain | `task-count` | yes / **no** |
| `B2-armA` / `B2-armB` | governed / plain | `filter-tasks-by-status` | yes / **no** |
| `B3-armA` / `B3-armB` | governed / plain | `enforce-title-max-length` | yes / **no** |

**Plain-arm prompt byte-identical to the Stage-A/Stage-B Cost-B runs** (the rows this tier is
compared against), i.e. the `stage-b-arms.workflow.js` variant — not the frozen `ea-x2` variant
the core tier used. Comparison rows: **Stage-A Cost-B 3.47× / 3.65×**, **Stage-B Cost-B
2.93× / 3.38×** (both valve-live, both stayed light, oracle 16/16 both arms).

### 8b.1 PRE-REGISTRATION — frozen 2026-08-03, before any extended-tier arm launched

Sources: corpus rows **SC-04 light-count**, **SC-05 light-statusfilter**, **SC-06 light-titlelen**
([corpus README §4](../2026-08-stage-c-classifier/README.md)). Same discipline as §3: **never
edited to match results.** Vector order: `stops · evidence.targeted · evidence.breadth · review ·
verify · openspec · adr`.

#### B1 — `task-count` (corpus row SC-04) — the additive-M3 seed, NOT zero-trigger

| Checkpoint | Expected newly-fired | Family · surface | Dims after | openspec | new stops |
|---|---|---|---|---|---|
| K1 | **none** — adjudication runs and must **DECLINE** | — | `1·0·0·0·0·0·0` | **0** | 0 |
| K2 | none expected (fold ⇒ 1 decision entry, below M4's threshold) | — | unchanged | 0 | 0 |
| K3 | **M3** by scan, non-breaking | materiality · **contract-dependency** | `1·0·0·0·1·1·1` | **1** (delta) | **0** (additive ⇒ no stop) |
| K4 | none (self-review expected clean) | — | unchanged | 1 | 0 |

Anti-expectation (registered): **M1 must NOT fire** — a read-only aggregate at the endpoint
boundary is inside the boundary posture. This is corpus observation **O-3**, the additive-M3
policy: any NEW public route owes a delta spec + a ledger ADR entry and nothing else. Under the
pre-C model this task carried the **full** OpenSpec set on the light path, so delta-only is still
a strict reduction — but B1 is **not** a zero-trigger change, and I am registering that now so it
cannot be re-read later as one.

#### B2 — `filter-tasks-by-status` (corpus row SC-05) — the true zero-trigger case

| Checkpoint | Expected newly-fired | Dims after | openspec | new stops |
|---|---|---|---|---|
| K1 | **none** | `1·0·0·0·0·0·0` | **0** | 0 |
| K2 | none | unchanged | 0 | 0 |
| K3 | **none** | `1·0·0·0·0·0·0` | **0** | 0 |
| K4 | none | unchanged | 0 | 0 |

Two hard anti-expectations: **M1 must NOT fire** — the posture explicitly names `?status=`
filtering as the known extension point, so an adjudication raise here is a **hard over-detection
failure**. **M3 must NOT fire** — the `MapGet("/tasks"` route line is *modified* (a parameter
added), not added or removed, so the route-marker delta is zero. This is the route-delta rule's
precision test.

#### B3 — `enforce-title-max-length` (corpus row SC-06) — zero-trigger, with a registered blind spot

| Checkpoint | Expected newly-fired | Dims after | openspec | new stops |
|---|---|---|---|---|
| K1 | **none** | `1·0·0·0·0·0·0` | **0** | 0 |
| K2 | none | unchanged | 0 | 0 |
| K3 | **none** | `1·0·0·0·0·0·0` | **0** | 0 |
| K4 | none | unchanged | 0 | 0 |

**Known blind spot, registered as corpus observation O-4 and NOT changed for this run:** tightening
the title limit is arguably a breaking contract change for existing clients (a previously-accepted
250-char title now 400s), and neither the route-delta scan nor the pre-registered adjudication
expectation flags it. Pre-registered NO-FIRE per the measured stay-light calibration. **If an arm
fires something here, it is scored as an over-detection against the frozen row** — and separately
reported as evidence that O-4 deserves the creator's attention. Flipping the row requires a dated
changelog entry, never a silent edit.

### 8b.2 What this tier is actually testing

1. **C-10 at its maximum.** B2 and B3 should produce **zero OpenSpec artifacts** — the first time
   any measured run of this program authors none. B1 should produce exactly one delta spec.
2. **"Start small" as a measurable claim.** Expected obligations on B2/B3: one folded approval
   stop, a contract in `change.md`, records, ledger — no spec, no ADR, no verify phase, no review.
3. **The cost floor of Stage C.** Whatever B2/B3 cost *is* the price of the governance base plus
   the classifier, with every trigger-bought obligation removed. Against Stage-B Cost-B
   (2.93×/3.38×) this isolates what C's classifier overhead adds when it buys nothing.

### 8b.3 Cost prediction (directional; registered so it cannot be retrofitted)

- **Predicted:** B2/B3 land **below** the Stage-B Cost-B row (3.38× tok) — dropping the full
  OpenSpec set, the ADR and the verify phase should more than pay for ~20 classifier invocations.
  B1, carrying a delta spec + ADR entry, should land at or slightly above it.
- **Falsification is informative either way.** If even the zero-trigger band cannot beat 3.38×,
  then the classifier overhead exceeds the ceremony it removes, and progressive rigor has no cheap
  end to defend — which would be the fourth failed cost hypothesis in this program.

## 9. Procedure log

- **2026-08-03** — brief + reading order read in full; kit created; **§3 pre-registration frozen
  before any worktree was staged or any arm launched**.
- **2026-08-03** — 7 worktrees created on `d27600f`, governed arms staged, sanity checks all OK
  (frozen posture intact: auth still in Non-goals; plain arms unstaged, no path-class map).
  Classifier wiring smoke-tested from a governed worktree with a throwaway state file before
  launch — M2 fired by scan on `auth`, matching SC-01.
- **2026-08-03** — CORE tier run: workflow `wf_c028449b-6bc`, 7 arms sequential, **0 errors**,
  58 min, 743k subagent tokens.
- **2026-08-03** — scored with the fixed `score-arm.sh`: **oracle 19/19 clean both arms**,
  arm-own suites green. Evidence archived to `evidence/` **before** worktree cleanup.
- **2026-08-03** — classification **independently replayed** from the archived checkpoint payloads
  against a fresh state; every arm's reported verdict reproduced exactly.
- **2026-08-03** — cost attribution computed. One correction applied to the instrument itself
  (not to any expectation): `git diff`-redirected numstat/patch scratch was initially charged to
  the classifier row; it is shell output costing the agent zero tokens, so `attribute-arm.py` now
  splits authored payloads from generated diffs. ADR bytes were then added, since `adr 2` fired on
  all three cost arms. Both fixes are in the committed script.
- **2026-08-03** — [`results.md`](results.md) written; dated row appended to `RUNKIT.md`
  (append-only, existing rows untouched). Worktrees removed, `git worktree prune` run.
  **No C-10 / C-11 / Stage-B decision is made in this kit — that is step 6, with the creator.**
- **2026-08-03 (extended tier, same day)** — creator asked for the light path. §8b
  pre-registration frozen **before** the 6 worktrees were staged or any arm launched. Setup and
  archive scripts generalized to `core|extended` so **both tiers share one staging
  implementation** (different toolkits would make the two cost rows incomparable). Governed
  prompt + ARM_SCHEMA lifted **verbatim** from the core-tier workflow and diff-verified identical;
  plain prompt lifted **verbatim** from `stage-b-arms.workflow.js` (the Cost-B variant), since the
  comparison rows are Cost-B, not the frozen-3.
- **2026-08-03** — extended run: workflow `wf_00892957-c5f`, 6 arms sequential, **0 errors**,
  40 min, 555k subagent tokens. Oracle **16/16 clean both arms**. Evidence archived, classification
  replayed independently, attribution computed.
- **2026-08-03** — one **over-detection** found (B3/K3/X1) and diagnosed by re-running that
  checkpoint against a code-only numstat, which fires nothing and matches the frozen row exactly.
  Scored as a miss against the row regardless; **corpus untouched**. Second dated RUNKIT row
  appended. Worktrees removed and pruned.
