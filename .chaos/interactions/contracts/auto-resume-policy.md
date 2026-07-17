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

# Auto-Resume Policy

## Principle

Auto-resume is useful, but only safe when a live CHAOS runner controls the active command execution.

The runtime must not assume arbitrary chat threads can be awakened by push events.

## Live runner auto-resume

Allowed when all conditions hold:

- a CHAOS runner/orchestrator is active.
- the command session is still live.
- the pending decision is answered.
- the answer validates.
- the command has not exceeded `maxAutoResumeCycles`.
- no new unsafe condition has appeared.

Flow:

```text
running -> waiting-for-decision -> answered -> auto-resume -> running
```

## Dead session behaviour

If the runner/chat/process is no longer live:

- the answered session becomes `ready-to-resume`.
- the Decision Center shows it in Ready to Resume.
- the user runs `chaos:resume` explicitly.

## Configuration

Suggested config:

```yaml
policies:
  interactionRuntime:
    resume:
      allowAutoResumeWhenRunnerActive: true
      allowAutoResumeAcrossDeadSessions: false
      requireExplicitResumeForDeadSessions: true
      maxAutoResumeCycles: 3
      stopOnNewMaterialDecision: true
      stopOnUnsafeWriteRiskEscalation: true
```

## Stop conditions

Auto-resume must stop when:

- a new material decision is needed.
- a decision answer is invalid or stale.
- the session lock changed unexpectedly.
- required artifacts are missing.
- write risk escalated.
- max cycle count is reached.
- user disabled auto-resume.

## Audit

Every auto-resume must record:

- commandRunId
- decisionId consumed
- selected option
- resumedAt
- resume cycle number
- runner identity/source
- stop reason if it stops
