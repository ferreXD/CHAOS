---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: task-count
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-04T00:00:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T00:00:00Z"
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
    bodyHash: "sha256:50882db6bacbe3cca310bd801efe797bd4cda85138198173465e703bcfdad895"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T23:06:42Z", run: "RUN-2026-08-04-task-count-b1a", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T23:16:25Z", run: "RUN-2026-08-04-task-count-b1a", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T23:15:01Z", run: "RUN-2026-08-04-task-count-b1a", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "10/10"
      contract: "5/5"
      decisions: null
      traceability: "5/0/0"
      syncState: null
      archiveReadiness: READY
---

# task-count — Active-task count endpoint

## Intent

Add a lightweight aggregate endpoint that reports how many tasks exist. This is a read-only convenience for the dashboard; it introduces no authentication and no persistence-model change. Contract: add GET /tasks/count returning HTTP 200 with a JSON object {"count": <integer>} where count is the total number of tasks currently in the store; count must always equal the number of items returned by GET /tasks (same store, same moment); creating a task (POST /tasks, 201) increases count by exactly 1 and deleting a task (DELETE /tasks/{id}, 204) decreases count by exactly 1; the root health endpoint GET / and all existing /tasks CRUD behaviour are unchanged. Constraints: keep dotnet build and dotnet test green (the existing 5 tests must still pass); do not change unrelated behaviour of the CRUD endpoints; work only inside src/TaskTracker.Api and its tests (tests/TaskTracker.Tests).

## Contract

**Endpoint**

- [x] `GET /tasks/count` returns HTTP 200 with a JSON object `{ "count": <integer> }`, where `count` is the total number of tasks currently in the store.

**Invariants**

- [x] `count` always equals the number of items returned by `GET /tasks` for the same store at the same moment.
- [x] Creating a task (`POST /tasks`, 201) increases `count` by exactly 1.
- [x] Deleting a task (`DELETE /tasks/{id}`, 204) decreases `count` by exactly 1.

**Non-regression**

- [x] The root health endpoint `GET /` and all existing `/tasks` CRUD behaviour are unchanged: the 5 baseline tests still pass and `dotnet build` stays green.

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Actual invocation: skipped, openspec dimension 0 — the classification owes no OpenSpec artifact; the contract of record is change.md §Contract. This is the classified outcome, not degraded mode.

Classified depth: **0 — none owed**

Confidence impact: None. Depth 0 is the classified obligation.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint, protected files, minimum pre-edit behaviour | FACT |
| `.chaos/constitution.md` | behavioural principles + confidence doctrine | FACT |
| `.chaos/rules/index.md` | R-001..R-007, the executable constraints this change is checked against | FACT |
| `.chaos/architecture.md` | boundary model, data-access posture, non-goals — the posture doc passed to the classifier | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface the new route joins | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | the in-memory store whose item count the endpoint reports | FACT |
| `src/TaskTracker.Api/Program.cs` | composition root; GET / health endpoint that must stay unchanged | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline | FACT |

## Risk (strict)

Risk class: **LOW** — Additive, read-only route. No authentication, no persistence-model change, no change to any existing endpoint's behaviour, and no new dependency. Blast radius is one endpoint file plus tests.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | `GET /tasks/count` could be swallowed by the existing `GET /tasks/{id}` route and return 404 instead of 200. | Low | Medium | The existing by-id route carries a `:guid` route constraint, so the literal segment cannot match it; an integration test asserts 200 plus the JSON body shape. |
| RK-2 | The count could drift from `GET /tasks` if derived from a separate counter rather than the same store projection. | Low | Medium | The count is derived from the same `TaskStore.All()` projection the list endpoint uses; a test asserts equality of the two at the same moment. |
| RK-3 | Adding count state to the store's public shape would cross the architecture boundary posture (new behaviour belongs at the endpoint/query boundary). | Low | Medium | The endpoint computes the count at the HTTP boundary from the existing store projection; `Domain/**` is not modified, so R-004 and the boundary posture both hold. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `task-count aggregate endpoint (no OpenSpec artifact owed at depth 0)` | — | C-001, C-002, C-003, C-004 (4) | 1 work unit: map GET /tasks/count in TaskEndpoints.cs and add integration tests covering the response shape and the three invariants. |
| `non-regression of the existing surface` | — | C-005 (1) | Covered by the untouched 5-test baseline plus the deliver and verify build+test re-runs. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation for this measurement run: no live human is available. Every decision in this run is recorded in the ledger AND resolved by me with an explicit maintainer-style rationale, with status RESOLVED-IN-ARM and tagged 'resolved-in-arm (no live human; lever-run mechanized run)'. Answering the approves-change decision IS the approval. No preset flag was passed, so the run carries zero floors and the classifier's fired triggers alone set the rigor. The governance digest verified clean (digest.py --check exit 0), so the digest was read once in place of its fourteen source references. OpenSpec is owed at depth 0, so no OpenSpec artifact exists for this change by design — the contract of record is change.md §Contract, backed by records/contract.json. Recorded tooling note: this run passed no preset flag, so classification-state.json carries mode null and the L4 emitter stamped mode: null on this record; the renderer requires a string, so the record's mode reads 'light' — the zero-floor preset — as the honest string encoding of 'no preset given'. The only floor in force is the C-11 unconditional stops floor of 1, not a preset floor.

