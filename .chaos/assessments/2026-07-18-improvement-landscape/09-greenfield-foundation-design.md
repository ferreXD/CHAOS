---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:01:59+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:01:59+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:cb976d15a2c89ab89fc1b04a3b3f93990b5cadee9cf76aebe70c51aa1b7fe73a"
---

# 09 — Greenfield Foundation Discovery: design

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Companion catalog (areas, options, full definitions): [10-greenfield-foundation-catalog.md](10-greenfield-foundation-catalog.md). Improvement ID: **IL-AG1** (consumers: IL-AG2/AG5/AG6).
Required-output map: experience §2 · areas §3 · options/definitions [10] · dependency model §4 · presets §5 · detection §6 · DC flow §7 · bootstrap §8 · artifacts §9 · ADR/rule/gate relationship §10 · command impacts §11 · revision §12 · risks §13 · MVP+deferred §14 · experiments §15 · roadmap §16 · worked example §17.

## 9.1 Design stance

A blank repository must not become an invitation for the model's favorite architecture. The foundation is a **small, explicit, user-selected posture** — 4 (+1 conditional) areas, 19 curated options total, versioned as a finite catalog — that gives humans a shared vocabulary and agents executable constraints. It is *not* an architecture encyclopedia, a wizard of dozens of questions, or an AI-generated architecture the user rubber-stamps. Every option has consequences (constraints, encouraged/discouraged practices, derived rules); options without executable consequences were rejected during design.

## 9.2 Recommended greenfield-init experience

```text
chaos:init
 → phase 0  preflight (git, existing .chaos?)
 → phase 1  minimal runtime bootstrap (mechanical, no decisions)
 → phase 2  greenfield detection scan → detection report (deterministic + labeled)
 → stop 1   POSTURE decision: "No established posture found. Treat as greenfield?"
            options: preset ×3 · area-by-area · regulated overlay toggle · "not greenfield — route to archaeology"
 → stop 2   FA-1 topology (3 options, evidence-backed recommendation or abstention)
 → stop 3   batch: FA-2 structure + FA-3 data + FA-4 delivery (independent given FA-1; options filtered by FA-1)
 → stop 4   FA-C communication (only if FA-1 ≠ single-deployable, or user opts in)
 → stop 5   RATIFY: preview foundation.yaml + derived ADR/rules/gates + AGENTS.md block → confirm
 → phase 3  write artifacts, complete command, release lock
```

Worst case **6 stops**; with a preset, stops 2–4 collapse into one *review-and-override* batch → **3 stops**. Non-interactive path: `chaos:init --preset pragmatic-product --yes` (§9.7). Every stop is a runtime decision — answerable in the Decision Center or the chat fallback — so init itself dogfoods the decision loop and the whole selection is auditable from day one.

## 9.3 Foundation areas — exactly five, one conditional

| # | Area | Question it answers | Always asked? |
|---|---|---|---|
| **FA-1** | System topology & deployment | How many independently deployable units, and why? | Yes |
| **FA-2** | Internal structure & domain organization | What is the *primary organizing principle* of the code? | Yes |
| **FA-3** | Data ownership & consistency | Who owns which data, under what consistency model? | Yes |
| **FA-4** | Delivery & operational posture | How much rigor does shipping demand here? | Yes |
| **FA-C** | Communication & integration | How do parts talk — sync, async, hybrid, in-process? | **Conditional:** asked when FA-1 ≠ single-deployable, or on opt-in; for FA-1-A it defaults to in-process contracts (C-D) with external-edge notes |

Rationale for this cut: topology/structure/data are the three choices that most constrain everything else; delivery posture is qualitatively different (it tunes CHAOS's own rigor defaults); communication is real but **largely determined by topology** — asking it unconditionally would present false choices to monolith teams (the brief's "explain how this area relates to topology" resolved by making the dependency structural). Quality/testing/observability/security are **downstream policies derived from FA-4**, not separate areas — one posture selection sets their defaults, each individually overridable later via rules (keeps the wizard at ≤5 questions).

## 9.4 Dependency & compatibility model

