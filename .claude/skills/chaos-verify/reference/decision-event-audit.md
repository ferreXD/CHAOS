# Decision Event Audit

`chaos:verify` must audit decision events from:

```text
chaos:propose -> PROP-DEC-*
chaos:review  -> REV-DEC-*
chaos:apply   -> APP-DEC-*
chaos:verify  -> VFY-DEC-* when needed
```

## Required decision event fields

```text
id
command
change_id
type
status
decision
rationale
evidence
confidence
scope_impact
requires_adr
requires_decision_log
requires_openspec_update
requires_rule_update
sync_action
```

## Audit checks

Check:

- every material decision has an ID;
- every decision has status and rationale;
- confidence is present;
- sync action is present;
- ADR/decision-log requirement is classified;
- OpenSpec update requirement is classified;
- material implementation drift has a decision event;
- new tables/migrations/external calls/API contracts have explicit decision events.

## Missing decision examples

- new EF migration added but no decision event;
- new external HTTP call added but no decision event;
- task changed during apply but no decision event;
- accepted risk recorded without rationale;
- sync action missing.

## Verification-time decision events

If a decision was made during apply but not recorded, `chaos:verify` may ask the user to create a `VFY-DEC-*` event.

This does not replace the original missing decision, but creates a syncable correction.

Example:

```md
### VFY-DEC-001 — Record untracked persistence decision

Command: chaos:verify
Change ID: customer-inventory-snapshot
Type: DECISION_EVENT_RECONSTRUCTION
Status: ACCEPTED_DURING_VERIFY
Confidence: MEDIUM

Decision:
A new EF migration/table was added during implementation and must be treated as a persistence decision related to this OpenSpec change.

Rationale:
The migration exists in the diff, but no APP-DEC event recorded it.

Sync action:
`chaos:sync` must decide whether this becomes a decision-log entry or an OpenSpec amendment only.
```
