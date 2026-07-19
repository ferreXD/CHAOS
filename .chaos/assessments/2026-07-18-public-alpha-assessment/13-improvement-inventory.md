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
    bodyHash: "sha256:099e01f6f41be98a0579f17e4de15eb674b740f69e2730046e5fac2d5085dcbf"
---

# 13 — Prioritized improvement inventory

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown
Each item: problem → change → value → complexity (S/M/L) → dependencies → risks → timing. Roadmap column links to [14-roadmap.md](14-roadmap.md).

## 13.1 Must do

| ID | Improvement | Problem → Change | Value | Cx | Deps | Risks | Roadmap |
|---|---|---|---|---|---|---|---|
| EA-I01 | **Sanitization purge** | Private-client residue (`.claude/hooks/README.md:207-215`, tracked `.claude/settings.local.json`, `config.yaml` type/mainline leftovers) contradicts roadmap's "completed" claim → purge + untrack + fix config self-description | Credibility; privacy | S | — | none | EA-S1 |
| EA-I02 | **First-run integrity** | Silent breakage: no `openspec init` path, `.mcp.json`→unbuilt dist, missing test fixture → document init, commit/decouple fixture, loud failure with build hint | Every new user | S | — | none | EA-S2 |
| EA-I03 | **Hook interpreter resilience** | `py -3` hardcoded; observed silently no-op'ing → `sys.executable`-based launcher or configurable interpreter + startup self-check surfaced in doctor | Silent-failure class removed | S | — | none | EA-S2 |
| EA-I04 | **Real CI** | 266 tests exist; CI runs none → run tests+typecheck (all 5 packages) + `dotnet test` on push/PR alongside parity | Contributor trust; drift guard | S | EA-I02 (fixture) | none | EA-S3 |
| EA-I05 | **SECURITY.md + honest demo framing** | No disclosure channel; "runnable demo" overclaim → add policy; reframe demo as illustrative until EA-I07 ships | OSS hygiene; honesty | S | — | none | EA-S4 |
| EA-I06 | **Remove PATCH-SUMMARY payloads** | Iteration changelogs (9.4+8.4 KB) ship inside skills — a model may read them as instructions → delete/move to docs | Token + safety | S | — | none | EA-S2 |
| EA-I07 | **Showcase trail** *(decided: Option 2, 2026-07-18)* | Validation exists (Reported) but is unverifiable → carry one real strict-mode change on the task-tracker through the full lifecycle; publish the complete sanitized artifact set in a showcase location (recommended: orphan branch, README deep-link + docs excerpt page) | The single most persuasive artifact CHAOS can own | M | EA-S2 | showcase itself must be honest (no retouching) | **EA-V1** |

## 13.2 Should do

