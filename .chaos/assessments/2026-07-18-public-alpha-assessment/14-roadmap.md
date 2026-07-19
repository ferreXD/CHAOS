---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:02:01+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:02:01+02:00"
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
    bodyHash: "sha256:8f1581af0ec024b30a925400a24a6417689a62a3c8d6a34b3c6928e4b674d6fe"
---

# 14 — Product direction and roadmap

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown
Improvement details for each EA-I reference: [13-improvement-inventory.md](13-improvement-inventory.md). Experiments: [15-validation-experiments.md](15-validation-experiments.md).

## 14.1 Direction options considered

| ID | Direction | Target user | Differentiator | Verdict |
|---|---|---|---|---|
| EA-D1 | **Lightweight governed AI coding workflow** — compress to the spine (propose→apply→verify + decisions + resume), risk × profile, everything else optional | solo seniors/leads on Claude Code | only *light* workflow with a real decision ledger | **Primary (with D3)** |
| EA-D2 | Full AI-SDLC governance platform — identity, attestation, dashboards, multi-provider | regulated enterprises | compliance depth | **Do not pursue yet** — scope kills a single-maintainer project |
| EA-D3 | **Human-decision interaction runtime as the product** — extract runtime+MCP+panel+capsules as framework-agnostic infrastructure; own the git-native ledger/capsule **formats** | every coding-agent user & framework author | only repo-local decision ledger + resume in the ecosystem; HumanLayer's pivot and Agent Inbox prove demand | **Primary (with D1)**; also the pivot target per kill criteria |
| EA-D4 | Brownfield modernization specialist — archaeology + strict lifecycle + client-billable trails | consultancies/migration programs | confidence-rated archaeology feeding gates — uncontested | **Secondary** — the wedge narrative and demo theme, not the whole identity |
| EA-D5 | Provider-neutral orchestration framework — chase Copilot/Codex/Cursor parity | — | none (hand-mirroring is a liability) | **Do not pursue** — generation belongs to v1 engineering, not identity |

