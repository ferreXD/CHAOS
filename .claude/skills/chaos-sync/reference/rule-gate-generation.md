# Rule and Gate Generation

`chaos:sync` may create or update rules and gates when decisions imply repeatable constraints or lifecycle checks.

## When to create a rule

Create or propose a rule when a decision implies a durable behavioural constraint.

Examples:

- External side effects require outbox dispatch.
- API replayable commands require operation id.
- Command handlers must not leak `IQueryable`.
- Runtime telemetry must include correlation id.

## When to create a gate

Create or propose a gate when a decision implies a repeatable lifecycle check.

Examples:

- Before `chaos:apply`, external side-effect changes must declare retry/idempotency strategy.
- Before `chaos:archive`, material decision events must be classified.
- Before `chaos:verify`, behavioral changes must have test evidence or waivers.

## Quality rules

Reject or mark as `DRAFT_WEAK` any rule/gate that is vague.

Bad:

```text
Use good observability.
```

Good:

```text
RULE-OBS-001: New command handlers that emit external side effects must include operation/correlation metadata and observable outbox dispatch status.
Source: ADR-0006, ADR-0010.
Severity: MAJOR.
Enforced by: chaos:review, chaos:verify.
```

## Filenames and index display IDs

Create rule/gate files with **date-prefixed, slug-based** physical filenames:

```text
.chaos/rules/YYYY-MM-DD-<slug>.md
.chaos/gates/YYYY-MM-DD-<slug>.md
```

Assign sequential display IDs (`R-NNN`, `G-NN`) only inside the indexes. Do not use a
sequential ID as the primary physical filename. Under `--all`, reconcile duplicate
sequential IDs one by one (see `change-scope-and-roles.md`).

## Index updates

When a rule/gate is created or updated, update:

```text
.chaos/rules/index.md
.chaos/gates/index.md
```

If the workspace currently uses only central indexes, insert lightweight definitions there. If it uses separate files, create them and update the index.

## Config paths for rules and gates

Create or update rules and gates under the configured paths from `.chaos/config.yaml` when present. Always update the configured rule/gate indexes. If configured paths are missing, use `.chaos/rules` and `.chaos/gates` as inferred defaults and record `CONFIG_PARTIAL`.
