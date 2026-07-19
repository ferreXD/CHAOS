---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T12:16:21+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T12:16:21+02:00"
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
    bodyHash: "sha256:5800136a77f8c16010357bcb858320f67ef3a4082d805dd29df8cfb610980008"
---

# Decision Events — add-task-query-filters

### PROP-DEC-001 — Invalid filter value returns 400

Command: chaos:propose
Change ID: add-task-query-filters
Mode: strict
Type: DESIGN_DECISION
Status: ACCEPTED_DURING_PROPOSAL
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`GET /tasks` rejects an unrecognized `status` or `priority` value with `400 Bad Request`
(rather than ignoring the filter or returning an empty list).

Rationale:
"If passed status doesn't exist in the enum or array of values, the most safe approach here is
returning a 400." Fail fast on bad input; a typo'd filter value should be a visible client
error, not silent. (Runtime decision
DEC-2026-07-19-add-task-query-filters-how-should-get-tasks-han-b492, answered in the Decision
Center by vscode-user on 2026-07-19.)

Evidence:
- examples/task-tracker/dotnet/src/TaskTracker.Api/Domain/TaskItem.cs — status/priority are the
  TaskState/TaskPriority enums, so an off-enum value is unambiguously invalid.
- examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — GET /tasks
  currently returns store.All() unfiltered.

Impact on proposal:
Adds a "reject invalid filter" scenario to the task-api spec delta and a validation task (2.2)
plus a negative-path test (3.4).

Sync action:
- CREATE_DECISION_LOG        # API-wide input-validation convention; should outlive this change

Follow-up owner: team

### REV-DEC-001 — Add a negative-path test for the invalid-priority 400 contract

Command: chaos:review
Change ID: add-task-query-filters
Mode: standard
Type: TASK_AMENDMENT
Status: RESOLVED_DURING_REVIEW
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Amend the OpenSpec artefacts so the invalid-*priority* half of the PROP-DEC-001 400 contract is
verified: add task 3.6 ("Test: invalid priority value returns 400") to tasks.md and a matching
"Invalid priority value is rejected" scenario (`?priority=banana` → 400) to the task-api spec
delta.

Rationale:
The spec states an unrecognized status OR priority value SHALL return 400, but only the status
side was tested/scenarioed. Review adds the symmetric coverage the proposal missed so both halves
of the normative contract are traceable at verify. (Runtime decision
DEC-2026-07-19-add-task-query-filters-invalid-priority-value-h-8d32, answered in the Decision
Center by vscode-user on 2026-07-19; recommended option accepted.)

Evidence:
- openspec/changes/add-task-query-filters/specs/task-api/spec.md — normative "status OR priority
  → 400" requirement.
- openspec/changes/add-task-query-filters/tasks.md — pre-amendment tests covered only invalid status (3.4).

Affected artefacts:
- openspec/changes/add-task-query-filters/tasks.md (added 3.6)
- openspec/changes/add-task-query-filters/specs/task-api/spec.md (added invalid-priority scenario)

Review impact:
Closes REV-001. OpenSpec `--strict` re-validation PASSED after the amendment. Verdict advances
from READY_WITH_CONDITIONS to READY_FOR_APPROVAL.

Sync action:
- AMEND_OPENSPEC_TASKS

Follow-up owner: team

### APP-DEC-001 — Parse filter enums case-insensitively

Command: chaos:apply
Change ID: add-task-query-filters
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: ACCEPTED_DURING_APPLY
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Filter values are parsed with `Enum.TryParse<T>(value, ignoreCase: true, out …)` so `open`,
`Open`, and `OPEN` all match.

Rationale:
The approved spec scenarios send lowercase input (`?status=open` → matches `Open`), so
case-insensitive parsing is required to satisfy the spec — not a free choice. Query-string values
are user-facing; case-sensitivity would be a surprising 400. Stays within the approved contract
(still 400 on a genuinely unknown value).

Evidence:
- openspec/changes/add-task-query-filters/specs/task-api/spec.md — "Filter by status" scenario uses `?status=open`.
- examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — TryParse(ignoreCase: true).

Scope impact:
src/TaskTracker.Api/Endpoints/TaskEndpoints.cs only. No spec change.

Sync action:
- NONE

Follow-up owner: implementer

### APP-DEC-002 — Reject numeric-out-of-range filter values with 400

Command: chaos:apply
Change ID: add-task-query-filters
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: ACCEPTED_DURING_APPLY
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
A filter value is accepted only when
`Enum.TryParse<T>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(typeof(T), parsed)`.
This makes numeric-but-out-of-range input (e.g. `?status=99`) return 400 rather than a 200 empty
list, matching the spec's normative "unrecognized value SHALL return 400".

Rationale:
`Enum.TryParse` accepts arbitrary numeric strings and returns an undefined enum value; without the
`Enum.IsDefined` guard, `?status=99` would silently match nothing (200 empty) instead of the
spec-required 400. Discovered by the C# specialist during apply and hardened in strict mode. No
spec change — this enforces the already-approved requirement more faithfully. Locked with a
regression test (`Get_tasks_with_numeric_out_of_range_status_returns_bad_request`).

Evidence:
- openspec/changes/add-task-query-filters/specs/task-api/spec.md — "unrecognized status or priority value SHALL result in a 400".
- examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — `Enum.IsDefined` guard.
- dotnet test — 12/12 passing incl. the numeric-rejection regression test.

Scope impact:
src/TaskTracker.Api/Endpoints/TaskEndpoints.cs + one test in
tests/TaskTracker.Tests/TaskEndpointsTests.cs. Within approved boundary; no spec/contract change.

Sync action:
- NONE

Follow-up owner: implementer

### ARC-DEC-001 — Route the invalid-filter convention to sync

Command: chaos:archive
Change ID: add-task-query-filters
Mode: strict
Type: sync-routing
Status: ACCEPTED_DURING_ARCHIVE
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Carry PROP-DEC-001 (invalid filter value → 400) to chaos:sync for promotion into a durable
decision-log entry, and archive the change (OpenSpec change moved to archive/, task-api delta
promoted into base specs).

Rationale:
The 400-on-invalid-value rule is an API-wide convention that must outlive this change. Confirmed
as part of the archive gate answered in the Decision Center (runtime decision
DEC-2026-07-19-add-task-query-filters-archive-add-task-query-f-9c6b, answered by vscode-user on
2026-07-19).

Evidence:
- .chaos/changes/add-task-query-filters/verification.md — VERIFIED, archive readiness READY.
- openspec list — no active changes after archive; archive/2026-07-19-add-task-query-filters present.
- openspec/specs/task-api/spec.md — base spec created from the promoted delta.

Impact on proposal:
Change closed; source-of-truth base specs updated. PROP-DEC-001 routed to sync.

Sync action:
- CREATE_DECISION_LOG

Follow-up owner: team
