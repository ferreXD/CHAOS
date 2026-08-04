# Lever-run results — all four levers priced together

> Pre-registration: [`README.md`](README.md) §3/§4/§5, frozen and committed (`95d508b`)
> **before any arm ran**. Nothing below edits it. 12 arms, 0 agent errors, 125 min,
> 1.27 M subagent tokens, Opus 5, base `d27600f`.

## 1. The headline, stated plainly

**The cost case failed, and failed worse than Stage D.** This is the **sixth** cost hypothesis
to die in this program.

| | Stage D | **Lever run** | bar | verdict |
|---|---:|---:|---:|---|
| Band A (zero-trigger) | 4.81× | **8.34×** | ≤2.0× | **MISS, regressed** |
| Band B (single-surface) | 5.51× | **7.37×** | ≤3.0× | **MISS, regressed** |
| Governed output, 6 arms | 273,539 | **398,494** | — | **+45.7%** |
| Plain output, 6 arms | 51,396 | 52,394 | — | +1.9% (denominator stable) |

Pre-registered prediction was band A 2.5–4.0× and band B 3.0–4.5× — **both missed, in the wrong
direction**. The denominator did not drift (plain arms within 2% of Stage D), so the regression
is entirely in the governed arms.

**Quality held: 0 oracle failures on 12/12** (P1 37/37 · P2 16/16 · P3 19/19 · B1 15/15 ·
B2 19/19 · B3 16/16, both arms). The stop-the-analysis gate did not trip, so the cost reading
is valid. The obligation audit closed **exit 0 on 6/6**, independently replayed out of band on
6/6.

## 2. Why — three instrument defects, all shipped by this program, all mine

The regression is **not** mostly a lever effect. Three defects in the levers' own build forced
unowed work on every governed arm. They are reported here rather than repaired-and-re-run,
because a re-run before understanding them would have hidden them.

| # | Defect | Blast radius | Cost mechanism |
|---|---|---|---|
| **D1** | **`render.py` does not know the `RUN-DEC-*` prefix.** `ENTRY_HEADING_RE`, `REF_TOKEN_RE` and `PREFIX_STAGE` hardcode `(PROP\|REV\|APPLY\|APP\|VFY\|VER\|CR\|SYNC\|ARC\|RETRO)` while `chaos-run`, the digest, the tier map and `chaos-scan`'s tests all mandate `RUN-DEC-*` | **6/6 arms** | The renderer parsed **zero** decisions from a fully conformant ledger; deliver deviations hard-failed with "cites unknown decision RUN-DEC-002"; close was blocked. Arms spent real deliberation diagnosing it, and at least one patched the instrument mid-run |
| **D2** | **`record.py` emits `mode: null`** when no preset flag is given (correct per `classification-state.json`), but the record schema's `mode` is a closed enum with no representation for "no preset" | several arms | Render validation rejection → repair loops → arms wrote `light` and documented the lie |
| **D3** | **`scan.py k4 --self-review` takes free text** and fires X2 for anything but the literal `clean` | **6/6 arms** | Every arm passed `pass`/`PASS`; **X2 fired on all six**, raising `review→2` and `verify→1`. Arms then paid for an independent review pass and a verify pass **they did not owe** |

D3 is the most expensive and the most instructive: it is a **usability defect that manufactures
governance**. The classifier did exactly what it was specified to do; the tool let a
well-behaved agent trip it, six times out of six.

## 3. Fidelity — the pre-registered expectations moved, and D3 explains most of it

| Pair | Registered vector | Measured | Divergence |
|---|---|---|---|
| P1 | `1·1·0·1·1·1·2` | `1·1·0·**2**·1·1·2` | review 2 ← **X2 (D3)** |
| P2 | `1·1·0·1·1·1·2` | `1·1·0·**2**·1·1·2` | review 2 ← **X2 (D3)** |
| P3 | `1·1·0·1·1·1·2` | `1·1·0·**2**·1·1·2` | review 2 ← **X2 (D3)** |
| B1 | `1·0·0·0·1·1·1` | `1·1·0·**2**·1·**2**·…` | review 2 ← X2; **openspec 2** (over-detection) |
| B2 | `1·0·0·0·0·0·0` (nothing fires) | `1·1·0·**2**·1·**1**·…` | **M4 fired** + X2 ⇒ band A ran OpenSpec **and** verify it did not owe |
| B3 | `1·0·0·0·0·0·0` (nothing fires) | `1·0·0·**2**·1·0·0` | **X2 only** ⇒ verify ran on a zero-materiality change |

