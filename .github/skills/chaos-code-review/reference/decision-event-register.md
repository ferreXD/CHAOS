# Decision Event Register — chaos:code-review (`CR-DEC-*`)

`chaos:code-review` records every material runtime decision as a `CR-DEC-*` Decision Event
so the review is auditable and syncable. Do not bury decisions in prose.

Material decisions include: missing-authority handling, remediation routing, accepted risk,
mode downgrade, and scope confirmation.

## ID scheme

```text
CR-DEC-001
CR-DEC-002
...
```

`chaos:sync` collects `CR-DEC-*` alongside `PROP-DEC-*`, `REV-DEC-*`, `APP-DEC-*`,
`VFY-DEC-*`, and `ARC-DEC-*`.

## Event shape

```md
### CR-DEC-001 — <short title>

Command: chaos:code-review
Change ID / Scope: <change-id | pr#N | since:<ref> | scope:<path>>
Mode: <light|standard|strict>
Type: REMEDIATION_ROUTING | RISK_ACCEPTANCE | MISSING_AUTHORITY | MODE_DOWNGRADE | SCOPE_CONFIRMATION | ARCHITECTURAL_DECISION_CANDIDATE | DEFERRED_DECISION
Status: ACCEPTED | DEFERRED | REJECTED | NEEDS_SYNC | NEEDS_ADR | NEEDS_DECISION_LOG | NEEDS_REMEDIATION
Knowledge type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Evidence coverage: COMPLETE | PARTIAL | WEAK
Assumption load: LOW | MEDIUM | HIGH

Decision:
...

Rationale:
...

Evidence:
- <file:line, AGENTS.md rule, skill, or repository evidence>

Review impact:
...

Sync action:
- NONE | ROUTE_TO_APPLY_REMEDIATION | CREATE_DECISION_LOG | CREATE_ADR | UPDATE_CHAOS_RULES | RECORD_ACCEPTED_RISK | REGISTER_COMMAND_IN_INDEX
```

## Where events are written

- Change-scoped review: append to `.chaos/changes/<change-id>/decision-events.md` (with
  confirmation) and link from `lifecycle.md`; also summarize in the code-review report.
- Non-change-scoped review: record the events inside the code-review report under
  `.chaos/code-reviews/`.

## Doctrine

- A recommendation is not a decision; record only what the user actually chose.
- Decisions that should become durable governance use `NEEDS_*` sync actions routed to
  `chaos:sync`; this command never edits shared governance indexes itself.
- Recommended ADR/decision-log/rule drafts use date-prefixed, slug-based filenames.