| ID | Improvement | Problem → Change | Value | Cx | Deps | Risks | Roadmap |
|---|---|---|---|---|---|---|---|
| EA-I18 | **risk × execution-profile model** | One axis couples assurance with ceremony; small strict-risk changes pay full weight → `light/standard/strict` × `micro/compact/full`; `strict-compact` = consolidated sessions, one consolidated report, batched decisions, full gates | Removes the #1 abandonment driver | M-L (prompt layer) | EA-V1 evidence | mode-matrix complexity — keep defaults inferred | **EA-B1** |
| EA-I25 | **Command merges** | Overlapping gates and diagnostics → status→doctor; change-scoped sync→archive; verify+code-review combined at compact | Fewer concepts, less re-reading | M | EA-I18 | user retraining | EA-B1 |
| EA-I13 | **Lazy references + change evidence index** | "Read everything first" fan-outs; verify/archive/retro re-read the same set 3× → ≤3 KB skill cores + fetch-on-need; `.chaos/changes/<id>/index.json` with hashes + summaries | 30–60%/command; kills re-reads | M | — | index staleness — hash-verify | EA-B2 |
| EA-I14 | **Deterministic validators** | Status's 18.7 KB check catalog and lifecycle bookkeeping are prompt-encoded linting → move to `chaos-interaction-diagnostics`; model consumes JSON report; later a CI action | Cheaper, and mechanically trustworthy (anti EA-R8) | M | — | check drift vs prompts — single-source the rules | EA-B2 |
| EA-I08 | **Runtime hardening bundle** | No cross-process mutex; unsanitized MCP read IDs; `chaos_answer_decision` open; no stale-lock release → advisory per-root lockfile; ID regex in zod on all tools; env-gate the bridge; confirm-gated force-release | Beta-grade robustness | M | — | low | EA-V3 |
| EA-I09 | **Capsule integrity + quality** | `validatesAgainstDecisionHash` always null; real capsules empty → wire the hash; resume-time capsule-quality gate (warn/stop on skeletal capsules); prompt agents for scope/constraints at pause | Anti EA-R9 | M | EA-I08 | over-strictness blocks resumes — warn first | EA-V3 |
| EA-I10 | **Hooks posture reconciliation** | README/config say "nothing wired"; settings wire everything incl. `--stamp` in-turn → align docs; default `--stamp` to Stop-only; document the posture change | Removes a security-relevant doc lie | S | — | none | EA-V3 |
| EA-I11 | **Decision Center v2** | No history view; no batch queue; escaped-text context → history tab, "answer all" queue, markdown+file-link rendering, one-click resume | The panel becomes the product's face | M | — | webview scope creep | EA-B5 |
| EA-I12 | **Wait-state visibility** | Stop-hook hold looks like a hung chat for up to 30 min → visible countdown/state in panel + status bar ("waiting on DEC-…; answer or release") | Kills a first-week abandonment moment | S | EA-I11 | none | EA-B5 |
| EA-I21 | **Claude Code plugin packaging** | Manual clone + two builds + VSIX → one-command plugin install | Time-to-first-value ≤15 min | M | EA-S2 | plugin API churn | EA-B4 |
| EA-I24 | **OpenSpec compatibility pinning** | OPSX rewrite can break the hard gate (EA-R5) → declare supported version range in doctor; abstract the spec-engine seam | Substrate insurance | S-M | — | none | EA-A3 |
| EA-I20 | **Contract single-sourcing + generated Copilot surface** | ≈6 reworded copies of core rules per command; content drift undetectable → one canonical contract per command; thin pointers; generation step; content-aware parity | ~40–50% instruction mass; makes portability real | L | EA-B1 stabilized | large refactor — do after profiles settle | EA-B3 |

## 13.3 Explore

| ID | Improvement | Notes | Roadmap |
|---|---|---|---|
| EA-I23 | **Standalone runtime extraction spike** | Package runtime+MCP+panel+capsule contract as a framework-agnostic "decision runtime for coding agents"; spec the ledger/capsule formats | EA-A1 / direction EA-D3 |
| EA-I22 | **PR ledger rendering** | `decision-events.md` → PR body section; cheap, high demo value; first team-facing feature | EA-A2 |
| EA-I15 | Compact resume protocol (capsule + answered-decision delta, not full protocol reload) | ~10k tokens/interruption | research |
| EA-I16 | Archaeology snapshots (content-hashed cache, `--since` deltas) | big on repeat brownfield | research |
| EA-I17 | Model routing (small models for todo scan/report formatting) | modest, easy | research |
| — | `chaos:run` single-driver pipeline (one command drives phases with gates) | pairs with EA-B1 | research |

## 13.4 Defer

Team/multi-user features (identity enforcement, shared DC, approval routing) · Azure DevOps provider polish · telemetry · air-gap docs · DSSE-style attestation (v1, auditor-driven) · npm/marketplace publication (needs EA-I19 package formalization: workspaces + `file:` deps + built artifacts) · web Decision Center.

## 13.5 Reject

- Further **hand-maintained Copilot parity** investment (freeze as experimental + honest notes until EA-I20 generation exists).
- **New lifecycle commands** — the surface needs subtraction, not addition.
- **`chaos:gate` as a standalone command** — fold gate semantics into review/verify; resolves the backlog's open "decide-chaos-gate-fate" item.
- **Enterprise feature-building now** (see [11-team-enterprise-viability.md](11-team-enterprise-viability.md)).
- **Additional provider adapters** before generation-from-one-source exists.
