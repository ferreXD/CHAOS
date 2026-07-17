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

# State Machine Contract

## Command session states

| State | Meaning |
|---|---|
| `created` | Session has been registered but has not started material work. |
| `running` | Command is actively executing. |
| `waiting-for-decision` | Command is blocked on one or more unanswered decisions. |
| `ready-to-resume` | Blocking decisions are answered and a valid resume capsule exists. |
| `resumed` | Command has consumed a response/capsule and continued after a pause. |
| `completed` | Command completed normally. |
| `cancelled` | User or runtime cancelled the session. |
| `expired` | Session exceeded expiry policy. |
| `failed` | Command/runtime failed in a non-success state. |

Allowed transitions:

```text
created -> running
running -> waiting-for-decision
waiting-for-decision -> ready-to-resume
ready-to-resume -> resumed
resumed -> running
running -> completed
running -> failed
waiting-for-decision -> cancelled
waiting-for-decision -> expired
ready-to-resume -> expired
any non-terminal -> failed
```

Terminal states:

- `completed`
- `cancelled`
- `expired`
- `failed`

## Decision states

| State | Meaning |
|---|---|
| `created` | Decision artifact exists but is not yet active. |
| `waiting` | Decision requires user input. |
| `answered` | User selected a valid option. |
| `consumed` | Command consumed the response and recorded it into the workflow. |
| `cancelled` | Decision was cancelled. |
| `expired` | Decision exceeded expiry. |
| `superseded` | Decision was replaced by a newer decision. |

Allowed transitions:

```text
created -> waiting
waiting -> answered
answered -> consumed
waiting -> cancelled
waiting -> expired
waiting -> superseded
answered -> superseded
```

Terminal states:

- `consumed`
- `cancelled`
- `expired`
- `superseded`

## Blocking rules

A session in `waiting-for-decision` blocks incompatible commands for the same `changeId`.

A session in `ready-to-resume` still holds the lock until resumed and completed/cancelled, unless policy allows manual lock release.

## Staleness

Runtime implementations should track `expiresAt` for sessions and decisions.

Expiration should not delete data. It should transition state to `expired`, write audit events, and let `chaos:doctor`/`chaos:status` surface cleanup options.

## Recovery

Malformed state must fail safe:

- do not continue command execution.
- preserve malformed file for inspection.
- write or report a runtime diagnostic if possible.
- ask for user intervention or run `chaos:doctor`.