Confidence limiters:

- `[FACT · HIGH]` K1 fired M2 (data-store surface) because the predicted scope named Domain/TaskStore.cs; the adjudication pass raised nothing (scanSeq 2). Vector: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0.
- `[FACT · HIGH]` The M2 firing closed the L1-D11 easy gate at scan 1; every implementation unit in this run is performed at ceiling, not delegated to mid tier.
- `[INFERENCE · MEDIUM]` The additive route this change introduces is expected to fire M3 at the first K3 diff scan; the K1 adjudication deliberately did not pre-empt it (adjudication rule 12).

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 10/10 (the 5 baseline TaskEndpointsTests unchanged and green + 5 added in TaskCountEndpointTests) |
| contract | 5/5 statements covered |
| rules | R-001 ✅ · R-002 ✅ · R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskCountEndpointTests.cs` (new)

scope drift: **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json; the C-15-scoped diff touches exactly two of the paths declared in the K1 scope line

status: Delivered · 2026-08-03 · run: RUN-2026-08-04-task-count-b1a
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-001 | the single material question set is recorded as RUN-DEC-001 with options, recommendation, answer and folds: 3; resolved-in-arm under the run's documented no-live-human deviation rather than guessed in chat |
| R-002 | every verdict in the frame, deliver and verify records carries confidence / evidenceCoverage / assumptionLoad, and every finding carries a knowledge type |
| R-003 | dotnet test 10/10, 0 failed; the 5 baseline tests are unchanged in the diff and still pass |
| R-004 | no Domain/** file appears in the diff; the count is read at the endpoint boundary from TaskStore.All(), so domain code references no ASP.NET type |
| R-005 | no enum or contract rename in the diff; TaskState naming untouched, no TaskStatus introduced |
| R-006 | AGENTS.md and root README.md are absent from the diff — neither was edited nor silently written |

### Delivery notes

Every contract statement C-001..C-005 is delivered and covered by an executing integration test, build is clean (0 warnings, 0 errors) and tests are green at 10/10 with the 5 baseline tests untouched. The diff is exactly two files, both declared in the K1 scope, and M5 never fired across 7 scans — NO_DRIFT. No deviation from the approved framing was needed, so the deviations list is empty rather than decision-backed.

Two obligations fired late and were authored at the firing rather than at close, per the creator rule: M4 at K2 raised openspec 0 → 1 and the task-api delta spec was written before any further implementation; M3 at the first diff scan raised openspec 1 → 2 and the full OpenSpec set (proposal, design, tasks) was authored immediately, before the second work unit. The frame record honestly reports openspec depth 0 / NOT_INVOKED because that was the true classified state at framing time; a pass record is never rewritten, so the raised depth is reported here and in the verify record instead. adr settled at 1, below the threshold of 2, so no ADR is owed and none was written — the design rationale lives in openspec/changes/task-count/design.md. The second work unit exists because the self-review caught that ReadFromJsonAsync's case-insensitive web defaults would have accepted a 'Count' field; C-001 names the field exactly 'count', so the assertion was tightened to parse the raw JSON.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-04-task-count-b1a · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 10/10 — independent re-run by chaos-record (L4-D4); 5 pre-existing baseline tests plus 5 new count/health tests |
| contract | 5/5 ticked; C-001..C-005, each covered by an executing integration test |
| openspec | `validate --strict` PASS · `isComplete: true` |
| traceability | 5 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json; diff paths are exactly two of the K1-declared scope paths |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Count Tasks — GET /tasks/count returns 200 with { "count": <integer> } | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — group.MapGet("/count", ...) returning Results.Ok(new { count = store.All().Count }) | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Get_tasks_count_returns_200_with_an_integer_count | SATISFIED | HIGH |
| Count Tasks — count agrees with the item count of GET /tasks at the same moment | task-api | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — count derived from the same TaskStore.All() projection GET /tasks serializes | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Count_equals_the_number_of_tasks_returned_by_get_tasks | SATISFIED | HIGH |
| Count Tasks — POST /tasks (201) increases count by exactly 1 | task-api | no code change required: the count reads the live store projection, so a create is reflected on the next read | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Creating_a_task_increases_the_count_by_exactly_one | SATISFIED | HIGH |
| Count Tasks — DELETE /tasks/{id} (204) decreases count by exactly 1 | task-api | no code change required: the count reads the live store projection, so a delete is reflected on the next read | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Deleting_a_task_decreases_the_count_by_exactly_one | SATISFIED | HIGH |
| Count Tasks — GET / and existing /tasks CRUD behaviour are unchanged | task-api | additive route registration only; no existing route body, status code or payload shape is modified | tests/TaskTracker.Tests/TaskCountEndpointTests.cs::Root_health_endpoint_is_unchanged plus the 5 untouched TaskEndpointsTests | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Contract check: the route delta is purely additive**
Attributed to TRG-003 (M3 contract-surface, breaking false). The scan's own cite reads "route delta: added ['GET /count'] (additive)" and the diff shows exactly one added route registration — nothing removed, renamed or tombstoned. No existing client can break on this change.

**VFY-002 — ADVISORY · FACT · HIGH · Data-store check: no persistence-model change stands behind the M2 firing**
Attributed to TRG-001 (M2 sensitive-surface, data-store). M2 fired at K1 purely because the predicted scope line named Domain/TaskStore.cs. The delivered diff touches no Domain/** file at all: the count is computed at the endpoint boundary from the existing TaskStore.All() projection. The store's public shape, its seeding, and its non-durable in-memory character are unchanged, so the architecture's persistence non-goal is not approached. The firing is carried in the record, not retracted.

**VFY-003 — ADVISORY · FACT · HIGH · Invariant safeguard: count cannot drift from the task list**
Attributed to TRG-003 (M3 contract-surface). The central contract invariant C-002 is structural, not merely tested: the endpoint reads the same TaskStore.All() projection that GET /tasks serializes, so no second source of truth exists that could diverge. The design explicitly rejected a maintained counter for this reason (design.md D2).

**VFY-004 — ADVISORY · FACT · HIGH · The X2 firing is a verdict-vocabulary artefact, not a review failure**
Attributed to TRG-004 (X2, surface none), whose cite reads "self-review verdict 'PASS' != clean". The scan expects the literal token 'clean'; the loop instructions specify only --self-review <verdict> without naming the accepted vocabulary, so the token 'PASS' fired X2 mechanically. The substantive self-review found no defect. The firing was NOT suppressed and no dimension was lowered: review stands raised to 2 and the independent review pass it owes was performed at ceiling, re-checking scope drift, all six applicable rules, contract coverage and decision completeness — recorded in this record's rules and traceability blocks. Reported as a toolkit finding: the accepted self-review vocabulary should be documented or the token set widened.

**VFY-005 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth and deploy safeguards were not run, and are not owed**
No auth, integration or deploy-ops surface fired at any of the 7 scans, so credential-enforcement and deployment safeguards are N/A — asserted rather than silently skipped. The diff introduces no authentication, touches no secret or config key, adds no package reference, and changes no deployment material. This matches the change's stated intent and the architecture's auth non-goal.

**VFY-006 — ADVISORY · INFERENCE · HIGH · Accepted trade-offs: O(n) count and the 'active' vs 'total' wording gap**
Two accepted, recorded trade-offs rather than defects. (1) store.All() materializes and sorts the full list to return one integer — O(n) where an O(1) counter would do; accepted because the store is a single-instance in-memory demo store and the invariant's correctness outweighs the allocation (design.md, Risks). (2) The task is titled 'Active-task count endpoint' while its contract defines count as the TOTAL number of tasks, equal to unfiltered GET /tasks. The explicit contract governs and the delta spec records 'total' unambiguously, so no later reader has to guess; a filtered count remains available as a separate, decision-bearing change.

**VFY-007 — MINOR · FACT · HIGH · Toolkit defect: the renderer does not recognise the RUN-DEC-* prefix, so this change's decision is invisible in the rendered artifacts**
Not attributed to a trigger — found during the verification pass. tools/chaos-render/render.py lines 60 and 64 enumerate the decision-entry prefixes as (PROP|REV|APPLY|APP|VFY|VER|CR|SYNC|ARC|RETRO)-DEC-\d{3}|ESC-\d{3}. RUN is absent. The chaos-run skill mandates that every material answer be a RUN-DEC-* ledger entry, so a chaos:run change's decisions match nothing: the rendered change.md Decision-event audit reads '0 entries' and lifecycle.current.decisions renders null, while the same ledger read by tools/chaos-classify/audit.py correctly reports '1 entry, all resolved' and 'stops.placed-have-entries: 1 ledger entry vs 1 placed stop(s)'. Two governance tools therefore disagree about whether this change has any decisions. Per the digest, this prefix list is the canonical scan rule governing lifecycle.current.decisions, the chaos:archive closure matrix and sync reconciliation, so the gap reaches beyond cosmetics. NOT worked around here: renaming the entry to a recognised prefix would violate the chaos-run contract, and hand-editing the rendered file would violate writer rule 1, so the ledger and the records are left correct and the renderer's prefix list is reported as the thing to fix. Impact on this change is presentational only — the audit gate, which is the authority on obligations, passed with the entry counted.

### Decision-event audit

0 entries: . No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed and was run inside the loop, attributed to the surfaces that actually fired (M2 data-store, M3 contract-dependency, M4 process, X2 review). The L4 emitter re-ran build and tests independently of the work loop: build 0 warnings / 0 errors, tests 10/10, openspec strict validation PASS. Every contract statement C-001..C-005 is covered by an executing test, the route delta is confirmed purely additive, and the M2 data-store firing is confirmed to have no persistence-model substance behind it. Nothing is deferred and no debt is carried, so READY rather than READY_WITH_DEBT.