Firings recorded by the classifier itself: P1/P2/P3 `M2,M1,M4,X2` · B1 `M2,M4,M3,X2` ·
B2 `M4,X2` · B3 `X2`.

**Scored in both directions, as registered.** The materiality verdicts reproduced Stage D
(M1+M2 same surface on the frozen-3, M3 on B1, M4 as the C-16/C-17 pair predicted). The
divergences are: **X2 on 6/6 (instrument-caused, D3)**, **B2's M4** (genuine over-detection on a
band-A task — two material questions were surfaced where the registration expected none), and
**B1's openspec 2** (a second distinct surface was counted where Stage D counted one).
B3 stayed clean of X1 — **C-15 continues to hold**, now validated a second time.

**Stops:** `newStopsTotal` = 0 on 6/6 as registered; absorption fired 0 times as registered
(and therefore remains **UNVALIDATED**, same as Stage D). Two arms surfaced an S3 discordance —
P1's is the best evidence in the run that real judgement happened: four tests falsified the
approved auth mechanism (minimal-API parameter binding runs *before* endpoint filters, so an
unauthenticated POST with no body returned 400 before 401, violating the contract's ordering
clause), and the fix was routed through a recorded decision plus an in-place ADR amendment.

## 4. The levers, scored individually

### L1 — model tiering: **never engaged. Untested.**

**`ceiling:1 mid:0 floor:0` on all six arms. Zero delegations. Zero escalations.** The
transcript-derived count agrees exactly with every arm's self-report: **12 invocations, all
`claude-opus-5`, 100% of tokens at ceiling** (the §5 cross-check found no discrepancy — the loop
knew exactly what it spent, because it spent nothing elsewhere).

Two independent reasons, both design faults rather than agent misbehaviour:

1. **The easy gate never opened.** It requires *zero triggers fired*, but the first scan fires
   something on essentially every real change: M2 at scan 1 (P1, P2, P3, B1), M4 at scan 3 (B2),
   X2 at scan 6 (B3). A gate that closes before the first implementation unit exists can never
   route implementation to mid tier. **L1-D11 as specified is inert.**
2. **The floor steps never occurred.** Render/audit repair loops were the delegable work; with
   D1 blocking the renderer, arms were diagnosing a tool defect, not running a repair loop the
   executor could take.

**L1's frozen predictions are unscored, not falsified.** Nothing was measured because nothing
was delegated.

### L2 — corpus amortization: **large real reduction, prediction still missed**

Measured with one instrument across both runs (the Stage-D figure was re-derived, not quoted):

| | Stage D (mean/arm) | Lever run (mean/arm) | change |
|---|---:|---:|---:|
| fixed-corpus read volume | ~122,205 chars | **~64,527 chars** | **−47%** |
| total read volume | ~160,776 chars | ~111,383 chars | −31% |
| distinct files read | 24–30 | 21–28 | small |
| reading-the-surface deliberation | 17.4% | **16.2%** | −1.2 pt |

Frozen prediction was **≤40,000 chars**: **missed**. The digest halved the fixed corpus but
did not quarter it, and the *deliberation* spent reading barely moved — arms still read the
loop skill, the digest, and change-specific context, and D1/D3 sent several back into source
files to diagnose tool behaviour. `digestCheckExit: 0` and `digestUsed: true` on 6/6, so the
lever was genuinely exercised and the fallback path never fired.

### L3 — protocol mechanization: **moved its target, nowhere near enough**

| | Stage D | Lever run |
|---|---:|---:|
| reasoning share of governed output | ~61% | **52.6%** |
| classification machinery (share of deliberation) | 48.3% | **43.2%** |
| governance artifacts | 12.1% | 11.6% |

