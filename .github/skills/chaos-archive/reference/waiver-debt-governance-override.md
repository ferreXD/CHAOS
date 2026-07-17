# Waiver, Debt, and Governance Override Policy

`chaos:archive` must distinguish normal debt from governance override.

## Archive with debt

Use when known non-blocking debt is accepted and routed.

Verdict:

```text
ARCHIVED_WITH_DEBT
```

Requires:

```text
debt item
reason
impact
confidence impact
sync route and/or retro route
follow-up recommendation if needed
```

## Governance override

Use when a normally blocking issue is overridden.

Verdict:

```text
ARCHIVED_UNDER_GOVERNANCE_OVERRIDE
```

Requires high-friction confirmation:

```text
override id
blocking issue overridden
reason
accepted risk
confidence downgrade
debt classification
sync action
retro action
explicit user confirmation
```

## Force waiver

`--force-waiver` enables governance override prompts but does not bypass them.

`--force-waiver` cannot produce clean `ARCHIVED`.

## Waiver ledger

Each waiver must include:

```text
id
source command
source report
waived condition
reason
accepted by
impact
confidence impact
archive impact
follow-up route
sync action
retro action
```

## Debt load

Classify debt load:

```text
LOW     minor non-blocking follow-up; no behavioural risk
MEDIUM  meaningful validation/governance debt; manageable with follow-up
HIGH    significant unresolved risk; archive only with explicit override
```

## Confidence impact

Suggested caps:

```text
validation waiver present              -> max MEDIUM
blocking issue overridden              -> max LOW or MEDIUM depending evidence
source-of-truth confirmation missing   -> max MEDIUM
decision events unclassified           -> max MEDIUM, strict blocks
critical tests skipped                 -> max MEDIUM or LOW
```
