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
    bodyHash: "sha256:b8ec73086170ab22b2c220fc8d197daa7c135fa09d2fc304ea220b62f0ed5595"
---

# 02 — Classification algorithm, ownership, confidence, overrides, calibration

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)

## 2.1 Ownership: deterministic signals first, model second, user last

| Actor | Role |
|---|---|
| **Deterministic tooling** (the blast-radius estimator IL-WF4 + repo manifest IL-PF7) | Produces the raw signals: predicted diff surface, touched path classes, module fan-in/out, contract/schema/secret/deployment file detection, dependency-manifest changes |
| **Shared change-classification skill** (one canonical contract, ~3 KB, referenced by propose/review/apply — never restated) | Owns the rule table mapping signals → axes/modifiers and the tie-break/escalation rules |
| **Agent** | Adjudicates only ambiguity (conflicting signals, low signal coverage, environment-dependent risk) and drafts the reasons prose |
| **User** | Confirms/overrides **only when material** (§2.4) |

The user never classifies trivial changes; the agent never free-styles a classification the signals contradict; the rule table — not model temperament — is the authority (Recommendation; directly addresses today's prose-only inference, Observed in `overview.md`).

## 2.2 Algorithm

```text
1. SIGNAL SCAN (deterministic, ~free):
   path classes hit (auth/secrets/persistence/contracts/deploy/infra/docs/tests)   ← config-declared class map + foundation rules
   predicted diff surface (files, modules, fan-out via manifest)
   contract/schema/dependency/migration file detection
   foundation/rule relevance (which R-*/G-* apply)
2. RULE TABLE:
   systemRisk   = max(risk class of any triggered signal)          # max-of, never average
   executionProfile = f(predicted files, modules, novelty, testing complexity)
   modifiers    = derived (reversibility from operation types; blastRadius from fan-out;
                  uncertainty from signal coverage + coupling unknowns; sensitivity from path classes;
                  urgency only from user declaration)
3. ADJUDICATION (model, only if needed):
   triggered when signals conflict, coverage < threshold, or environment-dependent risk detected
   (e.g. migration on a table of unknown size) → agent may raise uncertainty, propose one level up,
   or ask ONE targeted question
4. TIE-BREAKS: strict + ambiguous profile → round profile UP; light/standard + ambiguous → round DOWN
   (escalation is cheap, 07); uncertainty=high → systemRisk floor = standard
5. OUTPUT: classification.yaml (03) + one-line inline summary + workflow selection (05)
```

## 2.3 Confidence model

`confidence: HIGH | MEDIUM | LOW` attaches to the classification itself, computed — not vibed: **HIGH** = signals unanimous, coverage complete, no adjudication needed. **MEDIUM** = adjudication used, or environment-dependent factors declared, or legacy mapping ([03 §3.4](03-contract-and-artifacts.md)). **LOW** = conflicting signals or thin evidence — LOW *forces* a user confirmation and caps downstream evidence claims (consistent with the confidence doctrine, Observed in `overview.md` §labels). The reasons arrays cite signals, not adjectives.

## 2.4 User confirmation & override policy (anti-interruption by design)

A classification creates a runtime decision **only** when it materially affects safety or cost (IL-DQ2 materiality doctrine applied to classification itself):

| Situation | Interaction |
|---|---|
| light/standard risk + micro/compact + confidence ≥ MEDIUM | **No stop.** One inline line: `Classified standard-compact (confidence HIGH) — persistence touched; 3 files predicted. Override: --class …` |
| strict risk | Classification confirmation **folds into the existing strict-mode confirmation** — one decision, not two (the decision card shows both axes, reasons, gates, skipped ceremony) |
| confidence LOW, or two plausible profiles with materially different cost | One decision offering the alternatives with per-option cost/gate preview |
| user override at any time (`--risk`, `--profile`, `--class strict-compact`) | Applied; **downgrades require rationale** and are recorded as an override entry; upgrades apply silently |
| escalation during work | See [07](07-reclassification-protocol.md) — self-applying upward, decision only if a new approval gate appears |

Every override records `{by, from, to, rationale, decisionRef?, at}` in the classification history — the audit trail answers "who loosened this and why" mechanically ([07 §7.3](07-reclassification-protocol.md) hardens the downgrade path against agent self-service).

## 2.5 Learning & calibration (governed, repo-scoped, never per-user)

Recorded per change (into the outcome records, IL-DQ6/TR5, and the classification history):

- predicted vs actual files/modules touched (deterministic diff of prediction vs the IL-TR1 manifest)
- gates triggered / waived / **later found missing** (verify records the delta)
- reclassifications with direction and trigger; user overrides with direction
- defects found post-verify; rollbacks; incidents attributed to the change

`chaos:retro` aggregates these into a **calibration report**: per-signal precision ("persistence-class signal fired 14×, justified 13×"), profile-prediction error, gates never useful, gates repeatedly missed. Calibration **proposes rule-table adjustments as a governed change** (a normal proposal against the classification skill + config) — thresholds never drift silently, honoring "learning without silently changing governance." Explicit privacy rule: calibration is **repository/workflow-scoped**; no per-user behavioral profiles, no tracking of which human overrides how often beyond the audit trail that already exists (Recommendation, hard requirement from the brief).

## 2.6 Cost of classification itself

Target: for a light-micro change the whole step is one deterministic scan + one printed line — **no model adjudication, no decision, no separate report** (the yaml is ~1 KB). Estimated overhead (Hypothesis, to be measured by IL-PF10): deterministic scan ≈ free; adjudication when triggered ≈ 1–2k tokens; contract write ≈ negligible. The classification must never cost more than a micro change it classifies — this is a stated acceptance criterion for EA-B1a ([09 §9.4](09-recommendation-and-roadmap.md)).
