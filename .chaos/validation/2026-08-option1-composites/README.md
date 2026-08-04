# Option-1 composites — pre-registered measurement kit

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** CHAOS runs only
> *inside* the governed arms.
>
> **Pre-registration.** §3 and §4 are frozen **at the commit that lands this kit, before any
> arm runs**, and are **never edited to match results**. This program is 0-for-7 on plausible
> cost levers; a negative result is a valid outcome and gets written up as one.

## 1. What is under test

The **frame/close composites** (`tools/chaos-loop/loop.py`, design of record
[wall-clock lever plan §Option 1](../../../docs/design/2026-08-04-wall-clock-lever-plan.md)):
the 8-invocation frame chain and 7-invocation close chain of the measured `chaos:run` loop
each collapse to ONE packet call + ONE agent deliberation (a single input file) + ONE commit
call. `chaos-run` SKILL.md routes framing and close through the composites; the work loop
stays granular (`scan.py rescan|k2|merge`).

**What the composites change: the call surface only.** They run the granular tools' own
entry points in-process, and `tools/chaos-loop/test_chaos_loop.py` enforces the fidelity
contract at unit level: the granular sequence and the composite pair, driven with identical
inputs, leave a **byte-identical `.chaos/changes/<id>` tree** (timestamps pinned). Judgement
is never tool-authored — the composites move the agent's bytes and fail closed on anything
empty, on cite-less raises, and on any attempt to overwrite a derived fact.

**Mechanism being priced:** T1 (product conditions) issued 22 governance-CLI invocations,
three of them `--help`; 43–48% of deliberation bursts preceded classification machinery, and
the API calls issuing governance CLIs carried 15–19% of governed output tokens. The
composites remove ~13–17 model-visible round-trips and the inter-step deliberation between
them; the `--help` class disappears because each packet prints the exact next command.

## 2. Setup (the lever-run kit is the template — everything held constant)

| Held constant | Value |
|---|---|
| base commit · tasks · bands · oracles · pairs | identical to [`2026-08-lever-run`](../2026-08-lever-run/README.md) §1/§2 (base `d27600f`, never the `demo/dotnet` tip; frozen prompts lifted programmatically) |
| arm model (ceiling) | Opus 5 · mid Sonnet · floor Haiku (L1 tier map) |
| **effort** | **`high`, recorded per arm in the results** — lever run 2 ran an unrecorded `xhigh`; that confound is why this row exists |
| speed | `standard` (fast mode is excluded as a lever by creator decision) |
| denominator | the within-session plain arm, re-run, never borrowed |
| comparator (baseline) | **lever run 1** (`2026-08-lever-run`, effort `high`) — the clean like-for-like series; run 2 (`xhigh`) is NOT a comparator |

**The one variable:** the governed arms run the toolkit tip **with the composites and the
routed skill** against lever run 1's toolkit, which differs only by the granular
frame/close choreography.

## 3. Frozen fidelity gates (stop-the-analysis; any failure closes the route, L1-D11)

1. **Oracle green in every arm, both paths** — the same 19-check oracle set the lever-run
   kit uses; a fast arm that ships a defect is a failure, not a time.
2. **Classifier-verdict equality vs lever run 1** — the composites change the surface,
   never the classification: same fired triggers, same final vectors as the run-1 measured
   verdicts per pair. Any verdict flip is a defect finding, reported, never tuned away.
3. **Artifact-set equivalence** — every artifact class present in the run-1 arm (records,
   verdicts, packets, TRG events, ledger, rendered `change.md`/`lifecycle.md`, owed
   OpenSpec/ADR) present in the composite arm; obligation audit passes at every close.
   Byte-level parity is already enforced by the unit parity test; the arm-level assert is
   set-equivalence plus audit, because judgement prose legitimately varies run to run.
4. **Governance-CLI invocation ceiling: ≤ 4 + 2×(work units) per arm.**
   *Correction, recorded before freezing:* the lever plan estimated "≤ 5/arm", but that
   arithmetic missed the work loop, which stays granular by design — and the first K3 over
   a fresh diff always demands adjudication, so each work unit costs `rescan` + `merge`.
   A single-unit change therefore bottoms out at 6: `frame`, `frame-commit`, `rescan`,
   `merge`, `close`, `close-commit`. The plan's number was an estimate; this kit's gate is
   the binding freeze, corrected **before** any arm runs, not after.

## 4. Frozen direction tests (the falsification)

- **Output tokens: −15% or better** on governed arms vs the matching lever-run-1 arm.
  If tokens do **not** fall, narration volume is a style constant rather than
  per-step — the option dies and that finding matters more than the option.
- **Wall clock: −2 min or better per change** on the independent stopwatch
  (`tools/chaos-stopwatch`), band A watched specifically (run-1 band A: 15.0 min).
- **Secondary, reported not gated:** governance-CLI invocations per arm (expected 6–8 vs
  run 1's 16–39); share of deliberation bursts preceding classification machinery
  (expected to fall from 43–48%).

Expected effect, honestly stated from the resolved cost model (~2 s fixed/call,
~92 tok/s): **−2–3 min per band-A change**. The top of the plan's earlier 2–4 range assumed
more deliberation is step-adjacent than the burst attribution strictly proves.

## 5. Interaction with the queued product-conditions T1 re-run

`2026-08-product-conditions` §9 froze the T1 re-run prediction (**16–21 min**) for a toolkit
carrying only the two defect repairs (`805b5c9`, `ca7ce7d`). That section is frozen and is
not edited. If the re-run executes on a demo workspace aligned to a toolkit tip that
includes the composites, it measures **defect repairs + composites jointly** and must be
read that way — or the workspace is aligned to a pre-composite commit to keep the frozen
prediction's scope. Decide and record which, in that kit's procedure log, before the re-run.

## 6. Status log (never back-dated)

- 2026-08-04 — composites built (`tools/chaos-loop/loop.py`), parity + behavior suite green
  (11 tests; sibling tool suites 160 tests unregressed), `chaos-run` SKILL.md routed through
  the composites. §3/§4 frozen at the landing commit. **No arm has run.**
- 2026-08-04 — **option 2 (zero-trigger short-circuit) landed after this kit froze.** Arms
  executing on the toolkit tip therefore price options 1+2 **jointly** against lever run 1;
  the option-2 kit ([`2026-08-option2-short-circuit`](../2026-08-option2-short-circuit/README.md))
  records the joint reading, the curve gate, and the optional pinned-to-`1c1e707`
  attribution arm. This kit's §3/§4 gates stand unchanged.
