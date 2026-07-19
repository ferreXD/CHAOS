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
    bodyHash: "sha256:db6461d02f34465be829d8d574faf2c24f6d0383598a9dc0c79cdaa442aacd02"
---

# 01 — Problem, terminology, dimensions, levels, modifiers

Part of the CHAOS two-axis classification design (companion to the [public-alpha assessment](../2026-07-18-public-alpha-assessment/README.md) and [improvement landscape](../2026-07-18-improvement-landscape/README.md)) · commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Inferred / Hypothesis / Recommendation. This design refines **IL-WF1 / EA-B1**.

## 1.1 Problem assessment

The current model collapses two independent properties into one axis (Observed: `--light|--standard|--strict` in every command; `docs/overview.md` — "Same command, different amount of ceremony — matched to how risky the change is"). The conflation fails in both directions:

- **Dangerous-but-tiny** (production connection string): strict classification today implies the strict *path* — archaeology posture, review command, detailed apply plan, full report set, code-oriented gates — although the implementation is one line and most of that ceremony validates nothing relevant. Measured cost of the full chain: ~196k instruction tokens, 9 sessions, 11–14 stops (Observed, first assessment §06). The rational user bypasses governance exactly where it matters most (risk EA-R2).
- **Large-but-contained** (big internal refactor): today's inference leans light/standard on "no security/persistence/contract" signals, potentially under-weighting the *implementation* rigor a high-regression refactor deserves (deep code review, extensive tests) — the opposite mismatch.

The two failure modes have the same root: **risk describes what could go wrong in the system; weight describes how much engineering process the work deserves. They correlate weakly and must be classified separately** (Recommendation, Confidence: HIGH).

## 1.2 Recommended terminology

```yaml
systemRisk:        light | standard | strict     # axis 1 — danger, sensitivity, irreversibility, reach
executionProfile:  micro | compact | normal | full  # axis 2 — engineering work + workflow weight applied
```

Naming decisions (the brief's explicit question):

- **Axis 1 keeps `systemRisk` with the existing `light|standard|strict` values.** Reusing the value vocabulary is deliberate: every existing skill sentence about strict obligations ("blockers block", "material decisions required") remains true — it now binds to the risk axis, which is what those sentences were always about. This is the backbone of backwards compatibility (see [03 §3.4](03-contract-and-artifacts.md)).
- **Axis 2 is named `executionProfile`, not "implementation complexity" or "code complexity" or "workflow weight".** Rationale: *implementation complexity* is the primary **input signal**; *workflow weight* is the **consequence**; the axis itself is a **selection** that commands consume prescriptively. "Code complexity" is wrong because non-code changes (docs, config) need the axis too. The artifact stores the selected profile plus the reasons (complexity signals) that produced it.
- The pair is written **`<risk>-<profile>`** (`strict-compact`), risk first — safety leads.

## 1.3 Are two axes sufficient? — yes, plus a closed modifier set

Candidate third dimensions, adjudicated (the brief's list):

| Candidate | Verdict | Where it lives |
|---|---|---|
| Blast radius | **Signal into systemRisk**, echoed as modifier metadata for explanation — never a separate axis (it *is* most of what risk means) |
| Reversibility | **Modifier** — feeds systemRisk, triggers `G-SYS-ROLLBACK`, and sets the decision's one-way/two-way class (ties IL-DQ1) |
| Uncertainty | **Modifier** — raises evidence requirements and can escalate systemRisk one level; triggers targeted archaeology instead of broad ceremony |
| Change novelty | **Signal into executionProfile** (novel architecture → full); metadata only |
| Evidence confidence | Already exists — the classification carries its own `confidence` field (the confidence doctrine applies to the classification itself); not an axis |
| Urgency | **Modifier** — activates the break-glass path (IL-WF5); may lower *profile* with mandatory retro-debt; **never lowers risk** |
| Regulatory sensitivity | **Modifier** (`sensitivity`) — feeds systemRisk and triggers compliance gates; largely posture-driven via foundation D-C overlay |

**Final model: 2 axes + 5 closed modifiers** (Recommendation):

```yaml
modifiers:
  reversibility: easy | hard
  blastRadius:   low | medium | high
  uncertainty:   low | medium | high
  sensitivity:   [] | [security, data, compliance]   # zero or more
  urgency:       normal | elevated | emergency
```

Modifiers are schema-enumerated and closed — they explain, trigger specific gates, and apply bounded escalation rules; they never multiply the workflow matrix (12 combinations stay 12). Three axes were rejected: the examples in [06](06-scenarios.md) all classify cleanly with two axes + modifiers, and every added axis doubles the reasoning burden for users and agents. This is the smallest model that produces intelligent selection (the brief's requirement).

## 1.4 Level definitions

### systemRisk — determined by the **maximum** triggered signal class (risk is max-of, never average)

- **light** — low blast radius; easy rollback; no sensitive data/paths; no production, deployment, or external-contract implications; high behavioral confidence. *Boundary test: if any standard signal fires, it is not light.*
- **standard** — meaningful behavior change; moderate blast radius; integration or persistence impact; manageable rollback; focused validation required; some coupling uncertainty.
- **strict** — any of: security/auth/secrets touched · personal/regulated data · schema or data-integrity impact · public contract change · production/deployment/infrastructure sensitivity · availability impact · hard-to-reverse operations · high blast radius · high uncertainty on any of the above. *Strong evidence and explicit approval required.*

### executionProfile — determined by effort/coordination signals

- **micro** — one/very few files; obvious implementation; no design work; targeted validation; single session. *Boundary: predicted diff ≤ ~2 files and no new design decisions.*
- **compact** — small but meaningful; bounded to one module/slice; targeted analysis; limited consolidated reporting; focused review folded into verification.
- **normal** — ordinary feature; standard evidence gathering; separate propose/review/apply/verify; moderate artifacts.
- **full** — large, architectural, cross-module, or highly uncertain implementation; broad archaeology justified; staged implementation; standalone code review; archive/sync/retro likely justified.

**Tie-break rule:** when signals leave the profile ambiguous *and* systemRisk is strict, round the profile **up** (the connection-string case lands strict-**compact**, not strict-micro, because environment validation is staged work even though the diff is one line). At light/standard risk, ambiguity rounds down and the cheap escalation path ([07](07-reclassification-protocol.md)) corrects under-estimates.

## 1.5 The core principle, stated as command law

> **Risk raises the strength of relevant safeguards. Profile determines the weight of the workflow. Neither axis may set the other's output.**

Concretely: `strict` buys — explicit risk explanation, focused impact analysis, human approval, the *relevant* system gates (secrets/environment/rollback/…), strong evidence for the risky aspects, deep verification **of the safeguards**. It does **not** buy — broad archaeology, architectural review, code-review ceremony, generic implementation gates, mandatory retrospective, or the full report set. Those are the profile's to grant ([04](04-adaptive-gates.md), [05](05-workflow-matrix.md)).
