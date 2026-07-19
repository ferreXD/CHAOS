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
    bodyHash: "sha256:84dc92f06468a988a5832ae75b4da574ef72de719483b1055863270412e1c506"
---

# 02 — Improvement topics: Workflow (WF) · Decision quality (DQ) · Traceability (TR)

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Format per topic: category · complexity **L/M/H/VH** · impact · **recommendation** · timing. `(= EA-…)` = carried over from the [first assessment](../2026-07-18-public-alpha-assessment/13-improvement-inventory.md). Ceremony effect: ↓ reduces, ↑ increases, = neutral.

## WF — Workflow & command model

### IL-WF1 · Risk × execution-profile model `(= EA-B1/EA-I18)`
workflow · **M-L** · **transformative** · **must do** · beta-foundation
- **Problem:** one axis couples assurance with process weight; small strict-risk changes pay 9 sessions/19 artifacts. **Change:** `light|standard|strict` (required gates) × `micro|compact|full` (sessions/artifacts/stops); `strict-compact` = consolidated session(s), one consolidated report, batched decisions, full gates. **Users/value:** everyone; removes the #1 abandonment driver. **Evidence:** measured ceremony (first assessment §5/§6); mode texts change requirements, not structure. **Deps:** EA-V1 evidence. **Risks/downsides:** matrix complexity — keep defaults inferred, one confirmation. **Validation:** EA-X3 (≤2 sessions, ≤4 stops, ≤35k tokens). **Token:** ↓↓ · **Ceremony:** ↓↓ · core.

### IL-WF2 · `chaos:run` — consolidated lifecycle driver
new command · **M** · high · **explore** · beta
- **Problem:** even with profiles, users must invoke 3–6 commands in order and carry context between sessions. **Change:** one driver runs propose→apply→verify as *phases* of a single governed session at the chosen risk/profile; per-phase gates become internal checkpoints; existing commands remain for à-la-carte use. **Users/value:** newcomers and compact-profile users; "one command per change". **Evidence:** lifecycle read/write matrix shows phases share most context. **Deps:** IL-WF1. **Risks/downsides:** long sessions strain context; blurred command identities; must not silently skip gates. **Validation:** prototype on the showcase change; compare tokens/stops vs command-by-command. **Portfolio test:** see [05 §5.4](05-command-portfolio.md). **Token:** ↓ (shared context) · **Ceremony:** ↓ · optional.

### IL-WF3 · Merge overlapping commands `(= EA-I25)`
removal or simplification · **M** · high · **should do** · beta
- **Problem:** status/doctor, verify/code-review, archive/change-scoped-sync overlap in purpose and re-read the same evidence. **Change:** doctor absorbs status (one health command, env + workspace sections); archive absorbs change-scoped sync (repo-wide `--all` stays); verify+code-review combine at compact profile, stay separate at full. **Users/value:** fewer concepts, less re-reading. **Evidence:** first assessment §5.1 dispositions. **Deps:** IL-WF1. **Risks:** retraining; alias shims mitigate. **Validation:** EA-X1 concept-count reduction. **Token:** ↓ · **Ceremony:** ↓ · core.

### IL-WF4 · Deterministic blast-radius estimator
workflow · **M** · high · **should do** · beta
- **Problem:** mode/profile inference is model judgment; inconsistent, unexplained, and itself costs a decision stop. **Change:** a deterministic pre-scan (diff surface, touched-module fan-in/out from the repo manifest IL-PF7, path classes like auth/persistence/contracts from config) produces a risk/profile *proposal with evidence*; the model only adjudicates edge cases; one confirmation decision shows the signals. **Users/value:** consistent, explainable rigor selection. **Evidence:** `overview.md` already defines blast-radius heuristics as prose. **Deps:** IL-PF7 (manifest). **Risks/downsides:** false confidence in a crude metric — always show signals, allow override. **Validation:** classify 20 historical changes, compare with human judgment. **Token:** ↓ (replaces reasoning) · **Ceremony:** ↓ · core.

### IL-WF5 · Governed break-glass path (`--emergency`)
workflow · **M** · high · **should do** · beta
- **Problem:** CHAOS has no emergency lane; when production is down, users will bypass governance entirely (risk EA-R2) and the trail loses exactly the changes that most need one. **Change:** `chaos:apply --emergency` (flag, not a new command): minimal pre-gates, mandatory decision recording *during*, auto-created debt: a retroactive review+verify todo and a waiver with expiry; archive blocked until the retroactive pass completes. **Users/value:** on-call engineers; keeps the trail alive under pressure. **Evidence:** every governance system that lacks a break-glass gets bypassed (Inferred; industry pattern). **Deps:** IL-TR4 (waiver lifecycle). **Risks/downsides:** abuse as a fast lane — rate-limit per period, surface count in doctor/status. **Validation:** simulated hotfix drill. **Token:** ↓ at use, deferred cost later · **Ceremony:** ↓ then ↑ (deliberately) · core.