- **Dependency edges:** FA-1 → {FA-2, FA-3, FA-4 (weakly), FA-C}; FA-3 → FA-C. Questions are sequenced along edges (IL-DQ8 dependent-decision chains); FA-2/FA-3/FA-4 form an independent frontier after FA-1 and are batched.
- **Filtering, not warning-spam:** later areas show only options compatible with earlier picks (F1-A hides F3-C "service-owned stores"; F1-C requires it). Incompatible = hidden with a one-line "why not shown"; *risky-but-legal* combos (F1-B + F3-A shared DB across services) stay visible with an explicit warning that is recorded in `compatibilityWarnings` if chosen.
- **Hard incompatibilities (catalog v1):** F1-A × F3-C · F1-C × F3-A · F1-A × C-B-as-primary (async-first inside one deployable is an edge-case, not a posture) · F3-D without a named domain list.
- Compatibility notes per option live in the catalog ([10], "combines well / risky with").

## 9.5 Presets — three, plus one overlay

| Preset | Selections | For |
|---|---|---|
| **pragmatic-product** | F1-A · F2-B · F3-A · C-D · D-A | small teams shipping a product; the default recommendation absent contrary evidence |
| **structured-enterprise** | F1-A · F2-D · F3-B · C-D (C-C at external edges) · D-B | complex domains, longer horizon, extraction-readiness |
| **distributed-platform** | F1-B · F2-C · F3-C · C-C · D-D | genuine multi-team/platform scale with ops maturity |
| **regulated overlay** | forces D-C + CHAOS strict-mode defaults + audit retention rules; composes with any preset | compliance contexts |

Verdict on the preset question: **presets improve onboarding without oversimplifying, on one condition — the review step is mandatory.** A preset only *preselects*; stop 2 presents every area's selection for inspection/override (GF-X3 measures whether presets fit: users overriding ≥3 areas means the preset set is wrong). Three presets is the cap; no branded methodology packs — a fourth preset requires retiring one.

## 9.6 Greenfield detection contract

Deterministic scan producing `detection` with per-signal evidence and an overall classification:

- **Signals:** ADRs/decision-log absent · application source below threshold (language files outside scaffolding < N) · no meaningful build/dependency manifests · no architecture docs (docs/ scan) · repo age/commit count · CHAOS/OpenSpec workspaces absent · **user declaration** (always wins).
- **Classification:** `greenfield` (all structural signals empty) · `brownfield` (substantial source present — regardless of missing docs; poor documentation ≠ greenfield) · `ambiguous` (mixed, e.g. scaffolded-but-empty service skeletons).
- **Rules:** never silently initialize foundations — even a confident `greenfield` result is presented in stop 1 for confirmation; `ambiguous` asks explicitly with the signals shown; `brownfield` routes to archaeology + the observed-posture path (IL-AG5, deferred) and *offers* foundation ratification only after evidence exists. Classification + confidence recorded in `selection-evidence.md`.

## 9.7 Decision Center interaction flow (and fallbacks)

- **Grouping:** guided multi-step session under one `commandRunId`, changeId reserved as `project-foundation` (locks the foundation against concurrent mutation). Stops per §9.2; batch frontier uses existing `batch-independent`; chains use IL-DQ8 `dependsOn`.
- **Per-question rendering:** option cards from the catalog (name, one-liner, best-fit/poor-fit, complexity), the agent's recommendation **only when evidence supports it** (detection signals, user's stated intent) with confidence — otherwise explicit abstention (IL-DQ5); "custom/hybrid" is always the last option and requires a justification (recorded as rationale, flags the area `custom: true` with reduced automation downstream).
- **Fallbacks:** DC unavailable → chat-interactive decisions (the runtime-disabled path already exists; answers still written through the runtime CLI when possible). Non-interactive/CI: `--preset <id> --yes` writes the foundation with `selectedBy: automation`, confidence capped MEDIUM, and an open **ratification decision** left pending for a human (surfaced by doctor until answered). Cancellation/partial: capsule per session; completed areas persist as `status: draft`; `chaos:resume` continues; doctor reports a draft foundation.

## 9.8 Runtime bootstrapping sequence

