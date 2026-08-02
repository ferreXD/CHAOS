---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: soft-delete-tasks
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-02T22:58:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-02T22:58:00Z"
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
    bodyHash: "sha256:0a52af8ce7edc068377e903851665d9fe04c98c0f8fc243d3b7e5b7df9f2cc64"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-02T22:41:00Z", run: "RUN-2026-08-02-chaos-propose-soft-delete-tasks-e9a761", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-02T22:52:00Z", run: "RUN-2026-08-02-chaos-apply-soft-delete-tasks-312cae", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-02T22:58:00Z", run: "RUN-2026-08-02-chaos-verify-soft-delete-tasks-54f479", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "10/10"
      contract: "10/10"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: READY
---

# soft-delete-tasks — Soft-delete tasks — retain deleted rows behind a nullable deletedAt

## Intent

DELETE /tasks/{id} becomes a soft delete: stamp a nullable deletedAt, return 204, keep the row.
GET /tasks hides soft-deleted tasks by default and exposes them via ?includeDeleted=true; GET /tasks/{id} 404s for them.
The four seeded tasks stay active (deletedAt null) — the in-memory 'migration' is a defaulted record member.

## Contract

**model**

- [x] The task model carries a nullable `deletedAt` timestamp, serialized in JSON as `deletedAt`: an ISO-8601 string when set, `null` while the task is active.

**deletion**

- [x] `DELETE /tasks/{id}` on an active task sets `deletedAt` to the current time and returns 204 No Content; the task is retained in the store, not permanently removed.
- [x] `DELETE /tasks/{id}` for an unknown id returns 404 Not Found.
- [x] `DELETE /tasks/{id}` for an already soft-deleted task returns 404 Not Found and leaves the existing `deletedAt` unchanged.

**listing**

- [x] `GET /tasks` returns only active (not soft-deleted) tasks by default.
- [x] `GET /tasks?includeDeleted=true` returns all tasks, including soft-deleted ones (non-null `deletedAt`).

**retrieval**

- [x] `GET /tasks/{id}` returns 404 Not Found for a soft-deleted task and 200 OK for an active one.

**compatibility**

- [x] The four seeded tasks are active (`deletedAt` = null) after startup — existing rows keep working with no migration step.
- [x] The five pre-existing integration tests still pass and the other CRUD endpoints (POST, PUT, validation) keep their current behaviour.
- [x] Visibility filtering stays at the endpoint/query boundary: `TaskStore.All()` / `Get()` keep their shapes, only the `Remove` mutator becomes `SoftDelete`; `Domain/**` references no ASP.NET type (R-004) and `TaskState` naming is unchanged (R-005).

OpenSpec: `openspec/changes/soft-delete-tasks/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `openspec` CLI 1.6.0 (openspec/config.yaml)

Actual invocation: openspec/changes/soft-delete-tasks/

Generated OpenSpec artifacts:

- `openspec/changes/soft-delete-tasks/specs/task-api/spec.md`

`openspec status --change soft-delete-tasks --json` reports `isComplete: true`; Delta spec only — the openspec dimension classified to 1 (M1 + M3-free, and C-13 makes M1+M2 a same-surface pair on data-store, so the full set is NOT owed). proposal.md / tasks.md / design.md deliberately absent..

Validation command: `openspec validate soft-delete-tasks --strict`

Validation result: **PASS** — "Delta spec hand-authored per the run brief; the CLI (v1.6.0) was present and validated it clean."

Confidence impact: None — the delta spec was authored and validated at the classified depth; nothing degraded.

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Stage-C classification, no preset flag (zero floors). K1 two-call pattern: the deterministic scan fired M2 sensitive-surface (data-store, persistence path class on Domain/TaskItem.cs); the adjudication pass then raised M1 posture-crossing (data-store) citing the architecture boundary line 'new behaviour belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise' against an intent that commits to putting deletedAt on the model. Resulting vector: stops 1 - evidence.targeted 1 - evidence.breadth 0 - review 0 - verify 1 - openspec 1 - adr 2. newStops 0: both K1 materiality firings folded into the C-11 floor approval stop, so no second stop was created. Obligations honored at FRAME: evidence.targeted 1 -> read the cited .chaos/architecture.md sections (boundary model, data-access posture, non-goals) plus the rules index; openspec 1 -> delta spec only at openspec/changes/soft-delete-tasks/specs/task-api/spec.md (no proposal.md/tasks.md/design.md - that is the openspec-2 set and was NOT written); adr 2 -> docs/adr/ADR-001-soft-delete-store-shape.md records the accepted crossing. DOCUMENTED DEVIATION: no live human was available in this measurement run, so PROP-DEC-001 was recorded and then resolved with an explicit maintainer-style rationale, status RESOLVED-IN-ARM, tagged 'resolved-in-arm (no live human; Stage-C step-5 mechanized run)'. Answering that entry IS the approval. The envelope 'mode: light' is a schema artifact (the record schema requires one of light|standard|strict); under Stage C no mode was selected and no preset floor was applied - the dimension vector above is what drove every obligation. Inline self-review: scope sane (4 code/test files, all inside src/TaskTracker.Api + tests/TaskTracker.Tests) - rules mapped (R-003, R-004, R-005, R-006) - contract testable (10 statements, all behaviourally checkable over HTTP) - decisions complete (one entry, approves-change, answered) - decision cross-refs resolve. Verdict: clean.

Confidence limiters:

- `[INFERENCE · MEDIUM]` Classifier confidence is MEDIUM at K1 because adjudication was used (M1 raised by the semantic layer, not the scan); the deterministic scan alone was HIGH with M2 only.
- `[CONFLICT · HIGH]` Pre-existing divergence, not caused by this change: openspec/specs/task-api/spec.md already requires ?status=/?priority= filters on GET /tasks, but the code at base d27600f has no such filters. The delta spec restates those clauses verbatim for spec fidelity; this change neither implements nor verifies them.
- `[ASSUMPTION · MEDIUM]` Re-deleting an already soft-deleted task returns 404 (PROP-DEC-001 Q2-A). The pinned task contract is silent on this case; the answer was chosen for consistency with GET /tasks/{id} hiding soft-deleted rows.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 10/10 (5 pre-existing baseline tests + 5 new soft-delete tests; 0 failed, 0 skipped.) |
| contract | 10/10 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Domain/TaskItem.cs`, `src/TaskTracker.Api/Domain/TaskStore.cs`, `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`, `openspec/changes/soft-delete-tasks/specs/task-api/spec.md` (new), `docs/adr/ADR-001-soft-delete-store-shape.md` (new)

