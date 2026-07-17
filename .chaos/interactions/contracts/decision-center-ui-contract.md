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

# Decision Center UI Contract

## UX principle

CHAOS should use one persistent Decision Center per workspace, not a new popup/panel for every decision.

## Required UI areas

The Decision Center should provide:

1. Active Decision
   - current blocking decision.
   - recommendation.
   - options.
   - consequences.
   - rationale field when required.

2. Decision Queue
   - pending decisions across sessions/change IDs.
   - show which decisions are blocking.
   - show which are independent/batch-answerable.

3. Ready to Resume
   - sessions whose blocking decisions are answered.
   - copyable resume commands.
   - `changeId`, `commandRunId`, source command, next step.

4. History/Audit
   - answered, consumed, cancelled, superseded, and expired decisions.

## Status bar

The extension should expose a status bar state:

- `CHAOS: Ready`
- `CHAOS: 1 decision pending`
- `CHAOS: <changeId> locked`
- `CHAOS: 2 sessions ready to resume`

Clicking the status bar opens/focuses the Decision Center.

## UI behaviour

When a new decision appears:

- if Decision Center is open, refresh/focus the active decision.
- if closed, open/focus according to user setting.
- if user disabled auto-open, show notification/status bar only.

After submit:

Default behaviour: switch to dashboard/ready-to-resume state.

Alternative policies may later support closing the panel or keeping the decision view open.

## Security

The UI must:

- escape all text from runtime files.
- never render arbitrary HTML from decision payloads.
- use local assets only.
- avoid external CSS/JS/CDNs.
- use strict CSP.
- validate selected option ID before writing a response.
- write only runtime response files.

## Accessibility

The UI should support:

- keyboard navigation.
- visible focus state.
- clear option labels.
- no colour-only status indication.
- copyable IDs and paths.

## Batch decisions

Batch answer is allowed only for decisions marked:

```json
{
  "independent": true
}
```

Dependent decisions must be shown sequentially according to the decision graph.
