# Stage-D measurement kit — the collapsed `chaos:run`, priced against the frozen kit

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** No `chaos:propose`, no
> decision runtime, no governance artifacts for the harness itself. CHAOS runs only *inside* the
> governed arms.
>
> **Pre-registration.** §3 and §4 below are frozen **before any arm launches** and are **never
> edited to match results**. A negative cost result is a valid outcome — four cost hypotheses
> have already died in this program (Stage-B light, Stage-B standard, Stage-C core, Stage-C
> extended). Report as found.

Design of record: [`docs/design/2026-08-03-cost-bar-and-run-collapse.md`](../../../docs/design/2026-08-03-cost-bar-and-run-collapse.md)
§2 (the graduated bar), §4.1 (what D builds — the loop, blessed by the creator with two
amendments), §4.2 (what D measures), §5 (the frozen predictions).

**What is under test:** the Stage-D build shipped 2026-08-03 —
`.claude/skills/chaos-run/SKILL.md` (`b03a93d`), continuous-mode classifier + obligation audit
(`bf92510`), absorption corpus seed SC-23 (`6bfb41e`).

## 1. The one variable

| Held constant | Value |
|---|---|
| base commit | `d27600f` (frozen; **never** the `demo/dotnet` tip `df26104`, which ships JWT auth + 34 tests and invalidates the tasks and every oracle) |
| plain-arm prompts | **byte-identical** to the step-5 tiers — frozen `ea-x2` variant for P1–P3, Cost-B variant for B1–B3 (both lifted programmatically from the step-5 workflows, not retyped) |
| classifier / renderer / schemas / records / oracles | unchanged |
| worktree staging | one shared implementation, both tiers |
| telemetry schema | step-5 fields + Stage-D additions, so rows line up field-for-field |
| model | **Opus 5** (`claude-opus-5[1m]`), as in step 5 — compare ratios AND absolutes against step 5 |

**The variable:** the governed arm invokes the built **`chaos:run`** — one continuous loop —
instead of the `propose → review → apply → verify` march. The artifact set is identical.

## 2. Arms (12, sequential for clean per-arm `budget.spent()` deltas)

| Pair | Band | Task | Plain prompt variant | Step-5 denominator (time / tok) |
|---|---|---|---|---|
| P1 | **B** | `require-api-key-auth` | frozen `ea-x2` | 5.23× / 5.96× |
| P2 | **B** | `soft-delete-tasks` | frozen `ea-x2` | 3.65× / 5.10× |
| P3 | **B** | `optimistic-concurrency-updates` | frozen `ea-x2` | 6.74× / 5.42× |
| B1 | **B** | `task-count` | Cost-B | 5.69× / 6.77× |
| B2 | **A** | `filter-tasks-by-status` | Cost-B | 4.66× / 4.60× |
| B3 | **A** | `enforce-title-max-length` | Cost-B | 8.18× / 6.93× |

Aggregates to beat: core tier Σ **4.86× / 5.46×**, extended tier Σ **5.95× / 6.00×**.

## 3. Pre-registered classification expectations (frozen; never edited)

**The collapse changes *when* the classifier runs, not what it decides.** These are the step-5
verdicts, which D must reproduce.

| Pair | Expected triggers | Expected final vector (`stops · ev.t · ev.b · review · verify · openspec · adr`) | openspec | ADR | verify phase |
|---|---|---|---|---|---|
| P1 | M1 + M2, **same surface** (auth) | `1 · 1 · 0 · 0 · 1 · 1 · 2` | 1 (delta) | yes | runs |
| P2 | M1 + M2, same surface (data-store) | `1 · 1 · 0 · 0 · 1 · 1 · 2` | 1 (delta) | yes | runs |
| P3 | M1 + M2, same surface (data-store) | `1 · 1 · 0 · 0 · 1 · 1 · 2` | 1 (delta) | yes | runs |
| B1 | **M3 additive** at a diff scan | `1 · 0 · 0 · 0 · 1 · 1 · 1` | 1 (delta) | yes (entry) | runs |
| B2 | **none** | `1 · 0 · 0 · 0 · 0 · 0 · 0` | 0 (skip) | no | **does not run** |
| B3 | **none** | `1 · 0 · 0 · 0 · 0 · 0 · 0` | 0 (skip) | no | **does not run** |

### 3.1 B3 is the C-15 test, registered explicitly

B3's step-5 X1 firing was an **over-detection**: its K3 numstat counted the change's own
governance bookkeeping (8 files / 360 LOC, of which 6 were `change.md`/`lifecycle.md`/ledger/
state/records). Re-run with a code-only numstat it fired nothing. C-15 shipped that scope rule
into the skills (`325b337`), so **B3 must now come out clean**. If B3 fires X1 again, C-15 did
not take and that is a finding about the fix, not about the collapse.

### 3.2 Stops — the Stage-D-specific expectations

- **Every arm places exactly one unconditional stop (S1)**, the C-11 floor approval. Expected
  `newStopsTotal` (trigger-*created* stops, floor excluded) = **0 on all six arms**, matching
  step 5, where `newStops` was 0 at every checkpoint on every arm.
- **Absorption (`stopAbsorbedBy`) is expected to fire ZERO times.** It exists for the case where
  a scan demands a stop while another is pending unanswered; in a mechanized run every decision
  is resolved in-arm immediately, so nothing should ever be pending at scan time. **A non-zero
  absorption count is a finding, not a pass** — it would mean the loop left a stop pending across
  work units, and the arm must report which.
