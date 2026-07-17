# Lightweight Templates

## Physical filenames vs index display IDs

Generated governance artifacts use **date-prefixed, slug-based** physical filenames.
Sequential IDs (`ADR-XXXX`, `R-NNN`, `G-NN`) are **display-only** identifiers assigned
inside indexes, never the primary physical filename. See `change-scope-and-roles.md`.

```text
docs/adr/YYYY-MM-DD-<slug>.md            -> indexed as ADR-XXXX in .chaos/decisions/index.md
docs/decision-log/YYYY-MM-DD-<slug>.md   -> indexed as DEC-YYYY-MM-DD-<slug> or display id
.chaos/rules/YYYY-MM-DD-<slug>.md        -> indexed as R-NNN in .chaos/rules/index.md
.chaos/gates/YYYY-MM-DD-<slug>.md        -> indexed as G-NN in .chaos/gates/index.md
```

When filling the templates below, keep the heading's sequential ID for the **index
entry/display**, but save the file under its date-prefixed slug name.

## Lightweight Decision Log

```md
# Decision — <Title>

Status: Accepted
Date: YYYY-MM-DD
Source: <PROP-DEC/REV-DEC/APP-DEC/VFY-DEC/ARC-DEC>
Related change: <change-id>

## Decision

<What was decided.>

## Rationale

<Why this was chosen.>

## Scope

<Where this applies.>

## Consequences

<Expected impact, debt, or follow-up.>

## Sync metadata

Requires ADR: <Yes/No>
Requires rule update: <Yes/No>
Requires gate update: <Yes/No>
Created by: chaos:sync
```

## Lightweight ADR

```md
# ADR-XXXX — <Title>

Status: Proposed
Date: YYYY-MM-DD

## Context

<Why this decision exists.>

## Decision

<What we will do.>

## Consequences

<Trade-offs and impact.>

## Related sources

- <Decision event>
- <OpenSpec change>
- <Existing ADR/rule>

## Sync metadata

Created by: chaos:sync
Promotion source: <decision-id>
```

## Rule

```md
# RULE-<AREA>-<NNN> — <Title>

Status: Active | Draft
Severity: BLOCKING | MAJOR | MINOR | ADVISORY
Source: <ADR/decision/report>
Applies to: <commands/phases/modules>
Enforced by: <chaos command/gate>

## Rule

<Operational rule.>

## Rationale

<Why it exists.>

## Verification

<How commands/gates detect it.>

## Provenance

Created by: chaos:sync
Source decision: <id>
Related change: <change-id>
```

## Gate

```md
# GATE-<AREA>-<NNN> — <Title>

Status: Active | Draft
Severity: BLOCKING | MAJOR | MINOR | ADVISORY
Source: <ADR/decision/report>
Applies before: <chaos command/phase>

## Gate

<What must be true before proceeding.>

## Pass criteria

- <criterion>

## Block criteria

- <criterion>

## Provenance

Created by: chaos:sync
Source decision: <id>
Related change: <change-id>
```
