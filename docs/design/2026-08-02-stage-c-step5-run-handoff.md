# Stage-C step-5 run handoff — the frozen-kit re-run (for a fresh thread)

> **Audience:** the session that will execute step 5. Everything you need is in this file plus
> the reading list in §1. Do not re-derive the design; do not re-prove the entry gate; do not
> re-open decided questions (register C-1..C-14 is authoritative).
>
> **Authority:** step 5 is a multi-agent measurement run (Workflow, 6–13 arms, ~40–90 min).
> The creator handing this file to a thread with "run step 5" (or equivalent) **is** the
> explicit multi-agent opt-in. Without that instruction, prepare but do not launch.

## 0. Mission

Run the frozen EA-X2 kit **once** with the Stage-C progressive-rigor toolkit live in the
governed arm. This single run answers three questions **together**:

1. **C's cost curve** — what does progressive rigor cost on the frozen-3 materiality tasks,
   and how close to plain does a zero-trigger change get?
2. **The OpenSpec lever's real size** — C-10 (zero-base, trigger-gated OpenSpec) was adopted
   *pending this measurement*. It conditionally supersedes the creator's 2026-07-24
   "OpenSpec in all modes" overrule; this run is the condition.
3. **Stage-B's fate** — adopt the writer swap / revert `765ad41` keeping the renderer
   `c1ef7ac` / `chaos:lint` middle path. Decidable from this run's **cost attribution**
   because the classifier consumes no `records/*.json` (C is not welded to B).

Report results **as found**. Two cost hypotheses have already died in this program (Stage-B
light 4.15×, standard 5.87× vs 3.47×/4.75× baselines — claim retracted). A negative result
here is a valid, useful outcome; do not design or narrate around it.

## 1. Reading order (before touching anything)

1. This file.
2. `docs/design/2026-08-02-stage-c-progressive-rigor.md` — the design of record: register
   C-1..C-14, §8 preset floors, §9 OpenSpec (C-10/C-13), §11 step-5 entry, §12 open items.
3. `.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md` — the kit contract:
   frozen baseline + all three re-run rows, files, procedure, **invariants**.
4. `.chaos/validation/2026-08-stage-c-classifier/README.md` — corpus manifest (the golden
   S-recast rows are your pre-registration source) + MR-1..MR-7 + changelog discipline.
5. `.chaos/validation/2026-07-ea-v2/ea-x2-stage-a-light/README.md` + `results.md` — Stage-A/B
   measurement shape, Cost-B (light-eligible) tasks, scoring scripts.

## 2. State of the world (2026-08-02, all committed on `main`)

| Commit | What |
|---|---|
| `a447d17` | Stage-C design (C-1..C-14) |
| `3de4651` | classifier fidelity corpus — 27 pre-registered seeds, acceptance PASSED |
| `7d96cdb` | `tools/chaos-classify/` — deterministic core + pinned adjudication contract |
| `8994039` | `chaos:propose` wired (K1, floors, OpenSpec gate, ratchet) |
| `d881361` | SC-22 K4/X2 seed — corpus 28 |
| `c43dc09` | step-4 wiring complete: apply K2/K3, verify K4 enforcement, review/resume/sync/archive |

All 6 commands consume `classification-state.json` when present; changes without it keep
pre-C behaviour (legacy fallback everywhere). Corpus bar: A1–A8 + P1–P6 ALL PASS, 0 errors
both directions, 28 seeds. **The corpus was the calibration set; this run is the blind test.**

## 3. The comparison ledger (ratios, never absolutes across models)

| Row | date · model | time × | tok × | notes |
|---|---|---:|---:|---|
| Frozen baseline (standard) | 07-19 · Opus 4.8 | 3.94× | 4.75× | 11 artifacts, full OpenSpec |
| Stage-A `--light` | 07-24 · Opus 4.8 | 3.35× | 3.47× | governed −58% absolute; 1.64×/2.01× vs frozen plain |
| Stage-B light | 08-02 · Opus 5 | 3.79× | 4.15× | records cost more than lean prose |
| Stage-B standard | 08-02 · Opus 5 | 5.68× | 5.87× | cost case falsified |
| Stage-B Cost-B (light-eligible) | 08-02 · Opus 5 | 2.93× | 3.38× | valve live |

Oracle: 19/19 clean both arms on every row (35/35 per arm incl. arm-own suites on Stage-B).
Any oracle regression in step 5 is a **stop-the-analysis finding**, not a footnote.

## 4. Non-negotiables (standing, inherited)

