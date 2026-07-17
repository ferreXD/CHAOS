# Archive Readiness

`chaos:verify` must explicitly state whether the change is ready for `chaos:archive`.

## Statuses

```text
READY
READY_WITH_DEBT
NOT_READY
```

## READY

Use only when:

- OpenSpec validation passed;
- implementation aligns with spec;
- tasks are complete or explicitly deferred;
- validation evidence is sufficient for mode/risk;
- no blocking findings remain;
- material decisions are recorded and syncable.

## READY_WITH_DEBT

Use when:

- implementation is likely acceptable;
- non-blocking debt/waivers exist;
- confidence is not HIGH;
- archive may proceed only as `ARCHIVED_WITH_DEBT`.

## NOT_READY

Use when:

- validation failed;
- key requirements are missing;
- material drift is unrecorded;
- direct blockers remain;
- confidence is too low for the selected mode.

## Archive readiness checklist

Include:

```text
OpenSpec validation
Build
Tests
Task completion
Scope drift
Decision event syncability
Remaining blockers
Remaining waivers
Recommended next command
```
