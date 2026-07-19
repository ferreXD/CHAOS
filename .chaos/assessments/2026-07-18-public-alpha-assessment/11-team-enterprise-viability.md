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
    bodyHash: "sha256:e9bd3774cb7cb4d46326963c0e4e79f6e2560f5e12cd3cb9ccb7c2f00c8813b7"
---

# 11 — Team and enterprise viability

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 11.1 Current reality

CHAOS is **structurally single-user** (Observed): identity is a self-declared string (`selectedBy: "vscode-user"`); the sync roles model (`developerSafe`/`maintainer`/`repoOwnerOnly`) exists as YAML intent with textual enforcement; locks do not span git worktrees; nothing arbitrates two humans. This is appropriate for alpha.

## 11.2 Genuinely necessary for first team use (beta+)

1. **Identity/attribution** via git/provider context — the design already exists (`repositoryContext` policy, provider-username identity mode); it needs enforcement, not invention.
2. **Merge-friendly artifact conventions** — per-change folders already help; runtime state (locks/capsules/sessions) must stay git-ignored, as it is.
3. **PR-surfaced ledger** — render `decision-events.md` into the PR description (cheap, high demo value). → EA-A2
4. **CI validation of ledgers** — the diagnostics package as a GitHub Action (artifact coherence, decision consistency). → EA-I14 extension
5. **Cross-worktree lock semantics** — research track; today each worktree has its own `.chaos/interactions/`.

## 11.3 Premature before product-market fit (defer)

Shared/remote Decision Center · approval routing and reviewer roles · issue/work-item integrations · telemetry · air-gap posture documentation · cryptographic attestation (adopt DSSE-style signing at v1 when auditors are the buyer — `ai-sdlc` demonstrates the pattern) · Azure DevOps provider polish (config scaffolding exists; keep dormant).

## 11.4 Enterprise thesis

The audit-trail value proposition aligns with 2026 compliance pressure (EU AI Act high-risk provisions in August; auditors requesting AI-code provenance). But enterprise adoption requires: a security posture (disclosure policy, hardened MCP boundary, tamper-evidence), versioned schemas + migrations, published/signed packages, and at least one compliance-adjacent pilot. Treat enterprise as **pull, not push** (Recommendation): make the ledger format audit-friendly and let regulated users arrive, rather than building enterprise features speculatively.
