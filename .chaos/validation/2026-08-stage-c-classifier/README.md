# Stage-C classifier fidelity corpus — seed fixtures + pre-registered expectations

> Toolkit meta-work (no CHAOS governance). **Step 2** of the Stage-C build plan
> ([design doc](../../../docs/design/2026-08-02-stage-c-progressive-rigor.md) §11), authored
> 2026-08-02 — **before any classifier code exists** (`tools/chaos-classify/` does not exist yet;
> that is step 3). Expectations here are the held-out discipline of the EA oracles applied to
> classification: registered first, measured against later, never edited to make an
> implementation pass. Acceptance bar: [`acceptance.md`](acceptance.md). Design decisions
> C-1..C-14 govern; C-13 (distinct-surface full-set rule) and C-14 (rename-shape guard) were
> **found and decided during this corpus's authoring** — the discipline working as intended.

## 1. What is being tested

The Stage-C trigger classifier (design doc §5–§6): 7 deterministic scan triggers + 1 semantic
trigger (M1 posture-crossing), a raise-only model adjudication at K1/K3 (C-12), dimension
vectors, stop folding, floors, and declared triggers — measured in **both error directions**
(under-detection = governance bypass; over-detection = "start small" is a lie), per trigger.

**The interface seam this corpus pins:** the deterministic core is a **pure function** —

```text
classify(inputs, checkpoint, priorState) -> verdict
inputs = { frontmatter (yaml), intent (text), scope (text), ledger (markdown),
           diff numstat (text), diff patch (text), posture (markdown), class map (json) }
```

Git/filesystem access lives in an adapter the harness bypasses by feeding these sections
directly. The adjudication layer is a separate skill-side call consuming the core's candidate
surface; the harness scores the **combined** verdict, and the semantic subset separately
(acceptance.md).

## 2. Seed file format

One markdown file per seed in `seeds/`. Sections are keyed by heading; the payload is the first
fenced block under each heading: `## Frontmatter` (yaml) · `## Intent` · `## Scope` ·
`## Ledger` (optional) · `## Diff numstat` / `## Diff patch excerpt` (K3 seeds) · `## Posture`
(synthetic seeds only; default is [`assets/architecture-posture.d27600f.md`](assets/architecture-posture.d27600f.md))
· `## Expected` (json). Numstat is `added<TAB>deleted<TAB>path` (git format); parsers should
accept any whitespace run. Patch excerpts are minimal but format-true; the harness treats fixture
diffs as the complete diff.

`Expected` per checkpoint: `newlyFired` (first firings: `{trigger, by: scan|adjudication|declared,
surface, cite}`), `scanEcho` (already-fired triggers the K3 scan must independently re-detect —
deterministic-layer accountability), `newStops` (trigger-created stops only; floor/preset-placed
stops are not counted), `dimensions` (cumulative post-checkpoint vector, floors included),
`confidence`.

## 3. Micro-rules operationalized here (assistant-authored; creator ratifies with the corpus)

