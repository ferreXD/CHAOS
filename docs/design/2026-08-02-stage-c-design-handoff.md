# Stage C — design handoff brief

> **Purpose:** everything a fresh session needs to design Stage C without re-deriving three weeks
> of build and two measurement campaigns. This is the entry point; the design of record for the
> A→B→C sequence is [`2026-07-24-artifact-model-roadmap.md`](2026-07-24-artifact-model-roadmap.md)
> §Stage C. Toolkit meta-work — build CHAOS **without** CHAOS governance (creator's standing
> preference). The deliverable of the next session is a **design**, iterated with the creator —
> not code first.

## 1. Where things stand

| | State |
|---|---|
| **Stage A** | Shipped + measured (2026-07-24). Collapsed `--light`; prose 45.5% → 4.7% of governed output; governed −58% absolute on identical tasks. |
| **Stage B** | Built, shipped, and **measured on both paths (2026-08-02)**. Renderer + schemas + writer swap all on `main`. **Cost hypothesis falsified; correctness claims held.** See §3. |
| **Stage C entry gate** | **MET, twice.** The roadmap gates C on measured valve fidelity in both directions. Cleared on Opus 4.8 (Stage-A run) and again on Opus 5 (Stage-B light run): posture-crossing seed escalated with the right trigger; all light-eligible tasks stayed light. C is unblocked on its own terms. |
| **B's fate** | **Deliberately deferred to post-C evidence** (creator + assistant agreed 2026-08-02). Do not revert or double down yet. Commits are split so `765ad41` (writer swap) reverts independently of `c1ef7ac` (renderer + schemas). |
| **Branches** | `main` @ `a91100a` (ahead of origin, not pushed) · `demo/dotnet` @ `6437d7e` (aligned with main's surface, not pushed). Worktree `D:/Proyectos/CHAOS/demo-light`. Measurement worktrees preserved as evidence at `D:/chaos-stageb/wt` and `D:/chaos-ww/wt`. |
| **Creator's stated position** | The governance overhead **is** the core CHAOS product ("imho yes, it is the core CHAOS product at the end of the day"). The strategy question is calibration, not existence. |

## 2. What Stage C is (design of record, plus what changed)

From the roadmap: **kill modes as a user-facing concept.** Every change starts at the light base
(contract + decisions + implement); **rigor accumulates automatically as triggers fire** (blast
radius, decision count, posture crossing, scope spill). `--light/--standard/--strict` become
**threshold presets over one flow**, not three paths. The user learns one sentence: *"start small;
the system demands more when the change is bigger."* Direct descendant of the repo's 2026-07-18
two-axis-classification assessment (adaptive gates).

What changed since that was written:

- The **trigger classifier is now the whole game.** The valve (binary light→standard) is proven;
  C needs graded, per-dimension classification (which *sections*, which *checks*, which *review
  depth* — not just which mode). That classifier is load-bearing for everything and needs its own
  seed corpus and fidelity measurement before anything is built on it.
- **C is also the trim vehicle.** The expensive global questions (OpenSpec-in-every-mode,
  governance-reading depth, decision thresholds) become per-change trigger outcomes instead of
  one-time policy edits. This is the agreed strategy: iterate to C with the whole picture, then
  trim where the data says — not trim first.
- **C is where B's optionality argument cashes out or dies.** Records-as-data only matter if
  triggers consume computed state. But see the hard constraint in §4.

## 3. The evidence base C must be designed against

Both measurement rows live in
[`ea-x2-with-without/harness/RUNKIT.md`](../../.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md);
full scorecards in each kit's `results.md`; raw per-arm JSON in each kit's `evidence-*.json`.

| Path | Baseline tok ratio | Stage-B tok ratio | Authored artifact share |
|---|---:|---:|---|
| light | 3.47× | **4.15×** | 4.7% → 12.5% |
| standard | 4.75× | **5.87×** | 45.5% → 23.9% |

- **The ledger-first inversion reduced cost on neither path.** On standard, artifact-authoring
  tokens genuinely halved — and the non-artifact work grew ~28% and absorbed it. Agents author
  ~100 KB of JSON records to render ~78 KB of markdown. The roadmap's "prose → ~0; B is the only
  path toward ~1×" is **retracted against this evidence** — do not design C to rescue that claim.
- **B's mechanical claims held across 9 governed arms, twice:** 29 render invocations, 0 failures;
  0 hand-written artifacts (honesty flag); `--check` CLEAN 18/18; provenance automatic; oracle
  unregressed (19/19 standard, 35/35-per-arm light); one arm self-reported R-001 unmet and held
  READY_WITH_DEBT rather than claiming clean — governance catching its own measurement artifact.
- **Where the cost actually is** (standard path, post-B): governance reading + decision records +
  the OpenSpec set kept in every mode. **OpenSpec-on-light/standard is the single biggest lever
  left** — a creator overrule from 2026-07-24, explicitly flagged for revisit "at Stage B", never
  yet re-litigated with data. C's design must make it a trigger outcome.
- **Value evidence for calibration** (from the earlier campaign): pinned-contract tasks → ~4×
  cost, 0 catches (EA-X2); under-specified tasks → governance surfaced 3/3 material ambiguities
  the plain arm missed, and the decisive correction came from the **real human answer**, not the
  process (EA-X2b). The product is forced decision points on *material* choices. C's calibration
  target follows: **rigor where materiality is, near-zero where it isn't.**

## 4. Decisions already made — do not relitigate silently

1. **No CHAOS governance on this work** (standing creator preference; memory + roadmap header).
2. **Strategy: iterate to C first, trim after** (creator, 2026-08-02). The repo is currently in
   its worst configuration — A's mental model, B's cost, none of C's payoff — so standing still
   is not neutral.
3. **Hard constraint — do NOT weld C to B.** The classifier consumes **ledger + git + frontmatter
   only**, never `records/*.json`. Verified feasible: decision count (ledger scan rule per
   `change-template.md` §2), blast radius (git diff stats), posture crossing (intent/scope vs
   architecture non-goals), scope spill (changed files vs approved scope in Stage-A frontmatter),
   self-review verdict (frontmatter/ledger). If C reads B's records, the writer-swap revert
   becomes impossible and B's fate is decided by accident instead of evidence.
4. **B's fate is a creator decision pending C evidence.** Three live options: adopt (pay ~+24%
   ratio for structural drift-impossibility), revert the swap keeping the renderer (`765ad41` vs
   `c1ef7ac`), or the middle path — **`chaos:lint`**: run the renderer's validators (scan-rule
   counts, cross-ref resolution, enums, phase-vs-session, section length, provenance) over
   *authored* artifacts; catches 8–9 of the 11 round-3 defect classes at near-zero token cost.
   Keep all three viable in C's design.
