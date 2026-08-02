# Stage-C step 5 — the frozen-kit re-run: results

> Run 2026-08-03, model `claude-opus-5[1m]`, workflow `wf_c028449b-6bc` (7 arms, sequential,
> **0 errors**, 58 min, 743k subagent tokens). Method + **frozen pre-registration**: [`README.md`](README.md).
> Toolkit meta-work — no CHAOS governance on the measurement; CHAOS ran only inside the governed
> arms, which are the measured subject. Base commit `d27600f` for all 7 worktrees.
>
> **Caveats that apply to every table below:** tokens are an **output-only proxy**
> (`budget.spent()` deltas; no input tokens — IL-PF10). Time is **arm-self-reported** (`date +%s`).
> **Compare ratios, not absolutes, across model rows** — this row is Opus 5; the 2026-07-19 and
> 2026-07-24 rows are Opus 4.8. Same-model both arms; pinned contracts; one agent stands in for
> the human-led loop. This kit measures the **cost of producing the traceability**, not governance
> **value** (that is EA-X2b / EA-D3).

## Headline

**Three results, and they do not point the same way.**

1. **The cost hypothesis is falsified for the third time.** Stage C on the frozen-3 costs
   **4.86× time / 5.46× tokens** against its own plain arm — worse than Stage-A light
   (3.35×/3.47×) and Stage-B light (3.79×/4.15×), and only marginally better than Stage-B
   standard (5.68×/5.87×). My pre-registered prediction (§3.3: "between 3.47× and 4.15×") is
   **wrong, and reported as found**.
2. **Classification fidelity in the wild is perfect.** Against the frozen §3.1 expectations, over
   4 arms × 4 checkpoints: **zero under-detection, zero over-detection, dimension vectors exact,
   confidence trajectory exact.** The classifier's first blind test passes cleanly, and an
   independent replay from the archived payloads reproduces every verdict.
3. **The C-10 OpenSpec lever is real but small.** It fired the *good* way — all three frozen tasks
   landed on `openspec 1` (a single delta spec, not the full set), beating my registered primary
   expectation. But OpenSpec is only **8.3% of authored governance / 1.4% of governed output**.
   Even driving it to zero saves ~1.4%. **The lever was measured, and it is not where the cost is.**

The cost is in **records**: 54.9% of authored governance, and — reproducing Stage-B's own finding
almost exactly — the agents authored **59.5 KB of JSON to render 47.0 KB of markdown (ratio 0.79;
Stage-B standard measured 0.78)**.

## 1. Cost — frozen 3 tasks, governed (no preset flag, zero floors) vs plain

| Pair | task | Stage-C time | plain time | time ratio | Stage-C out-tok | plain out-tok | tok ratio | oracle (both arms) |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 675 s | 129 s | 5.23× | 49,803 | 8,350 | 5.96× | 9/9 clean |
| 2 | soft-delete | 836 s | 229 s | 3.65× | 54,233 | 10,630 | 5.10× | 5/5 clean |
| 3 | concurrency | 822 s | 122 s | 6.74× | 53,552 | 9,877 | 5.42× | 5/5 clean |
| **Σ** | | **2,333 s** | **480 s** | **4.86×** | **157,588** | **28,857** | **5.46×** | **19/19 both** |

Arm-own suites green everywhere (governed 16/10/11, plain 11/9/10; all 0 failed, builds clean).

**Read against the comparison ledger.** The plain arm is stable across the three Opus-5 rows
(480 s / 28,857 tok here; 428–439 s / 28,031–28,867 tok on both Stage-B rows), so the ratio
comparison to Stage B is sound.

| Row | date · model | time × | tok × | governed absolute |
|---|---|---:|---:|---|
| Frozen baseline (standard) | 07-19 · Opus 4.8 | 3.94× | 4.75× | 2,149 s / 185,376 |
| Stage-A `--light` | 07-24 · Opus 4.8 | 3.35× | 3.47× | 895 s / 78,310 |
| Stage-B light | 08-02 · Opus 5 | 3.79× | 4.15× | 1,620 s / 116,370 |
| Stage-B standard | 08-02 · Opus 5 | 5.68× | 5.87× | 2,495 s / 169,586 |
| **Stage-C (this row)** | **08-03 · Opus 5** | **4.86×** | **5.46×** | **2,333 s / 157,588** |