**Recommended direction: EA-D1 × EA-D3 — "narrow the methodology, elevate the runtime,"** with EA-D4 as the flagship story. (Recommendation, Confidence: HIGH on direction, MEDIUM on D3's absorption window.)

## 14.2 Product roadmap by horizon

Fields: problem · user outcome · why now · priority · deps · complexity · validation · exit criteria · type.

### Horizon 0 — Immediate public-alpha stabilization (~1–2 focused weeks) — all *core*

| ID | Title | Problem → Outcome | Why now | Pri | Deps | Cx | Validation / Exit |
|---|---|---|---|---|---|---|---|
| **EA-S1** | Sanitize for real | Private-client residue contradicts "completed" claim → clean public surface | Live reputational risk | P0 | — | S | grep clean for client terms; `settings.local.json` untracked; config self-description true |
| **EA-S2** | First-run integrity | Silent breakage (openspec init, fixture, MCP dist, `py -3`, PATCH-SUMMARY) → fresh clone works | Every evaluator hits it | P0 | — | S | fresh clone → doctor green → 266/266 tests pass |
| **EA-S3** | Real CI | Tests exist, CI runs none → red CI on any broken package | Contributor trust; drift guard | P0 | EA-S2 | S | CI runs tests+typecheck (5 pkgs) + `dotnet test` + parity |
| **EA-S4** | SECURITY.md + demo reframing | No disclosure path; "runnable" overclaim → honest surface | Cheap credibility | P0 | — | S | policy published; demo labeled illustrative pending EA-V1 |

### Horizon 1 — Public-alpha validation (~1 month) — *core*

| ID | Title | Problem → Outcome | Why now | Pri | Deps | Cx | Validation / Exit |
|---|---|---|---|---|---|---|---|
| **EA-V1** | **Showcase trail** *(decided 2026-07-18: Option 2)* | Validation exists privately (Reported) but is unverifiable → one real strict-mode change on task-tracker through the full lifecycle; complete sanitized artifact set published in a showcase location (recommended: orphan branch `showcase/…`; README deep-link + docs excerpt page) | The framework's own standard is "reconstruct from disk alone"; this is the critical-path artifact | P0 | EA-S2 | M | a stranger reads the full trail without installing anything; README links it; no retouched artifacts |
| **EA-V2** | Run experiments EA-X1/X2/X4 | Value/usability/trust claims are untested externally → published, honest results | Gate for beta investment | P0 | EA-V1 | M | thresholds in [15](15-validation-experiments.md); results committed to the repo |
| **EA-V3** | Runtime hardening pass | Races, read-path IDs, open answer bridge, null capsule hash → beta-grade robustness | Cheap while the code is fresh | P1 | — | M | concurrent-writer test suite green; EA-I08/09/10 closed |

### Horizon 2 — Beta foundation (~1 quarter) — *core*

| ID | Title | Problem → Outcome | Pri | Deps | Cx | Validation / Exit |
|---|---|---|---|---|---|---|
| **EA-B1** | risk × execution-profile model (+ command merges EA-I25) | Assurance/ceremony coupling → `strict-compact` etc.; consolidated single report; batched decisions surfaced | P0 | EA-V2 evidence | M-L | compact strict change ≤2 sessions, ≤4 stops, ≤35k instruction tokens (measured, EA-X3) |
| **EA-B2** | Token program (lazy refs, evidence index, deterministic validators) | 196k/lifecycle → ≤80k standard | P1 | EA-B1 | M | measured per-command table published; standard lifecycle ≤80k |
| **EA-B3** | Contract single-sourcing + generated Copilot surface + content-aware parity | 6 reworded copies/command; undetectable semantic drift → one canonical source | P1 | EA-B1 stable | L | an edit propagates from one file; parity checks content |
| **EA-B4** | Claude Code plugin packaging | Manual builds → one-command install | P1 | EA-S2 | M | EA-X1 time-to-first-value ≤15 min |
| **EA-B5** | Decision Center v2 (history, batch queue, rendering, one-click resume, wait-state) | Panel lacks the product's own memory → the ledger's face | P2 | — | M | EA-X5 stop-materiality ≥70%; history tab used in showcase video |

### Horizon 3 — Beta adoption — *core/optional*

| ID | Title | Type | Notes |
|---|---|---|---|
| **EA-A1** | Standalone runtime extraction spike + ledger/capsule format spec | explore → core if EA-V2 weak or absorption tripwire fires | direction EA-D3; the hedge |
| **EA-A2** | PR ledger rendering (`decision-events.md` → PR body) | optional, S | first team-facing feature; high demo value |
| **EA-A3** | OpenSpec compatibility pinning + spec-engine seam | core, S-M | anti EA-R5 |
| **EA-A4** | Three external reference users/repos with committed trails | adoption | success: 3 unaffiliated repos; feeds EA-R7 mitigation |

### Horizon 4 — v1 productization (deferred until beta evidence)

Versioned schemas + migrations · package formalization (EA-I19: workspaces, `file:` deps, published builds) · CHANGELOG + tags/releases · protected-file guard implementation · identity/attribution enforcement · DSSE-style attestation · team pilot. *All deferred; none started before Horizon 2 exits.*

### Research track (parallel, small)

Compact resume protocol (EA-I15) · archaeology snapshots (EA-I16) · model routing (EA-I17) · `chaos:run` pipeline driver · cross-worktree lock semantics.

## 14.3 Tracks

- **Product:** EA-S4 → EA-V1 → EA-B1 → EA-B5 → EA-A2
- **Technical:** EA-S2/S3 → EA-V3 → EA-B2/B3/B4 → H4
- **Adoption/community:** EA-S1 → EA-V1 showcase story → EA-X1 onboarding → EA-A4 references → co-maintainers (EA-R7)
- **Research:** EA-A1 spike + research track above

## 14.4 Critical path

```text
EA-S1 → EA-S2 → EA-S3  →  EA-V1 (showcase)  →  EA-V2 (experiments)  →  EA-B1 (profiles)  →  EA-B2/B4  →  beta call
                                                                 └─ kill/pivot gate (12-risk-register.md §12.3): continue vs EA-D3 extraction
```

## 14.5 Current-feature disposition

| Disposition | Features |
|---|---|
| **Stabilize** | interaction runtime · resume · Decision Center · doctor/diagnostics · parity CI (while twin trees exist) |
| **Simplify** | skill reference preambles (lazy loading) · hooks default posture · todo pipeline |
| **Merge** | status → doctor · change-scoped sync → archive · code-review + verify at compact profile |
| **Redesign** | contract sourcing (single canonical + generation) · mode model (risk × profile) |
| **Deprecate/remove** | PATCH-SUMMARY skill payloads · `chaos:gate` as standalone concept · hand-mirroring process (after EA-B3) |
| **Defer** | team/multi-user · Azure DevOps polish · telemetry · attestation · marketplace publication · web DC |

---

## Addendum (2026-07-18, same day): improvement-landscape delta

The companion [improvement-landscape assessment](../2026-07-18-improvement-landscape/README.md) ran a systematic 9-area / 75-topic exploration plus the Greenfield Foundation Discovery design. Its [final prioritization §11.5](../2026-07-18-improvement-landscape/11-final-prioritization.md) is the authoritative delta to this roadmap. Summary of accepted additions:

- **Horizon 0–1 (alpha):** IL-DQ2 materiality doctrine + stop budgets (prompt-only) · IL-PF10 token accounting in CI + per-command budgets · IL-PF9 report budgets/summary-first · IL-WF9 retire the `chaos:gate` concept · IL-RT9 abuse-suite skeleton in CI.
- **Horizon 2 (beta foundation), new items:** **EA-B6** Greenfield Foundation MVP (IL-AG1) · **EA-B7** decision schema v2 + dependent decisions + expiry (IL-DQ1/DQ8/DQ10) · **EA-B8** provenance chain + waiver lifecycle (IL-TR1/TR4/TR2); IL-WF5 break-glass folds into EA-B1; IL-RT5/RT8 fold into the hardening pass.
- **Horizon 3, new items:** **EA-A6** rules/gates as structured data (IL-AG4) · **EA-A7** ledger format v1 publication (IL-EX6, pairs EA-A1).
- **Critical path and kill/pivot criteria: unchanged** — no addition precedes the showcase trail (EA-V1) or the validation experiments.
