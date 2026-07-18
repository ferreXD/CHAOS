# 04 — Improvement topics: Architecture guidance (AG) · DX (DX) · Ecosystem (EX) · Productization (PA)

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Format per topic: category · complexity · impact · **recommendation** · timing. `(= EA-…)` = carried over.

## AG — Architecture guidance & governance artifacts

### IL-AG1 · Greenfield Foundation Discovery
new capability (chaos:init evolution) · **H** · **transformative** · **should do** · design now, MVP at beta
- **Problem:** in a blank repo, agents lack boundaries and silently default to model-preferred architecture; init asks unstructured questions or none. **Change:** the full design in [09](09-greenfield-foundation-design.md)/[10](10-greenfield-foundation-catalog.md): detection → curated foundation areas (4 + 1 conditional) → dependency-aware Decision Center session → authoritative `foundation.yaml` + derived ADR/rules → all commands consume it. **Users/value:** greenfield teams get explicit posture; agents get executable constraints; CHAOS's greenfield story stops being aspirational. **Evidence:** README claims greenfield support; nothing implements posture creation (Observed). **Deps:** IL-DQ8 (dependent decisions), IL-RT5 (schema), stabilization first. **Risks:** catalog sprawl, wizard fatigue — hard caps designed in. **Validation:** GF-X1..X4 ([09 §18](09-greenfield-foundation-design.md)). **Ceremony:** ↑ once at init, ↓ afterwards (fewer per-change architecture debates) · core-for-greenfield.

### IL-AG2 · Foundation-aware lifecycle commands
command enhancement · **M** · high · **should do** · beta (with IL-AG1 MVP)
- **Problem:** a foundation nobody reads is documentation. **Change:** propose/review templates cite applicable foundation constraints; apply treats them as scope boundaries; a proposal violating a constraint triggers a *foundation-conflict decision* (proceed-with-ADR-override | revise-proposal | revise-foundation); doctor/status verify foundation presence/freshness. **Users/value:** posture with teeth. **Deps:** IL-AG1. **Risks:** false-positive conflicts — constraints must be few and checkable. **Validation:** GF-X2 conformance experiment. · core-for-greenfield.

### IL-AG3 · ADR lifecycle & candidate tracking
governance · **M** · medium · **should do** · beta
- **Problem:** sync emits ADR candidates into a void — no status, no aging, no link to what supersedes what. **Change:** ADR frontmatter (`status: proposed|accepted|superseded-by`, `derivedFrom: DEC-…|foundation`), a generated ADR index, doctor flags stale candidates (>30d unratified); retro proposes supersessions. **Users/value:** the promoted trail stays coherent. **Evidence:** `docs/adr/` is a declared path with no lifecycle semantics (Observed). **Deps:** none. **Risks:** frontmatter bikeshedding — adopt MADR-compatible minimal fields. **Validation:** doctor catches a seeded orphan candidate. · core.

### IL-AG4 · Rules and gates as structured data
governance/architecture · **M** · high · **should do** · beta
- **Problem:** rules/gates exist as prose paths (`.chaos/rules`, `.chaos/gates`) consumed only by model reading; nothing is enforceable or even reliably discoverable. **Change:** `rules.yaml` entries `{id, statement, scope, severity, check: textual|deterministic(ref), derivedFrom}`; review/verify iterate the applicable set explicitly; deterministic checks run via diagnostics (IL-PF4); gates become named requirement bundles referenced by risk level — *data, not a command* (IL-WF9). **Users/value:** governance that can be listed, cited by ID, and partially machine-checked. **Deps:** IL-PF4. **Risks:** over-formalization — textual checks remain first-class. **Validation:** review report cites rule IDs; a deterministic rule fires in CI. · core.

### IL-AG5 · Brownfield observed-posture mirror
new capability · **M-H** · high · **explore** · beta→v1
- **Problem:** brownfield repos have an implicit architecture nobody wrote down; agents can't respect what isn't stated, and foundation (IL-AG1) only covers greenfield. **Change:** archaeology gains a mode that emits `observed-posture.md` — the *de facto* selections in the same vocabulary as the foundation catalog (topology, structure, data, communication) with confidence per area and divergence notes ("stated hexagonal, observed transaction scripts"); user ratifies/edits it into a foundation via the same decision flow. **Users/value:** the brownfield wedge gets the same guardrails as greenfield; uniquely differentiating (no researched tool does confidence-rated posture reconstruction). **Deps:** IL-AG1 catalog vocabulary, IL-TR9. **Risks:** wrong inference codified — ratification is mandatory, confidence displayed. **Validation:** run on 2 real brownfield repos; owner agreement rate. · optional→core.