Against **Stage-B standard** the governed arm is −6.5% time / −7.1% tokens — a real but modest
improvement over the heaviest path. Against **Stage-B light** it is **+44% time / +35% tokens**.
Against the **frozen plain** baseline (546 s / 38,996 tok) Stage C is 4.27× time / 4.04× tokens.

**Why Stage C lands near the standard path rather than the light one, mechanically:** with zero
preset floors, the triggers alone raised `verify 1` and `adr 2` on all three tasks. `verify 1`
means the arm ran a verify phase (record + render + independent build/test re-run); `adr 2` means
a blocking ADR was authored. So the "collapsed base" grew a fourth phase and a fifth artifact by
classification, not by flag — which is the design working as specified, and is also most of the
delta versus Stage-B light. Stage C did not add ceremony arbitrarily; it added exactly the
ceremony its own triggers demanded, and that ceremony is expensive.

## 2. Classification fidelity in the wild — both error directions

**This is the classifier's first blind test** (the corpus was the calibration set — corpus
observation O-8). Scored against [`README.md`](README.md) §3.1, frozen before launch and not
edited since. Verdicts cited from each arm's `classification-state.json` and confirmed by an
**independent replay** of the archived checkpoint payloads from a fresh state
(`evidence/*/tmp-payloads/`).

| Arm | K | Expected (pre-registered) | Observed | Under-detect | Over-detect |
|---|---|---|---|---|---|
| P1 auth | K1 | M1 adj + M2 scan, surface `auth`; `1·1·0·0·1·1·2`; 0 new stops; MEDIUM | **identical** | 0 | 0 |
| P1 | K2 | M4 *iff* ≥2 decision entries (see §2.1) | nothing fired (1 entry) | 0 | 0 |
| P1 | K3 | no new firings; `scanEcho [M2]` | **identical**; HIGH | 0 | 0 |
| P1 | K4 | no X2 (self-review clean) | nothing fired | 0 | 0 |
| P2 soft-delete | K1 | M2 scan + M1 adj, surface `data-store`; `1·1·0·0·1·1·2`; 0 stops; MEDIUM | **identical** | 0 | 0 |
| P2 | K2/K3/K4 | nothing / `scanEcho [M2]` / no X2 | **identical** | 0 | 0 |
| P3 concurrency | K1 | M2 scan + M1 adj, surface `data-store`; `1·1·0·0·1·1·2`; 0 stops; MEDIUM | **identical** | 0 | 0 |
| P3 | K2/K3/K4 | nothing / `scanEcho [M2]` / no X2 | **identical** | 0 | 0 |
| V1 ratchet seed | K1 | M1 adj + M2 adj, surface `auth`; `1·1·0·0·1·1·2`; 0 stops; MEDIUM | M1 **adj** + M2 **scan**, else identical | 0 | 0 |

**Aggregate: 0 under-detections, 0 over-detections, 13/13 checkpoint verdicts exact.**