### IL-WF6 · Slim `chaos:todo` to emit-and-curate
removal or simplification · **M** · medium · **should do** · beta
- **Problem:** todo is the second-heaviest command (26.2k tokens, 16 mandatory reference files) for what is largely mechanical scanning/dedup. **Change:** commands only *emit* candidates (already true); curation becomes a deterministic tool pass (scan, dedupe by provenance ID, render HTML — todo-views already exists) with a small model pass only for ambiguous merges; `chaos:todo` remains as the invoking wrapper. **Users/value:** cheaper backlog upkeep. **Evidence:** 5 of 8 public dogfood runs were todo — its cost recurs most. **Deps:** IL-PF4. **Risks:** dedupe quality drops — keep model assist for conflicts. **Validation:** run both paths on the current backlog, diff results. **Token:** ↓↓ for todo runs · **Ceremony:** = · core.

### IL-WF7 · Retro becomes periodic + trigger-based
workflow · **L** · medium · **should do** · beta
- **Problem:** per-change retro is a third full re-read of all evidence; low marginal insight per change. **Change:** default retro cadence = every N archived changes or on triggers (repeated waiver class, verify finding recurring, emergency use); per-change retro stays available at full profile. **Users/value:** keeps the improvement loop, cuts its cost ~N×. **Evidence:** first assessment §5.2 re-read analysis. **Deps:** IL-PF3 (evidence index makes periodic retro cheap). **Risks:** delayed learning — triggers mitigate. **Validation:** compare insight yield per token, per-change vs periodic. **Token:** ↓ · **Ceremony:** ↓ · core default change.

### IL-WF8 · Task-level apply re-entry
command enhancement · **M** · medium · **explore** · beta
- **Problem:** apply is resumable only at decision boundaries; a crash mid-task-list loses fine-grained position. **Change:** `chaos:apply --task <n>` + capsule `lastCompletedStep` at task granularity (schema already has the field); OpenSpec `tasks.md` checkboxes are the authoritative cursor. **Users/value:** long implementations survive interruptions precisely. **Evidence:** capsule schema has `lastCompletedStep`/`nextStep` (Observed) — underused. **Deps:** IL-RT3. **Risks:** cursor drift vs actual code state — verify-on-resume against checkboxes+diff. **Validation:** EA-X4 extension. **Token:** ↓ on resume · **Ceremony:** = · optional.

### IL-WF9 · Retire the `chaos:gate` concept
removal or simplification · **L** · medium · **must do** · alpha
- **Problem:** an undecided phantom command haunts the backlog ("decide-chaos-gate-fate") and the docs; gates-as-a-command duplicates review/verify. **Change:** close the question: gates are *data consumed by* review/verify/diagnostics (IL-AG4), never a command; remove references. **Users/value:** one less concept; resolves an open governance item. **Evidence:** `.chaos/todo/index.md` open item; no runtime session ever ran it. **Deps:** none. **Risks:** none found. **Validation:** docs grep clean. **Token:** = · **Ceremony:** ↓.

## DQ — Decision quality & human interaction

### IL-DQ1 · Decision schema v2: reversibility, urgency, expiry, evidence
runtime · **M** · **transformative** · **should do** · beta
- **Problem:** decisions today carry options/consequences/context but no reversibility class, urgency, expiry, or per-option evidence links — so the human can't triage and the runtime can't apply differentiated policy. **Change:** add `reversibility: two-way|one-way`, `urgency`, `expiresAt` (policy-set, IL-DQ10), `blastRadius`, per-option `evidenceRefs[]` (stable IDs, IL-TR9) and `recommendation {optionId, confidence, evidenceRefs}`; schemaVersion 2 (needs IL-RT5). **Users/value:** triage-able queue; one-way doors get ceremony, two-way doors get speed. **Evidence:** real decision records (Observed) show rich prose but no classes. **Deps:** IL-RT5, IL-TR9. **Risks/downsides:** classification burden on agents — default two-way + heuristics; misclassification risk — reviewable in DC. **Validation:** EA-X5 materiality ratings vs classes. **Interaction decisions:** none new. **Token:** ↑ slightly per decision · **Ceremony:** ↓ net (fewer stops for two-way doors) · core.

