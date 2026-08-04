# Lever run 2 results — the repairs held, the band opened, the cost case did not close

> Pre-registration: [`README.md`](README.md) §3/§4/§5, frozen and committed (`95cfb67`)
> **before any arm ran**. Nothing below edits it. 12 arms, 0 agent errors, 126 min,
> 1.25 M subagent tokens, Opus 5, base `d27600f`.

## 1. The headline

**Every fidelity prediction held. The cost prediction "held" for the wrong reason, and my own
direction test failed.**

| | Stage D | Run 1 | **Run 2** | bar | predicted |
|---|---:|---:|---:|---:|---|
| Band A | 4.81× | 8.34× | **5.57×** | ≤2.0× | 4.0–6.5× ✓ |
| Band B | 5.51× | 7.37× | **5.62×** | ≤3.0× | 4.5–6.5× ✓ |
| Governed output, 6 arms | 273,539 | 398,494 | **371,287** | — | −15…−30% ✗ (**−6.8%**) |
| Plain output, 6 arms | 51,396 | 52,394 | **66,246** | — | (**+26.4%**) |

**The ratios improved mostly because the denominator got more expensive, not because the
governed arms got cheaper.** Plain arms rose **+26.4%** between sessions for byte-identical
prompts and identical work; governed fell only **6.8%**. My pre-registered direction test
required governed absolute to fall **≥10%** — it did not. **On the test I designed to catch
exactly this illusion, the run fails.**

Per-band the illusion is starker: band A's governed output fell **1.7%** (105,828 → 103,978)
while its ratio "improved" from 8.34× to 5.57×, because its plain arms rose **47%**. Reading
the ratio alone would have reported a 33% improvement that mostly did not happen. This is
precisely why the RUNKIT invariant reports the governed absolute beside every ratio, and why
the within-session denominator lock (§1 of the cost-bar doc) exists.

**Quality held: 0 oracle failures on 12/12** (29/29 · 19/19 · 20/20 · 15/15 · 19/19 · 15/15).
Audit exit 0 on 6/6 plus **6/6 independent out-of-band replays**.

## 2. The D1–D5 repairs: confirmed in the wild

| Prediction | Result |
|---|---|
| **X2 = 0 on 6/6** (the sharpest test in the kit) | **HELD — X2 fired zero times.** It fired 6/6 in run 1 purely because `--self-review` took free text. The constrained choice removed an unowed review pass *and* an unowed verify pass from every arm |
| No `RUN-DEC` render failures | **HELD** — no arm reported the D1 blocking failure; renders and decision counts were clean |
| No `mode: null` rejections | **HELD** — the D2 widening carried |
| B3 clean, C-15 holds | **HELD** — B3 fired **nothing at all**, exactly as registered |

