# CHAOS Public-Alpha External Assessment — 2026-07-18

**Verdict: Continue with a narrower focus** — elevate the interaction runtime to the product's center, compress the methodology around it, stabilize before expanding.

Assessed commit `6421feb` (main, clean) · method: five parallel investigation streams (docs/OSS surface, runtime deep-dive, prompt-layer audit, dogfood evidence, ecosystem research) + first-hand spot verification · all 266 package tests and the example app's build+tests were executed · web research dated 2026-07-18.

> **Amendments (2026-07-18, post-review):** (1) Author clarified the full workflow **was** exercised privately — on CHAOS itself, the demo, and a real company brownfield project — with good results; artifacts were deliberately kept out of the public repo. The lifecycle gap is therefore **evidentiary, not executional**. (2) **Decision:** adopt **Option 2 — a showcase location** (recommended: orphan branch) holding one complete, real, sanitized lifecycle trail, README-linked → roadmap item **EA-V1**. Details: [01-executive-verdict.md](01-executive-verdict.md).

**Visual summary:** open [`views/dashboard.html`](views/dashboard.html) in a browser (self-contained, offline, light/dark). The markdown sections below are the source of truth; the dashboard is a generated view.

**Companion assessments (same day):** (1) the [improvement landscape & greenfield foundation](../2026-07-18-improvement-landscape/README.md) — 9-area/75-topic improvement exploration, command-portfolio review, decision/traceability/performance deep-dives, and the `chaos:init` Greenfield Foundation Discovery design; its prioritization amends this roadmap via the addendum in [14-roadmap.md](14-roadmap.md). (2) The [two-axis classification design](../2026-07-18-two-axis-classification/README.md) — the authoritative blueprint for EA-B1 (`systemRisk × executionProfile`, adaptive gates, the strict-compact flagship), decomposing it into EA-B1a–e.

## At a glance

| | |
|---|---|
| What it is | A genuinely engineered **human-decision runtime** (5 TS packages, ~13.6k LOC, 264/266 tests) + a **prompt-encoded SDLC methodology** (17 commands, ~1.2 MB × 2 adapter surfaces) over OpenSpec |
| Crown jewel | Decisions as durable, repo-local, resumable runtime state — proven in real data (11-min pause → answer → resume cycle with human rationale) |
| Biggest cost | ~196k instruction tokens + 11–14 human stops + 17–19 artifacts per standard change (measured) |
| Biggest gap | Publicly unverifiable lifecycle value (now addressed by EA-V1 showcase) + silent first-run breakage |
| Niche claim | No mainstream tool offers repo-local durable decision state for CLI coding agents (researched 2026-07-18) |
| Direction | EA-D1 × EA-D3: narrow the methodology, elevate the runtime; brownfield strict-risk work as the wedge story |
| Critical path | EA-S1→S2→S3 → **EA-V1 showcase** → EA-X1/X2/X4 experiments → EA-B1 profiles → beta / pivot gate |

Scores (1–10, unsmoothed — see [16-scorecard.md](16-scorecard.md)): implementation **8** · architecture **7** · problem relevance **8** · coherence **8** · reliability **6** · security **6** · novelty **6** · differentiation **5** · usability **4** · DX **4** · portability **4** · OSS adoption potential **4** · token efficiency **3** · onboarding **3** · beta readiness **3** · v1 readiness **2**.

## Index

| # | Section | One-liner |
|---|---|---|
| 01 | [Executive verdict](01-executive-verdict.md) | The ten questions answered; amendments; the verdict |
| 02 | [What CHAOS is & what's implemented](02-implementation-inventory.md) | Category, abstractions, conceptual model; implemented/validated/documented/aspirational classification; doc-vs-reality disagreements |
| 03 | [Value proposition](03-value-proposition.md) | Problem-by-problem analysis; positioning statements and overclaims to avoid |
| 04 | [Architecture & runtime](04-architecture-runtime.md) | Package audit, state model, concurrency, locks, capsules, MCP, runner, Decision Center, security; classification rollup |
| 05 | [Workflow & commands](05-workflow-commands.md) | Per-command disposition, ceremony accounting, mode system, hooks, triplication, parity, **risk × profile model** |
| 06 | [Token economics](06-token-economics.md) | Measured per-command token table; waste analysis; efficiency architecture with estimated savings |
| 07 | [Ecosystem comparison](07-ecosystem-comparison.md) | Spec Kit / OpenSpec-OPSX / BMAD / Kiro / Agent HQ / LangGraph Inbox / HumanLayer / ai-sdlc; feature matrix; "is it SOTA?" |
| 08 | [Novelty & differentiation](08-novelty-differentiation.md) | Commodity→novel classification; the defensible identity |
| 09 | [Developer experience](09-developer-experience.md) | First-run traps, aha/abandonment moments, Decision Center UX improvements |
| 10 | [Adoption & OSS readiness](10-adoption-oss-readiness.md) | Personas, barriers ranked, OSS gap classification, honesty of the alpha label |
| 11 | [Team & enterprise viability](11-team-enterprise-viability.md) | What's genuinely needed vs premature |
| 12 | [Risk register](12-risk-register.md) | 11 risks with probability/impact/warning signals; **kill/pivot criteria** |
| 13 | [Improvement inventory](13-improvement-inventory.md) | EA-I01…I25: must/should/explore/defer/reject with complexity & dependencies |
| 14 | [Roadmap](14-roadmap.md) | Directions EA-D1…D5; horizons EA-S/V/B/A; tracks; critical path; feature disposition |
| 15 | [Validation experiments](15-validation-experiments.md) | EA-X1…X6 with thresholds; the smallest uncertainty-reducing set |
| 16 | [Scorecard](16-scorecard.md) | 21 dimensions with justification, confidence, and "+2 requires" |

## How to extract the roadmap from these artifacts

Stable IDs are the extraction handles — every actionable item carries one:

- **EA-S1…S4 / EA-V1…V3 / EA-B1…B5 / EA-A1…A4** — roadmap items ([14-roadmap.md](14-roadmap.md)), each with priority, dependencies, complexity, and exit criteria.
- **EA-I01…I25** — improvements ([13-improvement-inventory.md](13-improvement-inventory.md)), each mapped to its roadmap item.
- **EA-R1…R11** — risks ([12-risk-register.md](12-risk-register.md)); **EA-X1…X6** — experiments ([15-validation-experiments.md](15-validation-experiments.md)); **EA-D1…D5** — direction options ([14-roadmap.md](14-roadmap.md) §14.1).

Suggested flow: run `chaos:todo --from-audit` (or `--scan`) over this folder to import EA-S/EA-V items as todo candidates with `EA-*` provenance IDs, mirroring how the 2026-07-01 OSS audit's F-* findings were imported; then reconcile `.chaos/roadmap/roadmap.md` against [14-roadmap.md](14-roadmap.md) (the EA roadmap is finer-grained and supersedes the RM-* packaging items already closed).

## Evidence labels used throughout

`Observed` (read/ran directly) · `Reported (author)` (author testimony, not independently verifiable) · `Inferred` · `Hypothesis` · `Recommendation` · `Unknown` — with `Confidence: HIGH/MEDIUM/LOW` where it matters. No adoption, performance, or satisfaction metrics exist yet anywhere; every number in these artifacts is either measured from the repo or explicitly labeled an estimate.