### IL-DQ2 · Materiality doctrine + stop budgets
governance · **L** · **transformative** · **must do** · alpha
- **Problem:** "material decision" is undefined enough that commands average 11–14 stops/change; fatigue is the thesis-killer. **Change:** a shared-protocol materiality test (stop only if: one-way door, OR crosses an approved-scope/foundation/ADR boundary, OR accepts risk, OR human explicitly reserved it); everything else = inline choice *logged as a decision event, not stopped for*; per-command soft stop budgets (propose ≤3, apply ≤2 standard) with overflow batching. Prompt-text change only. **Users/value:** the single cheapest fatigue fix. **Evidence:** stop accounting (first assessment §5.3); anti-goals in this exercise's brief. **Deps:** none. **Risks/downsides:** under-stopping hides real decisions — the logged-not-stopped events remain reviewable in DC history (IL-DQ3) and can be escalated. **Validation:** EA-X5 ≥70% of stops rated material. **Token:** ↓ · **Ceremony:** ↓↓ · core.

### IL-DQ3 · Decision queue + batch answering in the Decision Center `(= EA-I11 part)`
UX · **M** · high · **should do** · beta
- **Problem:** `decisionBatching: batch-independent` exists in the runtime but the panel presents decisions one-by-one; each stop is a separate interruption. **Change:** queue view with grouped independent decisions, "answer all then resume once", ordering by urgency/reversibility (IL-DQ1). **Users/value:** one interruption instead of N. **Evidence:** config supports batching (Observed, underexploited). **Deps:** IL-DQ1 helpful, not required. **Risks:** rushed batch answers — show per-item evidence inline. **Validation:** EA-X5 latency + fatigue. **Ceremony:** ↓ · core.

### IL-DQ4 · Decision impact previews
command enhancement · **M** · medium · **should do** · beta
- **Problem:** options state consequences as prose; the human can't see concrete downstream effects. **Change:** each option carries a structured preview where derivable: files/modules likely touched (from manifest), follow-on decisions expected, gates triggered, reversal cost note. Deterministic where possible, labeled INFERENCE otherwise. **Users/value:** faster, better-grounded answers. **Evidence:** the real README-rewrite decision (Observed) had 1,900 chars of context but no structured impact. **Deps:** IL-PF7, IL-DQ1. **Risks/downsides:** preview fabrication — require evidence labels; keep optional for two-way doors. **Validation:** user rating of preview usefulness in EA-X5. **Token:** ↑ per material decision, ↓ overall (fewer clarification rounds) · optional.

### IL-DQ5 · Abstention and evidence-threshold rule
governance · **L** · high · **should do** · alpha-beta
- **Problem:** an agent that always recommends trains the human to rubber-stamp; recommendations without evidence are manipulation-shaped. **Change:** shared-protocol rule: no `recommended` flag unless the recommendation cites evidence refs and confidence ≥ MEDIUM; below that the agent must abstain ("insufficient evidence — options presented without recommendation") or offer an evidence-gathering option (bounded archaeology). **Users/value:** trust; calibrated deference. **Evidence:** anti-manipulation requirement in the brief; confidence doctrine already exists to build on. **Deps:** IL-TR9 for refs. **Risks:** over-abstention annoys — threshold tunable. **Validation:** count abstentions vs overrides in showcase + EA-X5. **Ceremony:** = · core doctrine.

### IL-DQ6 · Decision outcome tracking & calibration
accountability · **M** · **transformative** · **explore** · beta-v1
- **Problem:** nobody learns whether recommendations were right; "did the outcome match the prediction?" is unanswerable. **Change:** decisions gain an outcome record closed at verify/archive/retro (`outcome: confirmed|partial|contradicted|unknown`, evidence ref); retro aggregates per-category calibration ("apply-scope recommendations: 9/11 confirmed"); calibration feeds future recommendation confidence. **Users/value:** the workflow provably improves; unique differentiator (no researched tool does this). **Evidence:** decision/verify artifacts already exist to link. **Deps:** IL-DQ1, IL-TR5 (same investment). **Risks/downsides:** outcome attribution is fuzzy — allow `unknown`, never force; audit noise — one record per material decision only. **Validation:** showcase change closes ≥80% of its decisions with outcomes. **Token:** ↑ small · **Ceremony:** = · optional→core.