5. **Per-increment measurement discipline stays.** B's failure was cheap to find because it was
   measured in isolation on frozen tasks. C must not arrive as one giant unattributable delta.
6. `maxMaterialDecisions: 2` held across all runs; no retune indicated.

## 5. Design questions the next session must answer (with the creator, not unilaterally)

1. **Trigger taxonomy & dimensions.** The valve is one bit. What are C's dimensions — evidence
   depth, review depth, verify depth, OpenSpec set, ADR requirement, human-stop count? Which
   triggers move which dimensions? (Seed list: posture-crossing, decision-count, blast-radius,
   scope-spill, self-review-fail, security/data-surface, dependency/API surface.)
2. **Classifier mechanism.** Deterministic tool (like the renderer — testable, cheap, but blunt
   for posture crossing) vs model-judged with deterministic guardrails vs hybrid (deterministic
   floor + model may only *raise* rigor, never lower). Hybrid is the assistant's prior; decide
   deliberately.
3. **One-way or two-way rigor?** The valve is one-way by design (never downgrade). Does C keep
   monotone escalation within a change? (Prior: yes — auditability; "demands more", never less.)
4. **What do presets mean now?** If `--light/--standard/--strict` are thresholds, what exactly do
   the flags set, what is the default, and what does a user override mean vs a trigger firing?
5. **OpenSpec as a trigger outcome.** Which trigger level demands the full set vs a delta vs
   nothing? This is where the biggest lever gets pulled — design it explicitly, with the creator,
   since keeping OpenSpec everywhere was their overrule.
6. **Classifier fidelity harness.** Before C is built: a seed corpus (start from the 7 measured
   tasks + secure-task-api + adversarial seeds — an innocuous-looking posture crossing, a big
   mechanical rename with huge blast radius but zero materiality), pre-registered expected
   classifications, both error directions measured. Under-detection = governance bypass;
   over-detection = the "start small" promise is a lie. Same bar the valve was held to.
7. **Where does the human stop land under C?** Light's floor is one stop. Does a zero-trigger
   change keep a mandatory stop? (Materiality evidence says the stop is the product — but EA-X2
   also says forcing it on pinned tasks catches nothing. This is the calibration knife-edge.)

## 6. Suggested iteration plan (design-first, measurement-gated)

1. **Design doc round.** Answer §5 with the creator; produce
   `docs/design/2026-08-XX-stage-c-progressive-rigor.md` (decisions register format, like the
   roadmap). No code.
2. **Classifier seed corpus + pre-registered expectations.** Author before any classifier exists
   (same held-out discipline as the EA oracles).
3. **Classifier as a standalone tool** (`tools/chaos-classify/`, house style: stdlib, own test
   suite), inputs per §4.3. Measure against the corpus; iterate until both error directions are
   acceptable. **Gate: do not wire it into commands before this passes.**
4. **Wire triggers into the collapsed flow** — one command at a time (the Stage-B swap order
   worked: propose → … → verify last), presets become thresholds, valve subsumed.
5. **Re-run the frozen kits once** (traps documented in memory `chaos-ea-x2-kit-rerun-traps`:
   base commit `d27600f`, not the branch tip; dated row in RUNKIT.md; score with the fixed
   `score-arm.sh`). This single run answers: C's cost curve, the OpenSpec lever's real size, and
   B's fate — because inputs stayed unwelded, whichever answer comes back is actionable.
6. **Then trim** where the data says, including the B decision (§4.4).

## 7. Map — where things live

```text
docs/design/2026-07-24-artifact-model-roadmap.md      A→B→C design of record; §Stage C
docs/design/2026-08-01-stage-b-renderer-handoff.md    B's handoff (pattern for this doc)
.chaos/validation/2026-07-ea-v2/ea-x2-with-without/   frozen baseline kit; harness/RUNKIT.md = all dated rows
.chaos/validation/2026-07-ea-v2/ea-x2-stage-a-light/  light kit; results.md has both light scorecards
tools/chaos-render/                                    renderer + schemas + 46-test suite + README (golden-diff buckets)
.claude/skills/chaos-shared/reference/change-template.md   §1–§3 formats · §5 machine layer
.claude/skills/chaos-shared/reference/record-emission.md   Stage-B writer protocol (both trees)
.chaos/assessments/2026-07-18-two-axis-classification/     C's intellectual ancestor
D:/Proyectos/CHAOS/demo-light                          demo worktree (branch demo/dotnet, aligned @ 6437d7e)
D:/chaos-stageb/wt · D:/chaos-ww/wt                    preserved measurement worktrees (evidence)
```

**First action for the next session:** read roadmap §Stage C, then §3–§5 above, then the two-axis
assessment — and open the trigger-taxonomy question (§5.1) with the creator before writing
anything else down.
