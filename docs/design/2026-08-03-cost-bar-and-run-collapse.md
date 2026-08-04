# The graduated cost bar, and Stage D — the collapse

> Toolkit meta-work (no CHAOS governance). Written 2026-08-03, **after** the step-5 core + extended
> rows ([`.chaos/validation/2026-08-stage-c-step5-rerun/`](../../.chaos/validation/2026-08-stage-c-step5-rerun/),
> commits `d9d6575` + `59e0bc7`) and **before** any arm of the run it pre-registers.
> Creator decisions of 2026-08-03 are recorded in §1 and §2; the Stage-D design in §4–§6 is the
> assistant's, pre-registered so it cannot be retrofitted.
>
> **A version is a stage.** This document is the design of record for **Stage D**, continuing the
> A → B → C sequence in [`2026-07-24-artifact-model-roadmap.md`](2026-07-24-artifact-model-roadmap.md).
> Like its predecessors, D is **built, then measured against the frozen kit, then trimmed with the
> creator** — it is not a side experiment. It builds on **C.1** (`297794c`), the patch that
> repaired the five defects step 5 surfaced.
>
> Its companion validation, **EA-D3** (the real-human value trial), is deliberately *not* a stage:
> it measures the product without changing it, and sits beside EA-X2 / EA-X2b / EA-X4. It is not
> blocked by D — the stop it tests is identical in C.1 and D — which is why the two run in
> parallel.

## 1. The denominator — locked (creator, 2026-08-03)

**Ratios are measured against the within-session plain arm, on output tokens, same model.**

This is the hardest available denominator and it is locked *before* optimizing, deliberately. It
has already bitten this program once: Stage A reported **1.64× / 2.01×** against the frozen plain
baseline and **3.35× / 3.47×** against its own session's plain arm — same run, and the choice of
denominator flipped it from "target met" to "target missed."

Consequences of the lock:

- **Tokens are the gate.** Time is reported alongside (arm-self-reported `date +%s`) but does not
  pass or fail a run — it is too noisy at n=3.
- **Plain arms are re-run in every session**, never borrowed from a prior row, even though the
  Opus-5 plain arm has proven stable (frozen-3: 28,031 / 28,867 / 28,857 tok across three sessions;
  light trio: 19,421).
- Cross-model rows stay comparable **as ratios only** — the standing RUNKIT invariant, unchanged.
- Tokens remain an **output-only proxy** (no input tokens; IL-PF10). The bar is therefore a bar on
  *generated* output, not on total inference cost.

## 2. The bar is graduated, not flat (creator, 2026-08-03)

A flat target would quietly abandon progressive rigor's core promise — that a change the system
itself certifies as trivial should cost near-nothing. The bar is therefore banded by **the
classifier's own verdict**, which is the one thing already measured as trustworthy (24/25 exact in
the wild, both error directions).

| Band | Classifier verdict | Owes | **Target (tok, vs within-session plain)** | Measured today |
|---|---|---|---:|---:|
| **A — zero-trigger** | no triggers fired; every dimension at floor | contract in `change.md` + ledger + records; **no OpenSpec, no ADR, no verify phase** | **≤ 2.0×** | **4.60×** (B2) |
| **B — single-surface materiality** | ≥1 materiality trigger, one surface class | + delta spec, ≤1 ADR, verify checks | **≤ 3.0×** | **5.46×** (frozen-3 Σ) · 6.77× (B1) |
| **C — multi-surface / breaking** | ≥2 distinct surfaces, or breaking (C-13) | full OpenSpec set, blocking ADR, full verify | **≤ 4.0×** (provisional) | **never measured** |

Band C is provisional: no arm in the entire program has reached `openspec 2`. Its target is an
extrapolation and must be re-set the first time a real band-C change is measured.

Pass/fail is on the **band aggregate (Σ)**, consistent with how every RUNKIT row is reported.

## 3. What the bar actually demands — it is not an artifact problem

The step-5 attribution is unambiguous: **traceability is affordable and the process is not.**

| | core tier (band B) | B2 (band A) |
|---|---:|---:|
| plain arm output | 28,857 | 7,384 |
| governed output | 157,588 (5.46×) | 33,935 (4.60×) |
| authored governance *incl.* classifier | 27,061 (0.94× plain) | 3,865 (0.52× plain) |
| — of which traceability (records · rendered · OpenSpec · ADR · ledger) | 22,108 | 2,748 |
| — of which classifier + adjudication | 4,953 | 1,117 |
| **non-artifact output** (doing the work + process) | **130,527 = 4.52× plain** | **30,070 = 4.07× plain** |