### IL-DQ7 · Adversarial second-look on strict one-way doors
governance · **M** · medium · **explore** · beta
- **Problem:** single-agent recommendations on irreversible decisions inherit that agent's framing bias. **Change:** for `strict` + `one-way` decisions only: a second bounded pass (subagent) tasked to refute the recommendation before it is presented; refutation summary attached to the decision. **Users/value:** highest-stakes calls get a devil's advocate. **Evidence:** judge/refute patterns standard in agent QA. **Deps:** IL-DQ1. **Risks/downsides:** token cost; theatrical disagreement — cap at one pass, require evidence-cited refutations. **Validation:** rate of recommendation changes after refutation. **Token:** ↑ (bounded, strict-only) · **Ceremony:** = · optional.

### IL-DQ8 · Dependent-decision graph
runtime · **M** · medium · **explore** · beta
- **Problem:** batching treats decisions as independent; real ones depend (foundation areas, scope→approach). **Change:** `dependsOn[]` in decision schema; runtime blocks answering out of order; DC renders the chain; batch = the independent frontier. **Users/value:** coherent multi-decision sessions (required by greenfield init, [09](09-greenfield-foundation-design.md)). **Evidence:** foundation questions are inherently sequenced. **Deps:** IL-DQ1, IL-DQ3. **Risks:** over-modeling — allow linear chains only at first. **Validation:** greenfield session prototype. · core-for-init.

### IL-DQ9 · Structured rationale capture
UX · **L** · medium · **should do** · beta
- **Problem:** rationale is one free-text box; sync later promotes decisions to ADRs and must reverse-engineer the *why*. **Change:** DC answer form adds optional structured fields: `why`, `rejectedBecause` (per rejected option, one line), `revisitWhen`; capsules and sync consume them. **Users/value:** ADR promotion quality; future readers. **Evidence:** the real captured rationale (Observed) was good precisely because the human volunteered structure. **Deps:** IL-DQ1 schema. **Risks:** form fatigue — all fields optional, one-line hints. **Validation:** sync-promoted ADR quality diff. **Ceremony:** ↑ tiny, opt-in · core.

### IL-DQ10 · Decision expiry & staleness policy
runtime · **L** · low-medium · **should do** · beta
- **Problem:** `expired` is a terminal state no policy ever sets; ancient unanswered decisions linger as pending forever. **Change:** config policy (`decisionExpiry: {default: 7d, strict: none}`); runtime marks expiry, DC badges age, doctor flags; expired decisions require re-validation (recreate with fresh evidence) not silent reuse. **Users/value:** queue hygiene; stale answers can't mislead resumes. **Evidence:** state machine supports it (Observed, unused). **Deps:** none. **Risks:** expiring something the user meant to answer — badge + grace, never auto-cancel strict. **Validation:** stale-queue simulation. · core.

## TR — Evidence, traceability & accountability

### IL-TR1 · Decision→files→tests provenance chain
traceability · **M** · **transformative** · **should do** · beta
- **Problem:** "which files changed because of DEC-X, and which tests validated it?" is unanswerable; the pieces exist unlinked (touched-files hook writes `.chaos/runtime/`, apply-report narrates, verify narrates). **Change:** apply records a per-task manifest `{taskId, decisionRefs[], filesTouched[] (from the hook stream), validation: {command, exit, testRefs}}` into the change folder; verify consumes and confirms it; decision events link back. Deterministic capture, model only annotates. **Users/value:** the audit trail becomes *queryable*, not narrative; the strongest compliance story. **Evidence:** hooks already capture touched files (Observed) — wiring is missing. **Deps:** hooks working (IL-RT7). **Risks/downsides:** manifest drift if hooks fail — doctor cross-checks git diff; noise — per-task granularity only. **Validation:** showcase change answers all 14 accountability questions ([07](07-traceability-accountability-analysis.md)). **Token:** ↓ (replaces narrative re-derivation) · core.

### IL-TR2 · Model/provider attribution
traceability · **L** · medium · **should do** · alpha-beta
- **Problem:** "which agent/model/provider contributed?" — unrecorded. **Change:** sessions and stamped artifacts gain `provider`, `model`, `adapter` fields (runner already knows; commands can read env); decision events note the proposing model. **Users/value:** compliance answerability; debugging model-specific failures. **Evidence:** artifact-metadata hook already stamps identity (Observed) — extend the schema. **Deps:** none. **Risks:** none material. **Validation:** fields present in showcase artifacts. · core.

