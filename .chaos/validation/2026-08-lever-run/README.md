# Lever-run measurement kit — L1+L2+L3+L4 priced together, once

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** No `chaos:propose`, no
> decision runtime, no governance artifacts for the harness itself. CHAOS runs only *inside* the
> governed arms.
>
> **Pre-registration.** §3, §4 and §5 below are frozen **before any arm launches** and are
> **never edited to match results**. Five cost hypotheses have already died in this program
> (Stage-B light, Stage-B standard, Stage-C core, Stage-C extended, Stage-D). A negative result
> is a valid outcome and gets written up as one. **Do not carry a prior stage's verdicts forward
> blindly — that error cost Stage D three of six fidelity rows.**

Designs of record, all landed before this kit:
[L2](../../../docs/design/2026-08-03-l2-corpus-amortization.md) (`b7f21f1`/`7d05572`) ·
[L1 + ceiling amendment](../../../docs/design/2026-08-03-l1-model-tiering.md) (`3bd1700`/`8dc3f5e`) ·
[L3+L4](../../../docs/design/2026-08-03-l3-l4-scan-and-record.md) (`b9f4867`/`e192a0c`) ·
[the graduated bar + §5c frozen prediction](../../../docs/design/2026-08-03-cost-bar-and-run-collapse.md).

**What is under test:** the four levers *together*, as the creator directed — one run prices
them jointly, not one at a time.

## 1. The one variable

| Held constant | Value |
|---|---|
| base commit | `d27600f` (frozen; **never** the `demo/dotnet` tip `df26104`, which ships JWT auth + 34 tests and invalidates the tasks and every oracle) |
| plain-arm prompts | **byte-identical** to the step-5/Stage-D tiers, lifted programmatically by `build-workflow.py` (never retyped); plain worktrees get **no staging** |
| tasks · bands · oracles · pairs | identical to Stage D |
| **arm model (ceiling)** | **Opus 5** — same as Stage D and step 5, so ratios AND absolutes stay comparable. Mid = Sonnet, floor = Haiku, per the L1 tier map |
| denominator | the **within-session plain arm** (the §1 lock), re-run, never borrowed |

**The variable:** the governed arm runs the **post-lever toolkit** — governance digest (L2),
tiered delegation with the ceiling rule (L1), `chaos-scan` (L3) and `chaos-record` (L4) — against
Stage D's `chaos:run` loop. Everything else is Stage D's setup.

## 2. Arms (12, sequential for clean per-arm `budget.spent()` deltas)

| Pair | Band | Task | Plain variant | Stage-D denominators (tok ratio) |
|---|---|---|---|---|
| P1 | B | `require-api-key-auth` | frozen `ea-x2` | 5.51× band Σ |
| P2 | B | `soft-delete-tasks` | frozen `ea-x2` | " |
| P3 | B | `optimistic-concurrency-updates` | frozen `ea-x2` | " |
| B1 | B | `task-count` | Cost-B | " |
| B2 | A | `filter-tasks-by-status` | Cost-B | 4.81× band Σ |
| B3 | A | `enforce-title-max-length` | Cost-B | " |

**To beat:** band A **4.81×**, band B **5.51×** (Stage D, output tokens vs within-session plain).
Bars: **≤2.0×** (A), **≤3.0×** (B). Governed absolute is reported beside every ratio.

## 3. Pre-registered classification expectations (frozen; never edited)

**The levers move who performs mechanical steps, never what is decided.** Same verdicts as
Stage D measured — including B3 clean under C-15, which Stage D validated:

| Pair | Expected triggers | Expected final vector (`stops · ev.t · ev.b · review · verify · openspec · adr`) | openspec | ADR | verify |
|---|---|---|---|---|---|
| P1 | M1 + M2 same surface (auth) + M4 | `1 · 1 · 0 · 1 · 1 · 1 · 2` | 1 | yes | runs |
| P2 | M1 + M2 same surface (data-store) + M4 | `1 · 1 · 0 · 1 · 1 · 1 · 2` | 1 | yes | runs |
| P3 | M1 + M2 same surface (data-store) + M4 | `1 · 1 · 0 · 1 · 1 · 1 · 2` | 1 | yes | runs |
| B1 | M3 additive at a diff scan | `1 · 0 · 0 · 0 · 1 · 1 · 1` | 1 | yes (entry) | runs |
| B2 | **none** | `1 · 0 · 0 · 0 · 0 · 0 · 0` | 0 | no | **does not run** |
| B3 | **none** | `1 · 0 · 0 · 0 · 0 · 0 · 0` | 0 | no | **does not run** |

