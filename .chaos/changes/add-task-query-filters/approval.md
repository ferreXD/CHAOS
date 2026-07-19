---
chaosMetadata:
  schemaVersion: 1
  artifactType: approval
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-19T11:52:46+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:52:46+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "{'name': 'chaos/dotnet/demo', 'isDefaultBranch': False, 'upstream': '', 'mergeBase': '', 'confidence': 'MEDIUM'}"
    reviewRequest: "{'providerType': 'unknown', 'id': '', 'url': '', 'title': '', 'author': '', 'sourceBranch': '', 'targetBranch': '', 'status': 'unknown', 'confidence': 'LOW'}"
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:1309adfadf8f38a6ae08f0e6ab10587ef7b890dfa9fae95c29ba712bace8c710"
---

# CHAOS Approval — add-task-query-filters

- Change ID: add-task-query-filters
- Approved: Yes
- Approved by: vscode-user (Decision Center)
- Approval date: 2026-07-19
- Approval source: chaos:review (runtime decision DEC-2026-07-19-add-task-query-filters-approve-add-task-query-f-1f68)
- Review verdict at approval: READY_FOR_APPROVAL
- OpenSpec validation: PASSED (`openspec validate add-task-query-filters --strict`)
- Confidence: MEDIUM (evidence coverage PARTIAL — filtering tests land at apply; expected to rise to HIGH at verify)
- Mode: standard

## Scope approved for implementation

Add optional `status` and `priority` query-param filters to `GET /tasks`, combined with AND, per
the OpenSpec change `add-task-query-filters`:

- `openspec/changes/add-task-query-filters/proposal.md`
- `openspec/changes/add-task-query-filters/design.md`
- `openspec/changes/add-task-query-filters/specs/task-api/spec.md`
- `openspec/changes/add-task-query-filters/tasks.md`

Implementation must stay within this approved boundary. Allowed code areas:

- `examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`
- `examples/task-tracker/dotnet/src/TaskTracker.Api/Domain/TaskStore.cs`
- `examples/task-tracker/dotnet/tests/TaskTracker.Tests/TaskEndpointsTests.cs`

## Decisions carried into apply

- **PROP-DEC-001** — invalid filter value returns `400 Bad Request` (both `status` and `priority`).
- **REV-DEC-001** — invalid-priority `400` is tested + scenarioed (tasks.md 3.6).
- **Open at apply:** enum-parse case-sensitivity (REV-003 / assumption A-2) — a bounded local
  implementation decision to be recorded during apply.

## Conditions

None blocking. Advisory follow-ups tracked for later:

- REV-002 — promote PROP-DEC-001 to a durable decision-log entry via `chaos:sync`.

## Next command

```text
chaos:apply add-task-query-filters
```
