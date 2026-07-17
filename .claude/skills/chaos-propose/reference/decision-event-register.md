# Proposal Decision Event Register

Every material decision made during `chaos:propose` must be recorded explicitly so `chaos:sync` can later promote, amend, or reconcile it into ADRs, decision logs, OpenSpec artefacts, rules, or accepted-risk registers.

This does not mean every decision becomes an ADR immediately. It means no meaningful decision is lost inside chat context.

## Required Decision Event format

```md
### PROP-DEC-XXX — <short title>

Command: chaos:propose
Change ID: <change-id>
Mode: <light|standard|strict>
Type: SCOPE_DECISION | SPEC_AMENDMENT | DESIGN_DECISION | TASK_AMENDMENT | EVIDENCE_WAIVER | RISK_ACCEPTANCE | ARCHITECTURAL_DECISION_CANDIDATE | DEFERRED_DECISION
Status: ACCEPTED_DURING_PROPOSAL | DEFERRED | REJECTED | NEEDS_SYNC | NEEDS_ADR | NEEDS_DECISION_LOG | NEEDS_OPENSPEC_AMENDMENT
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

Impact on proposal:
<proposal/design/spec/task impact>

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

Use stable IDs per proposal report:

- `PROP-DEC-001`, `PROP-DEC-002`, etc.
- Do not reuse IDs.
- If a decision is amended during the same command run, update the same event and add an amendment note.

## Required locations

Proposal decision events live under the change folder (v0 layout):

```text
.chaos/changes/<change-id>/decision-events.md
.chaos/changes/<change-id>/proposal-report.md
```

Legacy `.chaos/proposals/<change-id>-chaos-propose-report.md` is read-only for compatibility.

They may also be copied into OpenSpec `proposal.md`, `design.md`, or `tasks.md` when relevant, but the CHAOS report is the audit source for `chaos:sync`.

## Sync semantics

`chaos:sync` should later scan Proposal Decision Events and determine whether to:

- update OpenSpec artefacts;
- create a decision-log entry;
- create or amend an ADR;
- update CHAOS rules/gates;
- record accepted risk;
- close the event as already reflected.