`change.md` and `lifecycle.md` are renderer output and cost the authoring agent **nothing**
(27 render invocations across both tiers, 0 failures, `--check` clean, 0 hand-written artifacts).

### The single number the bar reduces to

> **Today a governed arm generates ~4–4.5× as much output as a plain arm *before writing a single
> artifact*. The bar requires that to fall to ~1.5–2×.**

| Band | non-artifact output now | budget at target | required cut |
|---|---:|---:|---:|
| A (≤2.0×) | 4.07× plain | 1.48× plain | **−64%** |
| B (≤3.0×) | 4.52× plain | 2.06× plain | **−54%** |

Both bands need the same intervention at roughly the same magnitude — **cut non-artifact work
generation by ~55–65%** — which is why one change (collapsing the phase march) plausibly serves
both. **Zero artifact reduction is required to hit either target.** Every artifact the creator
asked to keep — records, `change.md`, `lifecycle.md`, OpenSpec deltas, ADRs, the ledger — fits
inside the budget with room left over.

## 4. Stage D: build the collapse, then measure it

> **Correction (2026-08-03).** An earlier draft of this section claimed that "A, B and C were each
> measured as a prompted lifecycle before any command was built," and concluded that no
> `chaos:run` command should be written before measuring. **That premise was false.** Stage A
> shipped in `eaa1b84` and *then* was measured; Stage B built the renderer and swapped the writer
> in all six skills, then measured; Stage C built `tools/chaos-classify` and wired all six
> commands, then measured. The governed *arms* were prompt-driven only because a detached worktree
> cannot invoke a slash command — every arm read the **real staged `SKILL.md` files**, so the
> toolkit under test was always built first. The prompt is a driver, not a substitute.

**A version is a stage.** D is therefore a **build**, on the same footing as A, B and C: the
collapsed command ships into the skills tree, is staged into the governed worktrees exactly as
step 5 staged Stage C, and the arms exercise it through the real files. Measuring a prompt-only
mock would price a shape nobody can ship.

**Dependency: D builds on C.1, not C.** The five C.1 repairs (`297794c`) are prerequisites, not
optional tidying — three of them would corrupt the bands D measures: the dangling OpenSpec pointer
lands on every band-A arm, the lossy `lifecycle.md` projection on every arm that verifies, and the
OpenSpec completeness misreport already drove one arm to rewrite a completed pass record.

### 4.1 What Stage D builds

> **BUILT 2026-08-03** — corpus seed SC-23 first (`6bfb41e`, absorption pre-registered before
> the code), then continuous-mode classifier + the obligation audit (`bf92510`: repeatable K3,
> `adjudicationDue`/`newSurfacePaths`/`scanSeq`, absorption, `audit.py`; 28+8 unit tests,
> corpus 9/9 both modes over 29 seeds), then the loop itself
> (`.claude/skills/chaos-run/SKILL.md`, `b03a93d`) with the `chaos:verify` role note. The
> measurement (§4.2) has NOT run.

- **One `chaos:run`** replacing the mandatory `propose → review → apply → verify` march.
- **The continuous classification rule — resolved (creator, 2026-08-03).** K1–K4 were never
  phases; they were **evidence births**: intent exists (K1), answered decisions exist (K2), the
  diff exists and grows (K3), the review verdict exists (K4). The rule: **the classifier runs
  whenever evidence is born or grows — not when a phase boundary is crossed.** Model adjudication
  still runs only on new *semantic* input (intent; previously un-adjudicated diff surface) —
  C-12 carries over unchanged, as do raise-only, P1 (mechanical never stops) and P4 (monotone
  dimensions).
- **The obligation audit becomes a deterministic in-loop assertion** over
  `classification-state.json` (adr owed ⇒ exists; openspec depth owed ⇒ matches; verify owed ⇒
  record exists; every stop answered and consumed; dimensions never decreased). A checklist, not
  a model pass, so ~free.
- **Verification stays in the loop; only the *command* becomes the opt-in.** The rigor vector
  drives verification exactly as in C (`verify→1/2` fired by M2/M3/X1/X2/X3): when owed, the loop
  runs the pass internally before close, and the obligation audit asserts the record exists.
  `chaos:verify` survives as the human's *extra* pass over an already-verified change. (An earlier
  draft called this a semantics change — overstated: verification semantics are unchanged; only
  the invocation surface moves.)
