---
chaosMetadata:
  schemaVersion: 1
  artifactType: runtime-contract
  artifactScope: repository
  changeId: null
  sourceCommand: iteration-5-runner
  lastWrittenAt: "2026-07-07T00:00:00+02:00"
  lastWrittenBy: "chaos-iteration-5"
  lastAuditedAt: "2026-07-07T00:00:00+02:00"
  lastAuditedBy: "chaos-iteration-5"
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

# Runner Lease Contract

Additive Iteration 5 contract. It does not change any Iteration 0–4 contract; it
introduces the liveness artifact the live auto-resume runner uses. The authoritative
policy remains [`auto-resume-policy.md`](./auto-resume-policy.md); this contract only
defines the lease that makes "is a live runner controlling this session?" answerable
from files.

## Principle

```text
The chat thread is not the source of truth. The interaction runtime is.
Auto-resume is allowed only for live, runner-controlled sessions.
Liveness is proven by a fresh lease heartbeat — never by a process id alone.
```

## Artifact

A runner writes exactly one lease file while it is alive:

```text
.chaos/interactions/runners/<runnerId>.json
```

Optional sibling artifacts, same directory:

```text
.chaos/interactions/runners/<runnerId>.audit.jsonl   # runner audit trail
.chaos/interactions/runners/<runnerId>.stop          # manual stop flag (presence = stop)
```

Schema: [`../schema/runner-lease.schema.json`](../schema/runner-lease.schema.json).

## Fields

| Field | Meaning |
|---|---|
| `runnerId` | Stable id for this runner process/run. |
| `commandRunId` | The runtime session this runner controls (null until `beginCommand`). |
| `changeId` | Change under work, if any. |
| `sourceCommand` | The CHAOS command being executed. |
| `processId` | OS pid if known (advisory only; not a liveness proof). |
| `state` | Runner state (see runner state machine below). |
| `startedAt` | When the runner started. |
| `lastHeartbeatAt` | Last time the runner proved liveness. |
| `leaseExpiresAt` | `lastHeartbeatAt + sessionLeaseTtlMs`. |
| `autoResumeCyclesUsed` / `maxAutoResumeCycles` | Auto-resume budget. |

## Liveness rules

- The runner refreshes `lastHeartbeatAt` / `leaseExpiresAt` on every loop step.
- A lease is **live** iff `now <= leaseExpiresAt`. Otherwise it is **expired**.
- **Only a live lease permits auto-resume.** An expired/absent lease means the
  session is not runner-controlled: it stays `ready-to-resume` and the human runs
  `chaos:resume --run <commandRunId>`.
- Process id is advisory. Liveness is decided by the heartbeat/lease, never by pid
  alone (a pid can be reused; a crashed runner cannot refresh its lease).

## State ownership

- The lease is written and owned by the runner package. It is **derived/operational
  metadata**, not part of the core session/decision/lock/capsule state.
- An expired lease **never** deletes or rewrites runtime state. Sessions, decisions,
  capsules, locks, and audit remain the source of truth and remain resumable.
- Terminal runner states keep the lease file (with a terminal `state`) for audit; the
  runner does not garbage-collect runtime state.

## Relationship to `chaos:resume`

- Live lease + answered decision + safe conditions → the runner may auto-resume the
  same live session (Iteration 4's `chaos:resume` is **not** invoked).
- No live lease (crash, timeout, close, unknown) → fall back to `chaos:resume`, which
  reconstructs semantically from the resume capsule and answered decisions.

## Non-goals

No control of arbitrary chat threads, no cloud/remote lease service, no multi-user
remote approval, no `chaos:delete`. The lease is a local liveness token only.
