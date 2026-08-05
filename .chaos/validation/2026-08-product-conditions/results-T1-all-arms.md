# T1 across every arm — the first task with both denominators and both toolkits

> Toolkit meta-work. Written 2026-08-04 after the governed re-run. Every figure below is measured
> on the independent clock from runtime transcripts; every delivery is scored against the same
> evaluator-written oracle ([`oracles/T1ContractOracleTests.cs`](oracles/T1ContractOracleTests.cs)),
> which encodes only the T1 prompt's own sentences and was written by neither arm.

## 1. All seven runs

| # | Arm | Workspace | Model | **Machine** | Stops / questions | Oracle | Delivery |
|---|---|---|---|---:|---|---|---|
| 1 | plain | demo-plain | opus-5 high | **1.5 min** | 0 | **8/8** | 41/41 |
| 2 | plain | demo-plain | **haiku-4.5** | 0.4 min | 0 | **5/8 FAIL** | never built |
| 3 | plain | demo-plain | opus-5 high | **1.5 min** | 0 | **8/8** | 42/42 |
| 4 | plain+ask | demo-plain | opus-5 high | **2.1 min** | 1 question | **8/8** | 43/43 |
| 5 | **governed run 1** | demo-light | opus-5 | **23.7 min** | 2 stops | **8/8** | 42/42 after repair |
| 6 | governed run 2 | demo-light | opus-5 | 0.6 min | — | — | **VOID** — setup failure |
| 7 | **governed run 3** | demo-light | opus-5 | **16.2 min** | 1 stop | **8/8** | 47/47 |

Run 2 (haiku) is void as a denominator (model clause) and shipped a live C-003 violation. Run 6
aborted after 38 s: the model reported *"MCP interaction tools aren't available in this session"*
and the operator interrupted rather than let it proceed with in-band stops.

**Multipliers on the valid opus denominator (1.5 min):** governed run 1 **15.8×**, governed run 3
**10.8×**. Against plain+ask (2.1 min): **11.3×** and **7.7×**.

## 2. The lever result: 23.7 → 16.2 min, −32%

Governed run 3 ran on a toolkit carrying **four** changes since run 1 — the scope-parser fix
(`805b5c9`), the route B closure (`ca7ce7d`), and the frame/close composites plus the zero-trigger
short-circuit (`5b642e7`, ported as demo `5b642e7`). It is not the two-fix re-run
[`README.md` §9](README.md) predicted; it is that plus lever options 1 and 2.

**The raw stopwatch reads 36.7 min.** It contains a single **1226.9 s (20.4 min)** gap ending at
`Stop hook feedback: The pending CHAOS decision was answered in the Decision Center` — the operator
answering `RUN-DEC-001`. The model was idle throughout. That is `humanWait` by every definition this
kit uses, and it is never gated.

**True machine = 2199 − 1226.9 = 972.1 s = 16.2 min.**

This is the blind spot recorded at [`evidence/T1-plain-ask/`](evidence/T1-plain-ask/README.md) §3,
now confirmed on the governed side at ten times the magnitude: `stopwatch` reports
`turns 1, humanWait 0` for this run. **Any governed figure with a Decision Center stop in it is
overstated until the gap is subtracted.** Run 1 was checked the same way and is clean — its only
long gaps are a 69 s pre-prompt idle and a 223 s subagent call, which is legitimate machine time.
Its documented 23.7 min reproduces exactly with `--to-match "^runs finished"`.

## 3. Every frozen §9 prediction was correct

[`README.md` §9](README.md), frozen before the re-run:

| Prediction | Outcome |
|---|---|
| **"M5 must not fire. This is the sharpest test here."** | **Did not fire.** The parser fix held. |
| "No T0 delegation … no floor-tier call" | **Zero subagents.** Run 1 had one, and it shipped the defect. |
| "M4 will probably still fire" | **Fired** at K2 — 3 material questions across 1 entry. |
| "Machine time 16–21 min … predicting another miss" | **16.2 min** — bottom of the band, and still a miss. |