scope drift: **NO_DRIFT** — K3 fired no M5: every changed path was listed in the predicted scope at K1, including the planned new openspec delta spec and ADR.

status: Delivered · 2026-08-02 · run: RUN-2026-08-02-chaos-apply-soft-delete-tasks-312cae
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test green: 10/10 (5 baseline + 5 new), 0 failed. |
| R-004 | Domain/TaskItem.cs and Domain/TaskStore.cs reference no Microsoft.AspNetCore.* or endpoint type; SoftDelete takes only a Guid and the visibility filter lives in Endpoints/TaskEndpoints.cs. |
| R-005 | The TaskState enum and its usages are untouched; no TaskStatus identifier was introduced. |
| R-006 | AGENTS.md and root README.md were not modified (git status shows neither as changed). |

### Coverage honesty — how each contract statement was evidenced

9 of 10 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| Visibility filtering stays at the endpoint/query boundary: `TaskStore.All()` / `Get()` keep their shapes, only the `Remove` mutator becomes `SoftDelete`; `Domain/**` references no ASP.NET type (R-004) and `TaskState` naming is unchanged (R-005). | src/TaskTracker.Api/Domain/TaskStore.cs; src/TaskTracker.Api/Endpoints/TaskEndpoints.cs; docs/adr/ADR-001-soft-delete-store-shape.md | A structural/architectural statement about WHERE behaviour lives (store shape vs endpoint boundary) and about type references — not observable over HTTP, so no black-box test can assert it. Evidenced by inspection: TaskStore.All()/Get() signatures and bodies are unchanged, the only store mutator change is Remove -> SoftDelete, the includeDeleted filter and the soft-deleted 404 are both in TaskEndpoints.cs, Domain/** references no Microsoft.AspNetCore.* type, and TaskState is untouched. |

### Delivery notes

Every contract statement is implemented and 9 of 10 are covered by a passing integration test against the real HTTP surface; build is clean and the full suite (5 baseline + 5 new) is green.

Stage-C checkpoints. K2 (entry, scan-only per C-12): no new firings — the ledger holds one decision entry, below M4's threshold of 2 — vector unchanged at stops 1 / evidence.targeted 1 / evidence.breadth 0 / review 0 / verify 1 / openspec 1 / adr 2, confidence HIGH. K3 (DELIVER end, two-call): the scan reported scanEcho [M2] (re-detection of the K1 firing on the persistence path class) and fired nothing new — no M5 scope spill, no M3 route delta (the patch's added and removed route registrations are the same three: MapGet "/", MapGet "/{id:guid}", MapDelete "/{id:guid}"), no X1 (6 files / ~317 loc, under the 8-file / 400-loc threshold). The K3 adjudication pass DECLINED to raise anything: M1 and M2 are already fired (prompt rule 11); the new includeDeleted query parameter and the new deletedAt response field are additive shape changes that rules 9 and 12 keep out of M3's domain, and the posture crossing they represent is already carried by the M1 firing from K1 (double-counting it as M3 would be a measurement error). newStops 0, no stopSatisfiedBy — no mid-flight stop was created, so PROP-DEC-001 remains the change's only human stop. Late-fired obligations (design §5.3 law 5): none — openspec 1 and adr 2 both fired at K1 and were discharged at FRAME. Implementation honors PROP-DEC-001 verbatim: Q1-A (TaskStore.Remove -> SoftDelete, All()/Get() shapes untouched, visibility filtering at the endpoint), Q2-A (re-delete -> 404, timestamp preserved), Q3-A (no purge/TTL).

## Todo Candidates

- **Reconcile .chaos/architecture.md boundary-posture line to cite ADR-001** (PROP-DEC-001) — The ADR qualifies the 'not in the store's public shape' line; updating the posture doc is chaos:sync's job, not this change's.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-02 · run: RUN-2026-08-02-chaos-verify-soft-delete-tasks-54f479 · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — Re-run independently at verify time. |
| tests | 10/10 — Re-run independently at verify time: 0 failed, 0 skipped. Matches the deliver record. |
| contract | 10/10 ticked; 9 statements test-evidenced, 1 (C-010, the structural boundary statement) code-evidenced with whyNotTest recorded. |
| openspec | `validate --strict` PASS · `isComplete: true` · 0/0 tasks |
| scope drift | **NO_DRIFT** — M5 did not fire at K3; all changed paths were in the K1 predicted scope. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Data-store safeguard checks (verify 1) all pass**
Attribution: verify rose to 1 by TRG-001 (M2 sensitive-surface, data-store) and TRG-002 (M1 posture-crossing, data-store), so the trigger-relevant checks are persistence/migration ones. S1 no hard-delete path remains — grep finds no TryRemove/.Remove( anywhere in src/TaskTracker.Api, so a delete cannot destroy a row. S2 domain→HTTP boundary intact (R-004). S3 TaskState naming intact (R-005). S4 no purge/TTL/expiry machinery was introduced, matching PROP-DEC-001 Q3-A (retain for process lifetime) — the only textual matches are inside compiled binaries. S5 store public shape: All() still returns every row ordered by CreatedAt and Get() still returns the row by id; the sole mutator change is Remove -> SoftDelete, exactly the crossing ADR-001 accepts. S6 backward-compatible migration: DeletedAt is a defaulted positional member, so every pre-existing 5-argument construction (including the four seeded tasks) still compiles and yields an active task — build is clean with 0 warnings and Seeded_tasks_are_active_with_null_deletedAt passes.

**VFY-002 — MINOR · FACT · HIGH · Pre-existing spec↔code divergence carried into the delta spec (not caused by this change)**
openspec/specs/task-api/spec.md (written by the archived add-task-query-filters change) requires ?status=/?priority= filters on GET /tasks, but the code at this worktree's base d27600f has none. The MODIFIED requirement in the delta spec restates those clauses verbatim, because an openspec MODIFIED block must carry the requirement's full text. This change neither implements nor verifies filtering; the divergence predates it and is out of its approved scope. Not a blocker: no contract statement of this change depends on it. Refs TRG-002 only in the sense that the delta spec exists because M1 raised openspec to 1.
Recommend Reconcile the base spec with the code (or land the filters) in a separate change; also route the .chaos/architecture.md boundary-posture line to cite ADR-001 via chaos:sync..

**VFY-003 — ADVISORY · FACT · HIGH · Human stop was mechanized — documented deviation**
No live human was available in this Stage-C step-5 measurement run. The C-11 floor approval stop (PROP-DEC-001) was recorded as a real decision entry with options, recommendation and answer, then resolved with an explicit maintainer-style rationale, status RESOLVED-IN-ARM, tagged 'resolved-in-arm (no live human; Stage-C step-5 mechanized run)'. Answering it constitutes the approval. Zero trigger-created stops arose at K2/K3/K4, so this is the only stop in the change. Recorded so a reader never mistakes an arm-resolved decision for a human-owned one (constitution §1, R-001).

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

READY, not READY_WITH_DEBT: build and the full suite were re-run independently and are green (10/10), all 10 contract statements are covered, and the Stage-C obligation audit closes clean — adr 2 is satisfied by docs/adr/ADR-001-soft-delete-store-shape.md (the only blocker that could have capped this verdict), openspec 1 by the strict-validated delta spec, verify 1 by the six data-store safeguard checks below, and the single floor stop (PROP-DEC-001) was surfaced and answered. No dimension decreased at any checkpoint, so no human override was needed or recorded.