The circularity (init needs the runtime to record init's decisions) resolves because the runtime's substrate is mechanical: **phase 1 writes `.chaos/interactions/` schema + contracts + a config stub with the runtime enabled — no decisions required** — then `chaos_begin_command` starts the foundation session, and every subsequent choice is a real runtime decision. If even phase 1 fails (no write access, MCP absent), init degrades to chat-interactive with a warning that the foundation session will not be runtime-audited — never a silent degradation.

## 9.9 Foundation artifacts

```text
.chaos/foundation/
  foundation.yaml          # AUTHORITATIVE — machine-readable
  foundation.md            # generated human view (regenerated from yaml; header-marked, never hand-edited)
  selection-evidence.md    # authored evidence: detection report, per-area rationale, rejected options + why
```

The catalog itself ships **inside CHAOS** (skill reference data), pinned by `catalogVersion` in the yaml — no separate `catalog-version.json` (one fewer file to drift; the brief's "propose a better minimal structure" answered). `foundation.yaml` top-level fields: `schemaVersion`, `catalogVersion`, `status: draft|active|superseded`, `selections[{area, optionId, custom?, rationale, confidence, assumptions[], selectedAt, selectedBy, decisionRef}]`, `compatibilityWarnings[]`, `constraints[]` (flattened, agent-consumable), `encouragedPractices[]`, `discouragedPractices[]`, `derived {adrs[], rules[], gates[]}` (refs, not copies), `unresolvedQuestions[]`, `sourceCommand`, `changeHistory[]`. `foundation.md` explains: chosen posture, why, trade-offs accepted, consequences, agent constraints (the block AGENTS.md embeds — IL-AG6), what remains undecided, and **how to revise it** (§9.12) — the file must never read as permanent. Authoritative/derived status is declared per IL-TR6.

## 9.10 Relationship to ADRs, rules, gates, decision logs

**Foundation = initial posture and defaults. ADR = specific contextual decision. Rule = enforceable/reviewable constraint. Gate = validation requirement. Decision log = smaller scoped choice.** Derivation policy (hard cap ≈8 governance files at init — the anti-goal guard):

| Selection | Generates |
|---|---|
| FA-1 topology | **1 real ADR** (topology choices are genuinely architectural) + 1 dependency-direction rule |
| FA-2 structure | ADR *candidate* (ratified on first structural change) + 1 module-boundary rule |
| FA-3 data | ADR (if F3-B/C/D) or documentation-only (F3-A) + ownership rule where applicable |
| FA-C communication | rule (interaction-class table) · ADR candidate only for C-B/C-C |
| FA-4 delivery | **gates** (test/validation requirements per risk level) + CHAOS mode defaults; documentation otherwise |

Later ADRs **refine** the foundation within its constraints freely; an ADR that **contradicts** a foundation constraint requires the governed revision flow (§9.12) — agents encountering a conflict must raise a foundation-conflict decision (IL-AG2), never proceed silently.

## 9.11 Command impacts

| Command | Impact |
|---|---|
| `chaos:init` | Hosts the whole flow (§9.2); brownfield route unchanged plus observed-posture offer (deferred) |
| `chaos:propose` | Template cites applicable constraints by ID; proposals violating one trigger the foundation-conflict decision (proceed-with-ADR-override / revise-proposal / revise-foundation) |
| `chaos:review` | Checks proposal against constraints/discouraged practices; strict blocks on unresolved conflicts |
| `chaos:apply` | Constraints act as scope boundaries (e.g. dependency direction); violations = scope drift |
| `chaos:sync` | Reconciles derived artifacts after revisions; promotes ratified ADR candidates; regenerates `foundation.md` + AGENTS.md block |
| `chaos:doctor` | Probes: foundation present/absent/draft, schema+catalog version valid, derived refs resolve, ratification pending (CI path), staleness (changeHistory vs derived artifacts) |
| `chaos:status`→doctor | One posture summary line ("modular monolith · vertical slices · shared transactional core · pragmatic delivery · 2 unresolved questions") |
| `chaos:retro` | May propose foundation revisions with evidence (recurring conflicts, drift observations) — proposals only, never edits |
| `chaos:todo` | `unresolvedQuestions[]` become todo candidates with foundation provenance |

**No new user-facing command** — creation is init, revision is a propose template, inspection is doctor/DC ([05 §5.2](05-command-portfolio.md) kill decision).

## 9.12 Revision strategy

```text
current foundation → evidence for change (retro finding, recurring conflict, scale event)
→ chaos:propose --template revise-foundation-<area>   (impact analysis auto-listed from derived {} refs)
→ review (strict for FA-1/FA-3 — one-way-door class) → human decision → ADR records the change
→ foundation.yaml updated (changeHistory append, catalog option swap, status transitions)
→ sync updates derived rules/gates + regenerates views → doctor verifies coherence
```

Catalog migration: a new `catalogVersion` never silently re-maps selections; doctor reports "catalog updated; foundation pinned to v1 — review optional." Selections reference `optionId@catalogVersion`, so old foundations stay valid forever.

## 9.13 Risks and failure modes

| Risk | Mitigation |
|---|---|
| Catalog dogma (options ossify into "the right answers") | custom/hybrid escape hatch; catalog is versioned and revisable; options carry poor-fit warnings as prominently as best-fit |
| False greenfield (brownfield with poor docs initialized as blank) | detection rule: substantial source ⇒ brownfield, regardless of docs; never-silent confirmation |
| Preset rubber-stamping | mandatory review stop; GF-X3 override-rate metric |
| Constraint rot (foundation ignored by agents) | constraints embedded in AGENTS.md generated block + propose/review consumption (IL-AG2); conflict decisions make violations loud |
| Wizard fatigue | ≤6 stops worst case, 3 with preset; abstention allowed; partial completion persists |
| Model steering the selection | recommendations require detection/user-intent evidence, else abstain (IL-DQ5); options rendered symmetrically |
| Init session dies mid-flow | capsule + draft status + resume; doctor flags drafts |

## 9.14 MVP scope and deferred capabilities

**MVP (beta horizon):** detection contract · 3 presets + regulated overlay + area-by-area · catalog v1 (19 options as in [10]) · foundation.yaml/md/selection-evidence · derivation caps (≈8 files) · AGENTS.md generated block · propose/review textual consumption + conflict decision · doctor presence/validity probes · revision via propose template · `--preset --yes` CI path with pending ratification.
**Deferred:** observed-posture brownfield mirror (IL-AG5) · deterministic conformance checks against constraints (needs IL-AG4/PF4) · compatibility linting beyond the hard-block list · catalog migration tooling · per-area advanced variants · foundation diff visualization in DC · additional presets.

## 9.15 Validation experiments

| ID | Test | Threshold |
|---|---|---|
| GF-X1 | 3 devs run greenfield init cold | complete ≤15 min, ≤6 stops, posture correctly recorded |
| GF-X2 | Same greenfield task with vs without foundation | with-foundation runs show measurably less architecture drift from stated posture (structure conformance, dependency direction) |
| GF-X3 | Preset fit | median overrides per preset ≤2 areas |
| GF-X4 | Revision flow dry-run | revise-foundation change updates yaml + derived artifacts coherently; doctor green |

## 9.16 Roadmap items

**EA-B6 — Foundation MVP** (beta, after EA-B1; deps IL-DQ8, IL-RT5) · **EA-B7 — Foundation-aware commands** (IL-AG2, with B6) · **EA-A5 — Observed-posture explore** (IL-AG5, beta→v1) · catalog v1.1 review post-GF-X3. Registered in the [final prioritization](11-final-prioritization.md) and the roadmap addendum to the first assessment.

## 9.17 Worked example — "Lumen", a B2B invoicing SaaS (team of 4, .NET, 6-month runway)

1. **Detection:** empty repo (README + .gitignore only) → `greenfield`, confidence HIGH; stop 1 shows signals; user confirms and picks **pragmatic-product** preset, regulated overlay OFF.
2. **Review batch (stop 2):** preset preselects F1-A / F2-B / F3-A / C-D / D-A. User overrides **F3-A → F3-B** (module-owned schemas), rationale captured: *"billing will likely be extracted for a partner API next year; keep its schema separate from day one."* Compatibility check: F1-A × F3-B fine; warning none.
3. **Ratify (stop 3):** preview shows `foundation.yaml` (7 selections/fields), ADR-0001 *"Structured modular monolith for Lumen"*, rules `R-DEP-001` (modules depend only on published module contracts; no cross-module internals), `R-DATA-001` (no cross-module schema joins; billing schema owned by billing module), gate `G-TEST-001` (behavioral change requires slice-level tests, from D-A), AGENTS.md block (~20 lines: posture, constraints by ID, discouraged practices). User confirms; init completes; lock released. Total: **3 stops, ~10 minutes.**
4. **Downstream:** first `chaos:propose` ("add invoice PDF export") cites R-DEP-001/R-DATA-001 as applicable constraints, confidence HIGH, no conflicts. Third week, an agent proposes a shared `utils` reaching into billing internals → review flags R-DEP-001 → conflict decision → user picks *revise-proposal*. Month 4, real partner-API pressure arrives → `chaos:propose --template revise-foundation-topology` proposes F1-A → F1-B (extract billing), impact analysis lists ADR-0001, R-DEP-001, G-TEST-001 as affected; strict review; approved; ADR-0002 records the extraction decision; foundation.yaml changeHistory gains entry #2; sync updates the derived artifacts. The whole architectural life of the project is now a readable chain: foundation → conflicts → revision — exactly the trail CHAOS exists to produce.