- **Unchanged:** `init`, `status`, `todo`, `doctor`, `code-review`, `sync`, `archive`, `help` —
  none of them were ever in the delivery loop, so none of them carry per-change cost.
- **Unchanged:** the artifact set — records, `change.md`, `lifecycle.md`, OpenSpec deltas, ADRs,
  the ledger. §3 shows they are affordable; they are not what D is cutting.

#### The loop (blessed with two amendments, creator, 2026-08-03)

0. **Open** — `begin_command`, change skeleton, intent captured verbatim.
1. **Classify at intent** (K1-equivalent) — deterministic scan over intent + predicted scope,
   one adjudication pass → the initial rigor vector; OpenSpec artifacts owed by this
   classification are authored *here* (timing rule below); then **S1**.
2. **Work loop**, per task-sized unit — do the unit; deterministic re-scan of the grown diff
   (C-15 scope); adjudication only on previously un-adjudicated surface; **S2** if a
   stop-carrying trigger fired (folded per scan); **S3** whenever the agent hits a discordance
   (decision via the runtime, `folds: n`); each answered decision re-runs the M4 density scan
   (scan-only).
3. **Self-review** (mechanical) — X2 raises review→2 · verify→1; never stops (P1).
4. **In-loop verify** — if the vector owes verify ≥1, run the pass now; a failing verify
   re-enters the work loop with the failure as new evidence.
5. **Obligation audit** — the deterministic gate above; failure names the owed artifact and
   blocks close. A gate, not a stop.
6. **Close** — render `change.md`/`lifecycle.md`, `complete_command`. **S4** only under preset
   floor ≥2.

**Stop points:**

| Stop | When | Fires |
|---|---|---|
| **S1** frame approval | after classify-at-intent | **always** — the C-11 floor; the run's one unconditional stop |
| **S2** materiality | any work-loop scan | conditional; folds per scan |
| **S3** discordance | agent hits ambiguity/contradiction | agent-judged; carries `folds: n` |
| **S4** verify sign-off | at close | only under preset floor ≥2 (`--standard`/`--strict`) |

Two rules make the stops safe, and both are named build requirements:

- **Pending-stop absorption.** Continuous scanning produces more scan events than four
  checkpoints; without absorption D would *un-fold* stops and interrupt more often than step 5
  measured. Rule: while a stop is pending unanswered, new firings attach to it (amend) rather
  than creating another. Generalizes Stage C's HIGH-severity attach rule.
- **Capsule at stop creation.** Every stop writes its resume capsule when created — loop cursor:
  work-unit index, pending stop id, classification-state hash. Auto-continuation is a harness
  convenience, never a guarantee (EA-X4 measured 60% pre-hardening; 100% only after EA-V3,
  `647a472`). `chaos:resume` therefore survives the collapse and gets *simpler*: it trusts the
  capsule for **position only** and re-derives obligations from `classification-state.json` on
  disk.

**OpenSpec authoring timing (creator amendment, 2026-08-03).** The artifact is authored **when
its obligation fires, always before the surface it governs is implemented further**. Fired at
intent-classify → authored before S1, approved together with the frame in one stop. Raised
mid-loop (a scan on the actual diff fires M3/M1 on an unpredicted surface) → authored at that
scan, attached to the folded stop; work on that surface pauses until approved. **Never at
close** — a spec authored at the audit would document, not govern; the audit asserts existence
and depth, it never authors. Post-authoring drift is the in-loop verify's contract check to
catch, not the audit's.

### 4.2 What Stage D measures

**Held constant** (so the only variable is the collapse):

- base `d27600f`; same worktree staging as step 5 (both tiers already share one implementation);
- **plain-arm prompts byte-identical** to the step-5 tiers — frozen `ea-x2` variant for the
  frozen-3, Cost-B variant for the light trio;
- the same classifier (`tools/chaos-classify`), the same pinned adjudication contract, the same
  renderer, the same schemas, the same records, the same held-out oracles;
- the same telemetry schema, so the rows line up with step 5 field-for-field.

