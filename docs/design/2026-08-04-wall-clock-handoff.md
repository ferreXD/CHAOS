# Handoff — speeding up CHAOS wall clock

> Toolkit meta-work (no CHAOS governance — see [[chaos-develop-toolkit-without-governance]]:
> build CHAOS *without* CHAOS). Written 2026-08-04 for a reader with no context on this program.
>
> **Mission: make a governed change finish faster in wall-clock minutes.** Not cheaper, not
> fewer tokens. Minutes. Everything below explains why that is the only target that matters now,
> what has already been tried and failed, and where the evidence says the time actually goes.

## 0. The one-paragraph orientation

CHAOS delivers a code change under governance: it classifies how material the change is, stops
for human decisions where materiality demands it, and emits traceability artifacts. A governed
change currently takes **~15–24 minutes** where the same change ungoverned takes **~2–3**. Seven
consecutive attempts to reduce that — all aimed at *token volume* — have failed. On 2026-08-04
the metric was re-based from output tokens to **wall clock**, and a first measurement under real
product conditions showed the problem is worse than the harness ever reported. **You are picking
this up at the moment the program finally has the right instrument and a correct diagnosis, and
has not yet built anything against it.**

## 1. Read these first, in this order

| Doc | Why |
|---|---|
| [`2026-08-04-metric-rebase.md`](2026-08-04-metric-rebase.md) | The metric of record. §1 preserves the retired one, §3.1 has the bars, §6 has every measurement re-derived on the independent clock. |
| [`.chaos/validation/2026-08-product-conditions/results-T1.md`](../../.chaos/validation/2026-08-product-conditions/results-T1.md) | The first real-world run. Three defects, one corrected finding. |
| [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md) | The previous handoff — the four levers, now all built and all judged. Read for what NOT to redo. |
| `tools/chaos-stopwatch/README.md` | The instrument. Everything you claim about time comes from this. |

## 2. The metric — what gates, and what does not

**Primary and the only gate: an absolute wall-clock envelope per governed change.**

| Band | Wall clock (**gates**) | Price ceiling (secondary) | Measured today |
|---|---|---|---|
| **A** — trivial, zero-trigger | **≤ 5 min** | ≤ $10 | **15.0 min** (arms) · **23.7** (product) |
| **B** — single-surface materiality | ≤ 15 min | ≤ $25 | 18.8 min |
| **C** — multi-surface / breaking | ≤ 30 min | ≤ $50 | never measured |

**Price does not gate and is not a target.** Governance adds **$1.07–1.37 per change**; at 1,000
changes/month that is $1,547 against $276 for ungoverned — a rounding error beside payroll. The
ceiling has 4–8× of headroom. **Do not spend effort on cost.** Its only job is to tell you when
to stop.

**Output tokens are a diagnostic, not a bar.** They are the unit the previous seven hypotheses
optimized, and §5 explains why that aimed the program at the wrong thing.

## 3. Measured facts — do not re-derive these

All independently measured from runtime transcript timestamps (`tools/chaos-stopwatch`), not
self-reported.

**The series, minutes per governed change:**

| Row | Tasks | Model | min/change |
|---|---|---|---:|
| EA-X2 baseline | frozen-3 | opus-4-8 | 12.8 |
| **Stage A `--light`** | frozen-3 | opus-4-8 | **5.5** ← cheapest ever, still misses ≤5 |
| Stage B light | frozen-3 | opus-5 | 9.6 |
| Stage B standard | frozen-3 | opus-5 | 14.8 |
| Stage C core | frozen-3 | opus-5 | 13.9 |
| Stage C extended | B-tasks | opus-5 | 11.0 |
| Stage D | frozen-3 / B-tasks | opus-5 | 16.9 / 12.1 |
| Lever run 1 | frozen-3 / B-tasks | opus-5 | 21.9 / 14.6 |
| Lever run 2 | frozen-3 / B-tasks | opus-5 | 21.0 / 14.1 |
| **T1, product conditions** | priority filter | opus-5 | **23.7** |

**Four things this table establishes:**

1. **No configuration has ever met the band-A bar.** The closest is Stage A at 5.5 min, from
   2026-07-24, and everything built since is slower.
2. **The trend is the wrong way.** Same tasks, same model: frozen-3 went 14.8 → 21.0 (**+42%**),
   B-tasks 11.0 → 14.1 (**+28%**).
3. **Product conditions are slower than the harness** — 23.7 vs a 15.0 band-A arm mean. Every
   figure above is a **floor**, not an estimate.
4. **The graduated bar is not graduating.** Band A costs **80%** of band B (15.0 vs 18.8) while
   owing far less. The fixed cost of *entering* the loop dominates whatever the classifier decides.

