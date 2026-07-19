---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:02:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:02:00+02:00"
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
    bodyHash: "sha256:12845f9322b6d3f12d78f05bb67456b9898a71be746497052d4fee2c31a2a7f7"
---

# 11 — Final prioritization and roadmap integration

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Inputs: 75 IL topics ([02](02-topics-workflow-decisions-traceability.md)/[03](03-topics-runtime-performance.md)/[04](04-topics-guidance-dx-ecosystem-product.md)), portfolio review ([05](05-command-portfolio.md)), greenfield design ([09](09-greenfield-foundation-design.md)), and the first assessment's EA-* roadmap. Ranking method: impact × confidence-in-impact ÷ cost, qualitative, with sequencing constraints (stabilize → prove → compress → extend) breaking ties.

## 11.1 Deduplication

19 IL topics carry over EA items unchanged (marked `= EA-*` in the inventories); they are ranked once, under the EA ID where already scheduled. Cross-area merges within this exercise: IL-DQ6 ≡ IL-TR5 (one investment: outcome records + calibration); IL-PF1 ≡ IL-EX1's precondition (single-sourcing enables generation); IL-DQ3 ⊂ IL-DX4 (batch queue ships inside DC v2); IL-WF9 ⊂ IL-AG4 (gate retirement is the data-model's corollary); IL-RT7 ≡ EA-I03+EA-I10 combined; IL-DX2 ≡ EA-S2; IL-DX5 ≡ EA-V1; IL-PA1 ≡ EA-S1+S4; IL-PA2 ≡ EA-S3 (+ adds IL-PF10/IL-RT9 to CI).

## 11.2 Top 20 opportunities overall (deduplicated, ranked)

| # | ID(s) | Opportunity | Why this rank |
|---|---|---|---|
| 1 | EA-V1 (IL-DX5) | Showcase trail (decided) | Unblocks credibility for everything; cheap; capture-not-create |
| 2 | IL-DQ2 | Materiality doctrine + stop budgets | Transformative fatigue fix; prompt-text only; immediate |
| 3 | IL-WF1 (EA-B1) | risk × execution-profile model | Removes the #1 abandonment driver |
| 4 | EA-S1–S4 (IL-PA1/2, IL-RT7, IL-DX2) | Stabilization bundle: sanitize, first-run, CI, security policy, hook hardening | Table stakes; days of work; silent-failure class removed |
| 5 | IL-PF10 | Token accounting in CI + budgets | Cheap; makes every efficiency claim measurable; regression-proof |
| 6 | IL-TR1 | Decision→files→tests provenance chain | Turns the trail queryable; capture is deterministic; compliance story |
| 7 | IL-RT1+RT2 (EA-I08) | Lockfile + MCP boundary hardening | Beta-grade robustness; closes both audited race/security gaps |
| 8 | IL-PF2+PF9 | Lazy references + report budgets | 30–60%/run for low effort; readability doubles as savings |
| 9 | IL-PF3+PF4 | Evidence index + deterministic validators | Kills 3× re-reads; mechanically trustworthy checks (anti EA-R8) |
| 10 | IL-DX4 (EA-B5, incl. IL-DQ3/DQ1-view/IL-RT4 actions) | Decision Center v2 | The product's face: history, batch queue, wait-state, janitor |
| 11 | IL-AG1 (EA-B6) | Greenfield Foundation Discovery MVP | The greenfield story becomes real; agents get boundaries |
| 12 | IL-DQ1+DQ10 (needs IL-RT5) | Decision schema v2 + expiry policy | Reversibility/urgency/evidence classes unlock triage and policy |
| 13 | IL-RT3 (EA-I09) | Capsule integrity + quality gate | Trustworthy resumes; anti EA-R9 |
| 14 | IL-DX1 (EA-B4) | One-command plugin install | Time-to-first-value ≤15 min; adoption gate |
| 15 | IL-PF1→IL-EX1 (EA-B3) | Contract single-sourcing → generated adapters | Halves instruction mass; ends twin-tree drift; portability made real |
| 16 | IL-AG4 (+IL-WF9) | Rules/gates as structured data | Governance becomes listable, citable, partially machine-checkable |
| 17 | IL-WF5 | Governed break-glass path | Keeps the trail alive exactly when users would bypass it |
| 18 | IL-DQ6/IL-TR5 | Decision outcome tracking + calibration | The self-improving differentiator no competitor has |
| 19 | IL-EX2 (EA-A1) + IL-EX6 | Standalone runtime extraction + published ledger format | The absorption hedge; the format moat |
| 20 | IL-AG5 (EA-A5) | Brownfield observed-posture mirror | Unique brownfield differentiator; completes the posture story |

## 11.3 Top 5 by horizon

**Immediate public-alpha priorities:** 1) EA-V1 showcase trail · 2) EA-S1–S4 stabilization bundle (incl. IL-RT7 hooks) · 3) IL-DQ2 materiality doctrine · 4) IL-PF10 token accounting in CI · 5) IL-PF9 report budgets/summary-first (paired with IL-PA7 positioning refresh).