**The one variable:** the governed arm invokes the **built** `chaos:run` — one continuous loop
(intent → work → classifier watches → materiality fires → stop, ask, record → resume → records
accrue → render) — instead of the four-command march. Everything else, including the artifact set,
is identical to step 5.

One rule is already shipped rather than restated here: **blast-radius scope excludes `.chaos/**`
and `openspec/**`** (C-15, `325b337`). It is in `chaos-apply/SKILL.md` and the classifier adapter
contract, so D inherits it instead of re-specifying it in a prompt — which is the point of D being
a build.

**Arm plan (12 arms, sequential):**

| Arms | Band | Tasks | Expected classifier verdict |
|---|---|---|---|
| 3 governed + 3 plain | **B** | frozen-3 (auth, soft-delete, concurrency) | M1+M2 same surface ⇒ `openspec 1`, `adr 2` |
| 2 governed + 2 plain | **A** | `filter-tasks-by-status`, `enforce-title-max-length` | zero triggers ⇒ `openspec 0`, no ADR, no verify |
| 1 governed + 1 plain | **B** | `task-count` | M3 additive @K3 ⇒ `openspec 1`, `adr 1` |

Plain arms are re-run rather than borrowed, per the §1 lock.

**Optional riders — proposed, NOT yet approved.** Three calibration gaps could close for the
marginal cost of a few extra arms while the kit is already hot, rather than needing their own run
later: `--standard` / `--strict` arms (the §8 **preset floor vectors** have never been measured),
and one deliberately breaking multi-surface task (**band C** has never been reached — its ≤4×
target in §2 is pure extrapolation). **X1's numeric thresholds** (MR-5: 8 files / 400 LOC) stay
uncalibrated either way — C-15 fixed the *scope*, not the numbers. Creator's call on scale; the
12-arm plan above stands on its own without them.

## 5. Pre-registered predictions (frozen before launch; never edited to match results)

**Classification must not move.** The collapse changes *when* the classifier runs, not what it
decides. Registered expectation: the step-5 verdicts reproduce **exactly** — frozen-3 fire M1+M2
on one surface at `1·1·0·0·1·1·2`; `task-count` fires M3 at the diff checkpoint;
`filter-tasks-by-status` and `enforce-title-max-length` fire **nothing** and sit at
`1·0·0·0·0·0·0`. **B3 must now come out clean** — its step-5 X1 came from a numstat that counted
the change's own bookkeeping, which **C-15 already fixed in the shipped skills** (`325b337`), so D
inherits the correction rather than re-specifying it. Any divergence is a finding about the
collapse, scored in both directions.

**One prediction is weaker than it looks, and is registered as such.** "Classification must not
move" is a clean expectation under phases, where K1–K4 have fixed evidence boundaries. The
continuous rule is now designed (§4.1: classify on evidence birth/growth), but it makes triggers
fire **earlier and more often than K3 did** — e.g. M5 scope-spill and the M1 re-check are defined
against a diff that, in a continuous loop, exists earlier and grows per work unit. If the verdicts diverge, the
first question is whether the new rule is wrong or whether the step-5 verdicts were an artifact of
phase boundaries. Both answers are findings; neither is automatically a regression.

**Cost.** My honest expectation, stated so it can fail:

- Band A: **2.0×–3.0×** — I expect the collapse to help but **not** to reach ≤2.0× on the first
  attempt. Predicting a miss.
- Band B: **3.0×–4.0×** — likewise, improvement over 5.46× but short of ≤3.0×.
- **Direction is the real test.** If non-artifact output does not fall by at least 30%, the phase
  march was *not* the dominant cost and the ~79% residual is something else — which would falsify
  the entire diagnosis in §3 and send the next investigation at the residual directly.

**Quality is a stop-the-analysis gate, unchanged.** Oracle must stay 19/19 (band B) and 16/16
(band A) across both arms. Any regression halts the cost reading — a cheaper governed arm that
breaks the oracle is not a result, it is a defect.

## 5b. OUTCOME (measured 2026-08-03, `b31bb10`) — and the landing decision

Full scorecard: [`.chaos/validation/2026-08-stage-d-run-collapse/results.md`](../../.chaos/validation/2026-08-stage-d-run-collapse/results.md).
**Cost falsified** (band A 4.81× vs ≤2.0×, band B 5.51× vs ≤3.0×, governed absolute +19.7% on
band B, direction test failed — non-artifact output *rose* 12%). **Quality perfect**
(0 oracle failures on 12/12). **Mechanics clean on 6/6.**

