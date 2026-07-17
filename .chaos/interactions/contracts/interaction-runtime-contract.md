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

# Interaction Runtime Contract

## Core rule

The interaction runtime owns material decision state. The chat thread does not.

A CHAOS command that requires a material human decision must create or reuse a runtime interaction and stop when the runtime reports `mustStop: true`.

## Responsibilities

The runtime is responsible for:

- command session registration.
- material decision creation.
- response validation.
- same-change lock management.
- resume capsule creation.
- audit event recording.
- stale/expired interaction detection.

Commands are responsible for:

- calling the runtime at command start when available.
- creating decisions through the runtime at material decision boundaries.
- stopping after a pending decision is created.
- resuming from validated responses and resume capsules.
- recording consumed decisions into normal CHAOS artifacts such as `decision-events.md` when command execution resumes.

## Required command preflight

Every runtime-aware CHAOS command should start with `chaos_begin_command` or equivalent.

The runtime may return:

| Status | Command behaviour |
|---|---|
| `READY` | Continue normally. |
| `RESUME_AVAILABLE` | Offer to resume the previous session. |
| `BLOCKED_BY_PENDING_DECISION` | Stop and focus/reopen the Decision Center. |
| `CONFLICTING_COMMAND_ACTIVE` | Stop or ask whether to inspect/cancel the conflicting session. |
| `RUNTIME_UNAVAILABLE` | Use configured fallback policy. |

## Required decision boundary

When a material decision is needed, the command must call `chaos_create_decision` or equivalent.

The runtime returns:

```json
{
  "status": "WAITING_FOR_USER_DECISION",
  "mustStop": true,
  "decisionId": "DEC-...",
  "commandRunId": "RUN-..."
}
```

The command must stop.

## Write boundaries

The runtime may write:

```text
.chaos/interactions/**
```

Runtime implementations must not write production source, tests, ADRs, OpenSpec artifacts, rules, gates, or application files.

CHAOS commands may still write their normal approved artifacts, but runtime tools must not.

## Idempotency

Repeated creation attempts for the same unresolved material decision should return the existing decision when the decision purpose, `changeId`, `commandRunId`, and source command match.

The runtime must avoid duplicate decision spam.

## Auditability

Every state transition must write an audit event.

Minimum audit events:

- session created
- command started
- decision created
- decision answered
- decision cancelled
- decision expired
- response consumed
- capsule created
- lock acquired
- lock released
- command completed
- command failed

## Fallback

If the runtime is unavailable, commands may use the existing prompt-based decision protocol only when policy allows it.

Strict workflows may require interaction runtime availability in future iterations.
