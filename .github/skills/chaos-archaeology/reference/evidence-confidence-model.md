# Evidence and Confidence Model

Every material archaeology finding must declare both knowledge type and confidence.

## Knowledge type

- `FACT`: directly supported by inspected evidence.
- `INFERENCE`: reasoned from evidence but not directly proven.
- `ASSUMPTION`: accepted temporarily without enough evidence.
- `UNKNOWN`: not known from available evidence.
- `CONFLICT`: sources disagree or evidence is inconsistent.

## Confidence

- `HIGH`: directly evidenced, cross-checked, no material gaps.
- `MEDIUM`: evidenced but not fully proven, bounded assumptions remain.
- `LOW`: weak/partial evidence, important missing sources, or high uncertainty.

## Confidence caps

Apply caps when evidence is missing:

- no tests for behavioural preservation → max `MEDIUM`;
- side-effect absence inferred from search only → max `MEDIUM`;
- config/paths inferred in strict mode → max `MEDIUM`;
- conflicting evidence unresolved → max `LOW` or `CONFLICTING_EVIDENCE`;
- source files unavailable → max `LOW`.

## Rule

No confidence-less findings. No unlabeled assumptions. No inference disguised as fact.
