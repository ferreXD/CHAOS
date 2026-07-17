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

# Resume Capsule Contract

## Purpose

A resume capsule allows CHAOS to continue a paused command without relying on chat memory.

It is required for cross-thread continuation.

## Required properties

A resume capsule must include:

- `commandRunId`
- `sourceCommand`
- `changeId`
- current session state
- `lastCompletedStep`
- `nextStep`
- answered decision IDs
- consumed decision IDs
- context capsule
- required artifacts
- confidence summary
- created/updated timestamps

## Context capsule

The `contextCapsule` section should be compact.

It should include enough information to resume safely:

- intent
- approved scope
- selected path/profile
- constraints
- assumptions
- open risks
- confidence caps
- required artifacts to read
- forbidden actions

It should not include entire reports or long evidence dumps. It should link to artifacts instead.

## Resume lookup

`chaos:resume` must support:

```text
chaos:resume
chaos:resume --latest
chaos:resume --change <change-id>
chaos:resume --run <commandRunId>
```

If more than one session matches, it must ask the user which one to resume.

## Resume validation

Before resuming, the runtime/command must validate:

- session exists.
- session is `ready-to-resume` or explicitly resumable.
- lock belongs to the same command run or is compatible.
- required decisions are answered.
- response IDs match known decision IDs.
- required artifacts exist or missing artifacts are disclosed.
- capsule schema is valid.

## Resume behaviour

After successful resume:

1. Mark session `resumed`.
2. Mark relevant decisions `consumed` when the command records them into its normal CHAOS artifacts.
3. Continue from `nextStep`.
4. Preserve original audit history.

## Token economy

Commands should read the resume capsule before reading full reports.

Full artifacts should be read only when needed for correctness.
