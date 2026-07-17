---
title: CHAOS OSS Readiness Audit
date: 2026-07-01
author: audit (Claude Code)
scope: CHAOS tooling and workflow (.claude/, .github/, .chaos/*, openspec/ integration contract) evaluated for standalone public open-source readiness
status: advisory — audit/roadmap only, no lifecycle governance mutated, no production code touched

chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: repository
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-01T00:00:00+02:00"
  lastWrittenBy: <example-user>
  lastAuditedAt: "2026-07-01T00:00:00+02:00"
  lastAuditedBy: <example-user>
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: git
    confidence: LOW
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
---

# CHAOS OSS Readiness Audit — 2026-07-01

> Advisory document. Does not mutate governance, does not implement roadmap items, does not
> migrate artifacts, does not modify production application code. Findings use this
> workspace's own knowledge labels (`FACT`/`INFERENCE`/`ASSUMPTION`/`UNKNOWN`/`CONFLICT`) and
> confidence levels (`HIGH`/`MEDIUM`/`LOW`), per `.chaos/constitution.md` §9.

## Verdict

Internal usage readiness: **HIGH**
Public alpha readiness: **LOW**
Public v1 readiness: **LOW**

Recommended release posture: **internal alpha**

## Executive Summary

CHAOS is a mature, internally coherent human-led/agent-orchestrated SDLC workflow. Its own
internal governance audit (`chaos:status`, 2026-07-01) reports verdict `STRONG` with zero
blocking findings, a fully operational confidence/knowledge doctrine, nine lifecycle passes
exercised end-to-end, and a coherent v0 change-scoped collaboration model. On every dimension
this audit independently re-checked that touches *internal* rigor — OpenSpec integration
(hard gate + invocation proof + degraded-mode handling), change-scoped artifact layout,
artifact naming, provenance metadata, team-concurrency policy — the workspace **passes** with
`HIGH` confidence, much of it verified against real artifacts on disk, not just policy text.

However, CHAOS today exists **only as an instance embedded inside one private client
repository context**. It has never been packaged, described, or exercised as a standalone
public artifact. Every audit area concerned with "can a stranger pick this up" — public
positioning, a 5-minute overview, an install path into a blank repo, a demo/worked example,
license, contribution files, and content sanitization — is **MISSING or PARTIAL**, several as
outright blockers to any public release. The Claude-side adapter is solid; the Copilot-side
adapter is a hand-maintained digest with no automated parity check, is missing
`chaos:doctor` entirely, and carries no explicit stability label. Two confirmed content leaks
were found in the *generic* tooling layer (not the project-instance data, which is expected
to be project-specific): a hardcoded personal username in an example, and a project-specific
architecture-decision default baked into an otherwise-generic specialist contract, mirrored
identically on both the Claude and Copilot sides.

None of this is a rebuild. The scaffolding, discipline, and lifecycle depth are real and
above-average for an agent-orchestrated SDLC workflow. What's missing is entirely the
"public-facing packaging" layer — README, install guide, demo, license, sanitization,
Copilot hardening — not the underlying workflow logic.

## Evidence Reviewed

Direct reads (this session): `README.md`, `AGENTS.md`, `.chaos/README.md`, `.chaos/config.yaml`,
`.chaos/status-report.md`, `PATCH-SUMMARY.md`, `.chaos/workflow-evaluation-2026-06-29.md`,
`.claude/hooks/README.md` (lines 195-219), `.vscode/mcp.json`,
`.claude/skills/chaos-apply/reference/csharp-implementation-specialist-contract.md`,
`.github/skills/chaos-apply/reference/csharp-implementation-specialist-contract.md`, plus
targeted greps across `.claude/`, `.github/`, `.chaos/`, `docs/adr/`, `.chaos/rules/`,
`.chaos/gates/`, `.chaos/decisions/`.

Delegated research (6 parallel read-only agents, all findings cross-checked against file:line
evidence, 2 discrepancies resolved by direct re-verification — see §Findings F-07/F-18a):
positioning & onboarding; command matrix & lifecycle; Claude/Copilot adapter readiness;
OpenSpec integration & artifact policies; hooks & MCP integration; public-safety, contribution
model & license.

## Readiness Scorecard

| Area | Status | Confidence | Notes |
|---|---|---|---|
| Public README / positioning | MISSING | HIGH | No document anywhere pitches CHAOS to an external audience; `.chaos/README.md` is project-scoped, generated, derived documentation. |
| 5-minute overview | PARTIAL | HIGH | All ingredients exist but are spread across 3-4 files; no single newcomer-readable doc. |
| Install path | MISSING | HIGH | `chaos:init` bootstraps governance for an *existing* project with existing ADRs/decisions — it does not scaffold CHAOS into a blank repo. No copy/install checklist for `.claude/`/`.github/` artifacts. |
| Demo example | MISSING | HIGH | All `.chaos/changes/`, `.chaos/archaeology/`, `openspec/changes/archive/` content reflects a private-project history. `chaos:help demo` is explicitly unsupported in v0 (`.chaos/README.md:250`). |
| Claude adapter | PASS (1 leak) | HIGH | Structurally complete, OpenSpec gate + decision protocol enforced. One project-specific default leaked into a generic reference file — confirmed directly. |
| Copilot adapter | PARTIAL | MEDIUM-HIGH | Missing `chaos:doctor` entirely; no stability label; the same leaked project-specific reference (mirrored file); no automated parity check vs. Claude surface. |
| Hooks | PARTIAL | HIGH | Runtime-observability + artifact-metadata hooks are complete, optional, well-documented. Protected-file guard is spec-only (acceptable for public alpha; needed for v1). |
| MCP/repository context | PARTIAL | MEDIUM | Provider-neutral contract, resolution policy, security posture all documented; GitHub disabled/Azure DevOps enabled by default (inverted from what a public tool needs); org identifiers visible in dev config (`.vscode/mcp.json`). |
| Doctor | PASS | HIGH | Implemented, distinct from `chaos:status`, validates the right surface, read-only, modes supported. Known gap (no Claude command wrapper, no Copilot mirror) already tracked as sync debt. |
| Code review | PASS | HIGH | Correct lifecycle position, output contract, read-only-except-report, distinct from `chaos:verify`. Minor: per-mode (optional/recommended/required) posture is implicit, not explicit per command. |
| Public sanitization | PARTIAL | HIGH | 2 confirmed leaks in the generic tooling layer (username, project-specific default); org/project identifiers appropriately confined to project-instance config but would need templating if ever shipped as a starter example. |

## Findings

Severity legend: BLOCKER (blocks public alpha or v1 as noted) / HIGH / MEDIUM / LOW.
Status: MISSING / PARTIAL / STALE / CONFLICT / OK.

### F-01 — No public-facing positioning document exists
- Severity: BLOCKER (public alpha)
- Status: MISSING
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: `.chaos/README.md:52-59` frames CHAOS as a project-scoped workflow for a private repository context — generated documentation (`generatedBy: chaos:help --readme`) that explicitly defers to `.chaos/commands/index.md` etc. as source of truth. Root `README.md:50-76` ("Governance — CHAOS") only cross-references internal files. No file anywhere states what CHAOS is for an audience that has never seen the original private context, who it's for/not for, or its relationship to OpenSpec framed for newcomers.
- Recommendation: Author a standalone, humble, public README (not generated) — "experimental", "opinionated", "human-led", "brownfield-friendly", "public alpha", "not production-proven yet." Explicitly scope: brownfield migration focus, not a universal AI SDLC framework.
- Roadmap promotion: YES

### F-02 — No single 5-minute newcomer overview
- Severity: HIGH (public alpha)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: Lifecycle diagram + command map exist (`.chaos/README.md:60-92`); modes table exists (`.chaos/README.md:99-108`); artifact layout exists (`.chaos/README.md:110-133`, `.chaos/changes/README.md:39-137`); confidence model exists (`.chaos/constitution.md:61-100`). All four required ingredients are present but no single document assembles them for a first-time reader — a newcomer must cross-reference 3-4 files.
- Recommendation: Compose a single condensed overview doc combining lifecycle table, command matrix summary, mode explanation, and artifact layout in one page.
- Roadmap promotion: YES

### F-03 — No install path into a blank/new repository
- Severity: BLOCKER (public alpha)
- Status: MISSING
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: `.claude/skills/chaos-init/SKILL.md` and its `reference/interaction-model.md`/`output-contract.md` describe **discovering and ratifying existing evidence** (ADRs, decision logs) in a project that already has them — not scaffolding CHAOS tooling into a repository that has none. No document instructs "copy `.claude/`, copy `.github/`, initialize `.chaos/config.yaml`, verify setup, run first command" for a brand-new adopter repo.
- Recommendation: Author a minimal installation/onboarding guide distinct from `chaos:init`'s bootstrap-governance role — the two are different problems (installing the tool vs. bootstrapping governance content).
- Roadmap promotion: YES

### F-04 — No demo repository or worked example
- Severity: HIGH (public alpha)
- Status: MISSING
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: All content under `.chaos/changes/`, `.chaos/archaeology/`, `openspec/changes/archive/` (9 archived changes) reflects a private-project history, not teaching material. `.chaos/README.md:250` states explicitly: *"`chaos:help demo` is intentionally unsupported in v0."*
- Recommendation: Build a small, sanitized, end-to-end worked example (sample brownfield change → archaeology → propose → review → apply → verify → archive → sync) using a fictional/toy domain, not private-project data.
- Roadmap promotion: YES

### F-05 — Happy paths not explicitly tiered
- Severity: MEDIUM (public alpha)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: `.chaos/README.md:62-70` documents one golden path with `archaeology` marked optional; no document explicitly lays out the three distinct tiers (tiny: propose→apply→verify; normal: propose→review→apply→code-review→verify→archive; brownfield: full chain + sync/retro) as named, separate paths.
- Recommendation: Add an explicit three-tier table/section.
- Roadmap promotion: YES

### F-06 — Command stability matrix incomplete on 3 of 10 required dimensions
- Severity: HIGH (v1), MEDIUM (public alpha)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: `.chaos/commands/index.md` documents purpose/inputs/outputs/forbidden-writes/Claude-status for all 13 implemented commands. Mode behavior is undocumented for `chaos:init`, `chaos:status`, `chaos:archaeology`. Confidence-behavior is documented for only 2/13 (`chaos:verify`, `chaos:review`). Copilot support status exists only as one global note (`.chaos/README.md:94-97`, `.chaos/commands/index.md:37`), not per-command. Next-command recommendation lives in a separate section (`.chaos/README.md:172-184`), not attached per-command.
- Recommendation: Extend the command index with explicit per-command mode/confidence/Copilot-status/next-command rows.
- Roadmap promotion: YES

### F-07 — Project-specific default leaked into generic C# specialist contract, mirrored on both platforms
- Severity: MEDIUM (public alpha blocker for sanitization; also an adapter-genericity defect)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH (directly re-verified after one research agent flagged it and another missed it in its grep sweep)
- Evidence: `.claude/skills/chaos-apply/reference/csharp-implementation-specialist-contract.md:31` and `.github/skills/chaos-apply/reference/csharp-implementation-specialist-contract.md:31` both include a project-specific architecture-decision example in otherwise generic documentation. This file is otherwise generic CHAOS tooling (not project-instance `.chaos/` data), so a hardcoded project default here is a genericity/sanitization defect, not expected project-specific content.
- Recommendation: Replace the example with a generic phrase such as "the repository's own ADRs/architecture decisions".
- Roadmap promotion: YES (folds into F-18 sanitization item, but called out separately because it is also an adapter-quality defect)

### F-08 — Copilot adapter missing `chaos:doctor` entirely
- Severity: HIGH (v1)
- Status: MISSING
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: No `.github/prompts/chaos-doctor.prompt.md`, no corresponding `.github/agents/chaos-doctor-orchestrator.agent.md`, no `.github/instructions/chaos-doctor.instructions.md`. Already tracked internally as sync debt (`.chaos/commands/index.md`, `.chaos/status-report.md` §6 CS-HARDEN notes, §9 command matrix). Confirms `.chaos/README.md:232-233`: *"`chaos:doctor` is Claude-only for now ... tracked as sync debt, not a blocker"* (true for internal use; becomes a real parity gap for OSS positioning of Copilot as a supported surface).
- Recommendation: Add Copilot mirror or explicitly and visibly label Copilot's `chaos:doctor` support as "not yet available" in the command matrix rather than silent omission.
- Roadmap promotion: YES

### F-09 — No stability/maturity label on the Copilot adapter anywhere
- Severity: MEDIUM (v1)
- Status: MISSING
- Knowledge type: FACT
- Confidence: MEDIUM
- Evidence: `.github/copilot-instructions.md` declares mandatory CHAOS posture but does not state whether the Copilot surface is stable, beta, or experimental. Per the prior internal advisory (`.chaos/workflow-evaluation-2026-06-29.md` §3, §A.6), Copilot is a hand-maintained digest of the Claude reference library (104 KB vs. 491 KB, no `reference/` equivalent) with no automated parity check — a real fidelity gap that isn't disclosed to Copilot-path operators.
- Recommendation: Explicitly label Copilot as "experimental adapter" pending a parity mechanism, per this audit's known-target-posture guidance (do not overclaim support).
- Roadmap promotion: YES

### F-10 — No automated Claude↔Copilot parity check
- Severity: MEDIUM (v1)
- Status: MISSING
- Knowledge type: FACT (carried forward from `.chaos/workflow-evaluation-2026-06-29.md` §3, independently reconfirmed this session)
- Confidence: HIGH
- Evidence: Parity between "11+ skills ↔ orchestrators ↔ Copilot prompts" is asserted in `.chaos/commands/index.md` prose, never mechanically verified. `.github/prompts/` includes 5 `opsx-*` files with no exact Claude naming counterpart (Claude nests these under `.claude/commands/opsx/`), a minor but real naming asymmetry consistent with hand-maintained drift.
- Recommendation: Fold into the Copilot-hardening roadmap item rather than treat as separate — same root cause.
- Roadmap promotion: YES (merged into RM for Copilot adapter)

### F-11 — Protected-file guard hook is spec-only, not implemented
- Severity: LOW (acceptable for public alpha; recommended for v1)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: `.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md:20-28` describes a PreToolUse protected-file guard as vNext specification; no corresponding script exists under `.claude/hooks/scripts/`. Runtime-observability and artifact-metadata hooks are both implemented, optional, and documented (`.claude/hooks/README.md`, `PATCH-SUMMARY.md`).
- Recommendation: Per this audit's rubric, full enforcement is explicitly NOT required for public alpha. For v1, implement at minimum a report-only protected-file guard profile.
- Roadmap promotion: YES

### F-12 — MCP default provider posture is internal-tool-shaped, not public-tool-shaped
- Severity: MEDIUM (v1)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: MEDIUM
- Evidence: `.chaos/config.yaml:216` sets `github.enabled: false` while `azureDevOps.enabled: true` with project-instance values — correct and expected for *this* project's instance config, but if `.chaos/config.yaml` is ever offered as a starter template for public adopters, GitHub (the stated "public/default provider" per its own comment at line 216) should be the enabled default, not Azure DevOps with instance-specific identifiers.
- Recommendation: Ship a sanitized `config.yaml.example`/template alongside (or instead of) the real config when packaging for public use, with GitHub enabled by default and Azure DevOps shown as an opt-in with placeholder values.
- Roadmap promotion: YES (folds into sanitization + MCP roadmap items)

### F-13 — `chaos:doctor` has no Claude command wrapper and no Copilot mirror
- Severity: LOW (already tracked internally; promoting for OSS command-matrix completeness)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: `.chaos/status-report.md` §9, §11 action 5; `.chaos/commands/index.md` preamble. No `.claude/commands/chaos-doctor.md` exists (confirmed: file listing of `.claude/commands/` shows 14 files, none named `chaos-doctor.md`).
- Recommendation: Add the wrapper; this is low-effort and already scoped internally.
- Roadmap promotion: YES

### F-14 — `chaos:code-review` mode posture (optional/recommended/required) is implicit, not explicit
- Severity: LOW (polish)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: Lifecycle position, output contract, and read-only scope are all explicit (`.claude/skills/chaos-code-review/SKILL.md`, `.claude/commands/chaos-code-review.md`, `.chaos/commands/index.md:133-142`). The optional-in-light / recommended-in-standard / required-in-strict posture must be inferred from the general mode-inference logic rather than stated directly for this command.
- Recommendation: State the posture explicitly per mode in the command's own doc.
- Roadmap promotion: YES

### F-15 — Hardcoded personal username in generic hooks documentation example
- Severity: MEDIUM (public alpha blocker for sanitization)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH (directly re-verified)
- Evidence: `.claude/hooks/README.md:210,212` — example `chaosMetadata` frontmatter block used personal illustrative values inside generic hooks documentation (not project-instance data).
- Recommendation: Replace with a placeholder (e.g., `<example-user>`).
- Roadmap promotion: YES (folds into F-18 sanitization item)

### F-16 — No CONTRIBUTING.md, CODE_OF_CONDUCT.md, or issue templates
- Severity: HIGH (public alpha for a minimal CONTRIBUTING; full set for v1)
- Status: MISSING
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, or `.github/ISSUE_TEMPLATE/` anywhere in the repository (confirmed by direct directory listing and dedicated search).
- Recommendation: Add minimal CONTRIBUTING.md before any public alpha; add CODE_OF_CONDUCT.md and issue templates before v1.
- Roadmap promotion: YES

### F-17 — No LICENSE file or SPDX headers
- Severity: BLOCKER (public alpha)
- Status: MISSING
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: No `LICENSE`, `LICENSE.md`, or `COPYING` file anywhere in the repository; no SPDX headers in any `.claude/`/`.github/` tooling file.
- Recommendation: Choose and add a license before any public release. Per this audit's constraints, no license is chosen or recommended here — that is an explicit user/owner decision.
- Roadmap promotion: YES

### F-18 — Consolidated public-safety sanitization requirement
- Severity: BLOCKER (public alpha)
- Status: PARTIAL
- Knowledge type: FACT
- Confidence: HIGH
- Evidence: Confirmed leaks in the **generic tooling layer** (expected to be project-agnostic): F-07 (project-specific default in C# specialist contract, both platforms) and F-15 (hardcoded username in hooks README example). Project-instance data in `.chaos/config.yaml` and `.vscode/mcp.json` is **appropriately confined to project-instance files** — not a defect in itself, but both would need templating (see F-12) if ever shipped as a public starter example. No secrets, tokens, connection strings, or PATs were found anywhere in `.claude/`, `.github/`, `.vscode/mcp.json`, or `.chaos/config.yaml` — this is a genuine positive: the only leaks found are non-secret identity/naming leaks, not credential leaks.
- Recommendation: Fix F-07 and F-15 directly (small, mechanical edits). Decide packaging boundary: CHAOS-the-tool (`.claude/`, `.github/`) vs. this-project's-instance (`.chaos/*` data, `docs/adr/*`, `openspec/changes/archive/*`) — only the former should ever be published verbatim; the latter would need to become the F-04 demo example (sanitized/fictionalized), never the original private-project data.
- Roadmap promotion: YES

## Roadmap Promotions

| ID | Title | Target | Priority | Owner | Status | Depends on |
|---|---|---|---|---|---|---|
| RM-001 | Create canonical public README and positioning | public-alpha | BLOCKER | TBD | Proposed | |
| RM-002 | Create five-minute CHAOS overview | public-alpha | HIGH | TBD | Proposed | RM-001 |
| RM-003 | Create minimal installation and onboarding guide | public-alpha | BLOCKER | TBD | Proposed | RM-001 |
| RM-004 | Create demo repository or worked end-to-end example (sanitized, non-project-specific) | public-alpha | HIGH | TBD | Proposed | |
| RM-006 | Choose and add OSS license | public-alpha | BLOCKER | TBD | Proposed | |
| RM-007 | Add minimal OSS contribution files (CONTRIBUTING.md at minimum for public alpha; CODE_OF_CONDUCT.md + issue templates for v1) | public-alpha / v1 | HIGH | TBD | Proposed | |
| RM-008 | Document lightweight, normal, and strict CHAOS paths explicitly (3-tier happy path) | public-alpha | MEDIUM | TBD | Proposed | RM-002 |
| RM-009 | Create stable command support matrix (mode/confidence/Copilot-status/next-command per command) | v1 | HIGH | TBD | Proposed | |
| RM-010 | Validate and harden GitHub Copilot adapter (add chaos:doctor mirror, label stability, add parity check, fix F-07 mirror) | v1 | HIGH | TBD | Proposed | |
| RM-011 | Complete chaos:doctor implementation (Claude command wrapper + Copilot mirror) | v1 | MEDIUM | TBD | Proposed | RM-010 |
| RM-012 | Stabilize hooks installation and profiles (implement report-only protected-file guard profile) | v1 | MEDIUM | TBD | Proposed | |
| RM-013 | Complete repository-context and MCP integration docs (public-default posture, templated example config) | v1 | MEDIUM | TBD | Proposed | |
| RM-014 | Finalize chaos:code-review lifecycle integration (explicit per-mode posture) | vNext | LOW | TBD | Proposed | |
| RM-015 | Schedule legacy scattered-folder retirement (`.chaos/reviews/`, `.chaos/apply-reports/`, `.chaos/retros/` read-compat folders) | vNext | LOW | TBD | Proposed | |
| RM-016 | Decide fate of `chaos:gate` (implement or fold into verify/archive and downgrade G-0x language) | vNext | LOW | TBD | Proposed | |

## Recommended Release Plan

- **Current:** internal alpha (matches this repo's own `chaos:status` verdict of `STRONG` for *internal* use — that verdict is not in question here; this audit is scoped to public-readiness only).
- **Next — public alpha:** after RM-001 (README), RM-003 (install guide), RM-004 (demo), and RM-006 (license) land. RM-002, RM-007 (minimal), RM-008 are strongly recommended alongside.
- **v1:** after RM-009 (command matrix), RM-010 (Copilot hardening), RM-011 (doctor wrapper), RM-012 (hooks protected-file profile), RM-013 (MCP public-default posture), and the remainder of RM-007 (full contribution set) land.
- **vNext:** RM-014, RM-015, RM-016 — quality/consistency polish, not gating.

## Explicit Non-Goals

Not required for public alpha:

- Full hook enforcement (protected-file blocking, command-boundary enforcement, sync-authority blocking) — observability + metadata hooks are sufficient.
- A custom CHAOS MCP server — the provider-neutral contract with CLI/git fallback is sufficient.
- Perfect native decision UI.
- Full Copilot parity — an explicitly labeled "experimental adapter" is acceptable.
- Remote writes to GitHub/Azure DevOps — read-only default posture is correct and should remain the default indefinitely, not just through v1.
- Automated Claude↔Copilot parity CI (nice for v1, not a public-alpha gate).

## Final Recommendation

CHAOS is internally strong and not close to public-alpha or v1 packaging today, but the gap is
almost entirely presentational/packaging work (README, install guide, demo, license,
contribution files, two small sanitization fixes, Copilot hardening) rather than a workflow or
governance redesign. Recommend: (1) do not represent CHAOS as public alpha until RM-001,
RM-003, RM-004, RM-006 land; (2) keep humble framing ("experimental",
"human-led", "brownfield-friendly") throughout — this audit did not find evidence that would
support stronger claims; (3) treat the Copilot adapter as explicitly experimental until RM-010
lands, since it is currently an undisclosed digest of the Claude reference library with a
missing command and an unverified parity guarantee.

## Self-Audit

**Files inspected (direct reads by the lead audit, not counting the 6 delegated research
agents' own reads):** `README.md`, `AGENTS.md`, `.chaos/README.md`, `.chaos/config.yaml`,
`.chaos/status-report.md`, `PATCH-SUMMARY.md`, `.chaos/workflow-evaluation-2026-06-29.md`,
`.claude/hooks/README.md` (partial), `.vscode/mcp.json`, both copies of
`csharp-implementation-specialist-contract.md`, plus directory listings and greps across
`.claude/`, `.github/`, `.chaos/rules/`, `.chaos/gates/`, `.chaos/decisions/`, `docs/adr/`,
repo root. The 6 delegated agents additionally inspected (per their reports): the full
`.chaos/commands/index.md`; `.claude/skills/chaos-doctor/`, `.claude/skills/chaos-code-review/`,
`.claude/skills/chaos-propose/` and their `reference/` files; `.claude/skills/chaos-init/`;
`.chaos/changes/README.md` and 3 real change folders (`bootstrap-backend-architecture`,
`tighten-r005-dapper-reference-guard`, `automate-outbox-enqueue-via-pipeline-behavior`);
`.claude/hooks/` (full) and `.claude/skills/chaos-shared/reference/` (repository-context,
MCP security/tool-profile, hooks-policy files); `.github/prompts/`, `.github/agents/`,
`.github/instructions/`, `.github/copilot-instructions.md`, `.github/skills/`; root and
`.github/` searches for LICENSE/CONTRIBUTING/CODE_OF_CONDUCT/issue templates; targeted greps
for the private-project context and associated internal identifiers across the tooling layer.

**Files created:** `.chaos/roadmap/oss-readiness-audit-2026-07-01.md` (this file),
`.chaos/roadmap/roadmap.md`.

**Files modified:** none.

**Areas not inspected, and why:** The 125+ individual `reference/` files under `.claude/skills/`
were sampled, not exhaustively read line-by-line (time-boxed; the prior internal advisory
`.chaos/workflow-evaluation-2026-06-29.md` already inventories them quantitatively and no
research agent found reason to doubt that inventory). `dotnet build`/`dotnet test`/
`openspec validate` were not re-executed (out of scope for a documentation/positioning audit;
`.chaos/status-report.md` already confirms toolchain readiness). Full byte-for-byte diff between
every Claude skill and its Copilot mirror was not performed — spot-checks (chaos-propose,
chaos-doctor, csharp-specialist-contract) were used as representative samples, consistent with
the existing internal advisory's own sampling approach.

**Assumptions made:** That "the CHAOS repository" referred to in the task means the CHAOS
tooling (`.claude/`, `.github/`, plus the *generic* portions of `.chaos/`) considered as a
future standalone public artifact — not the original private project's own real governance data
(ADRs, decisions, real change folders), which is correctly project-specific and was treated as
out-of-scope content, not a defect, except where it leaked into the generic tooling layer.

**Public-safety concerns detected:** Yes — two, both LOW-severity/non-secret (F-07: a
project-specific default value in generic tooling, mirrored on both platforms; F-15: a
hardcoded personal username in a documentation example). No secrets, tokens, credentials, or
connection strings were found anywhere in the tooling or config layers inspected. Both findings
are cheap, mechanical fixes and are promoted into the sanitization workstream.
