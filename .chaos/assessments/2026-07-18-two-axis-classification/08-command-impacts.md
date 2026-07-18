# 08 — Command-by-command impacts

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)
Scope note: all impacts are prompt/skill-layer plus the small `classification.yaml` contract — no interaction-runtime schema change is required for v1 (decision-metadata enrichment rides EA-B7).

### `chaos:propose`
Runs the classification algorithm ([02](02-classification-algorithm.md)) as an early phase: signal scan → rule table → adjudication-if-needed → writes `classification.yaml` → prints the inline summary. The proposal's prose explains both axes with evidence, lists required gates and **intentionally skipped ceremony with reasons**, exposes uncertainty explicitly, and offers override flags. Creates a runtime decision **only** per the materiality table ([02 §2.4](02-classification-algorithm.md)) — strict confirmation folds classification approval into the existing strict stop; light/standard-micro/compact proposals stop zero extra times.

### `chaos:review`
Re-runs the signal scan and compares against the recorded classification (cheap, deterministic): **credibility check** (do signals support the axes?), **downgrade challenge** (any downgrade re-validated; contradicted downgrades are blocker findings), **gate-gap detection** (triggered-but-missing gates), and recommendation of escalation *or simplification* (review may propose profile↓ when the prediction over-shot — through the human-decision downgrade path). Review explicitly separates code-review needs (G-CODE-*, profile-driven) from system safeguards (G-SYS-*, risk-driven) in its findings.

### `chaos:apply`
Consumes the profile template (session shape, report format) and the gate list. Executes required system safeguards as first-class tasks (they appear in the task list with evidence obligations). Watches scope at task boundaries: actual-touched vs predicted diff + new-signal scan on new files → triggers the reclassification protocol ([07](07-reclassification-protocol.md)). Never invokes gates the classification marks n/a — and records that it didn't, so verify can audit the claim.

### `chaos:code-review`
Bound to **executionProfile + code signals, never to risk alone**: standalone command at full profile; folded into verify at compact; **not triggered at all for strict-risk config-only changes** (S3) unless implementation evidence (code touched) justifies it. Its skill drops all "strict ⇒ review required" language in favor of gate G-CODE-REVIEW's trigger.

### `chaos:verify`
Two verification lanes with different depths: **safeguard verification** (deep, driven by systemRisk — every triggered G-SYS/G-GOV gate checked against its evidence) and **implementation verification** (depth by executionProfile — traceability matrix scaled to the template). Mandatory output: the per-gate applicability record — `satisfied (ref) | waived (waiver ref) | not-applicable (reason tied to signals)` — making *n/a vs skipped* an audited distinction ([04 §4.4](04-adaptive-gates.md)).

### `chaos:status` (→ doctor per portfolio merge)
Displays per active change: both axes, confidence, modifiers as badges, selected workflow ID, reclassification count with direction, pending classification decisions. One line per change; details on demand from the yaml.

### `chaos:doctor`
New probes (deterministic, in the diagnostics package): classification missing for an active change · classification/signals contradiction (recorded axes unsupported by a fresh scan) · strict risk without its triggered safeguards · full profile without implementation evidence (no code touched but full ceremony selected — the inverse waste case) · downgrade without human decisionRef (blocker) · stale classification (scope drifted since last check) · legacy-mapping entries pending re-touch.

### `chaos:retro`
Consumes the calibration inputs ([02 §2.5](02-classification-algorithm.md)): was the classification accurate (prediction vs actual)? did required ceremony add value (gate outcomes)? were gates executed that mattered to nothing? were useful gates missed (verify's gap findings)? Output: calibration report + **governed** rule-table adjustment proposals. Retro itself is gate-triggered under the new model (G-GOV-RETRO), so this analysis runs where it's warranted, not everywhere.

### `chaos:sync`
Reconciles: classification-derived waivers into the waiver ledger · rule-table adjustment proposals into governance (with human decisions) · foundation-conflict outcomes (S13/S14 class) into ADRs/foundation revisions · ensures the gate catalog referenced by classifications matches the authoritative catalog version.

### `chaos:todo`
Captures as candidates, with classification provenance: unresolved classification uncertainty (LOW-confidence classifications that shipped) · deferred risk mitigations (waived gates with expiry) · missing evidence flagged by verify · calibration-suggested rule improvements awaiting a proposal.
