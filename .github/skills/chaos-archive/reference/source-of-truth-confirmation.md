# Source-of-Truth Confirmation Policy

After archive execution, `chaos:archive` must verify that OpenSpec state changed as expected.

## Confirmations

Check:

```text
active change removed or marked archived
archived change found in expected archive location/main OpenSpec archive listing
base specs updated when deltas existed
proposal/design/tasks preserved in archive
OpenSpec status/list reflects closure
CHAOS archive report written
```

## Confirmation outcomes

```text
CONFIRMED
PARTIALLY_CONFIRMED
UNCONFIRMED
FAILED
```

## Confidence impacts

```text
CONFIRMED             -> no confidence cap
PARTIALLY_CONFIRMED   -> max confidence MEDIUM
UNCONFIRMED           -> max confidence MEDIUM, verdict ARCHIVED_BUT_UNCONFIRMED
FAILED                -> verdict ARCHIVE_FAILED
```

## Strict mode

In `--strict`, source-of-truth update confirmation is required unless a governance override is explicitly recorded.

## Dry-run

In `--dry-run`, do not perform post-archive confirmation. Instead state:

```text
post_archive_confirmation: NOT_APPLICABLE_DRY_RUN
```
