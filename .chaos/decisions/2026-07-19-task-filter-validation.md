# Decision — Invalid query-param filter values return 400

Status: Accepted
Date: 2026-07-19
Source: PROP-DEC-001
Related change: add-task-query-filters

## Decision

List endpoints reject an unrecognized filter value with `400 Bad Request` (rather than ignoring
the filter or returning an empty list). "Unrecognized" includes both unknown names (e.g.
`?status=banana`) and numeric-out-of-range values (e.g. `?status=99`); filter values are parsed
case-insensitively.

## Rationale

Fail fast on bad input: a typo'd filter should be a visible client error, not silently ignored
(which can return unexpectedly broad results) and not an empty list (which is indistinguishable
from a valid filter that legitimately matches nothing). Human decision made in the Decision Center
during `chaos:propose`: "If passed status doesn't exist in the enum or array of values, the most
safe approach here is returning a 400."

## Scope

`GET /tasks` today (`status`/`priority` filters); the convention applies to future list-endpoint
filters across the Task Tracker API.

## Consequences

New list filters must validate their inputs and return `400` on any unrecognized value (name or
out-of-range), parsing case-insensitively. Implementations should guard enum parsing with
`Enum.IsDefined` (or equivalent) so numeric input cannot bypass validation.

## Provenance trail

- PROP-DEC-001 (propose) — established the 400 contract.
- REV-DEC-001 (review) — added the invalid-priority test + scenario.
- APP-DEC-001 (apply) — case-insensitive enum parse (spec-mandated).
- APP-DEC-002 (apply) — `Enum.IsDefined` guard so numeric-out-of-range values also return 400.
- ARC-DEC-001 (archive) — routed this convention to sync for promotion.
- Runtime decision: DEC-2026-07-19-add-task-query-filters-how-should-get-tasks-han-b492 (answered
  by vscode-user in the Decision Center).

## Sync metadata

Requires ADR: No (single-surface convention; revisit if the pattern recurs across subsystems)
Requires rule update: No
Requires gate update: No
Created by: chaos:sync (--change add-task-query-filters)
Promotion source: PROP-DEC-001
Index follow-up: assign a display ID in `.chaos/decisions/index.md` at maintainer-level sync.
