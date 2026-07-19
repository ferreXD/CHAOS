---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:02:02+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:02:02+02:00"
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
    bodyHash: "sha256:973e53723ad1ffdfa52244f47e8d4490c28dd1949297c41ab9ab4ce7f44f9305"
---

# 06 — Fifteen scenario classifications and what they reveal

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)
Modifier shorthand: rev(ersibility) · blast · unc(ertainty) · sens(itivity) · urg(ency). "Recl?" = likelihood the classification changes during implementation. These fifteen are also the **golden fixture suite** for the rule table's unit tests ([09 §9.3](09-recommendation-and-roadmap.md)).

| # | Change | Risk | Profile | Key modifiers | Required gates (beyond G-GOV-EVIDENCE/SCOPE) | Skipped ceremony | Approval? | Recl? |
|---|---|---|---|---|---|---|---|---|
| S1 | Docs typo | light | micro | rev easy, blast low | — | everything beyond the governed session note | No | ~0 |
| S2 | Internal variable rename | light | micro | blast low | G-CODE-STATIC | archaeology, review, reports | No | Low (cross-module rename → compact) |
| S3 | **Prod connection-string update** | **strict** | **compact** (tie-break up: staged env validation) | rev easy-value/blast high, sens security, unc med | G-SYS-SECRETS, ENV-TARGET, CONNECTIVITY, ROLLBACK, G-GOV-APPROVAL | broad archaeology, code-review, arch analysis, retro, full report set | **Yes** | Low |
| S4 | Authentication-policy change | strict | compact (config) / normal (code) | sens security, blast high | G-SYS-SECRETS?, G-CODE-TESTS-INTEGRATION (authz tests), G-GOV-APPROVAL, G-GOV-ADR (if policy is a decision) | broad archaeology (targeted authz-surface analysis instead) | **Yes** | Medium |
| S5 | New request-context middleware | standard | normal | blast med-high (cross-cutting path), unc med | G-SYS-AVAILABILITY, G-SYS-OBSERVABILITY, G-CODE-TESTS-INTEGRATION, G-CODE-PERF | strict approval, retro | No (standard confirm) | Medium (auth/PII flows through context → strict) |
| S6 | Database index addition | standard | micro | unc med (**table size unknown — env-dependent**), blast med | G-SYS-MIGRATION (light), G-SYS-AVAILABILITY (creation locking), G-SYS-ROLLBACK | code gates (n/a), archaeology, reports | No | Medium (huge prod table → strict via unc) |
| S7 | Database schema migration | strict | compact→normal (by code breadth) | rev hard, blast high, sens data | G-SYS-MIGRATION, DATA-INTEGRITY, ROLLBACK, G-CODE-TESTS-INTEGRATION, G-GOV-APPROVAL | broad archaeology unless coupling unknown | **Yes** | Medium |
| S8 | Large internal refactor (parser) | standard | **full** | blast low (system) — code breadth counts to *profile*, not risk | full G-CODE-* suite (STATIC, TESTS-UNIT/-INTEGRATION, REVIEW standalone, DEPS-IMPACT) | system gates (n/a), strict approval | No | Low |
| S9 | New isolated endpoint | standard | compact | blast low-med | G-SYS-CONTRACT (new public surface), G-CODE-TESTS-INTEGRATION, G-CODE-DOCS | archaeology, standalone review | No | Low |
| S10 | Breaking public API change | strict | normal | rev hard (consumers), blast high | G-SYS-CONTRACT (strong: deprecation policy), G-GOV-ADR, G-GOV-APPROVAL, G-CODE-TESTS-INTEGRATION, G-CODE-DOCS | broad archaeology (consumer-impact analysis instead) | **Yes** | Low |
| S11 | Dependency version update | standard | micro (patch/minor) | varies: security patch → sens security + urg elevated; major → compact | G-SYS-SUPPLY-CHAIN, G-CODE-STATIC, existing test suite as evidence | design/review ceremony | No (Yes if escalated) | Medium (breaking transitive change discovered) |
| S12 | Logging/observability config | light | micro | blast low | G-SYS-OBSERVABILITY (light) | everything heavy | No | Low (**PII into logs → sens data → strict**) |
| S13 | Introduce a message broker | strict | **full** | rev hard, blast high, unc high | G-SYS-AVAILABILITY, CONCURRENCY, OBSERVABILITY, DEPLOY, G-CODE-ARCH, G-GOV-ADR + **foundation revision (FA-C)**, G-GOV-APPROVAL, G-GOV-RETRO | none — this is what full is for | **Yes** | High (during rollout) |
| S14 | Extract service from modular monolith | strict | **full** | rev hard, blast high | as S13 + G-SYS-CONTRACT, DATA-INTEGRITY (data split), MIGRATION + **foundation revision (F1-A→F1-B)** | none | **Yes** | High |
| S15 | Security vulnerability remediation | strict | compact (typical fix size) | sens security, urg elevated→**emergency** possible | G-SYS-SUPPLY-CHAIN/SECRETS as applicable, G-CODE-TESTS (regression), G-GOV-APPROVAL (post-hoc under break-glass IL-WF5), G-GOV-RETRO (triggered) | broad ceremony; disclosure handled outside the public trail | **Yes** (may be retroactive) | Medium |

## 6.1 Weaknesses the scenarios expose (and the design's answers)

1. **Environment-dependent risk is invisible to static signals** (S6: index on a 100-row table vs a 500M-row production table are different changes). Answer: the `uncertainty` modifier + one targeted adjudication question; doctor can carry environment context hints later. Static classification must *know what it can't know* — this is why classification carries confidence.
2. **Cross-cutting ≠ risky** (S5): blast radius alone must not drive risk to strict without a sensitivity pathway; the rule table weights `blastRadius` into risk only when it co-occurs with behavioral or sensitive-path signals. Without this, every middleware change becomes strict and the model inflates.
3. **Double-counting breadth** (S8): code breadth must count toward *profile* only; system blast radius toward *risk* only. The refactor is the canonical test: standard-full, never strict.
4. **External knowledge needs** (S11): supply-chain risk depends on advisory data the repo doesn't contain. G-SYS-SUPPLY-CHAIN's evidence includes an advisory scan; absent tooling, uncertainty rises and the gate says so rather than pretending.
5. **Urgency must not silently erode governance** (S15): emergency lowers *profile* and defers gates via break-glass debt — it never lowers risk, and the retro trigger is non-waivable. The trail survives the fire.
6. **Foundation coupling** (S13/S14): some classifications are really *foundation revisions* in disguise; the signal "foundation-relevant path/decision" routes them into the governed revision flow rather than letting a change quietly re-architect the system — the classifier is the tripwire.
