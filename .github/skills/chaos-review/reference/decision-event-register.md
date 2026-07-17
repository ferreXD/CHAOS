# Review Decision Event Register

Every material decision or remediation choice made during `chaos:review` must be recorded explicitly so `chaos:sync` can later promote, amend, or reconcile it into ADRs, decision logs, OpenSpec artefacts, rules, or accepted-risk registers.

## Required Decision Event format

```md
### REV-DEC-XXX — <short title>

Command: chaos:review
Change ID: <change-id>
Mode: <light|standard|strict>
Type: PROPOSAL_AMENDMENT | DESIGN_AMENDMENT | SPEC_AMENDMENT | TASK_AMENDMENT | EVIDENCE_WAIVER | RISK_ACCEPTANCE | APPROVAL_CONDITION | ARCHITECTURAL_DECISION_CANDIDATE | DEFERRED_DECISION
Status: ACCEPTED_DURING_REVIEW | DEFERRED | REJECTED | RESOLVED_DURING_REVIEW | PARTIALLY_RESOLVED | UNRESOLVED | NEEDS_SYNC | NEEDS_ADR | NEEDS_DECISION_LOG
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

Affected artefacts:
- <proposal.md/design.md/spec/tasks.md/etc.>

Review impact:
<how this changed findings/verdict/confidence>

Sync action:
- NONE
- AMEND_OPENSPEC_PROPOSAL
- AMEND_OPENSPEC_DESIGN
- AMEND_OPENSPEC_SPEC
- AMEND_OPENSPEC_TASKS
- CREATE_DECISION_LOG
- CREATE_ADR
- UPDATE_CHAOS_RULES
- RECORD_ACCEPTED_RISK

Follow-up owner:
<user/team/unknown>
```

## ID rules

Use stable IDs per review report:

- `REV-DEC-001`, `REV-DEC-002`, etc.
- Do not reuse IDs.
- If the same issue is amended multiple times, keep one decision event and add amendment notes.

## Required location

Review decision events live under the change folder (v0 layout), inside the review
report and/or the per-change decision-event register:

```text
.chaos/changes/<change-id>/proposal-review.md
.chaos/changes/<change-id>/decision-events.md
```

Legacy `.chaos/reviews/<change-id>-proposal-review.md` is read-only for compatibility.

`chaos:sync` will later scan them to recommend ADRs, decision logs, rule updates, OpenSpec amendments, or accepted-risk records.
