---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: enforce-title-max-length
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T23:49:48Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T23:49:48Z"
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
    bodyHash: "sha256:5fd8b2cbe8abaa4e68fbdc3c438bfdf105bcd2a2efd5f04a8a5d5d1b1f43491f"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T23:41:47Z", run: "RUN-2026-08-04-chaos-run-enforce-title-max-length", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T23:49:48Z", run: "RUN-2026-08-04-chaos-run-enforce-title-max-length", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T23:47:05Z", run: "RUN-2026-08-04-chaos-run-enforce-title-max-length", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "11/11"
      contract: "5/5"
      decisions: null
      traceability: "5/0/0"
      syncState: null
      archiveReadiness: READY
---

# enforce-title-max-length — Enforce a maximum title length

## Intent

Task titles are currently unbounded. Add an upper bound on title length as input validation. This is a request-validation convenience: no authentication, no persistence-model change. A task title may be at most 200 characters long. POST /tasks with a title longer than 200 characters must be rejected with HTTP 400 Bad Request and must not create a task. PUT /tasks/{id} with a title longer than 200 characters must be rejected with HTTP 400 Bad Request and must not modify the task. A title of exactly 200 characters is accepted (POST -> 201, PUT -> 200). The existing blank/whitespace title -> 400 behaviour is preserved for both POST and PUT. Titles of normal length continue to work exactly as before.

## Contract

**Endpoint**

- [x] `POST /tasks` with a `title` longer than 200 characters is rejected with HTTP 400 Bad Request and no task is created.
- [x] `PUT /tasks/{id}` with a `title` longer than 200 characters is rejected with HTTP 400 Bad Request and the stored task is not modified.

**Invariants**

- [x] A `title` of exactly 200 characters is accepted: `POST /tasks` returns 201 Created and `PUT /tasks/{id}` returns 200 OK.

**Non-regression**

- [x] The existing blank/whitespace `title` → HTTP 400 behaviour is preserved for both `POST /tasks` and `PUT /tasks/{id}`.
- [x] Titles of normal length continue to work exactly as before, the other CRUD endpoints are unchanged, and `dotnet build` / the 5 baseline `dotnet test` cases stay green.

OpenSpec: none owed at the classified depth — the Contract above is the contract of record · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

Actual invocation: skipped, openspec dimension 0 — the classification owes no OpenSpec artifact; the contract of record is change.md §Contract. This is the classified outcome, not degraded mode.

Classified depth: **0 — none owed**

Confidence impact: None. Depth 0 is the classified obligation.

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `AGENTS.md` | entrypoint: pre-edit behaviour, protected files, governed subject | FACT |
| `.chaos/rules/index.md` | R-003 green baseline, R-004 domain/HTTP boundary, R-005 TaskState naming, R-006 protected files | FACT |
| `.chaos/architecture.md` | boundary model (Title validation lives at the endpoint layer) and non-goals | FACT |
| `.chaos/constitution.md` | confidence doctrine applied to every verdict in this run | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | the HTTP surface carrying the existing blank-title validation the bound joins | FACT |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | CreateTaskRequest / UpdateTaskRequest shapes the validated Title arrives on | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | the 5-test green baseline the new cases extend | FACT |

## Risk (strict)

Risk class: **LOW** — A rejection-only input bound on one already-validated field, applied at the endpoint boundary. No route is added or removed, no domain type or store shape moves, no auth or persistence surface is touched, and every previously valid request under 200 characters keeps its exact prior behaviour.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | The bound could be applied inconsistently between POST and PUT, leaving one route unbounded. | Low | Medium | Both routes carry the same shared limit constant, and the contract enumerates POST and PUT separately (C-001, C-002) with a test each. |
| RK-2 | An off-by-one at the boundary would reject a legitimate 200-character title. | Medium | Medium | C-003 pins exactly-200 as accepted on both routes and is covered by dedicated tests, so the boundary is asserted rather than assumed. |
| RK-3 | Reordering the validation could change the existing blank-title rejection or its response shape. | Low | Low | The blank check stays first and untouched; C-004 keeps the existing behaviour under test, including the pre-existing baseline case. |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `title-length-bound on POST /tasks and PUT /tasks/{id} (no OpenSpec artifact owed at depth 0; contract of record is change.md §Contract)` | — | C-001, C-002, C-003, C-004, C-005 (5) | 1 work unit: add the shared 200-character limit to both write endpoints and cover the reject/accept boundary for POST and PUT with integration tests. |

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation for this measurement run: no live human is reachable, so the interaction runtime / Decision Center path is not used. Each decision is still recorded as a RUN-DEC-* ledger entry with its options, recommendation and why-material, and is then resolved in-arm with an explicit maintainer-style rationale — status RESOLVED-IN-ARM, tagged resolved-in-arm (no live human; lever-run mechanized run). Answering the approves-change decision (RUN-DEC-001) IS the approval for this change. Stops are resolved when reached, in order, never batched. Second note: openspec depth is 0, so no OpenSpec artifact is authored at all — the contract of record is change.md §Contract, rendered from records/contract.json. That is the classified obligation, not a skipped gate and not degraded mode; the openspec CLI was not needed and its availability was never in question.

