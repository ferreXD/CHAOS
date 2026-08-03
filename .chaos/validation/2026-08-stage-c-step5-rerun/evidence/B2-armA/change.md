---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: filter-tasks-by-status
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T08:40:44Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T08:40:44Z"
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
    bodyHash: "sha256:712ce463cc5afaeb9869435ca23861d3fa29dc12aab5329da1f69ff27f43f53b"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T08:36:13Z", run: "RUN-2026-08-03-chaos-propose-filter-tasks-by-status-b87de4", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T08:40:44Z", run: "RUN-2026-08-03-chaos-apply-filter-tasks-by-status-af9a5d", mode: light, verdict: APPLIED }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "9/9"
      contract: "6/6"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: null
---

# filter-tasks-by-status — Filter GET /tasks by status

## Intent

GET /tasks returns every task; add an optional ?status= filter over the three TaskState names.
Case-insensitive match; no parameter keeps returning all tasks; an unrecognised value returns 400.
Query-shaping only - no auth, no persistence-model change, filter lives at the endpoint boundary.

## Contract

**Filter behaviour**

- [x] GET /tasks?status=<state> returns only tasks whose Status equals <state>, for each TaskState name (Open, InProgress, Done).
- [x] The status match is case-insensitive: GET /tasks?status=open returns the same set as GET /tasks?status=Open.
- [x] GET /tasks with an unrecognised status value (e.g. ?status=Bogus) returns HTTP 400 Bad Request and no task list.

**Compatibility**

- [x] GET /tasks with no status parameter returns all tasks, unchanged from the pre-change behaviour.
- [x] The other CRUD endpoints (GET /tasks/{id}, POST, PUT, DELETE) are behaviourally unchanged; the 5 baseline integration tests still pass and dotnet build / dotnet test stay green (R-003).

**Governance**

- [x] Filtering is implemented at the endpoint/query boundary: Domain/** is unchanged, no domain code references ASP.NET types (R-004), and the TaskState naming is preserved (R-005).

OpenSpec: `openspec/changes/filter-tasks-by-status/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Confidence impact: None. `openspec` dimension = 0 at K1 (zero triggers fired; classifier confidence HIGH), so under Stage-C design §9 / C-10 this change owes no OpenSpec artifacts and the gate is a deliberate SKIP - not a degradation. No openspec/changes/filter-tasks-by-status/ folder was created.

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Stage-C classification at K1 (two-call pattern, scan then adjudication) fired NO trigger; the adjudication pass declined every materiality raise (M1: the architecture names `GET /tasks` query filtering as the known extension point and asks that new filtering behaviour live at the endpoint/query boundary - this change moves with that posture, not against it; M2: no auth/secrets/persistence material; M3: an added query parameter on an existing route is the K3 route-delta scan's job per pinned rule 12). Dimension vector therefore stays at the universal base, so `openspec` is 0 and OpenSpec is skipped entirely - the contract lives in change.md §Contract. DOCUMENTED DEVIATION: no live human was available in this measurement run; PROP-DEC-001 was recorded and resolved with a maintainer-style rationale and tagged `resolved-in-arm (no live human; Stage-C step-5 mechanized run)`. Answering that entry IS the approval.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 9/9 (5 baseline tests unchanged and green + 4 new filter tests.) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — Diff paths (2 files) are a subset of the K1-approved scope; the classifier's M5 detector agreed at K3.

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-apply-filter-tasks-by-status-af9a5d
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 9/9 green; the 5 baseline tests are unmodified and still pass. |
| R-004 | Filtering added at the endpoint/query boundary only; Domain/TaskItem.cs and Domain/TaskStore.cs are unchanged and reference no ASP.NET types. |
| R-005 | The enum stays TaskState; the new helper TryParseState reads TaskState names and never introduces TaskStatus. |
| R-006 | AGENTS.md and root README.md were read only; neither was edited. |

### Coverage honesty — how each contract statement was evidenced

5 of 6 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| Filtering is implemented at the endpoint/query boundary: Domain/** is unchanged, no domain code references ASP.NET types (R-004), and the TaskState naming is preserved (R-005). | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs | Boundary and naming compliance is a structural property of the diff, not an HTTP-observable behaviour: the diff touches only Endpoints/** and the test file, Domain/** is byte-identical, no domain type references Microsoft.AspNetCore.*, and the TaskState name is used unchanged. |

### Delivery notes

All six contract statements are covered (five by integration test, one by structural code evidence); dotnet build is 0 warnings / 0 errors and dotnet test is 9/9 (5 baseline + 4 new). No scope drift, no deviations, no new stop.

Stage-C checkpoints K2 (entry, scan-only per C-12) and K3 (DELIVER end, scan + adjudication) both fired NO trigger, so the dimension vector stayed at the universal base for the whole change: stops 1 / evidence.targeted 0 / evidence.breadth 0 / review 0 / verify 0 / openspec 0 / adr 0. K3's deterministic scan declined M3 because the route delta is empty - the change edits the existing `MapGet("/")` handler rather than adding or removing a route registration (path-class-map note: M3 fires on route-marker DELTA, never on bare path-touch); the adjudication pass declined to raise it under pinned rules 9 and 12 (an added query parameter on an existing route is the scan's business, and nothing public was removed or renamed). newStops was 0 at every checkpoint, so the only human stop in this change is the C-11 floor approval (PROP-DEC-001), resolved in-arm because no live human was available in this measurement run. K3 numstat scope: src/ + tests/ only - see the verify-side note; including this change's own governance artifacts would have fired X1 on bookkeeping alone.
