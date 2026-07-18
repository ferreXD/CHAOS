# 03 — Machine-readable contract, artifact placement, backwards compatibility

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)

## 3.1 The contract

```yaml
# .chaos/changes/<change-id>/classification.yaml   — AUTHORITATIVE
changeClassification:
  schemaVersion: 1
  systemRisk: strict                    # light | standard | strict
  executionProfile: compact             # micro | compact | normal | full
  confidence: HIGH                      # computed, not asserted (02 §2.3)

  classifiedBy:
    method: deterministic+agent         # deterministic | deterministic+agent | user-override | legacy-mapping
    signalsTool: chaos-classify@1       # the deterministic scanner version
    model: claude-fable-5               # when adjudication ran (IL-TR2 attribution)

  signals:                              # raw deterministic evidence — the "why" that can't be vibed
    - {id: path-class.secrets, value: "config/appsettings.Production.json", riskClass: strict}
    - {id: predicted-diff, files: 1, modules: 1}
    - {id: env-config-change, environment: production}

  reasons:
    systemRisk:
      - production database connectivity (signal env-config-change)
      - credential-sensitive configuration (signal path-class.secrets)
      - possible availability impact
    executionProfile:
      - one configuration file, no code behavior redesign
      - validation is staged (environment + connectivity) → compact, not micro (tie-break up at strict)

  modifiers:
    reversibility: easy                 # value revert is trivial…
    blastRadius: high                   # …but a wrong value breaks production connectivity
    uncertainty: medium
    sensitivity: [security]
    urgency: normal

  requiredGates: [G-SYS-SECRETS, G-SYS-ENV-TARGET, G-SYS-CONNECTIVITY, G-SYS-ROLLBACK, G-GOV-APPROVAL]
  notApplicableGates: [G-CODE-TESTS-UNIT, G-CODE-REVIEW, G-CODE-ARCH]   # n/a ≠ skipped — nothing to review
  waivedGates: []                       # each entry would carry {id, waiverRef} (IL-TR4)
  skippedCeremony: [broad-archaeology, standalone-code-review, retrospective, full-report-set]

  selectedWorkflow:
    id: strict-compact                  # <risk>-<profile>
    template: compact                   # one of 4 profile templates
    overlay: strict                     # one of 3 risk overlays (05)

  overrides: []                         # {by, from, to, rationale, decisionRef, at}
  history:                              # append-only; reclassifications land here (07)
    - {at: 2026-07-18T…, event: classified, by: chaos:propose, commandRunId: RUN-…}
```

## 3.2 Placement (avoiding artifact proliferation)

- **`classification.yaml` is the single authoritative artifact**, in the change folder, ~40 lines. It *replaces* prose mode declarations — net new artifacts per change: one small file; net prose removed: the mode sections of every report.
- **`lifecycle.md`** displays one derived summary line (`strict-compact · confidence HIGH · reclassified 0×`) — a view, not a second copy.
- **Proposal** explains the classification in prose (reasons narrative + what's skipped and why safe); it cites, never restates, the yaml.
- **Evidence index** (IL-PF3) records the yaml's hash like any artifact. **No separate classification report exists.**
- Runtime decision records reference the yaml path when a classification decision is created; the Decision Center renders from the yaml ([07 §7.4](07-reclassification-protocol.md)).

## 3.3 Who reads it

`chaos:apply` (profile + gates to honor, scope prediction to diff against) · `chaos:verify` (gate applicability record: satisfied / waived / **not-applicable-with-reason** — the n/a-vs-skipped distinction is mandatory in the verification report) · `chaos:status`/doctor (display + coherence probes: classification present? gates consistent with signals? downgrades justified? stale after scope change?) · `chaos:retro` (calibration, [02 §2.5](02-classification-algorithm.md)) · `chaos:sync` (reconciles classification-derived gate/rule changes) · `chaos:todo` (captures unresolved classification uncertainty and deferred mitigations as candidates).

## 3.4 Backwards compatibility (additive migration)

- **Legacy flags keep working and keep their meaning:** `--light|--standard|--strict` now set **systemRisk**; when no profile is given, the legacy-equivalent profile is inferred so behavior is unchanged for old invocations — `light→(light, micro-or-compact by signals)`, `standard→(standard, normal)`, `strict→(strict, full)`. The new value arrives by *adding* `--profile <p>` or the shorthand `--class strict-compact`. Nothing existing breaks; strict callers get today's full ceremony until they opt down (Recommendation: the safe default direction).
- **Legacy artifacts:** proposals carrying `mode: strict` are read as `{systemRisk: strict, executionProfile: full, confidence: MEDIUM, classifiedBy.method: legacy-mapping}` — never invalidated, never rewritten in place; the mapping materializes only if the change is re-touched.
- **Config:** additive block under `policies.commandExecution` (`classification: {enabled, signalMap, profileThresholds, confirmStrict: fold}`); existing `inferModeWhenMissing`/`defaultMode` are honored as risk-axis settings. No runtime interaction-schema change is required (decision metadata additions ride IL-DQ1/EA-B7 when that ships).
- **Adapters:** the classification skill is shared contract text — the Copilot surface inherits it through the same parity/generation pipeline; the deterministic scanner is provider-neutral (CLI), consistent with the CLI-first doctrine (IL-EX5).
- **Gates:** legacy prose gate references map to catalog IDs where recognizable; unmapped ones remain textual gates until IL-AG4 lands — the catalog ([04](04-adaptive-gates.md)) is designed to absorb them incrementally.