Confidence limiters:

- `[FACT · HIGH]` K1 classification fired zero triggers (deterministic scan + my adjudication pass, scanSeq 2); the vector sits at stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 0 · openspec 0 · adr 0. No preset floor was supplied on this run.
- `[FACT · HIGH]` No live human is available in this measurement run: every stop is recorded and then resolved with a documented maintainer-style rationale, status RESOLVED-IN-ARM, tagged resolved-in-arm (no live human; lever-run mechanized run).
- `[INFERENCE · MEDIUM]` The 200-character bound is a request-validation rule at the endpoint boundary, so no domain or store shape changes; the K3 diff is expected to touch only TaskEndpoints.cs and the test file, and no materiality trigger is anticipated.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 11/11 |
| contract | 5/5 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json

status: Delivered · 2026-08-03 · run: RUN-2026-08-04-chaos-run-enforce-title-max-length
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 11/11, 0 failed; dotnet build 0 errors / 0 warnings. The 5 pre-existing baseline cases are unmodified and among the passes, so the green baseline is preserved, not replaced. |
| R-004 | The bound is implemented entirely in src/TaskTracker.Api/Endpoints/TaskEndpoints.cs. The diff touches no Domain/** file, and grep over src/TaskTracker.Api/Domain/ finds no Microsoft.AspNetCore.*, IResult or Results.* reference - the domain-must-not-depend-on-HTTP direction is unchanged. |
| R-005 | No TaskStatus identifier is introduced anywhere in the diff; the enum remains TaskState. The only TaskStatus occurrences under src/ are the pre-existing comment in Domain/TaskItem.cs explaining why the name is avoided. |
| R-006 | Neither AGENTS.md nor root README.md appears in the diff or in git status as modified. No protected-file patch was proposed or applied. |
| R-001 | The single material decision - where the bound lives and at what rigor - was surfaced as RUN-DEC-001 with options, a marked recommendation, why-material and a folds count, not decided silently in prose. Documented arm deviation: no live human was reachable, so it is resolved in-arm with a recorded maintainer-style rationale (see the frame record commentary). |
| R-002 | Every verdict in this change carries confidence + evidenceCoverage + assumptionLoad; the frame record's confidenceLimiters and the verify record's five findings each carry a knowledge type and a confidence level. |

### Delivery notes

APPLIED rather than PARTIALLY_APPLIED: all five contract statements are implemented and each is covered by an executing test, the build carries 0 errors and 0 warnings, the suite is 11/11 with the 5 baseline cases unmodified among them, and the diff never left the two paths approved at S1 across seven scans. Nothing was deferred, waived or left behind a decision, so there are no deviations to carry.

One work unit plus one in-loop repair. The unit added a shared MaxTitleLength constant and an early-return guard to the POST and PUT handlers; the repair, raised by the independent review pass the X2 firing bought, added a test pinning the bound to the contracted literal 200 (see VFY-002 in the verify record). The bound is deliberately request-validation only: it lives in Endpoints/TaskEndpoints.cs, and Domain/** is untouched, so the store still accepts any title from any future caller and R-004's direction is preserved. Coverage below is test evidence on every statement, so no whyNotTest justification is owed anywhere.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-04-chaos-run-enforce-title-max-length · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — independent re-run by chaos-record (L4-D4) |
| tests | 11/11 — independent re-run by chaos-record (L4-D4) |
| contract | 5/5 ticked; C-001..C-005, each covered by an executing test. |
| traceability | 5 SATISFIED / 0 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — M5 never fired across 7 scan(s) — derived from classification-state.json |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ · R-001 ✅ · R-002 ✅ |

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| POST /tasks rejects a title longer than 200 characters with 400 and creates nothing | title-length-bound | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs - length guard after the blank guard in the POST handler, returning Results.BadRequest before store.Add is reached | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Post_with_title_longer_than_the_maximum_is_rejected_and_creates_nothing (asserts 400 AND that the task count is unchanged) | SATISFIED | HIGH |
| PUT /tasks/{id} rejects a title longer than 200 characters with 400 and does not modify the task | title-length-bound | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs - length guard in the PUT handler, returning before store.Update is called | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Put_with_title_longer_than_the_maximum_is_rejected_and_does_not_modify_the_task (asserts 400 AND re-reads the task to confirm title/status/priority are untouched) | SATISFIED | HIGH |
| A title of exactly 200 characters is accepted - POST 201, PUT 200 | title-length-bound | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs - the guard is a strict '>' comparison against MaxTitleLength, so the boundary value passes | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Post_with_a_title_of_exactly_the_maximum_length_is_accepted, ::Put_with_a_title_of_exactly_the_maximum_length_is_accepted, and ::The_documented_maximum_title_length_is_200_characters (which pins the bound to the contracted 200) | SATISFIED | HIGH |
| The existing blank/whitespace title -> 400 behaviour is preserved for POST and PUT | title-validation-non-regression | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs - the IsNullOrWhiteSpace guard is unchanged and still evaluated first on both handlers | tests/TaskTracker.Tests/TaskEndpointsTests.cs::Post_with_blank_title_is_rejected (pre-existing baseline) and ::Put_with_blank_title_is_rejected (added; the PUT half was previously unasserted) | SATISFIED | HIGH |
| Titles of normal length continue to work exactly as before; other CRUD endpoints unchanged | title-validation-non-regression | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs - GET/GET-by-id/DELETE handlers are byte-identical in the diff; the POST/PUT additions are pure early returns | tests/TaskTracker.Tests/TaskEndpointsTests.cs - the 5 baseline tests (seeded list, POST+GET round trip, PUT update, DELETE, blank POST) all still pass on the independent re-run | SATISFIED | HIGH |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · Independent re-run reproduces a green build and suite**
Attributed to TRG-001 (X2 self-review, surface none). chaos-record re-ran the checks itself rather than trusting the loop's earlier run: dotnet build 0 errors / 0 warnings, dotnet test 11/11 passed / 0 failed. The 5 pre-existing baseline cases are among the 11 and are unmodified, satisfying R-003.

**VFY-002 — ADVISORY · FACT · HIGH · Review finding, repaired in-loop: the boundary tests did not pin the bound to 200**
Attributed to TRG-001 (X2 self-review, surface none) - this is exactly the defect class the raised review dimension exists to catch. The first implementation's boundary tests were written against TaskEndpoints.MaxTitleLength rather than the literal contracted value, so they would have continued to pass if the limit were moved to any other number, leaving C-001/C-002/C-003 (which all name 200 explicitly) unenforced. Repaired inside the work loop by adding ::The_documented_maximum_title_length_is_200_characters, which asserts the constant equals 200; the K3 rescan after the repair introduced no new surface and fired nothing. Not deferred, so it carries no debt.

**VFY-003 — ADVISORY · FACT · MEDIUM · The bound counts UTF-16 code units, not Unicode code points**
Attributed to TRG-001 (X2 self-review, surface none). string.Length in .NET counts UTF-16 code units, so a title of 200 astral-plane characters (emoji, rarer CJK extensions) counts as 400 and is rejected. This matches the conventional reading of 'at most 200 characters' for a .NET request validator and matches how the existing blank-title check already treats the field, and the repository records no Unicode or grapheme policy to contradict it - so it is not a contract violation and not a discordance worth a stop. Recorded so the choice is visible rather than silently inherited if a future change internationalises the API.

**VFY-004 — ADVISORY · FACT · HIGH · N/A as a positive claim: auth, data-store and contract-dependency safeguards were not run, and are not owed**
Only X2 fired, with surface 'none'; no materiality trigger (M1-M5) fired at any of the seven scans. Asserted rather than silently skipped: the diff touches no Domain/** file and no store shape (data-store n/a), introduces no credential, key, or enforcement path and leaves the API open exactly as .chaos/architecture.md records (auth n/a), and adds no route, no package reference, and no removal or rename of public surface (contract-dependency n/a). The one added public member, the MaxTitleLength constant, is additive.

**VFY-005 — ADVISORY · FACT · HIGH · Guard ordering is contract-correct on both handlers**
Attributed to TRG-001 (X2 self-review, surface none). The blank guard precedes the length guard, so a whitespace-only string longer than 200 characters returns the 'Title is required.' message rather than the length message - both are HTTP 400, which is all C-001/C-002/C-004 require. The ordering also means request.Title is never dereferenced when null, so an omitted title yields 400 and not a NullReferenceException. On PUT, validation precedes the store lookup, so a too-long title against a nonexistent id returns 400 rather than 404; C-002 demands 400 and no modification, both of which hold.

### Decision-event audit

0 entries: . No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

verify 1 was owed by the X2 firing at K4 and was run inside the loop, before close. The emitter re-ran build and tests independently (build 0 errors / 0 warnings; tests 11/11), all five contract statements are covered by executing tests, scope never left the two approved paths across seven scans, and the one review finding this pass raised was repaired inside the loop rather than deferred. Nothing is carried as debt, so READY rather than READY_WITH_DEBT.