Must-not-fire assertions all held: **M3** never fired (no route delta on any task), **X1** never
fired (see §2.2), **M5** never fired (predicted scope listed the planned new paths, as the corpus
changelog's input enrichment requires), **X2** never fired (all self-reviews clean).

Two graded notes, neither an error:

- **V1's M2 fired by `scan`, not `adjudication`** as SC-07 registers. Cause: the arm's predicted
  scope named the planned new file `src/TaskTracker.Api/Security/ApiKeyAuthMiddleware.cs`, so the
  auth path-class matched deterministically. This is the *same* correction the corpus already made
  for SC-01 on 2026-08-02 ("the `Security/ (new)` scope enrichment made the K1 scan legitimately
  sighted"). Same trigger, same surface, same dimensions — a stronger detection route, not a miss.
  **No corpus edit is made on the strength of this run.**
- **Stops:** every arm placed exactly one stop (`K1:floor-approval`), and `newStops` was 0 at every
  checkpoint on every arm — property **P6** (N materiality triggers at one checkpoint ⇒ 0 new stops
  at K1, folding into the floor stop) holds in the wild, not just on fixtures.

### 2.1 The M4 conditional resolved to the fallback branch — and the reason is structural

I registered (§3.2) that M4 would **probably fire** on all three tasks, taking `openspec` to 2 and
nulling the C-10 lever. **It did not fire on any of them**, because each arm recorded exactly
**one** ledger decision entry — below M4's threshold of 2.

That is not luck, and it is not the arms being lazy. It is **§5.3 law 2 (stop folding) colliding
with M4's detector**. The fold law says N materiality triggers firing at one checkpoint produce
*one* stop carrying N named questions; the propose wiring implements that as "K1-fired materiality
folds its named questions into the approval decision's presentation". So P1's single
`PROP-DEC-001` carries three folded questions; P2's carries three; P3's carries two. M4 counts
`## <PREFIX>-DEC-<nnn>` **headings**, so a fold of N questions reads as 1.

**Consequence, stated plainly: under the current wiring, M4 is structurally unable to fire from
K1-folded materiality — no matter how many material questions the change raises.** It can only
fire from decisions recorded across *different* checkpoints or from genuinely separate entries.
The V1 seed is the control: it recorded **4** entries (it surfaced them separately rather than
folding all four) and would have fired M4 at K2 — but it stops at FRAME, so K2 never ran.

This is a real design finding for step 6, and it cuts both ways: it is what *delivered* the C-10
lever on this kit (openspec 1 instead of 2), and it is a hole in the decision-density safety net.
The corpus never saw it because SC-01/02/03 were registered at K1+K3 only, with no ledger.

### 2.2 The registered X1 instrumentation hazard is real, and it decided a trigger

Registered in advance (§3.4). Outcome: **X1 did not fire — because all three arms scoped the K3
numstat to code.** They did not agree on *how*, and each independently measured and reported the
counterfactual:

| Arm | K3 numstat scope actually fed | Files | Counterfactual if governance included |
|---|---|---:|---|
| P1 | `src` + `tests` only | 3 | ~13 files ⇒ **X1 would have fired** (threshold 8) |
| P2 | `src` + `tests` + `openspec/` + `docs/adr/` | 6 | 12 files / 659 LOC ⇒ **X1 would have fired** (both thresholds) |
| P3 | `src` + `tests` only | 5 | 12 files ⇒ **X1 would have fired** |

Three arms, three different readings of "the actual diff", and in all three the choice is the
difference between a mechanical trigger firing and not firing. P3 additionally noted that an
unscoped `git diff` in these worktrees reports **85 files**, because the staged toolkit under test
is uncommitted working-tree content — it would have measured the frozen kit itself.

**Finding: "does a change's own governance output count toward its blast radius?" is undefined in
the design, and the answer flips X1 on every change in this band.** Not patched here. It is a
calibration question for step 6, and the honest reading of this run is that X1's clean sheet in
§2 rests on an instrumentation choice, not on a settled rule.

## 3. Cost attribution — the split that decides Stage-B's fate (brief §8.2)

Bytes-on-disk proxy over the 3 governed cost arms, exactly as the Stage-A/B rows measured it
(bytes ÷ 4 ≈ tokens). "Authored" = what the **agent** writes; rendered artifacts cost the agent
nothing. Per-arm JSON in [`evidence/*/attribution.json`](evidence/).

| Cost center | bytes | share of authored | ~tok-proxy |
|---|---:|---:|---:|
| **JSON records authored** | **59,454** | **54.9%** | 14,863 |
| classifier state + checkpoint payloads | 19,812 | 18.3% | 4,953 |
| ADRs (the `adr 2` obligation) | 10,108 | 9.3% | 2,527 |
| **OpenSpec delta specs** | **9,015** | **8.3%** | 2,253 |
| ledger — decision entries | 6,594 | 6.1% | 1,648 |
| ledger — `TRG-*` trigger events | 3,259 | 3.0% | 814 |
| **Authored governance total** | **108,242** | **100%** | **27,060** |
| *rendered markdown (renderer output — free)* | *46,967* | — | — |
| *implementation (added source/test bytes)* | *22,989* | — | — |

Authored governance ≈ **17.2%** of governed output tokens (Stage-A light: 4.7%; Stage-B light:
12.5%; Stage-B standard: 23.9%).

Two measurement honesty notes:

- `git diff`-redirected numstat/patch scratch (11–20 KB per arm) is **excluded** from the
  classifier row — shell redirection costs the agent no tokens. Charging it would have inflated
  Stage-C's overhead ~5×.
- The classifier row captures **artifacts only**. The **adjudication reasoning** (2 passes per
  cost arm, K1 and K3, per C-12) leaves nothing on disk and is **not** in this proxy. At the
  design's stated bound of 1–2k tokens per pass that is a further ~2–4k tokens per arm, i.e. the
  true classifier overhead is plausibly ~7–11% of an arm's output rather than the 3.1% the bytes
  alone suggest.

### 3.1 The Stage-B number

> **Agents authored 59,454 bytes of JSON records to render 46,967 bytes of markdown — a ratio of
> 0.79. Stage-B standard measured 100 KB → 78 KB = 0.78 on 2026-08-02.**

The finding reproduces to within 1% on a different lifecycle shape, a different rigor mechanism,
and a different artifact set. Records are the **single largest authored cost center at 54.9%**,
larger than OpenSpec, ADRs, ledger and classifier combined. Stage-B's own verdict — *"the input to
the projection is no cheaper than the prose it replaced"* — is now measured twice, independently.

C is not welded to B: the classifier consumed **zero** `records/*.json` (its inputs were ledger +
git + frontmatter + the path-class map throughout, confirmed in every archived payload), so all
three B options remain mechanically available. **This run supplies the attribution the B decision
was waiting on; the decision itself is step 6, with the creator.**

### 3.2 The C-10 lever, priced

All three tasks landed on `openspec 1` and wrote **exactly one delta spec each** — no proposal.md,
tasks.md or design.md anywhere (verified by `find` over each `openspec/changes/<id>/`). Against
the full set the prior rows authored (~9.3 KB/arm on Stage-B standard, 4.9–8.8 KB/change on
Stage-A light), C's delta-only depth costs **2.1–4.1 KB/arm**.

So the lever **works and is measurable — and it is worth ~1.4% of governed output.** Driving
zero-trigger changes to `openspec 0` (the extended tier, not run here) would save more in
proportion, since those changes have no other obligations either; but on the *materiality* band
this kit measures, C-10 is not a cost lever. **C-10's pending-measurement condition is now
satisfied with data, and the data says the lever is small.**

## 4. Mechanical claims — what held

| Claim | Evidence |
|---|---|
| Classifier ran end-to-end in a real lifecycle | 20 invocations across 4 arms, **0 failures**, 0 malformed payloads |
| Adjudication is raise-only with citations | 7 passes, 4 raises, **every raise carries an input citation**; no suppression, no mechanical-trigger touch, no dimension lowered |
| Monotone ratchet holds | dimensions never decreased at any checkpoint on any arm (replay-confirmed) |
| Stop folding (P6) holds in the wild | `newStops` = 0 at every checkpoint on every arm; exactly one `K1:floor-approval` stop placed |
| `TRG-*` events do not inflate decision counts | 2 TRG events per arm; V1's renderer counted 4 decisions, matching its 4 `PROP-DEC-*` entries |
| No legacy escalation leaked | **0** `ESC-*` entries, 0 non-null `escalatedFrom`, 0 "⚠ escalated" lines across all 4 arms |
| Writer discipline (Stage-B) | `handWroteRenderedArtifact = false` on 4/4 arms; strict artifact set honored, **0 stray artifacts**, 0 retired report files |
| Renders idempotent | 13 render invocations, **0 failures**; `--check` **CLEAN on 4/4** arms after the fact |
| No quality regression | oracle **19/19 both arms**, unregressed against every prior row |

## 5. Defects and findings this run surfaced

1. **M4 cannot fire from K1-folded materiality** (§2.1). Structural interaction between §5.3 law 2
   and M4's heading-count detector. Decides whether the OpenSpec lever exists on this whole band.
2. **Blast-radius scope is undefined** (§2.2): whether a change's own governance output counts
   toward X1. Three arms chose differently; all three counterfactuals fire X1. Uncalibrated.
3. **The OpenSpec CLI is incompatible with trigger-gated depth.** P3 ran
   `openspec status --change … --json`, which returned `isComplete: false` because the CLI measures
   the **full** artifact set and has no notion of a classified depth. The arm then edited two
   already-written pass records in place to keep the rendered claim truthful — a disclosed
   deviation from record-emission's never-rewrite-a-pass rule, chosen over shipping an inaccurate
   artifact. **C-10 needs a CLI story, or `openspec 1` will keep reporting itself incomplete.**
4. **`lifecycle.md`'s light projection is lossy under Stage C.** Reported independently by P1 and
   P2: the rendered `lifecycle.md` shows only Frame and Deliver rows and omits `archiveReadiness`,
   because the record envelope carries `mode: "light"` — even though verify genuinely ran
   (`verify 1`) and `change.md` renders it correctly. Under C, "light" is only floor provenance, so
   keying a projection off it is now wrong.
5. **The whole non-zero half of the vector rests on one semantic call.** All four arms flagged it
   independently: the M1 raise at K1 is what took `openspec` 0→1 and `adr` 0→2. Decline it and
   every frozen task becomes a near-zero-ceremony run. The M1 detector is a single point of
   sensitivity for both C's cost and its value — and the posture text it reads is itself hedged
   (`[UNKNOWN] for future intent` alongside an explicit Non-goal clause), which the arms had to
   thread through pinned rules 3/8/13.
6. **M3's definition excludes behaviourally-breaking changes.** Three arms independently declined
   M3 on changes that break every existing client (an auth cutover; added required semantics),
   because pinned rules 7/9/12 confine breaking to removed/renamed routes, removed schema fields
   and major dependency bumps. Fidelity-correct against the frozen rows (which register NO-FIRE),
   but the arms are right that it is a gap worth a decision — and it is *load-bearing*: firing M3
   would add a **distinct** surface class and push `openspec` to 2 under C-13.
7. **`escalatedFrom: null` appears in rendered frontmatter** on every change as renderer template
   boilerplate. Not authored by any arm and not a leak — but it is dead pre-C vocabulary in a
   rendered artifact.

## 6. Read against the ledger, and what this run does NOT decide

Three stages have now been measured on the same frozen kit. **No stage has reduced the governed
cost ratio below Stage A's**, and two — B and now C — moved it up:

- Stage A won by deleting prose (45.5% → 4.7%) and cut governed cost −58%.
- Stage B replaced that prose with more-verbose records and cost more, on both paths.
- Stage C spends where its triggers point. Fidelity is excellent and the ceremony is *targeted* —
  one folded stop, one delta spec, one ADR, no full OpenSpec set, no standalone review — yet the
  bill is **4.86×/5.46×**, because targeted ceremony on a materiality-crossing change is still a
  verify phase, an ADR, a delta spec, and 20 classifier invocations.

The uncomfortable synthesis this evidence supports: **on this band the dominant cost is not the
artifact model at all** — it is records (54.9%) plus the obligations materiality legitimately
buys. The frozen-3 are *all* posture-crossing by construction, so this kit measures C's expensive
end. C's cheap end (zero-trigger changes ⇒ `openspec 0`, no ADR, no verify phase) is the
**extended tier, which was not run** — and that is where C-10 and the "start small" promise would
actually be priced. Reading this row as "C is expensive" without that caveat would overstate it in
the same direction the last two hypotheses failed.

**Not decided here, by instruction (brief §9 — step 6, with the creator):** C-10's fate, C-11's
floor stop, Stage-B's adopt/revert, and the preset floor vectors. This run's deliverable is the
evidence, honestly scored.

## 7. Evidence index

| Path | Contents |
|---|---|
| `evidence/<arm>/classification-state.json` | the classifier's own machine state — primary fidelity citation |
| `evidence/<arm>/decision-events.md` | ledger: `PROP-DEC-*` entries + `TRG-*` trigger events |
| `evidence/<arm>/tmp-payloads/` | **exactly what was fed to each checkpoint** (payloads, raises, numstat, patch) |
| `evidence/<arm>/attribution.json` | per-arm byte attribution |
| `evidence/<arm>/{change.md,lifecycle.md,records/,openspec/}` | artifacts as produced |
| `evidence/<arm>/implementation.diff`, `full-worktree.numstat` | the code delta, and the unscoped numstat for §2.2 |
| `harness/` | setup script, arms workflow, attribution script, archive script |