- **S3 (discordance) is agent-judged and therefore NOT predicted.** These tasks pin exact wire
  contracts, so a well-behaved arm should find little to be discordant about; a high S3 count on
  a pinned-contract task suggests the loop is over-asking. Recorded, not scored.

### 3.3 The audit gate

Every arm must close with `audit.py` **exit 0**. A non-zero exit that the arm then repaired is
the gate working as designed — arms report `auditRuns`, `auditFailuresRepaired` and what was
owed. An arm that closes with a failing audit, or that never ran it, is a **build defect**.

### 3.4 Registered hazard: firing order may legitimately move

Per design §5, this prediction is weaker than it looks. The continuous rule fires triggers
**earlier and more often** than K3 did — M5 scope-spill and the M1 re-check run against a diff
that now exists earlier and grows per work unit. If verdicts diverge, the first question is
whether the new rule is wrong **or** whether the step-5 verdicts were an artifact of phase
boundaries. Both are findings; neither is automatically a regression. Divergences are scored in
**both** directions (under- and over-detection) regardless.

## 4. Pre-registered cost predictions (frozen; from design §5)

- **Band A: 2.0×–3.0×.** I expect the collapse to help but **not** to reach the ≤2.0× bar on the
  first attempt. **Predicting a miss.**
- **Band B: 3.0×–4.0×.** Improvement over 5.46× but short of the ≤3.0× bar.
- **Direction is the real test.** If non-artifact output does not fall by **≥30%**, the phase
  march was *not* the dominant cost, the §3 diagnosis of the design doc is falsified, and the
  next investigation goes at the residual directly.

**Quality is a stop-the-analysis gate.** Oracle must stay **19/19** (P1–P3) and **16/16**
(B1–B3) across both arms. Any regression halts the cost reading: a cheaper governed arm that
breaks the oracle is not a result, it is a defect.

## 5. Files

| File | Role |
|---|---|
| `harness/setup-stage-d-worktrees.sh` | creates the 12 detached worktrees off `d27600f` and stages the Stage-D toolkit into `*-armA` only |
| `harness/stage-d-arms.workflow.js` | the 12-arm workflow; plain prompts lifted **verbatim** from the step-5 workflows |
| `harness/build-workflow.py` | the lifter — regenerates the workflow, guaranteeing plain-prompt byte-identity |
| `harness/args.example.json` | the `args` payload (worktree paths are session-specific) |
| `results.md` | the scorecard (written after the run) |

Held-out oracles and task statements live in
[`../2026-07-ea-v2/ea-x2-with-without/oracles/`](../2026-07-ea-v2/ea-x2-with-without/oracles/)
and the Stage-A light kit; the harness references them rather than duplicating.

## 6. Caveats that travel with every number

- Tokens are an **output-only proxy** (`budget.spent()` deltas around sequential agents); no
  input tokens.
- Time is **arm-self-reported** (`date +%s`), not an independent stopwatch.
- Arms run **sequentially** so token deltas attribute to exactly one arm.
- Byte-size attribution (`bytes ÷ 4 ≈ tokens`) is a proxy; it splits *authored* payloads from
  `git diff`-generated scratch (a correction made during step 5 — counting generated scratch
  inflated the classifier's share ~5×).

## 7. Procedure log

Filled in as the run proceeds; never back-dated.

- 2026-08-03 — kit authored; §3/§4 frozen **before** any worktree was created.
- 2026-08-03 — harness built. Plain prompts lifted programmatically by `build-workflow.py`
  (sha256[:16] — frozen `ea-x2` variant `d28ced5572833c47`, Cost-B light variant
  `799be1dd6fefc2a5`, statements `d058e37b89ffaa89`); the only edit to a lifted prompt is its JS
  function name, asserted not to touch the template literal. Generated workflow syntax-checks
  identically to the step-5 workflow (both report only the intended top-level `return`).
- 2026-08-03 — 12 worktrees created on `d27600f` at `C:/sd5/wt`; Stage-D toolkit staged into the
  6 `*-armA` only; all 13 sanity checks pass (incl. `chaos-run` skill + `audit.py` present in
  governed, absent in plain). **This commit is the pre-registration: it lands before any arm
  runs.**
- 2026-08-03 — **first launch REJECTED**: all 12 arms failed in 37 ms, "output schema too large to
  classify safely". The telemetry schema serialized to 6.3 KB against step-5's working 4.0 KB. No
  agent ran, so the worktrees stayed pristine. Fixed by cutting fields (S1–S4 merged into one
  `stopCounts` string; three notes fields dropped) and reducing descriptions to labels →
  **3,559 bytes**, verified by serializing both schemas with `node`. Note for future kits:
  factoring the schema into shared `const`s shrinks the *source* but not the serialized JSON,
  which is what the classifier measures. Plain-prompt hashes unchanged across the rebuild.
- 2026-08-03 — 12 arms ran to completion: 106 min, 0 agent errors, 1.26 M subagent tokens.
- 2026-08-03 — scored all 12 arms against the held-out oracles: **0 failures on 12/12**
  (19/19 frozen-3, 16/16 light-3, both arms). Quality gate holds ⇒ the cost reading is valid.
- 2026-08-03 — evidence archived; attribution run on all 6 governed arms; the obligation audit
  independently replayed out of band on all 6 (**exit 0 on 6/6**). Results in
  [`results.md`](results.md); dated row appended to the EA-X2 `RUNKIT.md` (51 insertions,
  0 deletions — no prior row touched).