### Where the money actually is (transcript decomposition, the analysis §3 lacked)

§3 attributed cost by **bytes on disk**, which can only see artifacts. Decomposing the arms'
actual assistant output instead — 12 transcripts, `output_tokens` per message, visible content
(text + tool-call inputs) versus redacted reasoning — gives the real split:

| | Governed (6 arms) | Plain (6 arms) | ratio |
|---|---:|---:|---:|
| output tokens | 273,539 | 51,396 | 5.32× |
| visible (text + tool inputs) | ~39% | ~46% | 4.54× |
| **reasoning (redacted thinking)** | **~61%** | ~54% | **5.98×** |
| distinct deliberation turns | 207 | 39 | 5.3× |

**Governance makes the agent think ~6× more while it writes only ~4.5× more.** The conclusion is
robust to the chars-per-token assumption: across 3.0–4.5 chars/token, reasoning stays 54–70% of
governed output and its ratio stays *above* the total ratio in every case.

Attributing the 207 deliberation bursts to the action each precedes:

| What the deliberation was for | share |
|---|---:|
| **classification machinery** — scan prep (`git add -N` / `git diff`) 22.7% + running the classifier 18.4% + authoring the payload JSON 7.2% | **48.3%** |
| reading the governance surface | 17.4% |
| running the renderer | 8.7% |
| **authoring the governance artifacts** (records + ledger + OpenSpec + ADR) | **12.1%** |
| build/test + writing code | 7.7% |
| the obligation audit | 2.9% |

**The artifact model is exonerated a third time and by a wider margin than §3 believed:**
authoring every governance artifact accounts for ~12% of deliberation and ~18% of visible output.
**The classifier's *operating protocol* — not its verdict, not its artifacts — is the single
largest cost center in the product.** The agent spends four times more thought on *how to run a
scan correctly* (scope the diff, build the payload, work the two-call pattern, read the verdict
back) than on writing everything the governance model produces.

### Landing decision (creator review, 2026-08-03)

| Item | Call | Why |
|---|---|---|
| **`chaos:run` collapse** | **KEEP** | One command replaces four; 12.4 KB of skill text replaces 34.2 KB; 18 files read vs 21; mechanically proven 6/6 with zero governance weakened. Its cost regression is attributable and tunable (below), and a single loop is the **precondition** for mechanizing the protocol — you cannot wrap a scan protocol that is spread across four commands' checkpoint wiring. |
| **C-15** diff scope | **KEEP** | Validated: B3 came out clean, erasing the program's only fidelity miss. |
| **C-16 / C-17** M4 pair | **KEEP** | Validated in the wild as a pair: M4 fired on 3/3 frozen-3 arms and `openspec` still stayed at 1. |
| **Obligation audit** | **KEEP** | Deterministic, 2.9% of deliberation, exit 0 on 6/6 plus 6/6 independent out-of-band replays, and it found a real defect on day one. |
| **Stage-B renderer** | **KEEP** | 29 renders, 1 self-repaired failure, 0 hand-written artifacts across 6 arms. |
| **Pending-stop absorption** | **KEEP, UNVALIDATED** | 0/6 as pre-registered, but measured *through* the `RESOLVED-IN-ARM` workaround — the mechanism never met its real trigger. |
| **`RESOLVED-IN-ARM` defect** | **FIX** | `classify.py` reads it as unanswered; load-bearing for the audit gate, MR-3 and absorption. 0/29 corpus seeds affected ⇒ one-line predicate widening + regression test. |
| **Per-work-unit rescan cadence** | **TUNE** | This is where D's +19.7% lives: 3 diff scans on P1 where C ran 1, driving classification +32.5%. The continuous *rule* is right; its *frequency* is uncalibrated. |

**The verdict in one line: D's cost case failed and D's product case succeeded.** Keep it for
simplicity and for what it unlocks, not for what it saved.

## 5c. Stage E — the next hypothesis: mechanize the protocol, not the paperwork

> **Hypothesis (pre-registered here, before any build).** The dominant cost is **deliberation
> about how to operate the governance machinery**, not the machinery's output. Replacing the
> classifier's operating protocol with a single deterministic command — one that does scan prep,
> payload construction, the two-call adjudication dance and verdict interpretation itself — should
> remove a share of governed output proportional to the deliberation it absorbs.

