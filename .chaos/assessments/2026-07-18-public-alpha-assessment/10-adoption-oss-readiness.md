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
    bodyHash: "sha256:a8b3159a5238f29abe04224dc91e717c6009ae2dfb2200067e3950621300c086"
---

# 10 — Adoption analysis and open-source readiness

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 10.1 Segments

| Segment | Pain | Fit | Willingness / setup tolerance | Expected outcome |
|---|---|---|---|---|
| **Solo senior/staff eng, brownfield, Claude Code power user** | High | **Best** | High tolerance, self-serve | **Primary persona** — adopts for risky changes once first-run is fixed |
| **Consulting / migration teams** | High (client audit trail = deliverable) | **Strong** | Medium-high; billable to engagement | **Secondary persona** — the trail is client-billable evidence |
| Tech leads on AI-heavy teams | Med-high | Good later | Low tolerance for 9-session ceremony | Watchers until compact profiles + team story |
| Regulated / compliance-adjacent orgs | Rising (EU AI Act Aug 2026) | Thesis-fit, product-premature | Needs security posture CHAOS lacks | v1+ opportunity |
| Platform teams / IDPs | Medium | Integration target, not buyer | — | Partner channel later |
| Junior developers | Low perceived | Poor (decision quality assumed) | Low | **Anti-persona** |
| Greenfield / prototyping startups | Low | Poor | Low | **Anti-persona** (README already says so) |
| OSS maintainers | Medium | Interesting, token-cost-sensitive | Medium | Explore later |

**Ideal first use case:** a scary change to an unfamiliar brownfield module — auth, schema, cross-module contract — where archaeology + strict gates + the decision trail all earn their cost in one story. **Ideal demo:** the showcase trail (EA-V1) — a *real, committed* run of exactly that on the task-tracker repo. **Ideal onboarding path:** plugin install (one command) → `chaos:doctor` fixes you → run the demo change yourself → read the trail it leaves.

## 10.2 Adoption barriers, ranked by lethality (Inferred)

1. First-run breakage (silent) — EA-S2
2. Ceremony/token cost on normal changes — EA-B1/B2
3. Claude Code gating
4. No *public* proof of ROI — EA-V1 (amended: private validation exists, Reported)
5. Artifact volume / repo noise — mitigated by the showcase-not-main decision + compact profile
6. Trust in prompt-only enforcement — EA-I14
7. Single-user model
8. Maintenance fear (twin trees visible to any evaluator) — EA-B3
9. Lock-in fear — low (plain files, MIT), worth stating in README

## 10.3 OSS readiness classification (Observed)

| Class | Items |
|---|---|
| **Public-alpha blockers** | none remaining strictly — repo is public, MIT-licensed, documented |
| **Public-alpha high priority** | Residual private-client data (`.claude/hooks/README.md:207-215`; tracked `.claude/settings.local.json`; `config.yaml` `project.type: dotnet`, `mainlineBranch: chaos/main`) — roadmap wrongly marks sanitization done · missing `openspec init` first-run path · no `SECURITY.md`/private disclosure channel (CoC admits none) · "runnable demo" framing vs illustrative artifacts |
| **Beta blockers** | CI runs zero of the 266 tests (only parity-check; CONTRIBUTING's "keep green" is unenforced) · 2 fixture-broken tests on fresh clone · `.mcp.json` → unbuilt `dist/` |
| **v1 blockers** | CHANGELOG + git tags/releases (none exist; "v0.1.0" is a commit message) · Copilot parity truthing (content-aware or generated) · protected-file guard implementation · npm/marketplace publication story (packages are source-import-coupled) |
| **Nice to have** | PR template · issue-chooser `config.yml` · Node-version consistency (20.19 vs 22.6) · PowerShell-safe snippets · git identity hygiene (4 identities, corporate email in history) |

Hygiene positives (Observed): clean `.gitignore` runtime/source split; no tracked build junk; well-formed issue forms; Contributor Covenant 2.1; realistic CONTRIBUTING with dev setup.

**Is the "public alpha" designation honest?** Yes — arguably conservative on engineering quality and slightly generous on packaging. The project's own 2026-07-01 audit rated public-alpha readiness LOW and recommended "internal alpha"; the July push closed most packaging items (todo: 15/21 done, all remaining items v1/vNext). The four high-priority items above are the honest gap between label and reality — all cheap to fix (EA-S1/S2/S4).
