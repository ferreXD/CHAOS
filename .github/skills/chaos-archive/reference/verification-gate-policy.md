# Verification Gate Policy for chaos:archive

`chaos:archive` must inspect the latest verification report before closing a change.

## Acceptable verification verdicts

Archive can normally proceed from:

```text
VERIFIED
VERIFIED_WITH_CONDITIONS
```

`VERIFIED_WITH_CONDITIONS` requires debt/condition routing.

## Conditional verdicts

These may proceed only with explicit waiver/debt routing depending on mode:

```text
NOT_ARCHIVE_READY
INSUFFICIENT_EVIDENCE
```

## Blocking verdicts

These block by default:

```text
BLOCKED
VALIDATION_FAILED
SPEC_DRIFT_DETECTED
IMPLEMENTATION_DRIFT_DETECTED
```

## Force override

A blocking verification verdict can only be overridden with `--force-waiver` and explicit user confirmation.

A governance override must produce:

```text
ARCHIVED_UNDER_GOVERNANCE_OVERRIDE
```

or at best:

```text
ARCHIVED_WITH_DEBT
```

Never produce clean `ARCHIVED` when a blocking verification verdict was overridden.

## Verification report missing

Mode behavior:

```text
--light     prompt to continue with low confidence or stop
--standard  ask user whether to continue, run verify, or record waiver
--strict    block
```

## Archive readiness check

The command must extract from verification:

```text
final verdict
confidence
evidence coverage
assumption load
validation evidence
scope drift risk
archive readiness
open blockers
open conditions
waivers
accepted risks
decision events
```