M4 on the frozen-3 is registered because Stage D measured it firing on 3/3 (C-16/C-17 validated
as a pair, `openspec` still 1) — this is a measured fact carried forward deliberately, not an
assumption inherited unexamined.

**Stops:** every arm places exactly one S1 floor stop; trigger-created `newStopsTotal` = **0**
expected on all six. **Absorption is expected 0** and a non-zero count is a finding to explain,
not a pass. S3 is agent-judged, recorded not scored.

**The audit gate:** every arm closes `audit.py` **exit 0**. Repairs along the way are the gate
working; closing with a failing audit, or never running it, is a build defect.

**Registered hazard (carried from Stage D):** the continuous rule can legitimately move firing
order. Divergence is scored in **both** directions and its cause attributed before it is called
a regression.

## 4. Pre-registered cost + lever predictions (frozen)

**L3 — restated verbatim from cost-bar §5c, frozen before any lever was built and NOT
re-opened:** classification machinery is 48.3% of deliberation, deliberation ~61% of output ⇒ up
to ~29% of governed output addressable; if the wrapper captures two-thirds, **band B → ~4.4×,
band A → ~3.9× — both still missing their bars.** That miss is the honest prediction.

**Joint expectation (all four levers, this run):**

- **Band A: 2.5×–4.0× · Band B: 3.0×–4.5×.** Predicting the bars are **still missed** on this
  attempt, with band A closer than band B.
