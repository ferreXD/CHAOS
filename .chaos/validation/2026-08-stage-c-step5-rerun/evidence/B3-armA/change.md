---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: enforce-title-max-length
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-03T09:20:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-03T09:20:00Z"
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
    bodyHash: "sha256:68d318f9a0523fbe7ded87d8a3918870c9e11198bf4af4c0cacaceecc7f5ab66"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-03T08:48:52Z", run: "RUN-2026-08-03-chaos-propose-enforce-title-max-length-7ecd20", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-03T09:05:00Z", run: "RUN-2026-08-03-chaos-apply-enforce-title-max-length-9d431b", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-03T09:20:00Z", run: "RUN-2026-08-03-chaos-verify-enforce-title-max-length-79982d", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "10/10"
      contract: "6/6"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: READY
---

# enforce-title-max-length — Enforce a maximum title length of 200 characters

## Intent

Task titles are unbounded today; add a 200-character upper bound as request-level input validation.
POST /tasks and PUT /tasks/{id} reject longer titles with HTTP 400 and change nothing; exactly 200 is accepted.
Request-validation convenience only: no auth, no persistence-model change, no new endpoints or dependencies.

## Contract

**rejection**

- [x] POST /tasks with a title longer than 200 characters is rejected with HTTP 400 Bad Request and creates no task.
- [x] PUT /tasks/{id} with a title longer than 200 characters is rejected with HTTP 400 Bad Request and leaves the stored task unmodified.

**acceptance**

- [x] A title of exactly 200 characters is accepted: POST /tasks returns 201 Created and PUT /tasks/{id} returns 200 OK.

**regression**

