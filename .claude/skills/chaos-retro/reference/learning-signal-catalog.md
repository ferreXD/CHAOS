# Learning Signal Catalog

Learning signals are evidence-backed events that may indicate an opportunity to improve CHAOS.

## Signal categories

```text
SPEC_QUALITY_SIGNAL
REVIEW_QUALITY_SIGNAL
APPLY_EXECUTION_SIGNAL
VERIFY_VALIDATION_SIGNAL
ARCHIVE_CLOSURE_SIGNAL
SYNC_GOVERNANCE_SIGNAL
RULE_GAP_SIGNAL
GATE_GAP_SIGNAL
AGENT_BEHAVIOUR_SIGNAL
ESTIMATION_SIGNAL
DEVEX_SIGNAL
HUMAN_FRICTION_SIGNAL
```

## Examples

### SPEC_QUALITY_SIGNAL

- Proposal missed persistence implications.
- Acceptance criteria were not testable.
- OpenSpec tasks were too vague.

### REVIEW_QUALITY_SIGNAL

- Review found many issues that propose could have asked about.
- Review missed a missing validation task.

### APPLY_EXECUTION_SIGNAL

- Apply required multiple runtime decisions.
- C# specialist needed scope correction.
- Implementation drift occurred.

### VERIFY_VALIDATION_SIGNAL

- Tests were skipped.
- Confidence was capped due to missing build/test evidence.
- Spec-to-implementation traceability was partial.

### ARCHIVE_CLOSURE_SIGNAL

- Archived with debt.
- Governance override used.
- Closure depended on unclassified waivers.

### SYNC_GOVERNANCE_SIGNAL

- Decision events required promotion.
- Rules/gates were stale or missing.

## Required fields per signal

```text
Signal ID
Category
Source
Finding
Knowledge type
Confidence
Impact
Recommended improvement
Overfitting classification
```
