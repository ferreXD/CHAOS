---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: task-count
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T08:28:31Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T08:28:31Z"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: unknown
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: records
    confidence: MEDIUM
    bodyHash: "sha256:212a5a52e7c6fe070481de842c3703fd25e7475b4a1f3443f5256e9b8d1ae667"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T08:22:26Z", run: "RUN-2026-08-03-chaos-propose-task-count-6fc29c", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T08:26:48Z", run: "RUN-2026-08-03-chaos-apply-task-count-b41d07", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T08:28:31Z", run: "RUN-2026-08-03-chaos-verify-task-count-b1bc32", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "9/9"
      contract: "6/6"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: READY
---

# task-count — Active-task count endpoint

## Intent

Add GET /tasks/count returning HTTP 200 and { "count": <integer> } - the total number of tasks in the store.
Read-only convenience aggregate for the dashboard; count tracks GET /tasks exactly across POST (201) and DELETE (204).
No authentication, no persistence-model change; GET / and existing /tasks CRUD behaviour are unchanged.

## Contract

**endpoint**

- [x] GET /tasks/count returns HTTP 200 with a JSON object of the shape { "count": <integer> }.

**invariants**

- [x] count equals the number of items returned by GET /tasks for the same store at the same moment.
- [x] Creating a task via POST /tasks (201) increases count by exactly 1.
- [x] Deleting a task via DELETE /tasks/{id} (204) decreases count by exactly 1.

**regression**

- [x] GET / (health) and all existing /tasks CRUD behaviour are unchanged: the 5 baseline integration tests still pass.
- [x] The aggregate is computed at the endpoint boundary from the existing TaskStore read API; TaskStore's public shape is unchanged and Domain/** keeps no dependency on the HTTP layer (R-004, R-005).

OpenSpec: `openspec/changes/task-count/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Confidence impact: No confidence impact. Skipped by classification, not by tooling absence: checkpoint K1 fired zero triggers (confidence HIGH), so the openspec dimension is 0 and design section 9 / decision C-10 says a zero-trigger change owes no OpenSpec artifacts. The contract lives in change.md section Contract, backed by records/contract.json.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | governance entrypoint, protected-file policy | FACT |
| `.chaos/constitution.md` | knowledge/confidence doctrine | FACT |
| `.chaos/rules/index.md` | R-001..R-007 executable constraints | FACT |
| `.chaos/architecture.md` | boundary model, API strategy, non-goals | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the /tasks route group the new endpoint joins | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | the read API (All()) the count is derived from | FACT |
| `src/TaskTracker.Api/Program.cs` | host composition, store registration, root health endpoint | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline to preserve and extend | FACT |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-count-endpoint` | — | C-001, C-002, C-003, C-004 (4) | Map GET /tasks/count in TaskEndpoints; add integration tests for shape, parity with GET /tasks, and the create/delete deltas. |
| `regression-safety` | — | C-005, C-006 (2) | Keep the 5 baseline tests untouched and green; keep the aggregate at the endpoint boundary so TaskStore's public shape is unchanged. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation: no live human was available in this measurement run. PROP-DEC-001 was recorded as a real decision entry and then resolved with an explicit maintainer-style rationale, status RESOLVED-IN-ARM, tagged "resolved-in-arm (no live human; Stage-C step-5 mechanized run)". Answering that entry IS the approval. Inline self-review: scope sane (2 code files) - rules mapped (R-003, R-004, R-005, R-006) - contract testable (6 statements, all integration-testable) - decisions complete (1 entry, approval carried, none OPEN) - decision cross-refs resolve. Verdict PASS.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 9/9 (5 baseline + 4 new (count parity, POST +1, DELETE -1, root health unchanged).) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`, `openspec/changes/task-count/specs/task-api/spec.md` (new)

