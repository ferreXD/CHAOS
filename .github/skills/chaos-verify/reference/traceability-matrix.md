# Spec Traceability Matrix

Build a matrix linking requirements to implementation and validation evidence.

## Required columns

```text
Requirement / acceptance criterion
Source artifact
Implementation evidence
Test evidence
Status
Knowledge type
Confidence
Notes / action
```

## Status values

```text
SATISFIED
PARTIAL
MISSING
NOT_APPLICABLE
UNKNOWN
CONFLICT
```

## Example

```md
| Requirement | Source | Implementation evidence | Test evidence | Status | Confidence | Notes |
|---|---|---|---|---|---|---|
| REQ-001: endpoint accepts request | specs/api.md | `CreateTaskEndpoint.cs` | `CreateTaskEndpointTests.cs` | SATISFIED | HIGH | Build/tests passed. |
| REQ-002: duplicate operation is idempotent | specs/replay.md | `OperationId` check inferred | Missing | PARTIAL | MEDIUM | Needs explicit test. |
| REQ-003: sync failure remains pending | proposal.md | Not found | Not found | MISSING | LOW | Route to `chaos:apply --continue`. |
```

## Confidence rules

- Direct implementation + passing tests = can be HIGH.
- Direct implementation without tests = usually MEDIUM.
- Inferred implementation = MEDIUM/LOW.
- Missing source inspection = LOW.