## 4. Where the wall clock actually goes — the new diagnosis

This is the part no previous handoff had. From the T1 product run (n=1, 23.7 min):

**By phase:**

| Phase | Time | Share |
|---|---:|---:|
| **Frame** — digest, k1 scan, adjudication, records, first renders, artifact writes | 9.3 min | **39%** |
| Implementation — the actual filter + 8 tests | 7.7 min | 32% |
| Close — re-scope, rescan, k4, record, audit, render | 6.5 min | 27% |

**Nine minutes before the first line of code was considered.**

**By what the machine was physically doing:**

| | Time | Share |
|---|---:|---:|
| **Model generating / round-trip latency** | 14.8 min | **61%** |
| Tool execution | 9.6 min | 39% |

Tool execution breaks down as `Bash` 59 calls / 289 s, `Agent` 1 call / 223 s (a floor-tier
delegation, since closed — see §6), `Read` 25 / 24 s, `Edit` 11 / 24 s, `Write` 10 / 15 s.
**Excluding the closed delegation, tools are ~24% and the model is ~73%.**

**The structural fact that explains it: 113 tool calls, and ZERO of them batched.** Every single
tool call was issued alone, so the run paid 113 sequential model round-trips. Wall time is
essentially `round-trips × per-turn latency`.

### 4.1 L3 traded tokens for round-trips — and that is the regression

Same tasks, same model, one with the L3/L4 mechanization and one without:

| | tool calls/arm | bash calls/arm | min/arm |
|---|---:|---:|---:|
| Stage D (no L3/L4) | 76 | 39 | 14.5 |
| Lever run 2 (L3+L4) | **86** | **49** | **17.5** |
| Δ | **+13%** | **+26%** | **+21%** |

L3 mechanized the classification protocol into tool invocations. That **cut reasoning tokens** —
which is what it was measured on, and it succeeded there — **while adding ten round-trips per
change.** Under the token metric it read as progress. Under wall clock it is the single clearest
mechanism for the +21% degradation.

**This is the central insight to carry forward: the previous program optimized the wrong term.
Tokens fall when you move work into tools; minutes rise when you add round-trips.**

## 5. What has already been tried — do not repeat it

Seven cost hypotheses have been falsified. Four named levers were built, measured, and judged:

| Lever | Attacked | Verdict |
|---|---|---|
| **L1** model tiering | price per token | **Closed.** Ceiling is 3.1% blended saving — implementation is only 7.7–21% of output and the rest is ceiling-locked. Route B additionally **failed a correctness test** (§6). |
| **L2** corpus amortization | input tokens | Built, works (~44% read-volume cut), invisible to the gate. Fixed corpus is ~68 k chars/arm. |
| **L3** protocol mechanization | reasoning tokens | Hit its token target and **cost wall clock** (§4.1). |
| **L4** derived records | authored output | Works. Artifacts are **10.3%** of output — the smallest cost centre, exonerated four times. |

**Stop believing the artifact model is the problem.** It has been measured and cleared repeatedly:
records, `change.md`, `lifecycle.md`, OpenSpec deltas and ADRs together are ~10% of output. Every
attempt to cut governance by cutting artifacts has failed because the artifacts were never the cost.

## 6. Current state of the tier band (context for §4's `Agent` line)

`scan.py tier` bands each work unit T0 (floor/Haiku) · T1 (mid/Sonnet) · T2 (ceiling/session
model, the default). In T1's run a unit banded **T0 via route B** and the floor model shipped a
contract violation while reporting `COMPLETE, 41/41 green` — because "suite green" counted tests
**the executor itself wrote**. A self-written validator is not a validator. **Route B is closed**
(`ca7ce7d`); route A survives because its acceptance check pre-exists the unit and cannot be
authored by the executor. **Route A has never fired**, so T0 is dormant in practice.

The safety net worked at every layer — ceiling review caught it, escalation climbed one rung, the
overhead guard fixed inline. But the delegation **cost ~4 net minutes** and saved money nobody
measures. **Under a time-gated metric, delegating implementation is a wall-clock gamble with no
scoring upside.** Whether to delegate at all is open; my lean is not until a delegation is *shown*
to save wall clock.

## 7. The leads, ranked by expected wall-clock impact

None of these has been built. They follow from §4, and the first is by far the largest.

1. **Cut round-trips — batch independent tool calls.** Today 0% of turns issue more than one tool
   call, across 113 calls. Writing five independent artifacts is five turns; it could be one. The
   ceiling here is large and completely untouched. **Start here.**