- **Toolkit meta-work runs WITHOUT CHAOS governance** — no `chaos:propose`, no decision
  runtime, no governance artifacts for the measurement work itself
  (memory: `chaos-develop-toolkit-without-governance`). The governed *arms* use CHAOS —
  that is the measured subject.
- **Classifier inputs: ledger + git + frontmatter only. Never `records/*.json`.**
- **Plain-arm prompts byte-identical** to the frozen run. Never "improve" task statements —
  they pin exact wire contracts on purpose.
- **Corpus expectations are frozen.** Wild misfires are recorded as findings in the new kit;
  any corpus change goes through a dated README changelog entry, never to make results look
  better.
- **RUNKIT rows are append-only** — new dated row, never overwrite.
- Use `python` (3.12.3). `py -3` is broken on this machine; `python3` is a Store stub.

## 5. Run design

**Core tier (recommended minimum, 7 arms):** the frozen-3 tasks, governed vs plain, plus the
escalation-fidelity arm.

- `P1..P3-armA` — governed, **no preset flag** (zero floors: the Stage-C default is the thing
  being priced; triggers alone set the rigor). Tasks: `ea-x2-with-without/oracles/task{1,2,3}-*.md`.
- `P1..P3-armB` — plain, byte-identical prompts (take them from `args.example.json` /
  the prior workflow js — not retyped).
- `V1-armA` — the posture-crossing valve seed (task embedded in
  `ea-x2-stage-a-light/harness/stage-a-arms.workflow.js`). Under Stage C this tests the
  **ratchet**: expect M1/M2 firings and raised dimensions, recorded as `TRG-*` events. No
  plain twin needed (fidelity arm, not a cost pair).

**Extended tier (+6 arms, creator's call on scale):** the light-eligible trio
`ea-x2-stage-a-light/tasks/taskB{1,2,3}-*.md` governed vs plain. This is where C-10's saving
is **maximal**: zero-trigger changes owe `openspec 0` — no OpenSpec artifacts at all — vs
Stage-A/B light which still authored the set. Compare against the Cost-B row (2.93×/3.38×).
If the run must be split, run the core tier first; the extended tier is a separate dated row.

**Do NOT hand-build a "C without B" hybrid skills tree** (reverting the writer swap under the
Stage-C wiring) to A/B Stage-B directly — it is error-prone and contaminates the measurement.
B's fate is decided from **cost attribution** (§8) plus the existing Stage-B rows.

## 6. Mechanics

1. **Worktrees:** detached, base **`d27600f`** — NOT the `demo/dotnet` tip (`df26104` already
   ships JWT auth + 34 tests; basing there silently invalidates task 1 and every oracle).
   Model the setup on `ea-x2-stage-a-light/harness/setup-stage-b-worktrees.sh` (it pins
   `BASE_REF="d27600f"` and shows the staging pattern + sanity checks).
2. **Stage the toolkit under test into GOVERNED worktrees only** (plain arms untouched):
   - everything Stage-B staged: `tools/chaos-render/`, the full current `.claude/skills/`
     tree, `.claude/hooks/scripts/chaos-artifact-metadata-hook.py`;
   - **new for C:** `tools/chaos-classify/` (core + README + `adjudication-prompt.md`);
   - **new for C:** `docs/design/2026-08-02-stage-c-progressive-rigor.md` (skills cite it as
     a required reference);
   - **new for C:** copy `.chaos/validation/2026-08-stage-c-classifier/assets/path-class-map.json`
     → `<worktree>/.chaos/path-class-map.json` (the propose wiring reads exactly that path;
     absent map = blind path-class scans). The v1 map was authored FOR `d27600f` — it is the
     right map for these worktrees.
   - **Posture:** the worktree's own `.chaos/architecture.md` at `d27600f` IS the frozen
     posture (auth still in non-goals). Do not overwrite it from `main` or the tip.
3. **Arms workflow:** author a `stage-c-arms.workflow.js` modeled on
   `ea-x2-with-without/harness/stage-b-standard-arms.workflow.js` (sequential arms for clean
   per-arm `budget.spent()` deltas; governed prompt = the CHAOS lifecycle instruction, no
   preset flag; plain prompt = frozen bytes). The harness does NOT classify — the governed
   arm's own skills run K1..K4 inside the worktree; that is part of the measured cost.
4. **Score:** `score-arm.sh <worktree> <oracle.cs>` per arm (oracles stay OUT of worktrees):
   P1→`AuthOracleTests.cs`, P2→`SoftDeleteOracleTests.cs`, P3→`ConcurrencyOracleTests.cs`;
   extended tier → the three oracles in `ea-x2-stage-a-light/oracles/`. Expect 19/19 (and
   arm-own suites green). `score-all.sh` exists for batch runs (expects `A*/B*` worktree names).
5. **Optional blind judge:** `ea-x2-judge.workflow.js` — `JUDGE_DIR` is hard-coded, repoint
   per run.
6. **Cleanup:** `git worktree remove --force <scratch>/wt/*` then `git worktree prune`.
7. Windows quirks if scripting in PowerShell 5.1: write JSON as UTF-8 **without BOM** or read
   with `utf-8-sig`; don't pipe long python output through `Select-Object -First N` (exit 255).

## 7. Pre-registration duty (BEFORE launching any arm)

House discipline: the measured act gets pre-registered expectations. In the new kit README,
freeze **per task**: expected fired triggers (family + surface), expected dimension vector,
expected OpenSpec depth, expected stop count. Sources:

- the corpus manifest rows that recast these very tasks (golden S-recasts SC-10..SC-21 —
  `.chaos/validation/2026-08-stage-c-classifier/README.md` §4 says which fixture recasts what);
- the design's own prediction, already on record (C-13 register entry): the frozen-3 fire
  **correlated same-surface** materiality (e.g. M1+M2 both citing auth) → each owes a
  **delta** spec, not the full set. That IS the OpenSpec lever on this kit;
- the light-eligible trio: expected **zero triggers → `openspec 0`**, floor stop only.

After the run, score classification-in-the-wild against this table both directions
(missed firing = under-detection; spurious = over-detection). This is the classifier's first
blind test — the corpus can no longer vouch for it here.

## 8. What to record

New kit folder `.chaos/validation/2026-08-stage-c-step5-rerun/` (README = pre-registration +
procedure log; results.md = scorecard; evidence JSON as produced). Plus:

1. **A new dated row in RUNKIT.md** (append-only): time/token ratios per pair + Σ, oracle,
   model, one-paragraph read against the §3 ledger.
2. **Cost attribution per governed arm** — this decides B's fate, so split governed output
   tokens/bytes into: OpenSpec artifacts · JSON records authored · rendered markdown
   (renderer output, ~free) · ledger/decisions · classifier+adjudication overhead ·
   implementation. Compare the record-authoring share against Stage-B's finding (100 KB JSON
   → 78 KB markdown; "input to the projection no cheaper than the prose it replaced").