### IL-AG6 · AGENTS.md generated from governance
architecture · **L-M** · medium · **should do** · beta
- **Problem:** AGENTS.md/constitution restate posture by hand; drift is inevitable (protected-file policy already special-cases them). **Change:** the agent-facing constraint block in AGENTS.md becomes a generated section (from foundation + active rules) between markers, refreshed by sync; hand-written context remains outside markers. **Users/value:** one source of truth for agent constraints. **Deps:** IL-AG1/AG4. **Risks:** marker corruption — patch-preview policy already exists. **Validation:** sync round-trip idempotent. · core.

## DX — Developer experience & onboarding

### IL-DX1 · One-command install (Claude Code plugin) `(= EA-B4)` — packaging · **M** · high · **must do** · beta. Manual clone+builds+VSIX → plugin bundling commands/skills/agents/hooks/MCP. **Validation:** EA-X1 ≤15 min. · core.
### IL-DX2 · First-run integrity `(= EA-S2)` — must do · alpha. openspec-init path, fixture, loud MCP-dist failure, interpreter discovery. Already on the critical path; listed for completeness.
### IL-DX3 · Doctor-guided onboarding
UX · **M** · high · **should do** · beta
- **Problem:** setup failures are diagnosed but the fix journey is manual doc-reading. **Change:** `chaos:doctor --fix` becomes the guided path: detect → explain → offer safe fixes (build MCP, init openspec workspace, wire hooks) each confirm-gated; "doctor green" is the definition of onboarded. **Users/value:** the first 30 minutes stop being archaeology. **Deps:** IL-DX2. **Risks:** fixer mutating beyond intent — same consent discipline as today. **Validation:** EA-X1 completion without human help. · core.

### IL-DX4 · Decision Center v2 `(= EA-B5/EA-I11/EA-I12)` — UX · **M** · high · **should do** · beta. History tab, batch queue (IL-DQ3), markdown+file-link rendering, one-click resume, wait-state countdown, stale badges + janitor actions (IL-RT4), hook-health indicator (IL-RT7). · core.
### IL-DX5 · Showcase-led onboarding `(= EA-V1)` — must do · alpha (decided). "Read a real trail" as the first user experience; README deep-link. · core.
### IL-DX6 · Deterministic next-step hinting
UX · **L** · medium · **should do** · beta
- **Problem:** "what now?" is answered by a 15k-token `chaos:help` run or doc reading. **Change:** lifecycle.md + runtime state already encode position; a deterministic resolver (diagnostics) computes "next: chaos:verify (change X awaits verification)" surfaced in status-bar/doctor/command completion footers; help stays for narrative. **Value:** orientation without token spend. **Deps:** IL-PF4. **Validation:** hint correctness across the showcase lifecycle. **Token:** ↓ (replaces help invocations).

### IL-DX7 · Progress visibility for long commands
UX · **M** · low-medium · **explore** · beta-v1
- **Problem:** multi-minute commands are silent; users can't distinguish work from a hang (the Stop-hook wait makes this worse). **Change:** commands emit phase markers to `.chaos/runtime/active-command` (hook infra exists); status bar/DC render "apply: task 3/7". **Deps:** IL-RT7. **Risks:** prompt overhead per phase — one line each. **Validation:** perceived-responsiveness rating in EA-X1.

### IL-DX8 · Stable error codes
documentation/UX · **L-M** · medium · **explore** · beta
- **Problem:** failures surface as prose; not searchable, not linkable. **Change:** typed runtime errors + doctor findings get stable codes (`CHAOS-E042`) with a docs page per code; hooks/MCP errors included. **Value:** self-service debugging; issue-report quality. **Deps:** none. **Validation:** top-10 failure modes all coded.

## EX — Extensibility, portability & ecosystem

### IL-EX1 · Adapter generation from canonical source `(= EA-B3 part)` — architecture · **H** · high · **should do** · v1 design, beta groundwork. Kills the twin-tree liability; Copilot (and any future) surface becomes a build artifact. Deps: IL-PF1. · core.
### IL-EX2 · Standalone decision-runtime extraction `(= EA-A1/EA-D3)` — architecture · **M-H** · **transformative** · **explore→core** (hedge) · beta
- Package runtime+MCP+DC+capsule/ledger contracts as a framework-agnostic product usable without the CHAOS methodology (works beside Spec Kit/BMAD/plain Claude Code). The pivot target if EA-X2 value evidence is weak, and the absorption-race hedge (EA-R6). **Validation:** one non-CHAOS repo uses it for approvals within a month of release.