2. **Make the frame proportional to the verdict.** 39% of the run precedes any code. `k1` already
   returns "fired: none" for a trivial change — yet a full contract record, frame record, OpenSpec
   proposal and two renders are produced anyway. A zero-trigger verdict should buy a near-zero frame.
   This is also the direct attack on the flat A-vs-B curve (§3.4).
3. **Collapse the scan sequence.** T1 issued **8 scan invocations** plus tier calls, each a
   separate bash round-trip. The protocol may be right while its *invocation granularity* is wrong.
   Careful: this is L3's surface, and L3's mechanization is what added round-trips — do not
   "improve" it by adding more.
4. **Reduce reads.** 25 `Read` calls despite L2's digest being designed as *one* read. Either the
   reading protocol is not being followed or change-specific reads dominate; measure which.
5. **Question the 85 text-only turns.** Narration between actions costs generation time. Some is
   the reasoning the design wants; some is commentary.

**Measure before building.** Each of these is a hypothesis, and this program's record on
plausible-sounding cost hypotheses is 0 for 7.

## 8. Non-negotiables — these have all bitten

- **Pre-register.** Freeze predictions in the kit and commit them *before* any arm runs. Never
  edit them to match results. A negative result is a valid result and gets written up as one.
- **Never self-report time.** Use `tools/chaos-stopwatch`, which reads runtime-written transcript
  timestamps. Arm self-reporting under-states by **+6–31%**, worst on the shortest runs.
- **Report the absolute beside every ratio**, and put a direction test on the absolute. Plain-arm
  denominators drift ±26–47% between sessions for byte-identical prompts; a ratio alone once
  showed a "33% improvement" where the governed absolute moved 1.7%.
- **Quality is a stop-the-analysis gate.** The test suite must stay green. A cheap-tier
  correctness failure closes that route rather than being tuned (L1-D11).
- **Any input that changes what governance is owed is a constrained choice or fails closed.** This
  rule exists because it has been violated four times (§9).

## 9. Traps that have already cost real time

| Trap | What happened |
|---|---|
| **Silent governance loss ×4** | `--mode stricct` → zero floors; a typo'd trigger fired a phantom; `--self-review pass` fired X2 on 6/6 arms; a **missing path-class map made every change scan as "fired: none" at HIGH confidence**. All now fail closed. |
| **Scope parser** | Split on commas only, so a space-separated scope collapsed to one entry matching nothing — M5 fired on a *correct* declaration and cost an unowed stop, decision and re-scope tail. Fixed `805b5c9`. |
| **Kit-local script copies** | `decompose-output.py` was copied into a kit and went stale, mislabelling the thing it measured. Shared instruments live in `tools/`, not in kits. |
| **Digest staleness** | Editing any digest *source* silently stales `digest.py --check`. Re-stamp — but verify: for compiled sections a blind stamp produces fresh-wrong content. |
| **Transcript ordering** | Files are hash-named; sorting them shuffles the arms and once assigned governed reads to plain arms. Order by journal `started` events. |
| **Corpus invocation** | `run_corpus.py` with no args scores the semantic layer with no input and prints five FAIL blocks that look exactly like a classifier regression. It now exits 2. |

## 10. Where things live

```text
tools/chaos-stopwatch/     the wall-clock instrument (the gate)
tools/chaos-classify/      classifier core + corpus harness + pinned adjudication contract
tools/chaos-scan/          the classification protocol as a tool (L3) + the tier band
tools/chaos-record/        derived records (L4)
tools/chaos-digest/        the governance digest + staleness gate (L2)
tools/chaos-render/        change.md / lifecycle.md renderer — artifacts are never hand-written
.claude/skills/chaos-run/  the collapsed delivery loop — THE THING BEING OPTIMIZED
.chaos/validation/         measurement kits; each README is its own pre-registration
.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md   append-only row log
```

The demo workspace `D:/Proyectos/CHAOS/demo-light` (branch `demo/dotnet`) is a runnable
Task Tracker API used as the subject. It carries `.chaos/path-class-map.json`, without which M2
can never fire.

## 11. In flight right now

**T1 is queued for a re-run** against a toolkit with two repairs since run 1 (scope parser
`805b5c9`, route B closure `ca7ce7d`). Predictions are frozen in the kit README §9: M5 must not
fire, no T0 delegation, M4 probably still fires, machine time 16–21 min — **still missing the
15 min bar, predicted before it runs.** Run-1 evidence is preserved at `evidence/T1-run1/` so the
delta isolates what the two defects cost.

T2–T5 (band B, band C, a second band A, and a deliberately ambiguous task that forces a human
stop) are written and unrun. **Band C has never been measured by anything.**
