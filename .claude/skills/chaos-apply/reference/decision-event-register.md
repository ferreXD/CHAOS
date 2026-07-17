# Decision Event Register

Every decision made by `chaos:apply` must be explicitly recorded.

This does not mean every decision is immediately an ADR. It means `chaos:sync` has enough structured material to later amend ADRs, decision logs, rules, OpenSpec specs, or accepted-risk registers.

## Decision Event fields

```md
### APP-DEC-XXX — <short title>

Command: chaos:apply
Change ID: <change-id>
Mode: <light|standard|strict>
Type: IMPLEMENTATION_DETAIL | SPEC_AMENDMENT | LOCAL_DESIGN_DECISION | ARCHITECTURAL_DECISION | OUT_OF_SCOPE_CHANGE | RISK_ACCEPTANCE | WAIVER
Status: ACCEPTED_DURING_APPLY | DEFERRED | REJECTED | NEEDS_SYNC | NEEDS_ADR | NEEDS_DECISION_LOG
Knowledge type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Evidence coverage: COMPLETE | PARTIAL | WEAK
Assumption load: LOW | MEDIUM | HIGH

Decision:
<what was decided>

Rationale:
<why>

Evidence:
- <source 1>
- <source 2>

Scope impact:
<what files/modules/contracts/tests are impacted>

Sync action:
- NONE
- AMEND_OPENSPEC_TASKS
- AMEND_OPENSPEC_SPEC
- CREATE_DECISION_LOG
- CREATE_ADR
- UPDATE_CHAOS_RULES
- RECORD_ACCEPTED_RISK

Follow-up owner:
<user/team/unknown>
```

## Auth/access-control removal evidence requirement

When a decision event removes, reverts, or disables code whose name or location matches
an auth/access-control naming pattern (attribute, handler, requirement, policy,
authorization behavior), the decision event's `Rationale`/`Scope impact` fields must
proactively state the non-weakening evidence — do not wait for an automated
safety/security classifier to flag it and only then investigate reactively:

- confirm and cite that the real enforcement mechanism (if a separate one exists) is
  untouched;
- confirm and cite that the removed mechanism has zero production callers, or state what
  replaces it;
- cite the explicit owner direction authorizing the removal.

Provenance: RETRO-ACTION-003 (implement-authorization-pipeline retro, 2026-07-06). SIG-03:
an automated safety classifier flagged "disables an access-control mechanism" twice within
one change's apply phase (APP-DEC-004 and its related pass-through revert), each requiring
a reactive investigation before proceeding. Stating the evidence proactively in the decision
event removes the reactive round-trip.

## ID format

Use stable IDs:

- `APP-DEC-001`, `APP-DEC-002`, etc. inside one apply report.
- Do not reuse IDs.

## Required indexing

Apply decision events live under the change folder (v0 layout):

```text
.chaos/changes/<change-id>/apply-report.md
.chaos/changes/<change-id>/decision-events.md
```

Legacy `.chaos/apply-reports/<change-id>-apply-report.md` is read-only for compatibility.

For future versions, `chaos:sync` may promote them into:

```text
.chaos/governance/pending-decisions.md
.chaos/decisions/*.md
docs/adr/*.md
openspec/changes/<change-id>/*
```
