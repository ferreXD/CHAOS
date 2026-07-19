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
    bodyHash: "sha256:e1a81e886642c34ad2d2e406bbbea7bb7fc111598dcbe9fd103799492f28ff08"
---

# 04 — Adaptive gate model and catalog v1

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)
Implements the gates-as-data direction (IL-AG4); retires severity-tier gate activation. **Selection is by relevance predicate; severity only raises strength** (evidence depth, waivability, approval).

## 4.1 Gate schema

```yaml
- id: G-SYS-SECRETS
  category: system            # system | code | governance
  axis: systemRisk            # which axis primarily activates it
  triggers: {signals: [path-class.secrets], modifiers: {sensitivity: security}}   # OR-semantics
  evidence: "secret reference resolves against the declared store; no plaintext secret in diff"
  mandatory: true
  waivable: false             # waivable gates skipped ⇒ waiver with lifecycle (IL-TR4)
  strength: {light: n/a, standard: check, strict: check+approval-visible}
  cost: low                   # relative execution cost
  value: high
```

## 4.2 Catalog v1 (27 gates)

### System & operational (axis: systemRisk; triggered by signals/modifiers, never by profile)

| ID | Trigger | Satisfying evidence | Mand./Waivable | Cost→Value |
|---|---|---|---|---|
| G-SYS-SECRETS | secrets/credential paths or sensitivity:security | secret ref validated; no plaintext in diff | ✔ / ✖ | low→high |
| G-SYS-ENV-TARGET | environment/deployment config touched | explicit target-environment statement, verified against config map | ✔ / ✖ (standard+) | low→high |
| G-SYS-CONNECTIVITY | connection/endpoint config touched | post-change connectivity verification plan or executed check | ✔ / ✔ | low→high |
| G-SYS-DATA-INTEGRITY | persistence writes semantics changed | data safety statement; backup/verify plan at strict | ✔ / ✖ at strict | med→high |
| G-SYS-MIGRATION | migration file present | forward+rollback migration validated (tool-run where possible) | ✔ / ✖ at strict | med→high |
| G-SYS-CONTRACT | public contract diff (API/schema/events) | version/deprecation policy applied; consumer impact listed | ✔ / ✔ with waiver | med→high |
| G-SYS-DEPLOY | deploy topology/infra files | deploy plan + rollback path | ✔ / ✔ | med→high |
| G-SYS-AVAILABILITY | availability-affecting signals (pools, timeouts, middleware, locks) | degradation analysis; limits stated | ✔ std+ / ✔ | med→med-high |
| G-SYS-ROLLBACK | reversibility:hard, or strict risk | explicit rollback instructions in the change folder | ✔ / ✖ at strict | low→high |
| G-SYS-OBSERVABILITY | new failure modes introduced | logging/metrics presence for new paths | ✔ std+ / ✔ | low→med |
| G-SYS-COMPLIANCE | sensitivity:data|compliance (or D-C posture) | PII/retention handling statement | ✔ / ✖ under regulated overlay | med→high |
| G-SYS-CONCURRENCY | concurrency primitives/shared-state signals | race analysis; idempotency/stress evidence at strict | ✔ / ✔ | high→high |
| G-SYS-SUPPLY-CHAIN | dependency manifest changed | advisory scan + changelog/license review | ✔ / ✔ | low→med-high |

### Code & implementation (axis: executionProfile; triggered by profile × code-touching signals — **a config-only strict change triggers none of these**)

| ID | Trigger | Satisfying evidence | Mand./Waivable |
|---|---|---|---|
| G-CODE-STATIC | code files touched | linters/analyzers pass (deterministic) | ✔ / ✔ |
| G-CODE-TESTS-UNIT | behavior change in code, compact+ | tests for changed logic; strict risk makes missing tests blocking (today's rule, now correctly scoped to code changes) | ✔ / ✔ with waiver |
| G-CODE-TESTS-INTEGRATION | cross-module/endpoint/persistence code, normal+ (or contract signal at any profile) | slice/integration tests | ✔ / ✔ |
| G-CODE-REVIEW | normal+ profile with code touched (full ⇒ standalone `chaos:code-review`; compact ⇒ folded into verify) | review findings addressed or waived | ✔ at normal+ / ✔ |
| G-CODE-ARCH | architectural novelty or foundation-relevant paths | conformance vs foundation/rules (IL-AG2) | ✔ / ✔ |
| G-CODE-PERF | hot-path signals or perf-sensitive paths | perf consideration; benchmark at full | ✖ / — |
| G-CODE-DOCS | public surface or documented behavior changed | docs updated | ✔ normal+ / ✔ |
| G-CODE-DEPS-IMPACT | internal dependency edges changed | dependency-direction check vs R-DEP rules (deterministic-able) | ✔ / ✔ |

### Workflow & governance (axis: both)

| ID | Trigger | Satisfying evidence | Mand./Waivable |
|---|---|---|---|
| G-GOV-APPROVAL | strict risk (any profile) | explicit human approval decision before apply | ✔ / ✖ |
| G-GOV-EVIDENCE | always; strength by risk | evidence coverage ≥ threshold (light: recommended · standard: PARTIAL+ · strict: COMPLETE or waived gaps) | ✔ / via waiver |
| G-GOV-SCOPE | always | approved scope stated; apply drift-checked against prediction | ✔ / ✖ |
| G-GOV-ADR | foundation conflict or architectural decision class | ADR/decision-log entry (IL-AG3) | ✔ / ✔ |
| G-GOV-WAIVER | any waived waivable gate | waiver with owner+expiry (IL-TR4) | ✔ / ✖ |
| G-GOV-RETRO | triggers only: emergency used · reclassification occurred · repeated waiver class · full profile | retro entry (else periodic cadence, IL-WF7) | ✔ on trigger / ✔ |

## 4.3 The activation principle, tested

Connection-string change (strict-compact): activates G-SYS-SECRETS, ENV-TARGET, CONNECTIVITY, ROLLBACK, G-GOV-APPROVAL/EVIDENCE/SCOPE — **seven relevant gates, zero code gates**, no archaeology, no retro. Large internal refactor (standard-full): activates the full G-CODE-* suite + G-GOV-* — **and only G-SYS-OBSERVABILITY** from the system set if new failure modes appear. The strict tier no longer means "all gates"; it means "the triggered gates, at full strength, with approval" (Recommendation; the direct answer to the brief's core design principle).

## 4.4 Verification duty

`chaos:verify` must record, per catalog gate: `satisfied (evidence ref) | waived (waiver ref) | not-applicable (trigger absent)` — **n/a is a positive claim** ("no code was touched") that verify checks against the signals, not a silence. This is what makes skipped ceremony auditable rather than invisible ([08 §verify](08-command-impacts.md)).