Four for four. The first clean prediction set in this program — with the caveat that §9 was written
for a two-fix toolkit and this run had four changes, so landing at the band's floor rather than
below it is weaker evidence than it looks.

**Against the bars:** 16.2 min is **3.2× over** band A's ≤5 min, and misses band B's ≤15 min (where
the classifier actually put it) by **1.08×**.

## 4. What the new classification did better

`classification-state.json` for run 3 records `M4` at K2 and **`M3` contract-surface at K3, by
adjudication** — with a cite worth quoting:

> the public contract of an existing route changed: it accepts a new query parameter and can now
> answer 400 where it previously always answered 200. **The deterministic route-delta scan cannot
> see this because the route template `MapGet("/")` is byte-identical**; only the handler's
> parameter list and status set changed.

Run 1 never fired M3. That is a real detection improvement, not ceremony — and it is the adjudication
layer catching what the deterministic scan structurally cannot.

**Stops fell from 2 to 1** because run 1's second stop was the M5 false positive. The surviving stop
folds three items (frame approval + case sensitivity + the empty value) and offers four options
including *stop / defer*.

## 5. Lever gates — both missed, one marginally

[`docs/design/2026-08-04-wall-clock-lever-plan.md`](../../../docs/design/2026-08-04-wall-clock-lever-plan.md)
option 1 pre-registered two falsification gates:

| Gate | Target | Run 1 | Run 3 | Verdict |
|---|---|---:|---:|---|
| Governance-CLI invocations per arm | **≤ 5** | 38 | **27** | **MISSED** — −29%, nowhere near |
| Output tokens on governed arms | **−15%** | 68,728 | 58,917 | **MISSED by 0.7 pt** — −14.3% |

Run 1's total includes its subagent's 6,201 tokens (sidechain transcript); excluding it the
reduction is only −5.8%.

**The composites were used but not cleanly.** The invocation sequence shows `loop.py frame` called
**four times** and `frame-commit` **twice**, plus two `--help` calls — the "model re-discovers the
CLI surface every run" problem the option was written to remove, reappearing on the new surface.
Frame was supposed to go 8 → 2 invocations; it went to 6 plus help.

**So the 32% wall-clock win did not come from where option 1 predicted it would.** The plausible
sources are the removed M5 false positive and its re-scope tail, and the removed floor-tier
delegation — both of which are the two *defect fixes*, not the two *levers*. The levers' own
gates failed. That distinction should survive into whatever gets built next.

## 6. Quality is flat across every valid arm

**All six valid deliveries pass the oracle 8/8**, including both governed runs and all three opus
plain-family runs. The only correctness failure in the entire T1 set is the haiku plain run, and the
governed arm's own floor tier produced the identical defect in run 1 before its ceiling caught it.

**There is no measured correctness difference between 1.5 minutes and 23.7 minutes on this task.**
What the governed arms bought is the record: a contract of five to seven pinned statements, a
decision ledger, trigger cites, and a classification state — none of which the plain arms produce
and none of which the oracle can see.

The one behavioural divergence in the whole T1 set is still plain runs 1 and 3 disagreeing with each
other on the empty `?priority=` — the exact axis both governed runs and the plain+ask arm stopped
for. That remains the strongest single argument for the stop, and it is n=2.

## 7. Status

- Governed run 3 artifacts: [`evidence/T1-run3/`](evidence/T1-run3/) — captured live from the
  uncommitted working tree, including `short-circuit.json` and the full seven-verdict scan trail.
- Plain arms: [`evidence/T1-plain/`](evidence/T1-plain/README.md) · plain+ask:
  [`evidence/T1-plain-ask/`](evidence/T1-plain-ask/README.md).
- **T1 is the only task with a governed measurement.** T2–T5 governed remain unrun, so every
  multiplier past T1 in this kit is still a projection.
