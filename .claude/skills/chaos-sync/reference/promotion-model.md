# Promotion Classification Model

Every material decision event must be classified.

## Primary promotion levels

```text
NO_PROMOTION
DECISION_LOG
ADR_CANDIDATE
ADR_REQUIRED
RULE_UPDATE
GATE_UPDATE
OPENSPEC_UPDATE
FOLLOW_UP_CHANGE
ACCEPTED_RISK
DEFERRED_WITH_RATIONALE
```

A decision may have multiple sync actions, but it must have one primary classification.

## Examples

- Local persistence naming choice -> DECISION_LOG or NO_PROMOTION.
- New cross-module side-effect invariant -> ADR_CANDIDATE + RULE_UPDATE + GATE_UPDATE.
- Missing test task fixed in review -> OPENSPEC_UPDATE only.
- Skipped integration tests -> ACCEPTED_RISK + RETRO_TOPIC.
- New external integration policy -> ADR_REQUIRED.

## Required metadata

- source decision id
- source report
- related change id
- selected promotion level
- rationale
- confidence
- sync action
- created/updated files
