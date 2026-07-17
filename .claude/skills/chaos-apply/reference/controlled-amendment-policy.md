# Controlled Amendment Policy

During implementation, `chaos:apply` may discover that the approved change needs an additional concrete change such as a table, migration, DTO, test fixture, contract update, or configuration entry.

Do not automatically reject these discoveries. Classify them and ask the user how to proceed.

## Amendment classes

### IMPLEMENTATION_DETAIL

The proposal already implies the need and the implementation detail is local.

Examples:

- Add a private helper.
- Add a validator class.
- Add an EF migration for already-approved persistence.
- Add a test fixture for approved behaviour.

Allowed in light/standard after recording. In strict, require explicit confirmation and preferably OpenSpec task amendment.

### SPEC_AMENDMENT

The change affects the OpenSpec scope or tasks, but does not create a new architectural posture.

Examples:

- Add a missing API response field required by acceptance criteria.
- Add a migration not listed in `tasks.md`.
- Add a missing idempotency test task.

Ask whether to amend OpenSpec now, add directly and mark for sync, defer, or stop.

### LOCAL_DESIGN_DECISION

A bounded design choice is needed inside the current architecture.

Examples:

- New table name.
- Folder/class naming.
- Whether to use existing validator pattern or create a child validator.

Prompt one-by-one and record as decision event.

### ARCHITECTURAL_DECISION

The implementation requires a new or changed architecture posture.

Examples:

- New integration pattern.
- New persistence abstraction.
- New auth model.
- Change module ownership.
- Replace selected library strategy.

In strict mode, block. In light/standard, only continue if the user explicitly accepts risk and marks sync action as ADR/decision-log required.

### OUT_OF_SCOPE_CHANGE

The need is unrelated to the approved OpenSpec change.

Stop or defer.

### RISK_ACCEPTANCE

The user decides to proceed despite a known gap.

Must include rationale, scope, owner, confidence impact, and sync action.

## Required prompt

```text
Implementation discovered a required change not explicitly captured in the OpenSpec tasks.

Discovered change: <description>
Classification: <class>
Recommended action: <action>
Confidence: <high|medium|low>

Options:
1. Add directly and record decision event
2. Amend OpenSpec tasks/spec first, then continue
3. Defer and limit implementation scope
4. Accept risk and continue
5. Stop
6. Provide custom instruction
```

## Sync requirement

Every controlled amendment must create a Decision Event with `sync_action`.
