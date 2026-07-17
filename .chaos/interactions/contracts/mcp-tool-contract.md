---
chaosMetadata:
  schemaVersion: 1
  artifactType: runtime-contract
  artifactScope: repository
  changeId: null
  sourceCommand: iteration-0-design
  lastWrittenAt: "2026-07-06T17:30:00+02:00"
  lastWrittenBy: "chaos-iteration-0"
  lastAuditedAt: "2026-07-06T17:30:00+02:00"
  lastAuditedBy: "chaos-iteration-0"
  repositoryContext:
    provider: unknown
    branch: unknown
    reviewRequest: null
    contextSource: generated-artifact
    confidence: LOW
  metadata:
    identitySource: generated-artifact
    timestampSource: local-system
    confidence: MEDIUM
---

# MCP Tool Contract

## Principle

MCP tools expose the interaction runtime to agents. They must be deterministic, schema-validated, and non-blocking.

No MCP tool may wait indefinitely for a human decision.

## Tool list

### chaos_begin_command

Registers or resumes a command session.

Inputs:

- `sourceCommand`
- `changeId` optional for repository-level commands
- `adapter` (`claude`, `copilot`, `unknown`)
- `requestedMode` optional
- `commandArgs` optional

Outputs:

- `READY`
- `RESUME_AVAILABLE`
- `BLOCKED_BY_PENDING_DECISION`
- `CONFLICTING_COMMAND_ACTIVE`
- `RUNTIME_UNAVAILABLE`

### chaos_create_decision

Creates or reuses a material decision.

Inputs:

- `commandRunId`
- `changeId`
- `sourceCommand`
- decision payload

Outputs:

- `WAITING_FOR_USER_DECISION`
- `PENDING_DECISION_EXISTS`
- `INVALID_DECISION_PAYLOAD`

If successful, returns `mustStop: true`.

### chaos_get_active_decision

Returns active decision(s) for a workspace, `changeId`, or `commandRunId`.

### chaos_get_decision_response

Returns response state for a decision.

Outputs:

- `NO_RESPONSE_YET`
- `ANSWERED`
- `CANCELLED`
- `EXPIRED`
- `SUPERSEDED`

### chaos_create_resume_capsule

Creates or updates a resume capsule for a paused command session.

### chaos_complete_command

Marks command session completed and releases locks when safe.

### chaos_cancel_command

Cancels a command session and related pending decisions if confirmed.

### chaos_list_locks

Lists active/stale locks.

## Required response envelope

All tools should return:

```json
{
  "status": "READY",
  "mustStop": false,
  "commandRunId": "RUN-...",
  "changeId": "example-change",
  "message": "Human-readable summary.",
  "warnings": [],
  "errors": []
}
```

## Stop signalling

When `mustStop` is true, command contracts must stop.

No command should continue by interpreting the decision payload itself.

## Idempotency

`chaos_create_decision` must not create duplicates when an equivalent unresolved decision already exists.

It should return the existing `decisionId` and focus/open the existing Decision Center item.

## Error handling

Malformed inputs must produce structured errors. Runtime tools must not partially write state when validation fails.