- [x] The existing blank/whitespace-only title rejection (HTTP 400) is preserved for both POST /tasks and PUT /tasks/{id}.
- [x] Normal-length titles and the other CRUD endpoints (GET list, GET by id, DELETE) behave exactly as before: the 5 baseline tests stay green and dotnet build reports 0 errors.
- [x] The 200-character bound is enforced at the HTTP endpoint boundary; Domain/** is unchanged, references no ASP.NET types (R-004), and the TaskState naming is untouched (R-005).

OpenSpec: `openspec/changes/enforce-title-max-length/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **NOT_INVOKED**

`openspec status --change enforce-title-max-length --json` reports `isComplete: true`; skipped, openspec dimension 0 — K1 (scan + adjudication) fired zero triggers, so under design C-10/C-13 the change owes no OpenSpec artifacts; the contract lives in change.md Contract and records/contract.json. Nothing is owed and nothing is missing..

Confidence impact: none — this is the zero-trigger base, not a degraded mode; the openspec CLI was never needed and its absence is not a trigger.

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Documented deviation: no live human is available in this measurement run. PROP-DEC-001 was recorded as a real decision entry and resolved with an explicit maintainer-style rationale, status RESOLVED-IN-ARM, tagged resolved-in-arm (no live human; Stage-C step-5 mechanized run). Answering the approves-change entry IS the approval. OpenSpec was skipped deliberately at the classified depth (openspec dimension 0, C-10 zero-base): the contract lives in this change's Contract section and in records/contract.json, and no openspec/changes/enforce-title-max-length/ folder was created.

Confidence limiters:

- `[ASSUMPTION · HIGH]` "200 characters" is read as .NET string.Length (UTF-16 code units), not text elements/runes. Recorded in PROP-DEC-001; no posture line guards text-element semantics.
- `[FACT · HIGH]` Stage-C checkpoint K1 fired zero triggers (scan + adjudication); dimension vector stops 1 / evidence.targeted 0 / evidence.breadth 0 / review 0 / verify 0 / openspec 0 / adr 0, classification confidence HIGH.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 10/10 (5 baseline tests unchanged and green + 5 new tests for the 200-character bound) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — K3 M5 scan found no path outside the approved scope; the diff is exactly the two approved implementation files plus this change's own governance folder.

status: Delivered · 2026-08-03 · run: RUN-2026-08-03-chaos-apply-enforce-title-max-length-9d431b
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 10/10, including the 5 unmodified baseline tests |
| R-004 | validation lives in Endpoints/TaskEndpoints.cs; Domain/** unchanged and references no Microsoft.AspNetCore.* type |
| R-005 | TaskState naming untouched; no TaskStatus symbol introduced anywhere in the diff |
| R-006 | AGENTS.md and root README.md are not in the diff — no protected-file edit was made or proposed |

### Coverage honesty — how each contract statement was evidenced

5 of 6 statements are covered by a passing test. 1 are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| The 200-character bound is enforced at the HTTP endpoint boundary; Domain/** is unchanged, references no ASP.NET types (R-004), and the TaskState naming is untouched (R-005). | src/TaskTracker.Api/Endpoints/TaskEndpoints.cs (MaxTitleLength + ValidateTitle); src/TaskTracker.Api/Domain/ (unchanged in the diff) | A layering claim is not observable over HTTP: no integration test can assert that Domain/** carries no ASP.NET reference. Evidenced instead by the diff (Domain/** has zero changed lines in the K3 numstat) and by direct inspection of Domain/TaskItem.cs and Domain/TaskStore.cs, which use only System types and keep the TaskState naming. |

### Delivery notes

Every contract statement is covered — five by integration tests over real HTTP, one (C-006) by direct code evidence — build is 0 warnings / 0 errors and the suite is 10/10 with the 5 baseline tests unchanged and still passing. No deviations, no scope drift, no new stop at K3.

Stage-C checkpoints: K2 (scan-only, C-12) fired nothing — the ledger holds 1 decision entry, below the M4 threshold of 2. K3 (scan + adjudication) fired X1 blast-radius by scan on 8 files / 360 LOC, recorded as TRG-001; the adjudication pass declined all materiality raises (M1: the guard sits beside the existing blank-title check at the endpoint boundary, Domain/** untouched, no non-goal approached; M2: no credential/key/PII/persistence material in the diff; M3: no route-marker delta, no dependency manifest edit, no contract artifact, nothing removed or renamed; M4/M5: below threshold / no spill). X1 is mechanical, so it raised review 1, verify 1 and evidence.breadth 1 and placed no stop — newStops was 0 and no stopSatisfiedBy was reported, so no decision needed to be surfaced at DELIVER. Obligations honored before completing DELIVER: evidence.breadth 1 was discharged by reading the whole touched module (Program.cs composition, Endpoints/TaskEndpoints.cs, Contracts/TaskRequests.cs, Domain/TaskItem.cs, Domain/TaskStore.cs) to confirm zero fan-out beyond the endpoint layer; openspec stayed 0 (family law: a mechanical trigger never moves openspec/adr/stops/evidence.targeted), so no OpenSpec artifacts are owed and none were created. The 8-file K3 numstat covered src/, tests/ AND this change's own .chaos/changes/enforce-title-max-length/ governance artifacts (6 of the 8 files); over src/+tests/ alone the diff is 2 files / 108 LOC and X1 would not have fired. Files listed below are the implementation files only; the governance artifacts under .chaos/changes/enforce-title-max-length/ were also written this pass.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-03 · run: RUN-2026-08-03-chaos-verify-enforce-title-max-length-79982d · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — re-run independently at verify |
| tests | 10/10 — re-run independently at verify; 5 baseline + 5 new |
| contract | 6/6 ticked; 5 test-evidenced, 1 (C-006) code-evidenced with whyNotTest recorded in the deliver record |
| scope drift | **NO_DRIFT** — K3 M5 scan clean: every diff path lies inside the approved scope. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Findings

**VFY-001 — ADVISORY · FACT · HIGH · The renderer prints an OpenSpec folder pointer in change.md even though the classified openspec dimension is 0 and no such folder exists**
change.md's Contract section ends with `OpenSpec: openspec/changes/enforce-title-max-length/ - decisions: see decision-events.md`, emitted unconditionally by tools/chaos-render/render.py. Under Stage-C C-10 this change owes no OpenSpec artifacts (no TRG-* materiality event fired; TRG-001 is mechanical and by the family law cannot move openspec), and none were created, so the pointer names a path that does not exist. The rendered artifact is renderer-owned and was deliberately NOT hand-edited. Toolkit defect in the Stage-B renderer's Stage-C awareness, not a defect in this change.
Recommend Make the pointer line conditional on the frame record's openspec status (suppress it, or state 'OpenSpec: none owed (openspec dimension 0)', when status is NOT_INVOKED with isComplete true). Candidate for the step-6 trim..

**VFY-002 — ADVISORY · FACT · HIGH · X1 fired only because the change's own governance artifacts were counted in the K3 numstat**
TRG-001 cites 8 files / 360 LOC against the review1 threshold of 8 files. Six of those eight files are this change's own governance artifacts (change.md, lifecycle.md, decision-events.md, classification-state.json, records/contract.json, records/frame.pass-01.facts.json); over src/ + tests/ alone the diff is 2 files / 108 LOC, which is under both X1 thresholds. The numstat scope followed the chaos-apply skill's literal instruction (git diff against the pre-apply base, which in a normal repo includes the change folder), and it is reported here rather than tidied away. The consequence is a self-referential blast-radius signal: being governed at all can push a two-file change over the X1 file threshold, which is the over-detection direction the design's section 7 warns about.
Recommend Decide explicitly, with this data, whether the K3 numstat should exclude .chaos/changes/<id>/** (the change's own bookkeeping) before X1 thresholds are applied. Step-6 trim input; the alternative reading is to raise the review1 file threshold..

**VFY-003 — ADVISORY · ASSUMPTION · HIGH · "200 characters" is implemented as UTF-16 code units**
The bound is string.Length, so a title of 200 astral-plane characters (surrogate pairs) is rejected as 400 code units. The assumption was named in the approval entry rather than taken silently, no posture line guards text-element semantics, and the pinned contract states a flat character budget for an input-validation convenience.
Recommend No action. Revisit only if a requirement for grapheme-accurate limits appears..

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

READY. Build and tests were re-run independently at this phase (0/0, 10/10) and every one of the six contract statements is covered. The Stage-C obligation audit is clean against the final dimension vector stops 1 / evidence.targeted 0 / evidence.breadth 1 / review 1 / verify 1 / openspec 0 / adr 0: adr 0 means no ADR gates READY; openspec 0 means no delta or full set is owed, and none was created; verify 1 was discharged by the X1-attributed safeguard checks (fan-out, boundary, naming, protected files, scope drift); review 1 was discharged as a focused review folded into this verify pass rather than a standalone one, exactly as level 1 prescribes; the single placed stop (the C-11 floor approval) was surfaced as PROP-DEC-001 and answered, and no checkpoint reported newStops > 0; dimensions were monotone across K1 -> K2 -> K3 -> K4 with no decrease and therefore no human override was needed. The two open findings are advisory observations about the toolkit and the instrumentation, not defects in the delivered change.