| # | Rule |
|---|---|
| MR-1 | **Surface classes** (C-13's vocabulary): auth · data-store · contract-dependency · integration · deploy-ops · process. M1's surface = the posture section it cites, mapped to a class; M4 = process; **M5 carries no surface**. Defined in `assets/path-class-map.json`. |
| MR-2 | **C-13 counting:** full OpenSpec set at ≥2 distinct surfaces over fired {M1,M2,M3,M4}; M5 excluded; breaking-M3 and preset floors demand it regardless. |
| MR-3 | **Stop satisfaction:** a materiality stop demanded at Kn is satisfied (no new stop) by an ANSWERED ledger decision covering the same surface — the classifier emits `satisfied-by <id>`. K1 folding into the floor approval stop is the same principle. (SC-08 K3 is the seed.) |
| MR-4 | **Confidence glossary:** HIGH = scan-grade determination (incl. declarations; adjudication ran and declined). MEDIUM = any adjudication raise. LOW = conflicting/thin signals — forces a confirmation fold (design doc §6). |
| MR-5 | **X1 thresholds (provisional):** review→1 at ≥8 files or ≥400 changed LOC; review→2 at ≥20 files or ≥1000 LOC. |
| MR-6 | **Rename shape (C-14):** ≥6 files, global add/delete ratio within ±20%, ≥80% of files with both adds and deletes ⇒ M2 path-hits demote to adjudication candidates. |
| MR-7 | **M3 route-delta:** fires on added/removed route markers in api-surface-source patches, never bare path-touch. Breaking = removed/renamed route, removed schema field, major dependency bump. |

## 4. Manifest — the pre-registration (27 seeds)

Wave 1 (**encoded**, `seeds/`): 15 seeds. Wave 2 (**encoded**, `seeds/`, same day): 12
golden-scenario recasts of the two-axis assessment's S1–S15. All 27 rows have fixtures.

| Seed | Band | K | Expected (summary) | Props |
|---|---|---|---|---|
| SC-01 frozen-auth | measured | K1,K3 | M1+M2 adj (auth, correlated ⇒ **openspec 1**); fold ⇒ 0 new stops; adr 2; K3 scan-echoes M2 | P6 |
| SC-02 frozen-softdelete | measured | K1,K3 | M2 scan + M1 adj (data-store, correlated); fold; adr 2 | P6 |
| SC-03 frozen-concurrency | measured | K1,K3 | as SC-02 (concurrency-class orphan noted, O-2) | P6 |
| SC-04 light-count | measured | K1,K3 | zero @K1 (adjudication declines); **M3 additive** @K3 ⇒ openspec 1 + adr 1, no stop (O-3) | — |
| SC-05 light-statusfilter | measured | K1,K3 | zero both; route-delta precision anti-seed (param ≠ new route) | — |
| SC-06 light-titlelen | measured | K1,K3 | zero both; validation-tightening blind spot registered (O-4) | — |
| SC-07 underspec-secure | value | K1,K2 | M1+M2 adj @K1; **M4 @K2 ⇒ openspec 2** (auth+process distinct) | P4,P6 |
| SC-08 underspec-delete | value | K1,K2,K3 | LOW @K1; M4 @K2; M2+M1 @K3 **stop-satisfied by answered decision** ⇒ 0 new stops ever; openspec 2 | P4 |
| SC-09 underspec-concurrent | value | K1,K2 | LOW @K1; M4 @K2 ⇒ openspec 1 | P4 |
| ADV-01 innocuous-crossing | adversarial | K1 | **M1 adj must fire** (data-store cite); scan structurally blind — the under-detection tripwire | — |
| ADV-02 mega-rename | adversarial | K1,K3 | X1 only (review 2); C-14 guard demotes persistence path-hits; **zero stops** | P1 |
| ADV-03 map-gap | adversarial | K1,K3 | M2 adj @K3 with patch-content cite (`.key` under unmapped `tools/`); **newStops 1** — the legitimate mid-flight halt | P5 |
| ADV-04 scope-spill | adversarial | K1,K3 | M5+M2 @K3 fold ⇒ **1** stop; M5 surfaceless; openspec 0 | P6 |
| ADV-05 declared-trigger | adversarial | K1 | M2 by `declaredTriggers` ⇒ verify 1 + evidence.targeted 1; HIGH | — |
| ADV-06 strict-floor | adversarial | K1 | fired EMPTY; dimensions == strict floor vector; 2nd stop floor-placed at DELIVER exit | P3 |
| SC-10 readme-typo (S1) | golden | K1,K3 | zero; floor stop only | — |
| SC-11 small-rename (S2) | golden | K1,K3 | zero (3 files, below X1; guard n/a) | — |
| SC-12 config-secret-rotate (S3) | golden | K1,K3 | M2 scan (auth: `appsettings` configKeyMarker) fold; verify 1, evidence.targeted 1; openspec 0, adr 0 | — |
| SC-13 middleware-context (S5) | golden | K1,K3 | X1 (9 files ⇒ review 1) only; **M1/M2 must NOT fire** — cross-cutting ≠ risky (two-axis weakness #2 guard) | P1 |
| SC-14 db-index (S6, synthetic posture) | golden | K1,K3 | M2 scan (data-store: `Migrations/`) fold; verify 1; env-dependent risk noted (O-7) | — |
| SC-15 schema-migration (S7, synthetic) | golden | K3 | M2 scan + **M3 breaking** (distinct ⇒ openspec 2); adr 2; newStops 1 (folded) | P6 |
| SC-16 parser-refactor (S8, synthetic) | golden | K1,K3 | X1 large ⇒ review 2; zero stops — the canonical breadth≠risk seed | P1 |
| SC-17 breaking-api (S10) | golden | K3 | M3 scan breaking (route removed) ⇒ stop + adr 2 + **openspec 2** | — |
| SC-18 dep-patch-bump (S11a) | golden | K3 | X3 only ⇒ verify 1; zero stops | P1 |
| SC-19 new-dependency (S11b) | golden | K3 | M3 scan (new direct dep, non-breaking) ⇒ openspec 1 + adr 1, no stop | — |
| SC-20 log-config (S12) | golden | K1,K3 | zero (demo PII class empty — O-5) | — |
| SC-21 message-broker (S13, synthetic-extended posture) | golden | K1 | M1 adj (integration: "No external integrations" [FACT]) + M3 scan (new dep) + X1 ⇒ **distinct surfaces ⇒ openspec 2**, adr 2, review 2; fold ⇒ 0 new stops; MEDIUM | P6 |

Excluded from the S1–S15 recast, with reasons: **S4** (auth policy — band already covered by
SC-01/SC-07), **S9** (new endpoint — identical to SC-04), **S14** (service extraction — S13's
heavier twin, adds no new trigger coverage), **S15** (security-emergency — urgency/break-glass is
NOT a C v1 dimension; observation O-6).

## 5. Observations for the creator (found while authoring; none silently resolved)

| # | Observation |
|---|---|
| O-1 | Correlated same-surface triggers (M1+M2 on auth) would have nulled the OpenSpec lever on the frozen-3 → **resolved as C-13** (distinct-surface rule) during authoring. |
| O-2 | Concurrency/shared-state has **no M2 class** (two-axis G-SYS-CONCURRENCY has no C home). SC-03 is covered via the persistence path + M1 — deliberately. Candidate new class if real use misses it. |
| O-3 | **Additive-M3 policy:** any NEW public route owes delta spec + adr entry (SC-04, SC-19). If step-5 shows this too hot on real light traffic, the additive arm of MR-7 is the knob. |
| O-4 | **Validation-tightening-as-breaking** (SC-06): tightening title length is arguably breaking for existing clients; pre-registered NO-FIRE per the measured stay-light calibration. Flipping it later = dated changelog entry. |
| O-5 | The demo subject has no PII paths — the pii class is empty and PII detection is **untested by this corpus**; needs a non-demo subject eventually. |
| O-6 | Urgency/break-glass (S15, IL-WF5) is unabsorbed by C v1 — no dimension models it. Carried, not resolved. |
| O-7 | Environment-dependent risk (S6's unknown table size) has no C home beyond the confidence field — two-axis weakness #1 is only partially carried. |
| O-8 | This corpus is a **calibration set, not a blind oracle**: step 3 iterates against it openly. Protection = frozen expectations + the changelog rule; the blind test is the step-5 re-run. |
| O-9 | **No seed exercises X2 / K4** (self-review-fail): the 27 registered rows never reach a post-DELIVER checkpoint. X2 logic is unit-tested in `tools/chaos-classify/` only; add a K4 seed via changelog before X2 is wired into verify. Found while speccing the tool (step 3). |

## 6. Invariants (do not drift)

- **Expectations are never edited to make a classifier pass.** Any expectation change requires a
  dated entry in the changelog below, with a reason, committed BEFORE the motivating classifier
  change.
- Posture stays frozen at `d27600f` ([`assets/architecture-posture.d27600f.md`](assets/architecture-posture.d27600f.md)) —
  the demo tip has already drifted (auth left the non-goals on 2026-08-01) and MUST not leak in.
- Both error directions are always reported, per trigger (acceptance.md).
- The manifest rows, not the fixture files, are the registration: any fixture/row divergence
  found later is resolved toward the row, via changelog entry.
- `maxMaterialDecisions` stays 2; the strict floor vector tracks design doc §8 — if §8 is
  re-calibrated, ADV-06 changes via changelog entry, not silently.

## 7. Changelog

- 2026-08-02 — corpus registered: 27-row manifest, wave-1 (15 seeds) encoded, acceptance bar
  frozen. C-13/C-14 decided during authoring (creator, same day). Assistant-authored; pending
  creator ratification of MR-1..MR-7 and the manifest.
- 2026-08-02 (later) — wave-2 encoded (12 fixtures, SC-10..SC-21) from the frozen rows. Two
  row-interpretation notes recorded in-fixture, no expectation changes: SC-12 and SC-21 fire
  their K1 materiality **by adjudication** (a scan cannot see config keys or manifest deltas
  before a patch exists — the rows' "scan" wording refers to K3 detectability); SC-21 registers
  K1 only, so its M3 scan confirmation is deliberately outside corpus scope.
- 2026-08-02 (step 3 start, corpus ratified by proceeding) — five **input enrichments**, zero
  expectation changes, all found by implementing the tool: (1) SC-01 scope gains
  `Security/ (new)` and (2) SC-13 scope gains `README.md (~9 files predicted)` — a FRAME scope
  must list planned NEW paths or M5 false-fires on them; (3) ADV-05 uses the qualified
  declaration form `sensitive-surface:auth` (declared triggers carry their surface class);
  (4/5) ADV-02 and SC-16 numstat gain a machine-readable `# totals: files=N loc=M` trailer —
  the defined format for abbreviated diffs. Implementation notes fixed alongside (documented in
  the tool README): a route re-registered to return 410 counts as removed (MR-7); MR-3
  decision-surface inference uses documented keyword classes; LOW confidence = nothing fired AND
  vague scope (no file entries, depth ≤ 2). O-9 added (X2/K4 uncovered).
- 2026-08-02 (rounds 2–3 + final) — **full acceptance bar ALL PASS** (see
  [`results.md`](results.md)). Round-2 residuals were one anticipation family (three K1
  over-raises) → prompt rules 13–14 + two more fixture-encoding corrections (ADV-04's spilled
  patch became a pure doc-comment — judges kept reading store-internal behaviour as a boundary
  crossing, a sensitivity worth remembering; ADV-05's intent dropped its accidental
  "external vendor" integration flavor). Round-3 re-judged the four affected packets: all
  declined, exact. No expectations were changed in rounds 2–3.
- 2026-08-02 (round-1 blind adjudication) — two **fixture-encoding corrections** (rows
  unchanged; found by the blind judges reading my patch excerpts more carefully than I wrote
  them): ADV-03's `OpsSigning.cs` comment implied API-startup key loading (an unregistered M1
  auth crossing — rewritten as an unwired script helper) and ADV-04's spilled patch line
  changed the store's public shape (an unregistered M1 boundary crossing — rewritten as a
  private helper). The rows register M2-only / M5+M2; the patches now encode that intent.
  Tool-side same round: adjudication packets became **evidence-gated per checkpoint** (a K1
  judge saw ledgers/diffs that don't exist yet — packet bug, not a judge failure) and the
  pinned prompt gained rules 8–12 (hedged posture is crossable; M3 domain limits; checkpoint
  gating; no re-raises; no pre-empting additive scan detection).
- 2026-08-02 (first scan run) — one **expectation correction**, per the changelog rule:
  SC-01 K1 M2 changes `by: adjudication` → `by: scan`. Cause: the same-day `Security/ (new)`
  scope enrichment made the K1 scan legitimately sighted (the auth class matches the predicted
  new path) — the tool fired correctly and the frozen "scan is blind at K1" wording became
  stale. NOT a fit-to-pass edit: the deterministic firing is the better behaviour; K1
  auth-adjudication necessity remains covered by SC-07 and ADV-01. acceptance.md's semantic
  subset updated accordingly (also corrected to list SC-12 K1 and SC-21's M3, always
  adjudication-registered in their fixtures).
