# Evidence and Confidence Model

## Knowledge types

Every finding, claim, and final verdict must label knowledge type.

```text
FACT       Directly observed in files, commands, outputs, or user answers.
INFERENCE  Reasonable conclusion from evidence, but not directly proven.
ASSUMPTION Required belief not proven by available evidence.
UNKNOWN    Material information is missing.
CONFLICT   Sources disagree or evidence contradicts itself.
```

## Confidence levels

```text
HIGH
MEDIUM
LOW
```

Confidence must be evidence-backed.

Bad:

```text
Confidence: HIGH because the implementation looks good.
```

Good:

```text
Confidence: HIGH because OpenSpec validation passed, build passed, relevant tests passed, changed files were inspected, and no conflicting ADR/rule was found.
```

## Final metadata

The final verdict must include:

```text
confidence: HIGH | MEDIUM | LOW
evidence_coverage: COMPLETE | PARTIAL | WEAK
assumption_load: LOW | MEDIUM | HIGH
validation_evidence: COMPLETE | PARTIAL | MISSING
scope_drift_risk: LOW | MEDIUM | HIGH
archive_readiness: READY | READY_WITH_DEBT | NOT_READY
```

## Confidence caps

Apply these caps unless stronger direct evidence exists.

| Condition | Maximum confidence |
|---|---|
| OpenSpec validation not run | MEDIUM |
| Build not run for code change | MEDIUM |
| Tests skipped for behaviour change | MEDIUM or LOW |
| Git diff unavailable | MEDIUM |
| C# specialist unavailable for complex .NET change | MEDIUM |
| Missing apply report in standard mode | MEDIUM |
| Missing apply report in strict mode | LOW / BLOCKED |
| Unrecorded material decision | MEDIUM or BLOCKED depending mode |
| Conflicting ADR evidence | LOW / BLOCKED |

## Assumption load

```text
LOW     Assumptions are minor and do not affect correctness materially.
MEDIUM  Assumptions affect validation depth but are bounded.
HIGH    Assumptions affect core behaviour, safety, scope, or archive readiness.
```