The §5c prediction (band B → ~4.4×, band A → ~3.9×, *both still missing their bars*) predicted
the **direction** correctly on structure — reasoning share fell 8.4 points and machinery fell
5.1 — but the **cost** went the other way. Attribution note, stated because it changes how the
number reads: the Stage-D script bucketed `scan.py` calls as "scan prep / other bash"; a kit-
local copy adds explicit `run scan tool (L3)` / `run record tool (L4)` labels and **reproduces
Stage D's original 48.3%/12.1% exactly**, so the comparison is instrument-clean. Even so,
**"scan prep / other bash" is still 23.7%** of deliberation — the wrapper absorbed the payload
and sequence work, but a large residue of hand-run bash remains, much of it defect diagnosis.

### L4 — derived records: **honesty guard held; volume unmoved**

- **`judgementAutoFilled: false` on 6/6.** The emitter never filled a judgement field in the
  wild — the L4-D5 guarantee held under real conditions, not only in unit tests.
- `handWroteRenderedArtifact: false` on 6/6; the renderer remained the sole writer.
- Records' share of visible output: **7.5% of deliberation** went to authoring records
  (Stage D: comparable band). The frozen ≤15%-of-visible-output prediction cannot be scored
  cleanly from this run's instrumentation — recorded as **unscored**, not as a pass.

## 5. What this run actually establishes

1. **Four levers, built and exercised end-to-end, made governed delivery *more* expensive** —
   +45.7% governed output versus Stage D. Reported as found.
2. **Most of that is attributable and fixable**: three of the program's own defects (D1–D3),
   two of which (D1, D3) hit 6/6 arms and manufactured work no design asked for.
3. **The structural targets did move**: reasoning 61%→52.6%, machinery 48.3%→43.2%, fixed-corpus
   reads −47%. The levers do what they claim; the claim is just not worth what it costs yet.
4. **L1 is inert as designed** — the easy gate cannot open on real changes, so the single lever
   predicted to cut *price* (rather than tokens) has never been exercised.
5. **The cheapest available win is not another lever.** It is fixing D1–D3, which cost real
   tokens on every arm, and re-specifying L1-D11's gate so it can open.

## 6. What must happen before any further measurement

Ordered by evidence, not by ambition:

1. **Fix D1** (`render.py` prefix set — the same `RUN` omission already fixed in the schemas but
   not in the renderer's own regexes), **D2** (`mode` needs a "no preset" representation), and
   **D3** (`--self-review` must be a constrained choice, not free text). All three are small,
   all three are validator-adjacent, and all three cost real tokens on 6/6 arms.
2. **Re-specify the L1-D11 easy gate.** "Zero triggers fired" is unreachable. A workable form
   has to key on the *vector*, not on trigger absence — e.g. mid tier allowed while
   `evidence.breadth 0` and `review ≤1` and the unit touches no fired surface. That is a design
   decision for the creator, not a tuning knob.
3. **Only then re-measure**, with the same kit, a fresh pre-registration, and a new RUNKIT row.
   The D1–D3 repair alone plausibly recovers a large share of the +45.7%, and until it is
   removed no lever number from this run can be called final.

## 7. Caveats that travel with these numbers

- Tokens are an **output-only proxy** (`budget.spent()` deltas); no input tokens. L1 and L2 are
  structurally under-measured by it — which is exactly why §5's invocation table and the
  read-volume diagnostic exist.
- **Blended cost was not computed**: with 100% of invocations at ceiling there is nothing to
  blend. The §7 bar re-base (blended cost + wall time) remains an **open creator decision** and
  was not silently taken here.
- Time is arm-self-reported. Governed wall time ran 1,348 s (P1) and comparable elsewhere.
- Governed arms wrote **more tests** than plain arms (P1 28 vs 19, and the oracle run shows
  37 vs 28 passing) — part of the token gap is extra delivered work, not pure overhead.
- One analysis-instrument bug was found and fixed **before** any number in this document was
  taken from it: `read-volume.py` originally ordered transcripts by filename hash instead of
  journal start order, which assigned governed reads to plain arms. Fixed, re-run, and the
  corrected output is what §4 reports.
