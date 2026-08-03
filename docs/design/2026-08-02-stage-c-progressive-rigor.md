# Stage C — Progressive rigor: trigger taxonomy, dimensions, and threshold presets

> Toolkit meta-work (no CHAOS governance). Outcome of the 2026-08-02 design session (creator +
> assistant) that answered the seven design questions in
> [`2026-08-02-stage-c-design-handoff.md`](2026-08-02-stage-c-design-handoff.md) §5. Design of
> record for the A→B→C sequence: [`2026-07-24-artifact-model-roadmap.md`](2026-07-24-artifact-model-roadmap.md)
> §Stage C. Intellectual ancestor: the
> [two-axis classification assessment](../../.chaos/assessments/2026-07-18-two-axis-classification/README.md)
> (2026-07-18). Evidence base: all dated rows in
> [`RUNKIT.md`](../../.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md) plus
> EA-X2b. C's entry gate (measured valve fidelity, both directions) was met twice — Opus 4.8
> (Stage-A run) and Opus 5 (Stage-B light run) — and is not re-argued here.

## 1. Decisions register (who decided what, so future sessions don't relitigate)

All session calls below were made by the creator on 2026-08-02, choosing among options the
assistant brought with a recommendation ("accepted rec" = the recommended option was chosen).

| # | Decision | Call | By |
|---|---|---|---|
| C-1 | Taxonomy shape | **Two trigger families** (materiality / mechanical) inheriting the two-axis §1.5 command law; flat matrix and scaled gate catalog rejected (catalog remains the growth path via the verify-attribution hook, §5.3) | creator, accepted rec |
| C-2 | Trigger set v1 | 8 triggers — M1–M5 materiality, X1–X3 mechanical — covering the handoff's full seed list | creator, accepted rec |
| C-3 | Self-review-fail (X2) | **Mechanical, never adds a stop**: fires independent review + deeper verify; humans see it at the existing verify/dashboard checkpoint | creator, accepted rec |
| C-4 | Dependency changes | **Split by magnitude**: new direct dependency or major bump → M3 (materiality); patch/minor bumps → X3 (mechanical) | creator, accepted rec |
| C-5 | Combination laws | Max-of per dimension; stops fold per checkpoint; family law (§5.3); laws are property tests in the fidelity harness | assistant proposal, creator accepted |
| C-6 | Classifier mechanism | **Hybrid, raise-only**: deterministic stdlib tool computes the 7 scan triggers + M1 candidate surface; one bounded model adjudication per checkpoint may only *raise*, never suppress, and must cite its source input | creator, accepted rec |
| C-7 | Adjudication reach | Model may raise **any materiality trigger** (with citation); mechanical triggers are scan-only — a model "raising blast radius" would be a measurement error, not a judgment | creator, accepted rec |
| C-8 | Rigor direction (§5.3) | **Agent-monotone + human-only downgrade**: the system only ratchets up within a change; a human may lower a dimension via a recorded override (rationale + decisionRef in the ledger), per the two-axis §7 downgrade asymmetry | creator, accepted rec |
| C-9 | Preset semantics (§5.4) | **Floor vectors + declared triggers**: flags set per-dimension minimums, triggers only raise above them, no flag = zero floors; users may declare specific triggers in intent frontmatter | creator, accepted rec |
| C-10 | OpenSpec set (§5.5) | **Zero-base, trigger-gated** — zero-trigger changes owe no OpenSpec artifacts; M1/M3/M4 owe a delta spec; full set only on breaking contract change, ≥2 distinct materiality triggers, or preset floor. **Adopted pending the step-5 re-run measurement.** Revisits (with data) the creator's 2026-07-24 "OpenSpec in all modes" overrule | **creator**, accepted rec — supersedes the 07-24 overrule conditionally |
| C-11 | Floor stop (§5.7) | **Keep** — one FRAME approval stop minimum on every change (fold-absorber + under-detection safety net until classifier fidelity is measured). Explicit re-test condition: revisit after the fidelity corpus + step-5 re-run price it | creator, accepted rec |
| C-12 | Adjudication cadence (amends C-6's "per checkpoint") | Model adjudication runs at **K1 and K3 only** — the checkpoints where new semantic input exists (intent, diff); K2/K4 are scan-only. A lexical pre-filter was rejected: it would reintroduce exactly the blindness M1 adjudication exists to catch | creator, accepted rec (doc review) |
| C-13 | Full-OpenSpec threshold (amends C-10's "≥2 distinct triggers") | Full set requires ≥2 materiality triggers firing on **distinct surface classes** (each fired trigger carries its cited class); same-surface pairs — M1+M2 both citing auth — are correlated and owe a delta. Found authoring the corpus: the unqualified rule nulls the OpenSpec lever on the frozen-3 tasks | creator, accepted rec (corpus authoring) |
| C-14 | Rename-shape guard on M2's scan | Rename-shaped diffs (numstat: many files, adds≈deletes) demote M2 class-path hits from scan-fire to adjudication candidates; the K3 adjudication (C-12) declines pure renames. Keeps P1 (mechanical-never-stops) true on the mega-rename seed without weakening the raise net | creator, accepted rec (corpus authoring) |

**Step-6 decisions (creator, 2026-08-03)** — made against the step-5 evidence
([core](../../.chaos/validation/2026-08-stage-c-step5-rerun/results.md) +
[extended](../../.chaos/validation/2026-08-stage-c-step5-rerun/results.md#part-2--extended-tier-the-light-eligible-band-cs-cheap-end),
commits `d9d6575` / `59e0bc7`):

| # | Decision | Call | By |
|---|---|---|---|
| C-10 **resolved** | OpenSpec zero-base | **Kept trigger-gated 0/1/2 exactly as measured.** The lever is real (all three frozen tasks took a delta, never the full set) and small (8.3% of authored governance, ~1.4% of governed output). The 2026-07-24 "OpenSpec in all modes" overrule is now **unconditionally superseded, with data** | creator |
| C-11 **resolved** | Floor stop | **Kept on every change.** Re-test condition fired (fidelity measured, stop priced) and the answer is keep: it costs almost nothing in tokens and it is the mechanism the product rests on — the human sees the contract before the agent acts | creator |
| **Stage-B** | Writer fate | **Adopted.** `765ad41` + `c1ef7ac` stay; agents emit records, the renderer writes `change.md`/`lifecycle.md`. Records are the largest authored cost centre (54.9% core / 65.8% extended) and the projection ratio never beats ~0.8 (0.78 · 0.79 · 0.87, measured three times) — the trade is bought for correctness, not cost: drift structurally impossible, provenance by construction, 27 renders 0 failures, `--check` clean, 0 hand-written artifacts | creator |
| C-15 | Blast-radius diff scope | **A change's own governance output never counts toward X1.** The K3 numstat/patch cover the governed subject only — always exclude `.chaos/**`, `openspec/**` and any ADR the change authored; stage new files (`git add -N`) or the diff is blind to them. Measured: 6/6 governed arms cross X1's threshold on their own paperwork; one actually did, producing the program's only classification miss, and the spurious X1 also decided whether the final checkpoint ran at all | creator ("fix it"), assistant-implemented |
| C-16 | M4 counts questions, not headings | M4 was **bimodal and formatting-driven**: stop folding (§5.3 law 2) collapses N questions into one ledger entry, so a heavily-decisioned change could never reach the threshold, while any small change was one entry away from tripping it. The detector now sums **material questions**, declared as `folds: <n>` on the entry (`change-template.md` §2); absent/malformed ⇒ 1. `maxMaterialDecisions` stays 2 | creator, accepted rec |
| C-17 | M4 leaves C-13's surface count | `C13_COUNTED` = {M1, M2, M3}. **M4 measures density, not surface** — its folded questions are by construction one decision on one surface, so counting `process` as a second surface double-counts the same event (same treatment M5 already had). M4 still fires and still raises `openspec→1`, `review`, `evidence.targeted`. Without this, C-16 would have escalated every posture-crossing change to the full OpenSpec set — verified on the real P1 ledger. Also dissolves the `adr 1` / M4 tension: a decision-log entry no longer manufactures surface diversity | creator, accepted rec |

**Standing constraints inherited, not decided here:** classifier inputs are **ledger + git +
frontmatter only, never `records/*.json`** — this kept all three Stage-B fate options live through
the step-5 measurement, and the constraint remains (C never welds to B). **Stage-B's fate is no
longer deferred: adopted 2026-08-03** (step-6 register above); per-increment measurement discipline; `maxMaterialDecisions: 2` unchanged; no design
goal of rescuing the retracted "~1× via rendering" claim.

## 2. The model in one paragraph

Every change starts at the light base (contract + decisions + implement). A classifier re-runs at
each lifecycle checkpoint over ledger + git + frontmatter; when a **trigger** fires, it raises
specific **rigor dimensions**, monotonically, with the firing trigger recorded as the reason.
`--light/--standard/--strict` are **floor vectors** over the same dimensions, not paths. The user
still learns one sentence: *"start small; the system demands more when the change is bigger"* —
with C's refinement that "bigger" is measured per dimension: **material** changes buy human
decision points; **big** changes buy review/verify depth; neither buys the other's ceremony.

Calibration target (from EA-X2 / EA-X2b): **rigor where materiality is, near-zero where it
isn't.** Pinned-contract tasks produced 0 catches at ~4× cost; under-specified tasks produced 3/3
material ambiguities surfaced, with the decisive correction coming from the real human answer.
The stop on a material choice is the product; everything else is overhead to minimize.

## 3. Inputs and checkpoints

**Inputs (hard constraint):** the decision ledger (`decision-events.md`: decision count/kinds,
escalation events, verdict lines), git (diff stats, path classes, manifests), and `change.md`
frontmatter (intent, approved scope, phase, self-review verdict, classification state). Never
`records/*.json`.

**Checkpoints** — triggers can only fire when their evidence exists; the classifier runs at each:

| # | Checkpoint | What newly exists | Triggers that can first fire |
|---|---|---|---|
| K1 | FRAME entry (`chaos:propose`) | intent + predicted scope frontmatter | M1 (intent), M2/M3 (predicted paths), X1 (predicted from scope), declared triggers |
| K2 | FRAME exit / DELIVER entry (`chaos:apply` validates decisions) | answered decisions in ledger | M4 (decision density) |
| K3 | DELIVER (diff exists; per-task boundaries and end) | actual diff | M2/M3 (actual), M5 (spill), M1 re-check, X1, X3 |
| K4 | post-DELIVER | self-review verdict | X2 |

Classification state (fired triggers with checkpoint + citation, dimension vector, floors,
declared triggers, overrides) lives in `change.md` frontmatter; escalation events are additionally
ledger-recorded (as today, `escalatedFrom`). Re-classification reads its own prior state, which is
what makes the monotone ratchet enforceable.

## 4. Rigor dimensions

Six dimensions — `evidence` splits into two sub-dimensions, so seven ladders. Level 0 **is** the
light base.

| Dimension | 0 (base) | 1 | 2 |
|---|---|---|---|
| **stops** (placed set) | the K1 FRAME approval stop (C-11 floor) | +1 *named* stop at any later checkpoint where materiality fires (folds per checkpoint, §5.3) | preset floor 2 places a second stop at DELIVER exit (verify sign-off) |
| **evidence.targeted** | scoped scan | targeted reads — only the crossed ADR/posture/rule | — |
| **evidence.breadth** | scoped scan | module-level understanding of the touched surface | broad archaeology |
| **review** | self-review line in `change.md` | focused review folded into verify | standalone review pass |
| **verify** | contract check + tests green | + trigger-relevant safeguard checks, with n/a-as-positive-claim | full verify orchestration |
| **openspec** | none — contract lives in `change.md` | delta spec only | full set (proposal + specs + tasks) |
| **adr** | none | decision-log entry in the ledger | ADR required, blocking |

Notes: `evidence` is split into two sub-dimensions so the family law (§5.4) stays exact —
materiality buys *targeted* evidence, mechanical breadth buys *breadth*. `openspec` level 0 = none
is decision C-10 made concrete. `adr` level 2 is enforced at verify: no READY verdict until the
ADR exists. Every non-zero level carries its attribution (e.g.
`verify: 1 by [M2@K3]`) — verify consumes the attribution to know *which* safeguard checks apply
(auth surface vs migration vs contract). That attribution hook is where a future gate catalog
(two-axis 04) grafts on if C's evidence ever justifies it; it is not built now.

## 5. Trigger taxonomy (two families)

### 5.1 Materiality family — may add stops; moves evidence.targeted, adr, openspec

| ID | Trigger | Detector (inputs) | Class | Fires at | Moves |
|---|---|---|---|---|---|
| **M1** | posture-crossing | intent/scope frontmatter vs architecture posture & non-goals docs | **semantic** (the only model-judged detector) | K1; re-checked K3 on actual paths | stop naming the crossing · evidence.targeted→1 · adr→2 if crossing accepted · openspec→1 |
| **M2** | sensitive-surface | path classes in predicted scope / actual diff: auth, secrets, persistence semantics, migrations, PII, deploy config | deterministic (path-class map, config-declared) | K1 (predicted), K3 (actual) | approval stop · verify→1 (safeguards for *that* surface) · evidence.targeted→1 |
| **M3** | contract-surface | public API/schema/event paths in diff; **new direct dependency or major bump** (C-4) | deterministic | K1 / K3 | openspec→1 (the delta spec *is* the contract artifact) · adr→1 (→2 if breaking) · stop if breaking · verify→1 (contract checks) |
| **M4** | decision-density | material decisions ≥ 2 in ledger (threshold held across all measured runs; unchanged in C) | deterministic | K2, ongoing | openspec→1 (formalize what was ambiguous) · review→1 · evidence.targeted→1 · **no extra stop** — each material decision already stops via the runtime |
| **M5** | scope-spill | actual diff vs approved scope in frontmatter | deterministic | K3 | re-approval stop · classifier re-runs over the spilled surface |

*Breaking* (M3) is detected by deterministic heuristic — deleted/renamed public symbols or
endpoints, removed schema fields, major-version manifest bumps. The adjudication layer may raise
it where the heuristic is blind; heuristic ambiguity lowers classification confidence (§6)
instead of passing silently.

*Rename-shape guard* (C-14): when numstat shows a rename-shaped diff (many files, adds≈deletes
per file), M2 class-path hits demote from scan-fire to adjudication candidates; the K3
adjudication declines pure renames. A semantic change hiding inside a rename-shaped diff remains
the raise net's job.

### 5.2 Mechanical family — never adds a stop; moves review, verify, evidence.breadth

| ID | Trigger | Detector (inputs) | Class | Fires at | Moves |
|---|---|---|---|---|---|
| **X1** | blast-radius | diff stats: files/modules/LOC/fan-out over thresholds (values calibrated by the corpus, §7) | deterministic | K3 (predicted at K1 from scope) | review→1 or 2 by size · verify→1 · evidence.breadth→1 |
| **X2** | self-review-fail | review verdict in frontmatter/ledger ≠ clean (C-3) | deterministic | K4 | review→2 (independent pass) · verify→1 |
| **X3** | dependency-churn | patch/minor manifest bumps, lockfile churn (C-4) | deterministic | K3 | verify→1 (supply-chain check) |

### 5.3 Combination laws (property-tested, §7)

1. **Max-of, never sum** — per dimension across fired triggers (the two-axis risk rule,
   generalized). Exception: `stops` combines as the **union of placed stops** (which then fold
   per checkpoint) — placement, not count, is what matters.
2. **Stops fold at checkpoints** — N materiality triggers firing at one checkpoint produce **one**
   stop carrying N named questions. Corollary (the fold-absorber): at K1, materiality stops fold
   into the already-mandatory FRAME approval stop, so e.g. M2 firing on a pinned-contract auth
   task adds ~zero stop ceremony — only targeted safeguard checks. Only mid-flight triggers (M5,
   M1-recheck at K3) create genuinely *new* stops. This is the design's answer to the
   escalation-was-right-but-caught-nothing tension in the evidence: escalate **less, more
   targeted** — per dimension, not per mode.
3. **Agent-monotone ratchet** (C-8) — the system only raises within a change; downgrades exist
   only as human overrides recorded `{by, from, to, rationale, decisionRef, at}` in the ledger.
4. **Family law** — mechanical triggers never move stops/adr/openspec/evidence.targeted;
   materiality triggers never set review=2 or move evidence.breadth on their own. Verify is
   shared; attribution disambiguates why it rose.
5. **Late-fired obligations are due by DELIVER exit** — artifact obligations (openspec, adr)
   from triggers firing at K2/K3 are owed before DELIVER completes, enforced by verify; nothing
   is owed retroactively "at FRAME".

### 5.4 Calibration fit against the evidence

- **Pinned tasks (EA-X2, 0 catches at ~4×):** M2 fires on the auth task; its stop folds into the
  floor stop, verify rises only to targeted auth safeguard checks — stops/openspec/adr all stay
  at base. Near-zero added ceremony — matches the data.
- **Under-specified tasks (EA-X2b, 3/3 surfaced):** M4 + M1 fire; forced decision points land on
  the material choices. The stop is the product — matches the data.
- **Mechanical mega-rename (adversarial seed):** only X1 fires; review/verify rise, zero stops.
  "Start small" survives breadth.
- **Innocuous-looking posture crossing (adversarial seed):** M1 must fire; its semantic detector
  is exactly what the fidelity corpus measures in both error directions.

## 6. Classifier mechanism (C-6, C-7)

**Deterministic core:** `tools/chaos-classify/` — house style (stdlib only, own test suite, like
the renderer). Input: repo path + changeId. Output: fired scan triggers with signal values, the M1
**candidate surface** (which posture/non-goals sections are in scope given intent + paths), and a
classification `confidence` (HIGH = signals unanimous/coverage complete; MEDIUM = adjudication
used; LOW = conflicting signals or thin coverage — LOW folds a confirmation question into the next
pending stop, creating one at the current checkpoint if none is pending; LOW *forces*
confirmation, per two-axis §2.3/§2.4).

**Adjudication layer (skill-side, not in the tool):** one bounded model pass over the candidate
surface (order 1–2k tokens per pass), at **K1 and K3 only** (C-12) — the checkpoints where new
semantic input exists; K2/K4 add only structured ledger fields the scans already read. It may **only raise** — fire any *materiality* trigger
the scan missed — and every raise must cite the input line (intent sentence, non-goals clause,
path) that justified it. It can never suppress a deterministically fired trigger, never touch
mechanical triggers, never lower a dimension.

The fidelity harness (§7) scores the **combined** verdict (tool + adjudication) in both error
directions; the tool additionally has its own unit suite. Nothing is wired into a command until
the harness passes (handoff §6.3 gate — unchanged).

## 7. Fidelity harness (handoff §5.6 — drafted by assistant, to be ratified with the corpus)

**Discipline:** corpus and expected classifications are authored **before the classifier exists**
(same held-out rigor as the EA oracles). Acceptance thresholds are pre-registered with the corpus,
not fitted after.

**Corpus composition (~25–30 seeds):**

- The 7 measured tasks: frozen-3 (auth gate, soft-delete, concurrency), the 3 light-eligible Cost-B
  tasks, secure-task-api.
- EA-X2b's under-specified tasks (the value-side fixtures).
- The 15 two-axis golden scenarios S1–S15, recast as classification-only fixtures (synthetic
  frontmatter + diff; no implementation needed).
- Adversarial seeds: innocuous-looking posture crossing · mechanical mega-rename (huge X1, zero
  materiality) · path-class-map gap (sensitive file on an unlisted path — tests the C-7 raise net)
  · mid-flight scope-spill · declared-trigger fixture · preset-floor fixture.

**Measured, both directions, per-trigger and aggregate:** under-detection (expected trigger did
not fire — governance bypass) and over-detection (unexpected trigger fired — "start small"
becomes a lie).

**Property tests (from §5.3 laws):**

- P1 mechanical-only seeds ⇒ stops/adr/openspec/evidence.targeted stay at floor.
- P2 materiality-only seeds ⇒ review ≤ 1 and evidence.breadth = 0 (absent preset floors).
- P3 no preset or adjudication ever lowers a fired dimension; only a human override record can.
- P4 checkpoint replay is monotone per dimension.
- P5 every adjudication raise carries a citation; adjudication never removes a trigger.
- P6 N materiality triggers firing at one checkpoint produce exactly one new stop — and at K1,
  zero new stops (they fold into the floor stop).

**Gate:** the classifier is not wired into any command until both error directions meet the
pre-registered bar on this corpus.

## 8. Presets, declared triggers, overrides (C-9)

Provisional floor vectors — values to be calibrated against the corpus and the step-5 re-run:

| Flag | stops | evidence.targeted | evidence.breadth | review | verify | openspec | adr |
|---|---|---|---|---|---|---|---|
| *(none)* / `--light` | 1 (C-11 floor) | 0 | 0 | 0 | 0 | 0 | 0 |
| `--standard` | 1 | 1 | 1 | 1 | 1 | 1 | 0 |
| `--strict` | 2 | 1 | 2 | 2 | 2 | 2 | 1 |

- Floors are minimums; triggers raise above them; **a preset can never suppress a fired trigger.**
- **Declared triggers** (`declaredTriggers: [sensitive-surface]` in intent frontmatter or CLI
  equivalent) are the precise user instrument — "I know this touches auth even if the paths don't
  show it" feeds the classifier instead of bypassing it. Declared triggers are treated as fired
  (they can only add).
- Raising rigor (flags, declarations) is always silent; lowering below a fired level is only the
  recorded human override (C-8).
- A fired deterministic trigger is a recorded fact and cannot be argued away; relief for a
  false-positive path hit is the C-8 override on the *dimensions* it moved — the trigger stays in
  the trail, the consequences are lowered on the record.
- A `stops` floor of 2 places the second stop at DELIVER exit (verify sign-off); trigger stops
  are additional and fold at their own checkpoints.
- **Legacy mapping is intentionally not behavior-preserving:** old `--standard`/`--strict` selected
  paths; new flags set floors over one flow. The old sentences about strict obligations remain
  true (floors guarantee them); the old *ceremony bundles* are gone by design.

## 9. OpenSpec under C (C-10 — adopted pending measurement)

Zero-trigger changes owe **no OpenSpec artifacts** (contract lives in `change.md`). M1, M3, or M4
each owe a **delta spec**. The **full set** is owed only on a breaking contract change, ≥2
materiality triggers firing on **distinct surface classes** (C-13 — same-surface pairs such as
M1+M2 both citing auth are correlated, not distinct; M5 carries no surface and never counts), or
a preset floor.

- **Drift defense:** M3 is deterministic and catches exactly the changes specs exist to describe
  (public API/schema/event paths, manifests). A change that never touches contract surface has
  nothing to tell a spec; one that does mechanically owes a delta. Path-class-map gaps are covered
  by the C-7 raise net.
- **Priced, 2026-08-03 (step 5) — the provisionality is discharged.** The lever is **real**: all
  three frozen-3 tasks took a delta spec, never the full set, and two light-eligible tasks authored
  **no OpenSpec artifacts at all**. It is also **small**: 8.3% of authored governance / ~1.4% of
  governed output on the materiality band, 1.6% / 0.24% on the light band. Creator kept the
  trigger-gated 0/1/2 rule as measured (C-10 resolved), so the 2026-07-24 overrule is now
  **unconditionally superseded, with data**.

## 10. Floor stop (C-11)

Every change keeps ≥1 human stop (the FRAME approval; answering = approval), because (a) it is the
fold-absorber that makes K1 materiality stops nearly free, and (b) until the classifier's error
rates are measured it is the last line of defense against under-detection — the net stays up while
the tightrope is unmeasured. **Re-test condition — fired and resolved 2026-08-03 (C-11).** Fidelity came back at 24/25 exact
with **zero** under-detection, and the stop was priced at near-nothing in tokens. The creator
**kept it on every change**: it costs almost nothing and it is the mechanism the product rests on —
the human sees the contract before the agent acts. Not revisited again without new evidence.

## 11. Build & measurement plan (per-increment, unchanged discipline)

Step 1 of the handoff §6 plan (the design round) is this document; numbering continues from it.

- **Step 2 — seed corpus + pre-registered expectations** (§7), authored before any classifier
  code.
- **Step 3 — `tools/chaos-classify/`** standalone; iterate against the corpus until both error
  directions pass; wire nothing until then.
- **Step 4 — wire one command at a time** (Stage-B swap order worked: propose first, verify
  last); presets become floors; the Stage-A valve is subsumed by the ratchet (an escalation event
  is now "a trigger fired").
- **Step 5 — re-run the frozen kits once** (traps: base worktrees on `d27600f`, not the demo tip;
  dated row in RUNKIT.md; score with the fixed `score-arm.sh`). This single run answers: C's cost
  curve, the real size of the OpenSpec lever (C-10's condition), and Stage-B's fate — possible
  because the classifier consumes no `records/*.json`.
- **Step 6 — trim** where the data says, including the B decision (adopt / revert `765ad41`
  keeping `c1ef7ac` / `chaos:lint`).

## 12. Open items deliberately carried, not resolved

- Numeric thresholds: X1 blast-radius **values** and the preset floor vectors are still
  uncalibrated. X1's **scope** is now fixed (C-15); its thresholds are not. The
  "≥2 materiality triggers" rule is settled by C-13 + C-17.
- ~~C-10 and C-11 re-test conditions~~ — **both discharged 2026-08-03** (step-6 register).
- Gate-catalog graft (two-axis 04) stays deferred; the verify-attribution hook is its landing pad.
- ~~Stage-B's fate~~ — **decided 2026-08-03: adopted** (step-6 register). Follow-on now unblocked:
  the `change.md` frontmatter classification block was deferred only to keep C unwelded from B
  (`change-template.md` §2) and can be reconsidered.
- Path-class map provenance: who authors/maintains the per-repo class map (likely a `chaos-init`
  template + governed edits). A wrong map is the largest deterministic failure mode; the corpus's
  map-gap seed measures the adjudication net, not the map itself.
- Whether K3 runs per task boundary or only at DELIVER end — decide when wiring `chaos:apply`
  (cost vs latency of mid-flight M5 detection).