**What E builds:** one `chaos-scan` wrapper owning what the agent currently reasons through by
hand — `git add -N` + C-15-scoped `git diff`, payload JSON assembly from `change.md` + state,
the scan → `adjudicationDue?` → merge sequence, and a verdict digest the agent reads instead of
raw JSON. The agent's remaining job at a scan becomes exactly the one thing only a model can do:
**the adjudication judgement itself**, when the tool says it is due.

**Quantified prediction (frozen):** classification machinery is 48.3% of deliberation and
deliberation is ~61% of output ⇒ up to **~29% of governed output** is addressable. If E captures
two-thirds of it, band B goes 5.51× → **~4.4×** and band A 4.81× → **~3.9×**. **Both still miss
their bars.** That is the honest prediction: E is the largest single lever measured in this
program and it is still not sufficient alone — which is itself the finding, because it would mean
no single mechanization reaches ≤3.0× and the bar needs revisiting against reality.

**Why this is the right next probe:** it is the first lever in five stages aimed at the
**residual** rather than the artifact model. A, B and C attacked artifacts (~12% of deliberation).
D attacked the phase march (a label, not a cost center). E attacks the 48%.

**What E must not do:** weaken any governance guarantee. Same triggers, same dimensions, same
raise-only adjudication with mandatory citations, same stops, same audit. E moves *who performs
mechanical steps*, never *what is decided*.

### 5d. E is one of four approved levers — see the handoff

Protocol mechanization is **not** the only lever, and on the measured evidence not the largest.
The creator approved **four** levers on 2026-08-03, to be built together and priced in one run:

| | Lever | Attacks | Measured target |
|---|---|---|---|
| **L1** | **Model tiering** — cheap tier for mechanical steps, strong model for adjudication / implementation / discordance | **price** | ~50–60% of the work is mechanical; **reduces cost without reducing tokens**, so it is invisible to every metric this program has used |
| **L2** | **Amortize the fixed corpus** — prompt-cache it, then compile a hash-keyed governance digest | **input** | **93.4%** of read volume is identical every change (~147.6k chars/change); the only lever whose saving grows as (N−1)/N |
| **L3** | **Protocol mechanization** (§5c above) | **reasoning** | classification machinery = 48.3% of deliberation |
| **L4** | **Derive records** instead of authoring them — emit facts, agent keeps judgement prose | **output** | records = 49% of authoring bytes / ~29.6% of visible output |