### IL-EX3 · OpenSpec seam + version pinning `(= EA-A3/EA-I24)` — integration · **S-M** · high · **should do** · beta. Doctor-declared supported range; adapter module isolating CLI/tree layout; vendored opsx pinned. Anti EA-R5. · core.
### IL-EX4 · Spec-engine plugin interface
integration · **H** · medium · **defer** · v1+
- Generalize IL-EX3's seam into a documented interface (OPSX artifact model, potentially Spec Kit as an engine). **Why defer:** one engine deeply > two shallowly; revisit when a second engine has real demand. **Risks if early:** abstraction tax on the core path.

### IL-EX5 · CLI-first adapter doctrine
architecture/documentation · **L** · medium · **should do** · beta
- **Problem:** portability is framed as "mirror the prompt tree", the most expensive possible framing. **Change:** document and commit to the real contract: *any agent that can run a CLI can participate* — the runtime CLI (already the Copilot write path) is the canonical adapter surface; MCP is an optimization; prompt surfaces are generated skins (IL-EX1). **Value:** portability story becomes credible without N hand-built adapters. **Deps:** none (doctrine), IL-EX1 (realization). **Validation:** a scripted non-Claude agent completes a decision round-trip via CLI only. · core doctrine.

### IL-EX6 · Published ledger & capsule format contract
architecture · **M** · high · **should do** · beta
- **Problem:** the defensible moat is the *format*, but schemas live as internal JSON files with no versioned public contract. **Change:** publish `decision-record`, `decision-event`, `capsule`, `outcome` (IL-TR5), `waiver` (IL-TR4) schemas as a versioned spec ("CHAOS ledger format v1") with conformance fixtures; third-party tools can read/write it. **Value:** owning the standard survives platform absorption of the UX. **Deps:** IL-RT5 (migrations legitimize versioning). **Risks:** premature freezing — mark v1 provisional until beta exit. **Validation:** parity-check-style conformance runner passes on real state. · core.

### IL-EX7 · Project-local skill extension points
architecture · **M** · low-medium · **defer** · v1
- Project-owned override files (extra question-bank entries, report sections, rule packs) without forking skills. Real need, wrong time: extension surface before contract single-sourcing would double the drift problem. Revisit after IL-PF1.

## PA — Productization, adoption & OSS maturity

### IL-PA1 · Sanitize + security policy `(= EA-S1/EA-S4)` — must do · alpha (critical path; already scheduled).
### IL-PA2 · Real CI `(= EA-S3)` — must do · alpha. Tests+typecheck (5 pkgs) + dotnet + parity + token accounting (IL-PF10) + nightly abuse suite (IL-RT9).
### IL-PA3 · Release engineering `(= EA-I19)` — packaging · **M** · medium · **should do** · v1. Workspaces + `file:` deps + built artifacts + tags + CHANGELOG + publishable packages. Blocks marketplace/plugin distribution beyond source installs.
### IL-PA4 · Reference-user program `(= EA-A4)` — adoption · **M** · high · **should do** · beta. 3 unaffiliated repos with committed trails; doubles as EA-R7 mitigation (recruit co-maintainers from them).
### IL-PA5 · Publish experiment & benchmark results
documentation/adoption · **L** · medium · **should do** · beta
- **Problem:** claims without published evidence read as marketing; CHAOS's differentiator is epistemic honesty. **Change:** EA-X/GF-X results (including failures) committed under `docs/evidence/` with method + raw numbers; README cites them. **Value:** credibility no competitor bothers to earn. **Deps:** EA-V2. **Validation:** first external issue citing the evidence pages.

### IL-PA6 · Contribution surface
documentation · **L** · medium · **should do** · beta
- Good-first-issues generated from the todo backlog (provenance IDs already exist), PR template with ledger checklist, CODEOWNERS, issue-chooser config. **Value:** converts curiosity into contributors (EA-R7). **Validation:** first external PR merged.

### IL-PA7 · Positioning refresh
documentation · **L** · medium · **should do** · alpha-beta
- README leads with the showcase trail and the one-sentence identity ("the governance layer OpenSpec doesn't have — decisions as durable runtime state"), explicitly names anti-personas, publishes the token-cost table (IL-PF10) with the roadmap to shrink it. Honesty as positioning. **Deps:** EA-V1. **Validation:** message-market check in EA-X1 exit interviews.