- **L1 (price):** cheap/mid share of governed output **10–25%**; band-A blended cost
  **−25% to −45%** vs ceiling-only; total tokens **≤ +5%** over an untiered run (the overhead
  guard's ceiling — more means the guard failed).
- **L2 (input):** fixed-corpus read volume **~147.6k → ≤ 40k chars/arm**; reading-the-governance-
  surface deliberation **17.4% → single digits**.
- **L4 (output):** records' share of visible output **29.6% → ≤ 15%**; **zero** auto-filled
  judgement fields across all six governed arms (the L4-D5 honesty guard, spot-audited in
  evidence, not only unit-tested).
- **Fidelity:** unchanged, per §3. Any movement is scored in both directions.

**Quality is a stop-the-analysis gate.** Oracle must stay **19/19** (P1–P3) and **16/16**
(B1–B3) across both arms. A cheaper governed arm that breaks the oracle is a defect, not a
result. **Additionally (L1-D11):** an oracle regression on an arm that used the mid tier for
implementation **closes L1-D11** — the easy gate reverts to ceiling-always rather than being
tuned.

## 5. Model-invocation accounting (creator requirement, 2026-08-03)

**Every arm registers how many times each model was invoked.** Two independent sources, both
recorded, and **disagreement between them is itself reported**:

1. **Self-reported** (`modelInvocations` in the arm telemetry): `"ceiling:<n> mid:<n> floor:<n>"`
   — one count per *agent invocation*, the ceiling count including the arm's own top-level run.
   Plain arms report `ceiling:1 mid:0 floor:0` by construction.
2. **Independently derived** from the workflow transcripts by
   `harness/count-invocations.py`: subagent spawns per model + the arm agent itself, with output
   tokens attributed per model. This is the authoritative number; the self-report measures
   whether the loop *knows* what it spent.

Reported per arm and per band in `results.md`, next to the blended-cost diagnostic (L1-D8).
Because L1 is invisible to output tokens, **this table is how L1 is actually scored.**

## 6. Files

| File | Role |
|---|---|
| `harness/setup-lever-worktrees.sh` | 12 detached worktrees off `d27600f`; stages the **post-lever** toolkit into `*-armA` only |
| `harness/lever-arms.template.js` + `build-workflow.py` | the workflow; plain prompts lifted verbatim (sha256-fingerprinted) |
| `harness/count-invocations.py` | per-model invocation + token accounting from the transcripts (§5) |
| `harness/read-volume.py` | per-arm read volume and fixed-corpus share (L2-D4 diagnostic) |
| `args.example.json` | session-specific worktree paths |
| `results.md` | the scorecard (after the run) |

Reused unchanged from the Stage-D kit (referenced, not duplicated): `score-arm.sh`,
`archive-evidence.sh`, `attribute-arm.py`, `decompose-output.py`, the held-out oracles and task
statements.

## 7. Caveats that travel with every number

- Tokens are an **output-only proxy** (`budget.spent()` deltas around sequential agents).
- Time is **arm-self-reported** (`date +%s`), not an independent stopwatch.
- Blended cost uses published per-model prices at run date; it is a **diagnostic**, not the bar
  (the §7 bar re-base remains an open creator decision — not silently taken here).
- Plain-arm variance between sessions is large (Stage D: 10,630 → 16,176 for identical work),
  which is why the denominator is within-session and absolutes are always reported.

## 8. Procedure log

Filled in as the run proceeds; never back-dated.

- 2026-08-03 — kit authored; §3/§4/§5 frozen **before** any worktree was created.
- 2026-08-03 — harness built. Plain prompts lifted programmatically by `build-workflow.py`;
  sha256[:16] **identical to Stage D's** — frozen `ea-x2` `d28ced5572833c47`, Cost-B light
  `799be1dd6fefc2a5`, statements `d058e37b89ffaa89`. The denominator is preserved by
  construction, not by trust.
- 2026-08-03 — telemetry schema measured **before** launch (the Stage-D trap): **2,919 bytes**
  serialized, 32 properties, against the 6.3 KB rejection and 3.6 KB working precedent. Room was
  made by dropping every field recoverable from archived evidence (fired triggers, checkpoints,
  raises, TRG/decision ids, openspec paths) — self-report is now reserved for honesty fields,
  process counts, and the §5 model-invocation accounting.
- 2026-08-03 — 12 worktrees created on `d27600f` at `C:/lr`; post-lever toolkit staged into the
  6 `*-armA` only; **21/21 sanity checks pass**, including two new ones this kit adds: the
  digest must be **fresh inside the worktree** (or every arm silently takes the L2 fallback) and
  `classify.py` must be **byte-identical** to the repo copy (the levers must not have moved the
  classifier). One check was authored wrong and corrected before use: it asserted the plain arm
  had no `.claude/agents/` or `chaos-shared/`, but both exist at `d27600f` — the real invariant
  is that the plain worktree is **pristine at the base commit**, which is what it now asserts.
- 2026-08-03 — end-to-end smoke test inside `B2-armA` before launch: `scan.py k1` → `rescan`
  (fired M5 correctly on a deliberately out-of-scope edit, appended `TRG-001` itself) →
  `record.py deliver` (facts derived, judgement empty, `scopeDrift` correctly left empty because
  M5 had fired). Smoke artifacts reverted; subject paths verified pristine; digest still fresh.
  **This commit is the pre-registration: it lands before any arm runs.**
- 2026-08-04 — 12 arms ran to completion: 125 min, 0 agent errors, 1.27 M subagent tokens.
- 2026-08-04 — scored all 12 arms against the held-out oracles: **0 failures on 12/12**
  (37/37 · 16/16 · 19/19 · 15/15 · 19/19 · 16/16). Quality gate holds ⇒ the cost reading is
  valid. Evidence archived; obligation audit independently replayed out of band: **exit 0 on
  6/6**.
- 2026-08-04 — analysis instrument corrected **before** any number was reported from it:
  `read-volume.py` ordered transcripts by filename hash instead of journal start order, which
  assigned governed reads to plain arms. Fixed and re-run. Separately, a kit-local copy of
  `decompose-output.py` adds `run scan tool (L3)` / `run record tool (L4)` labels (the Stage-D
  copy bucketed them as "scan prep"); it **reproduces Stage D's original 48.3%/12.1% exactly**,
  so the cross-run comparison is instrument-clean.
- 2026-08-04 — results written ([`results.md`](results.md)); dated row appended to the EA-X2
  `RUNKIT.md` (append-only, no prior row touched). **Sixth cost hypothesis falsified — and this
  one regressed** (band A 8.34×, band B 7.37×, governed absolute +45.7%), with most of the
  regression attributed to three defects in the levers' own build (D1–D3 in `results.md` §2) and
  **L1 measured as inert** (0 delegations on 6/6).