### IL-TR3 · Deterministic-vs-reasoned labeling
traceability · **L** · medium · **explore** · beta
- **Problem:** readers can't tell which report sections are computed facts vs model narrative. **Change:** report template convention: sections marked `source: deterministic (tool@version)` vs `source: model-reasoned`; diagnostics JSON embedded verbatim gets the former automatically. **Users/value:** calibrated trust per section; auditors can weight accordingly. **Evidence:** confidence doctrine exists for claims; this extends it to provenance. **Deps:** IL-PF4 (more deterministic sections to label). **Risks:** label sprawl — section-level only. **Validation:** reader comprehension test on showcase reports. · optional.

### IL-TR4 · Waiver lifecycle
governance · **M** · high · **should do** · beta
- **Problem:** waivers are prose in `waivers.md`; no IDs, owners, expiry, or follow-up — accepted risk silently becomes permanent. **Change:** waivers get `{id, risk, scope, acceptedBy, decisionRef, expiresAt|revisitOn, status}`; doctor/status flag expired waivers; archive lists open waivers; break-glass (IL-WF5) auto-creates one. **Users/value:** accepted risk stays visible until retired. **Evidence:** waivers.md is in the documented layout with no lifecycle semantics (Observed). **Deps:** none. **Risks:** ceremony creep — waivers only for standard/strict blockers. **Validation:** doctor flags a deliberately expired waiver. **Ceremony:** ↑ tiny, targeted · core.

### IL-TR5 · Outcome feedback records `(pairs IL-DQ6)`
accountability · **M** · high · **explore** · beta-v1
- Same investment as IL-DQ6 seen from the ledger side: an append-only `outcomes.jsonl` per change linking decision → outcome → evidence, consumed by retro. Kept as a separate ID so the ledger format spec (IL-EX6) includes it even if calibration UX (DQ6) waits. **Recommendation:** explore with DQ6.

### IL-TR6 · Authoritative-artifact map
traceability · **L** · medium · **should do** · beta
- **Problem:** "which artifacts are authoritative?" is answered only by convention (docs say OpenSpec owns specs; lifecycle.md ties reports). **Change:** `lifecycle.md` (or the evidence index IL-PF3) gains an explicit table: artifact → authoritative|derived|generated-view → owner; generated views carry a header marker; a diagnostics probe verifies no derived file is newer than its source without regeneration. **Users/value:** ends editing-the-wrong-file class of errors. **Evidence:** foundation design needs the same distinction ([09 §artifacts](09-greenfield-foundation-design.md)). **Deps:** none. **Validation:** probe catches a seeded violation. · core.

### IL-TR7 · Confidence history index
traceability · **L** · low-medium · **explore** · v1
- **Problem:** confidence transitions (proposal MEDIUM → verify HIGH) are recorded in prose across reports, not queryable. **Change:** evidence index (IL-PF3) records per-claim confidence entries; status can render "confidence climbed/dropped" per change. **Value:** the confidence doctrine becomes visible as a trajectory. **Deps:** IL-PF3. **Recommendation:** explore — nice, not load-bearing.

### IL-TR8 · PR ledger rendering `(= EA-A2/EA-I22)`
integration · **S→M** · high · **should do** · beta
- **Problem:** the trail lives in files reviewers never open; teams live in PRs. **Change:** deterministic renderer: `decision-events.md` + waivers + verify verdict → a PR-body section (and/or a check summary). **Users/value:** first team-visible surface; zero methodology buy-in required from reviewers. **Deps:** IL-TR1 strengthens it. **Risks:** PR noise — collapse-by-default section. **Validation:** pilot on CHAOS's own PRs once CI exists. · optional→core.

### IL-TR9 · Stable evidence IDs for archaeology findings
traceability · **M** · high · **should do** · beta
- **Problem:** "what evidence existed?" — archaeology findings are prose; proposals cite them loosely; nothing survives rewording. **Change:** findings get stable IDs (`ARCH-<scope>-NNN`) with confidence + source refs; proposals/decisions/reviews cite IDs; the archaeology index maps ID → report section. **Users/value:** evidence becomes referenceable and its confidence propagates mechanically (enables IL-DQ5 thresholds). **Evidence:** decision events already use `PROP-DEC-*` ID discipline — extend the pattern to evidence. **Deps:** none. **Risks:** ID ceremony in reports — generate IDs, don't hand-author. **Validation:** showcase proposal cites ≥3 ARCH refs traceably. · core.
