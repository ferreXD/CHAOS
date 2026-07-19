---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T11:33:37+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:33:37+02:00"
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
    bodyHash: "sha256:2d8ff218479ba1a50c0594841a78ef1a16d7f5c09dbbfb9755112468c6c099f2"
---

# CHAOS Proposal Report — add-task-query-filters

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "add optional status/priority filters to GET /tasks" --strict
- Mode: strict
- Mode source: explicit
- Date/time: 2026-07-19
- Change ID: add-task-query-filters
- OpenSpec available: yes
- OpenSpec validation: PASSED
- Proposal status: PROPOSED_READY_FOR_REVIEW

## User intent

Add optional `?status=` and `?priority=` query-param filters to `GET /tasks`, which today
returns every task unfiltered. Multiple filters combine with AND.

## Change classification

- Type: NEW_CAPABILITY (adds filtering to an existing endpoint; additive, backward-compatible)
- Risk: LOW–MEDIUM inherent (in-memory store, no persistence/auth/external side effects,
  optional params). Touches a public API contract additively and establishes an API-wide
  input-validation convention.
- Reasoning: `--strict` was **explicitly requested**, not inferred; honored as-is. Strict adds
  evidence rigor and makes `chaos:review` mandatory before implementation.

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current behavior | GET /tasks returns `store.All()` unfiltered (line 21) |
| `examples/task-tracker/dotnet/src/TaskTracker.Api/Domain/TaskItem.cs` | verified | domain model | `TaskState {Open, InProgress, Done}`, `TaskPriority {Low, Medium, High}` |
| `examples/task-tracker/dotnet/src/TaskTracker.Api/Domain/TaskStore.cs` | verified | store | in-memory `ConcurrentDictionary`; `All()` orders by CreatedAt |
| `examples/task-tracker/dotnet/tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | test baseline | green; no filter coverage yet |
| `.chaos/rules/index.md` | verified | rules | R-001, R-003, R-004, R-005 apply |
| `docs/adr/**`, `docs/decision-log/**` | missing | governance | none exist yet — invalid-filter convention is greenfield (routes to CREATE_DECISION_LOG) |
| `.chaos/archaeology/**` | not required | archaeology | new capability; current behavior directly evidenced |

## Evidence assessment

### Evidence required
- Current GET /tasks behavior; filter value domain (enums); test baseline; applicable rules.

### Evidence found
- All of the above (FACT, direct source read). OpenSpec available and initialized.

### Evidence missing
- No test yet exercises filtering (expected at propose time; lands at apply/verify).
- No prior decision-log/ADR for filter validation — this change establishes it.

### Impact on proposal confidence
- Design and current-behavior evidence are COMPLETE. Absence of filtering tests caps overall
  evidence coverage at PARTIAL and overall confidence at MEDIUM until apply/verify.

## Runtime decision log

| Decision ID | Type | Question | User answer | Status | Confidence impact |
|---|---|---|---|---|---|
| PROP-DEC-001 | DESIGN_DECISION | How should GET /tasks handle an invalid filter value? | Reject with 400 Bad Request | ACCEPTED_DURING_PROPOSAL | none (HIGH-confidence, evidence complete) |

## Decision Events

See `.chaos/changes/add-task-query-filters/decision-events.md`.

- **PROP-DEC-001 — Invalid filter value returns 400** — DESIGN_DECISION,
  ACCEPTED_DURING_PROPOSAL, HIGH. Runtime decision
  `DEC-2026-07-19-add-task-query-filters-how-should-get-tasks-han-b492`, answered by
  vscode-user. Sync action: `CREATE_DECISION_LOG`.

## Approach alignment record

### Candidate approaches presented
- Option A — Conservative: inline endpoint LINQ filtering.
- Option B — Balanced (recommended): thin endpoint + domain-owned AND filtering.
- Option C — Strategic: reusable filter/spec abstraction (deferred as over-engineered).

### Recommended approach
- Option B.

### User response
- proceed — approach confirmed by answering the material runtime decision (reject-400) in the
  Decision Center; no alternative approach or constraint change requested.

## OpenSpec Invocation

Status: INVOKED

Configured OpenSpec command: `openspec` CLI (config `toolchain.openspec`, `specEngine: openspec`)

Actual invocation:
Drove the `openspec` CLI (first-class path 3): `openspec new change add-task-query-filters` →
`openspec status --change ... --json` → `openspec instructions <artifact> --change ... --json`
for proposal/design/specs/tasks, writing each to its `resolvedOutputPath`.

Generated/updated OpenSpec artifacts:
- openspec/changes/add-task-query-filters/proposal.md
- openspec/changes/add-task-query-filters/design.md
- openspec/changes/add-task-query-filters/specs/task-api/spec.md
- openspec/changes/add-task-query-filters/tasks.md

Validation command: `openspec validate add-task-query-filters --strict`

Validation result:
PASS ("Change 'add-task-query-filters' is valid")

Confidence impact:
none (OpenSpec fully invoked and validated)

## OpenSpec artefacts

- Change path: openspec/changes/add-task-query-filters/
- Proposal: openspec/changes/add-task-query-filters/proposal.md
- Design: openspec/changes/add-task-query-filters/design.md
- Specs: openspec/changes/add-task-query-filters/specs/task-api/spec.md
- Tasks: openspec/changes/add-task-query-filters/tasks.md

## ADR/rule alignment

| Constraint | Source | Alignment | Confidence |
|---|---|---|---|
| R-001 Human owns material decisions | `.chaos/rules/index.md` | ALIGNED — invalid-filter decision routed through the runtime/Decision Center (PROP-DEC-001) | HIGH |
| R-003 Preserve green test baseline | `.chaos/rules/index.md` | ALIGNED — filter + invalid-value + baseline tests scoped in tasks.md (3.1–3.5) | HIGH |
| R-004 Respect domain→HTTP boundary | `.chaos/rules/index.md` | ALIGNED — filtering pushed into a domain `TaskStore` query method (design Option B, task 2.3) | HIGH |
| R-005 Keep `TaskState` naming | `.chaos/rules/index.md` | ALIGNED — no rename; existing enum reused | HIGH |

## Findings

### PRP-001 — Filtering behavior has no test coverage at propose time

Type: FACT
Confidence: HIGH
Severity: MINOR
Source: examples/task-tracker/dotnet/tests/TaskTracker.Tests/TaskEndpointsTests.cs

Finding:
The existing suite is green but exercises only pre-filtering behavior; no test covers status/
priority filtering, AND semantics, or the 400 contract.

Impact:
Caps evidence coverage at PARTIAL and overall confidence at MEDIUM until apply lands the tests.

Required action:
Implement tasks 3.1–3.5 during apply; verify closes the gap (confidence expected to rise to HIGH).

### PRP-002 — Invalid-filter contract is a new API-wide convention

Type: INFERENCE
Confidence: HIGH
Severity: ADVISORY
Source: PROP-DEC-001; absence of any `docs/decision-log/` entry

Finding:
The 400-on-invalid-value rule is not yet recorded as a durable convention; it currently lives
only in this change's decision event.

Impact:
Future list endpoints have no discoverable precedent unless PROP-DEC-001 is promoted.

Required action:
Carry PROP-DEC-001 (sync action CREATE_DECISION_LOG) through to `chaos:sync` for promotion to a
decision-log entry.

## Assumption register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | `task-api` is a new base capability (no existing base spec to modify) | Determines ADDED vs MODIFIED delta shape | HIGH | `openspec/specs/` is empty (verified) |
| A-2 | Enum parse case-sensitivity is an apply-time detail, not spec-level | Keeps the spec stable; leaves a local choice to the specialist | MEDIUM | Confirm at apply (mirrors demo APP-DEC-001) |

## Deferred / remaining open questions

None. The single material decision was resolved via the runtime; the enum-parse case-sensitivity
detail is intentionally deferred to apply as a local (non-spec) implementation decision.

## Confidence summary

- Overall confidence: MEDIUM
- Evidence coverage: PARTIAL
- Assumption load: LOW

High-confidence areas:
- Current behavior, domain model, rule alignment, the invalid-filter decision, OpenSpec validation.

Medium-confidence areas:
- End-to-end correctness pending filtering tests (land at apply/verify).

Low-confidence areas:
- None.

Confidence limiters:
- No filtering test coverage exists yet (PRP-001).

## Next command

```text
chaos:review add-task-query-filters
```