**L5 (incremental scan cadence) is deferred.** Execution brief, standing rules and traps:
[`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md).

**Open metric question carried by that handoff:** every number here is *output tokens*, and L1/L2
are largely invisible to that metric. The bar should probably be re-based on **blended cost +
wall time** — a creator decision, not an assumption, and not to be changed silently.

### 5e. Per-lever design register

**L1 — model tiering** (design of record:
[`2026-08-03-l1-model-tiering.md`](2026-08-03-l1-model-tiering.md), decided 2026-08-03,
before any L1 code):

| Id | Decision | Call | Why |
|---|---|---|---|
| **L1-D1** | Tiering architecture | **Strong loop, cheap subagents** (creator) | The only mechanism Claude Code has (model varies per subagent); same boundary as existing delegation, one tier down. Cheap-orchestrator inversion shelved unless savings disappoint |
| **L1-D2** | The mechanical tier | **Haiku 4.5** (`model: haiku`) (creator) | Largest price gap; validator containment is what the design pays for. Also pins "weakest supported model" in the robustness policy to a concrete model |
| **L1-D3** | Tier-map baseline | **Post-L3/L4 composed loop; deterministic-first ladder** (creator) | Tool > cheap > strong — L3/L4 absorb most of the handoff's candidate list; tiering them would price a shape that stops existing this batch |
| **L1-D4** | The tier map | Cheap: TRG transcription · render repair loop · mechanical audit repair · harness telemetry. Strong-reserved: adjudication, implementation + S3, judgement prose, ledger answers, OpenSpec, self-review, verify | Judgement and governance never leave the strong model; only validator-gated mechanics descend |
| **L1-D5** | Executor contract | Generic mechanical-executor agent: one named step, explicit inputs, named validator, structured return; **never decides** | The C# specialist boundary, one tier down |
| **L1-D6** | Failure handling | 2 attempts cheap → orchestrator finishes strong inline; never a stop; persistent escalation = todo to make the step a tool | A validator failure is data, not a defect |
| **L1-D7** | Overhead guard | Delegate only validator-gated, self-contained steps; a delegation that inflates total tokens is a map defect | Handoff overhead must not eat the price win; +5% total-token ceiling registered |
| **L1-D8** | Measurement | Tier-split + blended-cost diagnostics beside every ratio; output-token bar unchanged; predictions frozen (cheap share 10–25%, blended −10–25%, tokens ≤ +5%) | Same posture as L2-D4; the §7 bar re-base stays an open explicit decision |
| **L1-D9** | Ceiling rule (amendment) | **Session model = tier ceiling; no subagent ever exceeds it** (creator) | The user's model choice is a cost-consent boundary; strict on a low ceiling proceeds + records a confidenceLimiter, never blocks, never upgrades |
| **L1-D10** | Relative tiers (amendment) | ceiling/mid/floor resolve against the session model, collapsing downward (haiku-only must still work) (creator) | Floor pinned in the executor; specialist inherits ceiling; mid passed at spawn |
| **L1-D11** | Implementation tier (amendment) | **SUPERSEDED by L1-D12..D15** — measured **inert** in the lever run (0 delegations on 6/6): the gate was change-scoped and latched on the first firing, which arrives at scan 1 | A gate that shuts before the first implementation unit exists can never route anything |
| **L1-D12** | The T1 (mid) condition | **Surface-disjoint + test coupling** (creator): a unit is mid-eligible only if its declared paths touch no class carrying a fired trigger's surface, touch no sensitive class at all (prospective), and it authors no evidence for a contract statement attributed to a fired trigger | Bands **work units, not changes**. `M4`/`X2` carry no path-class surface, so the firings that closed the old gate on B2/B3 no longer block mid; `M1`/`M2`/`M3` still keep their surfaces at ceiling. The coupling gate exists because P1's C-007 ordering clause was falsifiable only by tests encoding the security contract |
| **L1-D13** | Presets vs tier | **Orthogonal** (creator): presets raise obligations, never the executing model | Recorded consequence: under `--strict` a mid-tier model may still write code for units passing all four gates; revisit first if a strict arm shows mid work reaching a fired surface |
| **L1-D14** | Escalation | **Budget 2, then latch** (creator): a failed mid unit (tests fail / diff spills into a sensitive or fired class / rescan attributes a new firing) is redone at ceiling and spends 1; after the second, implementation stays ceiling for the run | Tolerates noise, latches on a pattern — the old gate latched on the *first* firing, which is what made it inert |
| **L1-D15** | Tier selection mechanism | `scan.py tier` returns T1/T2 **deterministically** with the deciding gate + citation; declared paths are verified after the fact by the rescan diff | Tier becomes a tool verdict, never a model judgement; the after-the-fact check is what stops an agent declaring innocent paths and then editing auth |

**L3 + L4 — `chaos-scan` + `chaos-record`** (joint design of record:
[`2026-08-03-l3-l4-scan-and-record.md`](2026-08-03-l3-l4-scan-and-record.md), decided
2026-08-03, before any L3/L4 code; **the §5c prediction stays frozen and un-reopened**):

| Id | Decision | Call | Why |
|---|---|---|---|
| **L3-D1** | Tool shape | `tools/chaos-scan/scan.py`, imports `classify()` as a library; classifier core untouched | Zero corpus movement; the audit.py import pattern |
| **L3-D2** | Invocation surface | Subcommands per evidence class (`k1`/`rescan`/`k2`/`k4`/`merge`); inputs captured once into `scan-inputs.json` (working state, not a record); scope changes only via explicit `update-scope` citing a decision | Later calls need only the change id; no silent scope drift |
| **L3-D3** | Diff mechanics | `git add -N` + C-15-scoped numstat/patch inside `rescan`, persisted under `scan/` | C-15 by construction; L4 reuses the same diff |
| **L3-D4** | Verdict digest | Append-only `scan/verdict-<seq>.md`; MUST carry verbatim cites, demoted candidates + reasons, stop duty, vector, `adjudicationDue` + packet pointer | The C-6/C-12 evidence surface is non-negotiable; ~20 lines replaces raw JSON |
| **L3-D5** | Adjudication flow | Sanitized packet written when due; orchestrator judges at ceiling; `merge` **fails closed on cite-less raises** | The corpus-validated blindness contract, mechanized |
| **L3-D6** | TRG ledger writes | **Tool-appended by chaos-scan** (creator) — writer rule 2 amended: decision entries agent-only, `TRG-*` tool-appended; supersedes L1's floor assignment | Tool beats cheap model; TRG was already RECORDED/command-made |
| **L4-D1** | Tool shape | `tools/chaos-record/record.py` emits frame/deliver/verify; `contract.json` stays agent-authored; render stays the projector | Emission ≠ projection; contract statements are judgement end-to-end |
| **L4-D2** | Output mode | **Partial record at the real path** (creator): facts filled, judgement empty; agent fills; `render --check` gates; abort deletes | Writer rule 3 intent preserved; no draft-rename convention |
| **L4-D3** | Derivation table | Envelope + auto pass-NN mechanical; deliver parses the loop's own logs + scan's numstat + scaffolds coverage/rules by id; frame adds intent verbatim + real `openspec status` proof | Derive facts, scaffold structure, never content |
| **L4-D4** | Verify execution | **`record.py verify` re-runs build/tests/openspec itself** (creator); deliver stays parse-only | The independent re-run IS the check; results become untranscribable-wrong |
| **L4-D5** | Honesty guard | Emitter never fills a judgement field — enforced by unit test; underivable facts stay empty | Guessing is the defect class this lever must never ship |

**L2 — corpus amortization** (design of record:
[`2026-08-03-l2-corpus-amortization.md`](2026-08-03-l2-corpus-amortization.md), decided
2026-08-03, before any L2 code):

| Id | Decision | Call | Why |
|---|---|---|---|
| **L2-D1** | Digest production model | **Curated + sync-maintained** (creator) | Best compression (checklists, not marker extraction); staleness machine-detectable via source hashes; `chaos:sync` already owns governance reconciliation |
| **L2-D2** | Pinned surfaces in the digest | **Embed verbatim, byte-equality checked** (creator) | Pinned contracts must never be paraphrased; one read serves everything; adjudication runs at K1 on every change anyway |
| **L2-D3** | Adoption scope before re-measure | **`chaos:run` loop only** (creator) | Tight blast radius; the measured arms exercise exactly what changed; other commands adopt after validation |
| **L2-D4** | How L2 is measured | **Read-volume + input diagnostics; output-token bar unchanged** (creator) | Bar re-base (§7 of the handoff) stays an open, explicit decision — not changed silently |
| **L2-D5** | Digest location | `chaos-shared/reference/governance-digest.md`, manifest in frontmatter | Versioned and staged together with its sources — a worktree can never see a half-updated pair |
| **L2-D6** | Staleness tool | `tools/chaos-digest/digest.py --check/--stamp`, stdlib, exit 0/1/2 | House style (render/classify); deterministic, no model in the gate |
| **L2-D7** | Killing the 49k schema read | Curated example records + existing `render.py --check` validator; schema stays machine-truth, unread by agents | Examples are schema-validated by unit test so they cannot lie; generator rejected as complexity without honesty gain |
| **L2-D8** | Staleness behavior in the loop | Fail closed on content, fall back open to full sources; degradation recorded in frame facts | Correctness never depends on digest freshness |

## 6. What Stage D does NOT settle

- **Governance value.** Every arm in this program self-answers its own decisions. The mechanism the
  whole product now rests on — *stop, ask a human, record the answer* — has **never been tested
  with a real person in the loop**. That is a separate trial (EA-D3 shaped) and it is the highest-
  value experiment remaining, independent of cost.
- **Band C.** No measured change has ever reached `openspec 2`.
- ~~The step-6 decisions~~ — **all resolved 2026-08-03** (`325b337`): C-10 kept trigger-gated,
  C-11 floor stop kept, Stage-B adopted, C-15 diff scope, C-16 M4 counts questions, C-17 M4 leaves
  C-13's surface count. **Still open and untouched by D:** preset floor vectors, X1's numeric
  thresholds, and the carried register questions (M3's breaking definition / corpus O-4, the
  concurrency M2 class / O-2, PII / O-5, urgency / O-6, the frontmatter classification block now
  unblocked by the Stage-B adoption).
- **Whether the shape is worth shipping.** D builds and prices `chaos:run`; whether it *stays* is
  the step-6-style trim that follows the measurement, with the creator, recorded in a D register.
  A build that misses the bar is still a result — it tells you the residual is not the phase march.
