# CHAOS Confidence and Knowledge Classification Model

## Confidence and knowledge classification doctrine

Every CHAOS command that emits a judgement, recommendation, approval, verification, gate result, or review finding must separate **what is known** from **what is inferred**.

### Knowledge type labels

Every material finding must be labelled as exactly one of:

- `FACT` — directly supported by inspected source evidence, tool output, or explicit user confirmation.
- `INFERENCE` — reasoned from available evidence, but not directly proven.
- `ASSUMPTION` — accepted temporarily because evidence is incomplete.
- `UNKNOWN` — material information is missing or could not be inspected.
- `CONFLICT` — two or more sources disagree or imply incompatible positions.

### Confidence levels

Every material finding and every final verdict must include a confidence level:

- `HIGH` — direct evidence was inspected, validation ran or was evidenced, and no major unresolved assumptions remain.
- `MEDIUM` — evidence exists but validation is partial, or the conclusion depends on bounded assumptions.
- `LOW` — key evidence is missing, validation did not run, source conflicts exist, or the conclusion is mostly inferred.

### Verdict metadata

No CHAOS command may emit a bare verdict. Final verdicts must include:

- `verdict` — the command-specific judgement.
- `confidence` — `HIGH`, `MEDIUM`, or `LOW`.
- `evidence_coverage` — `COMPLETE`, `PARTIAL`, or `WEAK`.
- `assumption_load` — `LOW`, `MEDIUM`, or `HIGH`.

### Hard rules

- No confidence-less verdicts.
- No unlabeled assumptions.
- No inference disguised as fact.
- No silent resolution of conflicts.
- Missing evidence must reduce confidence or block the relevant gate.
- Low-confidence positive verdicts must be treated as conditional, not as clean approval.
