# 09 — Failure modes, validation, token impact, roadmap, final recommendation

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)

## 9.1 Failure modes

| Failure | Danger | Mitigation |
|---|---|---|
| **Under-classified risk** (strict signals missed) | The one that ships incidents | Conservative rule table (max-of semantics; unknown → uncertainty↑ → risk floor standard); review's mandatory re-scan; doctor contradiction probe; calibration tracks misses |
| Classification theater (users auto-accept) | Trust rot | Stops only where material (one folded strict stop); visible skipped-with-reasons builds attention rather than numbing it |
| Agent self-downgrade | Governance bypass | Mechanically impossible without a human decisionRef ([07 §7.3](07-reclassification-protocol.md)); doctor blocker |
| Signal gaming (agent shapes work to dodge signals) | Subtle bypass | Signals are deterministic over *actual paths touched*; apply re-scans at task boundaries; verify audits n/a claims |
| Profile churn mid-change | Ceremony thrash | Task-boundary hysteresis; escalation cheap, downgrade deliberate |
| Gate catalog sprawl | Complexity creep | Catalog versioned; additions require the same governed change as rule edits; 27-gate v1 cap with cost/value columns forcing honesty |
| Environment-dependent risk invisible to static signals | Wrong confidence | Uncertainty modifier + declared unknowns; classification confidence caps downstream claims (S6 pattern) |
| Legacy drift (old artifacts misread) | Confusion | Explicit legacy-mapping with MEDIUM confidence + doctor listing; artifacts never rewritten in place |
| User confusion (two axes too clever) | Adoption | The inline one-liner is the everyday surface; most users see axes only on strict changes; EA-X1/X3 test comprehension |

## 9.2 Performance and token impact

Reductions (Hypothesis at current prompt sizes; measured by IL-PF10/EA-X3): strict-small changes are the headline — S3-class work drops from the full strict chain (~180–220k, 6–10 stops) to **strict-compact ~40–60k, 2–3 stops (≈70–80% reduction)**; standard everyday work drops via compact (~35–50k vs ~90–120k). Systemic savings: no broad archaeology below full · no standalone code-review below normal · retro trigger-based · consolidated reports at micro/compact (19 → ~6 artifacts) · fewer irrelevant gates → fewer evidence obligations → fewer stops. Costs: deterministic scan ≈ free · adjudication ~1–2k when triggered · classification.yaml ~1 KB · reclassification checks = manifest diffs (cheap) · one-time skill-contract complexity. Guardrail restated: **light-micro classification must cost less than the change it classifies** — acceptance criterion, not aspiration.

## 9.3 Tests and validation strategy

1. **Rule-table unit tests** — the [15 scenarios](06-scenarios.md) become golden fixtures (signals in → expected axes/modifiers/gates out); deterministic, runs in CI (EA-S3), extended by every calibration finding.
2. **Adversarial tests** — agent-attempted downgrade without decisionRef (must be rejected by the store); scope-expansion fixture triggers escalation at the right boundary; n/a-claim contradicted by signals caught by verify.
3. **EA-X3 (small-change tax)** — re-scoped to this design: S3-class change at strict-full vs strict-compact; thresholds ≤2 sessions, ≤4 stops, ≤60k tokens with all triggered safeguards evidenced.
4. **Comprehension probe** (inside EA-X1) — users explain back why their change got its classification; success = correct attribution of risk vs profile.
5. **Calibration report after the showcase** — prediction accuracy on the first real trail.

## 9.4 Roadmap integration (refines EA-B1; sequenced within the existing beta horizon)

| ID | Item | Deps | Exit criterion |
|---|---|---|---|
| **EA-B1a** | Classification contract + rule table + deterministic signal scan (subsumes IL-WF4; needs IL-PF7 manifest for fan-out signals — a path-class-only v0 can precede it) | EA-V1/V2 | 15 golden fixtures green; light-micro overhead ≈ one line |
| **EA-B1b** | Profile templates + risk overlays in skills; consolidated micro/compact reports | EA-B1a | EA-X3 thresholds met on S3-class change |
| **EA-B1c** | Adaptive gate catalog v1 (27 gates; absorbs IL-AG4's gate half; merges into EA-A6 for the rules half) | EA-B1a | verify emits per-gate satisfied/waived/n-a record |
| **EA-B1d** | Reclassification protocol + history + downgrade hardening + doctor probes | EA-B1a·b | adversarial tests green |
| **EA-B1e** | Decision Center classification card + escalation timeline events | EA-B1a·d, IL-DX4 | strict confirm shows the card; zero added stops below strict |

Critical path unchanged: nothing here precedes EA-V1 (showcase) or EA-V2 (experiments); EA-B1a–e *are* the concrete content of the EA-B1 milestone the roadmap already carries. The improvement-landscape inventory gains this file as the authoritative design for IL-WF1 (its §11.5 delta is amended accordingly).

## 9.5 Final recommendation — explicit answers

- **Adopt the two-axis model?** **Yes** (Recommendation, Confidence: HIGH). It is the single highest-leverage usability/trust/token change available, and it resolves the measured core failure (risk-ceremony conflation) without weakening any safeguard.
- **Second-axis name?** **`executionProfile`** — the axis is a prescriptive selection commands consume; *implementation complexity* is its input signal, *workflow weight* its consequence, *code complexity* too narrow.
- **Are two axes sufficient?** **Yes**, with the closed 5-modifier set (reversibility, blastRadius, uncertainty, sensitivity, urgency). A third axis was evaluated and rejected: every candidate either feeds an axis or acts as a modifier, and the 15-scenario suite classified cleanly.
- **Which modifiers are necessary?** All five earn their place through gate triggers or escalation rules; none is metadata-only. Sensitivity and urgency are the two that most change behavior (compliance gates; break-glass).
- **How should workflow selection work?** Deterministic signals → rule table → adjudication only on ambiguity → `template ⊕ overlay` composition (4×3, nothing hardcoded per combination) → confirmation only where material.
- **Which current strict gates stop being automatic?** Broad archaeology (targeted impact analysis instead) · standalone `chaos:code-review` · mandatory retro · the full report set · 2–3-approach proposal ceremony · generic code-quality gates on non-code changes · the archive/sync/retro tail below full profile. What stays automatic at strict: approval before apply, triggered system safeguards at full strength, COMPLETE-or-waived evidence, deep safeguard verification, decision recording.
- **How much ceremony can realistically be removed?** For the mismatched cases that motivate this design: **~70–80% of tokens and ~⅔ of stops** on strict-small changes; ~50% on standard everyday changes (Hypothesis — publish only measured numbers, IL-PF10).
- **What first?** **EA-B1a** (contract + rule table + signals with the 15 golden fixtures), because everything else composes on top of it and it is testable without touching any workflow — then EA-B1b to ship the flagship **strict-compact** experience on the showcase repo.
