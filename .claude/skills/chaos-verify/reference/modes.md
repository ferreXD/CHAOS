# Mode Reference

## Invocation

```text
chaos:verify <change-id> --light
chaos:verify <change-id> --standard
chaos:verify <change-id> --strict
chaos:verify <change-id> --dry-run
chaos:verify <change-id> --continue
```

## Mode inference

If no mode is provided, infer the mode and ask for confirmation.

### Infer `--light` for

- documentation-only changes;
- test-only changes;
- small internal cleanup;
- no behaviour change;
- no data/persistence/API/security effect.

### Infer `--standard` for

- normal feature work;
- bounded API/application changes;
- normal persistence/application logic;
- limited module-local changes.

### Infer `--strict` for

- brownfield migration;
- auth/security;
- external side effects;
- data persistence;
- new tables/migrations;
- API contract change;
- offline/replay/idempotency;
- cross-module changes;
- production-critical behaviour.

## Behaviour by mode

### Light

- apply report recommended, not always required;
- review report recommended, not always required;
- only high-impact issues prompt remediation;
- accepted risk allowed for non-critical gaps;
- confidence caps must still be applied.

### Standard

- OpenSpec change required;
- review/apply evidence required or user must decide continuation;
- task traceability required;
- direct blockers block;
- skipped validation requires rationale;
- fixable governance gaps should be prompted one by one.

### Strict

- review report required;
- apply report required;
- OpenSpec validation required;
- no unresolved blocking/major findings;
- material decision events required;
- validation attempt or explicit hard waiver required;
- unrecorded scope drift blocks;
- tests missing for behavioural change blocks unless user explicitly downgrades mode.

## Dry run

`--dry-run` performs inspection and produces a report draft but does not run validation commands and does not amend any files.

## Continue

`--continue` reads the previous verification report and classifies prior issues as:

```text
RESOLVED
STILL_OPEN
NEWLY_INTRODUCED
NO_LONGER_RELEVANT
```