scope drift: **NO_DRIFT** — K3 fired no M5. The src/tests numstat covers exactly the two paths named in the approved scope; the delta spec under openspec/changes/task-count/ is an obligation created by the K3 M3 firing (design 5.3 law 5), not unapproved drift.

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-apply-task-count-b41d07
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test: 9/9 passed, 0 failed; the 5 baseline tests are unmodified. |
| R-004 | The diff touches only Endpoints/TaskEndpoints.cs on the src side; Domain/** is unchanged and references no Microsoft.AspNetCore.* type. |
| R-005 | No enum or naming change; TaskState is neither renamed nor shadowed by TaskStatus anywhere in the diff. |
| R-006 | AGENTS.md and root README.md are untouched (git status shows no modification to either). |

### Coverage honesty — how each contract statement was evidenced

5 of 6 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The aggregate is computed at the endpoint boundary from the existing TaskStore read API; TaskStore's public shape is unchanged and Domain/** keeps no dependency on the HTTP layer (R-004, R-005). | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs:23-26 (group.MapGet("/count", (TaskStore store) => Results.Ok(new { count = store.All().Count }))) | A structural invariant of the diff, not an observable HTTP behaviour: the assertion is that Domain/TaskStore.cs is untouched and that Domain/** references no ASP.NET type. Evidenced by the numstat (src diff is confined to Endpoints/TaskEndpoints.cs, 5 added lines, 0 deleted) rather than by a runtime test. |

### Delivery notes

Every contract statement is implemented and covered; build is clean and all 9 tests pass (5 baseline + 4 new). Checkpoint K2 fired nothing; checkpoint K3 fired M3 contract-surface (additive route delta, breaking: false) with newStops 0, so no new stop was owed - the K1 floor approval PROP-DEC-001 remains the only stop. The late-fired obligations (design 5.3 law 5) were discharged before DELIVER completed.

M3 obligations discharged in-phase: openspec 1 -> the delta spec openspec/changes/task-count/specs/task-api/spec.md was authored and `openspec validate task-count --strict` reports "Change 'task-count' is valid"; adr 1 (decision-log entry in the ledger, not a blocking ADR) -> satisfied by the pre-existing PROP-DEC-001, whose answer records the decision to add the public GET /tasks/count contract surface at the endpoint boundary; verify 1 -> the contract-dependency safeguard checks are deferred to chaos:verify, which is the enforcement end. Note for measurement: no second ledger entry was created for adr 1 because one would have crossed the M4 decision-density threshold (>= 2 entries) and fired a trigger with no material question behind it; PROP-DEC-001 is the genuine decision-log entry for this contract surface. Mechanized-stop deviation from FRAME still stands: no live human; PROP-DEC-001 is RESOLVED-IN-ARM.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-03-chaos-verify-task-count-b1bc32 · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — Re-run independently at verify. |
| tests | 9/9 — Re-run independently at verify; 5 baseline tests unmodified and green. |
| contract | 6/6 ticked; C-001..C-005 by test; C-006 by code with whyNotTest recorded in the deliver record. |
| openspec | `validate --strict` PASS · `isComplete: true` |
| scope drift | **NO_DRIFT** — M5 never fired. The governed-subject diff is confined to the two approved paths; the delta spec is a trigger-created obligation, not drift. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · M3 contract-surface fired at K3; every obligation it created is discharged**
TRG-001 (M3, by scan, surface contract-dependency, cite "route delta: added ['GET /count'] (additive)", breaking false) raised verify 0->1, openspec 0->1, adr 0->1. openspec 1: delta spec present and strict-valid. adr 1: satisfied by PROP-DEC-001, the ledger entry that records the decision to add this public contract surface at the endpoint boundary - adr 1 is a decision-log entry, not the blocking ADR of adr 2, so it does not gate READY. verify 1: the contract-dependency safeguard checks ran (route inventory shows 6 /tasks routes + the root health route, one added and none removed or renamed; the response body matches { "count": <int> } exactly; the delta spec matches the implemented behaviour).
Recommend None. Recorded for the audit trail..

**VFY-002 — ADVISORY · FACT · HIGH · Instrumentation note: the K3 numstat was scoped to the governed subject (src/ + tests/), and scoping it wider would have fired X1 on governance prose alone**
The K3 numstat/patch were produced with `git add -N src tests` then `git diff --numstat -- src tests` / `git diff -- src tests`, giving 2 files and 67 changed lines. Two reasons: (a) this worktree carries a large pre-existing toolkit overlay under .claude/, .chaos/ and tools/, so an unscoped `git diff` would have swamped the change's own diff with unrelated modifications; (b) X1 blast-radius is a property of the governed subject. Measured counterfactual (numstat only - the classifier was NOT re-run and the classification state was NOT mutated): including .chaos/changes/task-count/** and openspec/changes/task-count/** gives 10 files / 503 lines, which crosses this repo's X1 review1 thresholds (files 8, loc 400). Including the governance trail in the blast-radius input would therefore have fired X1 - raising review, verify and evidence.breadth - purely because the change produced governance artifacts, a self-referential ratchet worth ruling out explicitly in the classifier contract.
Recommend State in tools/chaos-classify/README.md that the K3 numstat is scoped to the governed subject and excludes the change's own governance and spec artifacts..

**VFY-003 — ADVISORY · FACT · HIGH · The renderer emits an unconditional OpenSpec pointer under change.md #Contract even when the frame record says NOT_INVOKED**
At FRAME the openspec dimension was 0, the frame record recorded status NOT_INVOKED, and the renderer still wrote the line "OpenSpec: `openspec/changes/task-count/` - decisions: see `decision-events.md`" pointing at a folder that did not yet exist; the adjacent "OpenSpec Invocation: NOT_INVOKED" subsection was the only correction. The pointer became accurate later, when the K3 M3 firing created the delta spec, so the change is not affected - but on a change that stays at openspec 0 the rendered artifact would dangle. Not hand-corrected: change.md is renderer-owned and the fix belongs in tools/chaos-render/render.py.
Recommend Make that pointer conditional on the frame record's openspec.status (or on the folder existing) in tools/chaos-render/render.py..

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

READY. Build and tests were re-run independently and are clean (0/0, 9/9). All 6 contract statements are covered. The obligation audit against the final dimension vector passes on every line: adr 1 (a ledger decision-log entry, not a blocking ADR) is satisfied by PROP-DEC-001, so no ADR gates READY; openspec 1 is satisfied by the delta spec, which `openspec validate task-count --strict` accepts; verify 1 ran the contract-dependency safeguard checks attributed to TRG-001 (route inventory, additive-only delta, response-shape conformance, domain-boundary purity) and all passed; newStops was 0 at K1/K2/K3/K4 and the single placed stop (K1 floor approval) was surfaced and answered as PROP-DEC-001; no dimension decreased across the four checkpoints, so no human override was needed or recorded.
