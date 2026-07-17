# Evidence and Confidence Model

`chaos:propose` must use evidence-backed confidence. Confidence is not self-belief.

## Knowledge type

Every meaningful statement in findings, assumptions, and recommendations must be classified as one of:

- `FACT`: directly supported by inspected source material.
- `INFERENCE`: reasoned from facts, but not directly stated.
- `ASSUMPTION`: accepted temporarily without direct evidence.
- `UNKNOWN`: required information is unavailable.
- `CONFLICT`: sources disagree or user input contradicts documented material.

## Confidence

Use:

- `HIGH`: source evidence is direct, current, and sufficient.
- `MEDIUM`: evidence exists but is partial, indirect, or missing validation.
- `LOW`: evidence is weak, inferred, missing, or conflicting.

## Evidence coverage

- `COMPLETE`: all evidence required for the current mode/change type is available.
- `PARTIAL`: enough evidence exists to propose, but important validation is missing.
- `WEAK`: proposal would rely on large assumptions or missing sources.

## Assumption load

- `LOW`: few assumptions, none material.
- `MEDIUM`: assumptions exist but are bounded and called out.
- `HIGH`: major decisions rely on assumptions.

## Required proposal-level confidence block

Every proposal report must include:

```md
## Confidence Summary

Overall confidence: HIGH | MEDIUM | LOW
Evidence coverage: COMPLETE | PARTIAL | WEAK
Assumption load: LOW | MEDIUM | HIGH

High-confidence areas:
- ...

Medium-confidence areas:
- ...

Low-confidence areas:
- ...

Confidence limiters:
- ...
```

## Finding format

```md
### Finding PRP-001 — <title>

Type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Severity: BLOCKING | MAJOR | MINOR | ADVISORY
Source: <file/path or user answer>

Finding:
...

Impact:
...

Required action:
...
```
