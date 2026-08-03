---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: enforce-title-max-length
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T16:40:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T16:40:00Z"
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
    bodyHash: "sha256:2b6dc2bac74e1c0218c368f72d4492dda388dd1fed8296c2cd30580e771e6b81"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T16:23:00Z", run: "RUN-2026-08-03-chaos-run-enforce-title-max-length-a7c3f1", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T16:40:00Z", run: "RUN-2026-08-03-chaos-run-enforce-title-max-length-a7c3f1", mode: light, verdict: APPLIED }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "10/10"
      contract: "6/6"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: null
---

# enforce-title-max-length — Enforce a maximum title length (200 characters) on task create and update

## Intent

Task titles are currently unbounded. Add an upper bound on title length as input validation.
This is a request-validation convenience: no authentication, no persistence-model change.
At most 200 characters; POST/PUT reject longer titles with 400; exactly 200 is accepted; blank-title 400 preserved.

## Contract

**Bound**

- [x] A task title may be at most 200 characters long.

**Rejection**

- [x] `POST /tasks` with a title longer than 200 characters is rejected with HTTP 400 Bad Request and creates no task.
- [x] `PUT /tasks/{id}` with a title longer than 200 characters is rejected with HTTP 400 Bad Request and does not modify the task.
- [x] A title of exactly 200 characters is accepted: `POST` returns 201, `PUT` returns 200.

**Preserved behaviour**

- [x] The existing blank/whitespace title → 400 behaviour is preserved for both `POST` and `PUT`.
- [x] Titles of normal length keep working exactly as before and the other CRUD endpoints are unchanged; `dotnet build` and `dotnet test` stay green with the 5 existing tests passing.

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Classified depth: **0 — none owed**

Confidence impact: none — skipped, openspec dimension 0. The K1 classification fired zero triggers, so no OpenSpec artifacts are owed (Stage-C C-10 zero-base) and none were authored; the Contract section of `change.md` is the contract of record. This is the classified outcome, not degraded mode and not a CLI-availability gap.

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation (measurement condition): no live human is available in this Stage-D mechanized run. Every decision is recorded in `decision-events.md` and resolved in-arm with an explicit maintainer-style rationale, tagged `resolved-in-arm (no live human; Stage-D mechanized run)`. Answering the `approves-change` decision IS the approval. The interaction runtime (Decision Center) was not invoked: this arm runs in a detached measurement worktree.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 10/10 (5 pre-existing tests + 5 added for the title bound) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — K3 scan 1 (C-15 scoped: git diff -- src tests) reported no M5 firing; both touched paths are the approved scope.

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-run-enforce-title-max-length-a7c3f1
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 10/10 green (5 baseline tests unchanged and passing) |
| R-004 | validation added in Endpoints/TaskEndpoints.cs only; Domain/** untouched and free of Microsoft.AspNetCore.* references |
| R-005 | no enum or naming change; TaskState untouched |
| R-006 | AGENTS.md and root README.md not modified (git diff scope: src, tests only) |

### Delivery notes

Every contract statement is covered by an executed integration test; build is 0 warnings / 0 errors and the suite is 10/10 (5 pre-existing + 5 added). One work unit, no scope drift, no deviations, no unanswered decision.

The bound is enforced at the HTTP boundary only (`Endpoints/TaskEndpoints.cs`), after the existing blank-title guard, so the blank-title 400 keeps precedence and the domain (`TaskStore`/`TaskItem`) is untouched — R-004's direction is preserved by construction. Length is measured on the raw title, matching the store, which never trims.
