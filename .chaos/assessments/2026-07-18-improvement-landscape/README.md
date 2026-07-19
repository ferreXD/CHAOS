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
    bodyHash: "sha256:06eb26672728bc2fe5614709a3582e27b8b58529dac374d26c8ae70e44285d5a"
---

# CHAOS Improvement Landscape & Greenfield Foundation — 2026-07-18

Companion to the [public-alpha external assessment](../2026-07-18-public-alpha-assessment/README.md) (same commit `6421feb`, same day, same evidence base and conventions). Two mandatory exercises: **(A)** a systematic improvement landscape across the whole product, and **(B)** the Greenfield Foundation Discovery design for `chaos:init`. Ends with an integrated prioritization and a roadmap delta that the first assessment's roadmap now references.

**Visual summary:** open [`views/dashboard.html`](views/dashboard.html) (self-contained, offline, light/dark). Markdown is the source of truth; the dashboard is a generated view.

**Companion (same day):** the [two-axis classification design](../2026-07-18-two-axis-classification/README.md) — the authoritative deep-dive for IL-WF1/EA-B1 (systemRisk × executionProfile, adaptive gates, workflow matrix); see the addendum in [11 §11.5a](11-final-prioritization.md).

## At a glance

| | |
|---|---|
| Taxonomy | **9 areas** (WF · DQ · TR · RT · PF · AG · DX · EX · PA); "team/enterprise" deliberately distributed, not an area |
| Topics | **75** (≈45 newly proposed, 19 carried over from EA-*, rest reshaped); every topic carries problem/change/complexity/impact/validation/timing/recommendation |
| Command portfolio | Target **7 minimal / 12 standard / 14–15 full** (from 17+5 today) — reached by merging and demoting, not deleting capability; **zero to one** new commands (only `chaos:run` survives the 7-question test, as *explore*) |
| Decision quality | Order of investment: fewer better-classified stops → one interruption instead of N → better-grounded decisions → outcome-tracked calibration. Guardrails: no evidence → no recommendation; abstention is a feature |
| Traceability | 8 of 14 accountability questions unanswerable today; all close with 5 mechanisms (TR1/TR2/TR4/TR6/TR9), none adding human ceremony |
| Performance | Sequencing: measure first (IL-PF10), then lazy refs + budgets, then index + deterministic validators, then single-sourcing. Target (Hypothesis): ~196k → 60–80k standard, 25–35k compact |
| Greenfield foundation | **4 areas + 1 conditional**, 19 curated options, 3 presets + regulated overlay, ≤6 stops (3 with preset), `foundation.yaml` authoritative, ≤8 derived governance files, zero new commands |
| Top immediate priorities | Showcase trail (EA-V1) · stabilization bundle (EA-S1–S4) · materiality doctrine (IL-DQ2) · token accounting in CI (IL-PF10) · report budgets (IL-PF9) |

## Index

| # | Section | One-liner |
|---|---|---|
| 01 | [Improvement taxonomy](01-improvement-taxonomy.md) | The 9 areas, why each matters, why team/enterprise was distributed |
| 02 | [Topics: WF · DQ · TR](02-topics-workflow-decisions-traceability.md) | 28 topics: workflow model, decision quality, traceability |
| 03 | [Topics: RT · PF](03-topics-runtime-performance.md) | 19 topics: runtime hardening/recovery, token/performance |
| 04 | [Topics: AG · DX · EX · PA](04-topics-guidance-dx-ecosystem-product.md) | 28 topics: architecture guidance, DX, ecosystem, productization |
| 05 | [Command portfolio review](05-command-portfolio.md) | Per-command verdicts, 7-question test, minimal/standard/full portfolios |
| 06 | [Decision-quality analysis](06-decision-quality-analysis.md) | The quality model, anti-manipulation guardrails, what never becomes a decision |
| 07 | [Traceability & accountability](07-traceability-accountability-analysis.md) | 14-question answerability matrix, tiering, noise control |
| 08 | [Performance & token analysis](08-performance-token-analysis.md) | Cost ranking, proposal economics with invalidation strategies, benchmarks |
| 09 | [Greenfield foundation design](09-greenfield-foundation-design.md) | The full IL-AG1 design: flow, detection, artifacts, revision, worked example |
| 10 | [Greenfield foundation catalog](10-greenfield-foundation-catalog.md) | 19 complete option definitions across FA-1/2/3/C/4 |
| 11 | [Final prioritization](11-final-prioritization.md) | Dedupe, top 20, top 5 × 3 horizons, not-pursued, roadmap delta |

## ID namespaces (extraction handles)

- **IL-\<area\>\<n\>** — improvement topics (e.g. `IL-DQ2`, `IL-PF10`), each with recommendation must/should/explore/defer/reject.
- **F1-A@1 … D-D@1** — foundation catalog options (area-letter@catalogVersion).
- **GF-X1…X4** — foundation validation experiments.
- **EA-B6/B7/B8, EA-A5/A6/A7** — new roadmap items minted here, extending the first assessment's EA-S/V/B/A scheme ([11 §11.5](11-final-prioritization.md)).

Suggested extraction flow: import [11 §11.3](11-final-prioritization.md) horizon lists via `chaos:todo --from-audit` with IL-*/EA-* provenance; the roadmap delta in §11.5 is the authoritative reconciliation against `.chaos/roadmap/roadmap.md` and the first assessment's [14-roadmap.md](../2026-07-18-public-alpha-assessment/14-roadmap.md) (which now carries an addendum pointing here).

## Evidence labels

Same conventions as the first assessment: `Observed` · `Reported (author)` · `Inferred` · `Hypothesis` · `Recommendation` · `Unknown`, with confidence tags where they matter. All token/ceremony numbers trace to the first assessment's measurements; savings figures are labeled Hypothesis until IL-PF10 measures them.
