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

# Session Locking Policy

## Purpose

Locks prevent a pending material decision from being bypassed by a later command over the same `changeId`.

## Lock scope

Locks are scoped to `changeId`, not the entire repository.

This allows unrelated CHAOS work to continue while one change is waiting for user input.

## Lock file

The aggregate lock file is:

```text
.chaos/interactions/locks.json
```

Each lock records:

- `lockId`
- `changeId`
- `lockedByCommandRunId`
- `lockedByCommand`
- `reason`
- `blockingDecisionIds`
- `compatibleCommands`
- `createdAt`
- `expiresAt`
- `state`

## Default blocked commands

The following commands are blocked by default when a lock exists for the same `changeId`:

- `chaos:apply`
- `chaos:verify`
- `chaos:archive`
- `chaos:sync --change`
- `chaos:review` when it would advance the same lifecycle boundary
- any command that writes to `.chaos/changes/<change-id>/` as a lifecycle owner

## Default compatible commands

The following commands are compatible by default:

- `chaos:status`
- `chaos:doctor`
- `chaos:help`
- `chaos:todo --dry-run`
- `chaos:resume` for the locked session
- reopening/focusing the existing decision
- commands for a different `changeId`

## Same command re-entry

If the user invokes the same command again for the same `changeId` while a decision is pending, the runtime should not create a duplicate decision.

It should return:

```json
{
  "status": "BLOCKED_BY_PENDING_DECISION",
  "mustStop": true,
  "uiAction": "focus-existing-decision",
  "decisionId": "DEC-..."
}
```

## Lock release

Locks are released when:

- the command completes.
- the command is cancelled.
- the session expires and user confirms cleanup.
- an administrator/maintainer explicitly releases a stale lock.

Locks must not be silently released merely because a decision was answered. A ready-to-resume session may still need to consume the answer and finish.

## Conflict handling

When a conflicting command starts, the runtime must return a deterministic blocking response and include:

- conflicting `commandRunId`
- active `decisionId`
- `changeId`
- recommended next action

## Safety rule

When lock state is uncertain, block and ask. Do not assume it is safe to continue.