3. **Classification fidelity in the wild** (§7 table, both error directions, citations from
   the arms' `TRG-*` ledger events and `classification-state.json` — archive these files
   from the worktrees into the kit before cleanup).
4. **Caveats verbatim on every table:** tokens are an output-only proxy; time is
   arm-self-reported; compare ratios not absolutes across model rows.

## 9. Decisions this run feeds (step 6 — with the creator, not unilaterally)

- **C-10** (OpenSpec zero-base): adopted if the lever is real; if marginal, reverting to
  delta-always is a one-line threshold change, not a redesign. Either way the 2026-07-24
  overrule's supersession becomes unconditional-with-data or is withdrawn.
- **C-11** (floor stop): re-test condition fires — with fidelity + price data, dropping or
  moving the floor stop on zero-trigger changes returns to the table.
- **Stage-B fate**: adopt / revert `765ad41` keeping `c1ef7ac` / `chaos:lint`, from §8.2
  attribution + the existing Stage-B rows.
- **Preset floor vectors** (design §8) get their calibration data.

Step 6 (trim per the data) is a separate conversation with the creator. This run's deliverable
is the evidence, honestly scored — not the decisions.

## 10. Trap list (each has bitten before)

1. Base = `d27600f`, never the `demo/dotnet` tip (`df26104` invalidates task 1 + oracles).
2. `main` has no demo surface at all (empty `src/TaskTracker.Api`) — never base arms on it.
3. Frozen posture: `d27600f`'s `.chaos/architecture.md`. The tip removed auth from non-goals
   (2026-08-01) — tip posture kills every M1 auth expectation.
4. Plain-arm prompts byte-identical; plain worktrees get NO staging.
5. RUNKIT row appended, never overwritten; use the **fixed** `score-arm.sh` from
   `ea-x2-with-without/harness/`.
6. Multi-agent Workflow needs the creator's explicit go (see §0 Authority).
7. Sequential arms only — parallel arms destroy per-arm token attribution.
8. Oracles never enter a worktree except during their scoring window (script handles it).
9. `python`, not `py -3`. BOM-less JSON. No `Select-Object -First` over python stdout.
10. Do not run `chaos:*` governance on the measurement work itself; the governed arms are
    the only place CHAOS runs.