**Beta-level investments:** 1) IL-WF1 profiles + IL-WF3 merges (+ IL-WF5 break-glass) · 2) IL-PF2/PF3/PF4 token program · 3) IL-RT1/RT2/RT3/RT5 runtime hardening + migration framework (with IL-RT9 abuse suite in CI) · 4) IL-DX4 Decision Center v2 + IL-DX1 plugin install · 5) IL-AG1/AG2 foundation MVP + foundation-aware commands.

**Longer-term differentiators:** 1) IL-DQ6/TR5 outcome-tracked, calibration-aware decisions · 2) IL-EX2+EX6 standalone decision runtime + "CHAOS ledger format v1" as an open standard · 3) IL-AG5 observed-posture brownfield mirror · 4) IL-TR1-complete provenance ("reconstruct everything from disk" as a checked guarantee, §[07 §7.4](07-traceability-accountability-analysis.md)) · 5) IL-AG1-full foundation system (catalog v2, conformance checks, revision analytics).

## 11.4 Explicitly not pursued

New provider adapters before generation exists (IL-EX8-class) · `chaos:gate` and any new lifecycle command except the `chaos:run` prototype · `chaos:foundation` as a command · spec-engine plugin interface now (IL-EX4 deferred) · project-local skill extensions now (IL-EX7 deferred) · role-aware approval/escalation, shared DC, telemetry, enterprise attestation now ([06 §6.4](06-decision-quality-analysis.md), [07 §7.2](07-traceability-accountability-analysis.md)) · architecture-opinion marketplace / >3 presets / technology-specific templates ([09 anti-goals](09-greenfield-foundation-design.md)) · IL-RT6 write-ahead journal until IL-RT9 shows real incidence · any absolute token-savings claims before IL-PF10 measures.

## 11.5 Roadmap integration (delta to the first assessment's [14-roadmap.md](../2026-07-18-public-alpha-assessment/14-roadmap.md))

**Added to Horizon 0–1 (alpha):** IL-DQ2 (materiality, prompt-only) · IL-PF10 (token CI) · IL-PF9 (report budgets) · IL-WF9 (retire gate concept) · IL-RT9 seeded (abuse suite skeleton in CI).
**Added to Horizon 2 (beta foundation):** **EA-B6** Greenfield Foundation MVP (IL-AG1; deps IL-DQ8, IL-RT5) · **EA-B7** Decision schema v2 + dependent decisions + expiry (IL-DQ1/DQ8/DQ10; dep IL-RT5) · **EA-B8** Provenance chain + waiver lifecycle (IL-TR1/TR4/TR2) · IL-WF5 break-glass folded into EA-B1 · IL-RT5/RT8 folded into EA-V3-successor hardening.
**Added to Horizon 3 (beta adoption):** **EA-A6** Rules/gates as data (IL-AG4) · **EA-A7** Ledger format v1 publication (IL-EX6, pairs EA-A1) · IL-PA5/PA6 community items.
**Horizon 4 / research additions:** IL-DQ6/TR5 calibration · IL-AG5 observed posture · IL-EX4/EX7 extension surfaces · IL-RT6 · IL-WF2 `chaos:run` prototype gates on EA-B1.
**Unchanged:** critical path (EA-S→EA-V1→experiments→EA-B1→beta/pivot gate) and the kill/pivot criteria — no IL item precedes the showcase trail or the experiments.

## 11.5a Addendum (2026-07-18, same day): two-axis classification design

The third companion assessment, [two-axis classification](../2026-07-18-two-axis-classification/README.md), is now the **authoritative design for IL-WF1/EA-B1**. Effects on this prioritization: EA-B1 decomposes into **EA-B1a–e** (contract+rule table+signals · templates+overlays · 27-gate catalog · reclassification protocol · DC classification card — see its [09 §9.4](../2026-07-18-two-axis-classification/09-recommendation-and-roadmap.md)); **IL-WF4** (blast-radius estimator) is subsumed into EA-B1a as the deterministic signal scan; **IL-AG4**'s gate half is absorbed by EA-B1c (the rules half remains EA-A6); IL-WF5 (break-glass) binds to the `urgency` modifier; IL-DQ1's reversibility class binds to the `reversibility` modifier. Rankings unchanged — #3 (risk × profile) simply gained its blueprint.

## 11.6 The shape of the product this selects

Applying the brief's closing filter — useful, understandable, efficient, safe, credible, distinctive, enjoyable, habit-forming, bounded, loved by its creator first: the ranked set deliberately front-loads *subtraction and proof* (stabilize, show, measure, de-ceremonialize) before *addition* (foundation, calibration, extraction), and every addition either strengthens the decision loop (DQ/TR), hardens the engine (RT), cheapens the loop (PF), or extends the loop's reach (AG/EX) — nothing on the list builds a second product. The portfolio target remains **12 standard commands** ([05 §5.3](05-command-portfolio.md)); the concept count goes down even as capability goes up. That is the test future proposals should meet.
