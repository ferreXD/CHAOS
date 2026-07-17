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