Fired triggers: P1 `M2,M1,M3,M4` · P2 `M2,M1,M4` · P3 `M2,M1,M4` · B1 `M3` · B2 `M4` ·
B3 *(none)*. Against registration: P1 additionally raised **M3** by adjudication (the arm's
argument, recorded: a new mandatory precondition on five already-public routes is invisible to
the route-delta scan because the route *set* is unchanged — the "breaking before the diff
exists" case rule 12 carves out). B1 fired only `M3`, not `M2+M4`. Both are divergences from
the registered table, scored as such; neither is instrument-caused this time.

## 3. The tier band: **it opened — and then could not be acted on**

**T0 fired on 5 units across 3 arms** — B1 (1), B2 (2), B3 (2), all via **Route B**, citing
pinned statements. Run 1's count was **zero**. By the registered criterion ("any non-zero T0
count is the amendment working"), **the band works**: the gates admitted exactly the units the
design predicted (band-A implementation), and correctly refused the rest.

Refusals were correct and well-cited: P1 unit 1 `T2/coupled-evidence` ("C-001 reads on the
fired surface contract-dependency"), P1 unit 2 `T2/fired-surface` (the auth class), P2/P3
`T2/fired-surface` on the persistence class. **Gate 3 — the coupling gate the creator added —
fired on a real case**: P1's tests were refused floor tier precisely because they encode a
fired surface's contract, which is the P1-C-007 lesson working as designed.

**But `modelInvocations` is `ceiling:1 mid:0 floor:0` on 6/6 again — and this time the cause
is the harness, not the design.** All three arms independently diagnosed it: **a workflow
subagent cannot spawn nested subagents** — there is no Task/Agent tool in an arm's toolset, so
`chaos-mechanical-executor` was unreachable. The T0-banded units were executed **inline at
ceiling**. The arms correctly declined to record escalations (nothing failed; the capability
was simply absent), leaving the budget unspent at 0/2 on 6/6 — the contract was understood.

**Consequence, and it is the most important sentence in this document: the oracle result does
NOT vindicate Route B.** Route B units were banded at floor and then run at ceiling, so the
route's *safety* — a floor-tier model implementing against pinned statements with no
pre-existing validator — remains **completely untested**. Nothing here licenses trusting it.

**L1 is therefore unmeasurable in this harness as constructed**, and no amount of re-running
it will change that. Measuring L1 requires one of: arms that can spawn subagents; a workflow
that performs the tier delegation itself (the script spawning the tiered agent, not the arm);
or measurement outside a workflow entirely.

### 3.1 The delegation path itself is fine — verified, not assumed (2026-08-04)

**This is a limitation of the measurement apparatus, not of the product**, and the distinction
matters enough to have been checked rather than reasoned about. Spawning
`chaos-mechanical-executor` from a **main session** — the way a real `chaos:run` invoked from
chat or CLI would — works end to end: the agent launched, ran as
**`claude-haiku-4-5-20251001`** (the pinned floor tier), executed its named validator
(`digest.py --check`, exit 0) and returned the required contract response shape, in 12 k tokens
and 19 s.

The asymmetry is structural: a measurement **arm is itself a subagent**, and a subagent has no
Agent/Task tool, so it cannot nest another one. A main session does. Therefore:

- **A real `chaos:run` tiers normally.** Nothing in §3 says otherwise, and nothing here should
  be read as "the tier band does not work in practice."
- **Only the harness is blind to it.** Every L1 number in runs 1 and 2 is structurally zero
  because of where the arms sit in the agent tree, not because the band failed to route.
- **Route B's safety is still untested** — that conclusion is unchanged. The delegation path
  working says nothing about whether a floor-tier model implements pinned statements
  *correctly*; only a run where T0 units actually execute at floor can answer that.

## 4. L2/L3/L4 diagnostics

| | Stage D | Run 1 | Run 2 |
|---|---:|---:|---:|
| reasoning share of governed output | ~61% | 52.6% | **55.4%** |
| classification machinery (deliberation) | 48.3% | 43.2% | **49.6%** |
| governance artifacts | 12.1% | 11.6% | **10.3%** |
| fixed-corpus read volume (mean/arm) | ~122,205 | ~64,527 | **~68,437** |

L2 holds its ~44% reduction against Stage D but still misses its ≤40,000 target. **L3's target
went the wrong way**: classification machinery rose to 49.6%, above Stage D's 48.3%, with
"scan prep / other bash" still 25.6% and the scan tool itself 24.0% — the wrapper is being
used heavily, and the reasoning around it did not shrink. Artifacts continue to be the
smallest cost center (10.3%), exonerated a fourth time.

## 5. What this run establishes

1. **The repairs are real and confirmed in the wild** — X2 silenced 6/6, no D1/D2 failures.
   That work was necessary and is done.
2. **The tier band is correct and opens** — 5 T0 verdicts where run 1 had 0, with every
   refusal correctly cited, including the coupling gate.
3. **L1 remains unmeasured**, for a harness reason rather than a design or product reason —
   the delegation path itself was **verified working** from a main session (§3.1). Route B's
   safety is untested and must not be assumed.
4. **The cost case did not close.** Governed output fell 6.8% against a required 10%; the
   headline ratio improvement is mostly denominator movement.
5. **Cross-session ratio comparisons are unsafe** at this variance (plain +26.4%, band A plain
   +47% for identical work). Any future claim must lead with the governed absolute.

## 6. What must happen before another measurement

1. **Fix the harness before re-measuring L1, or stop claiming L1 can be measured.** Preferred:
   the workflow script performs the tier delegation itself, so the tiered model actually runs.
   Until then every L1 number is structurally zero. **Note this is a harness change only** —
   the product path is verified (§3.1), so nothing about `chaos:run` needs to move.
2. **Do not re-run for cost alone.** Two runs now say the residual is not where the levers
   aimed: machinery is back to 49.6% while artifacts sit at 10.3%.
3. **Re-base the bar** (the §7 question, still open with the creator). At plain-arm variance of
   ±26–47%, an output-token ratio is not a stable instrument, and this run is the second
   demonstration.

## 7. Caveats

- Output-token proxy only; no input tokens.
- **Two variables were bundled** (repairs + band), so the token delta cannot be split between
  them; the fidelity table separates their signatures, which is why X2 and the tier counts are
  reported independently of cost.
- Governed arms again delivered more tests than plain (P1 29 vs 20 under the oracle).
- Time is arm-self-reported.
