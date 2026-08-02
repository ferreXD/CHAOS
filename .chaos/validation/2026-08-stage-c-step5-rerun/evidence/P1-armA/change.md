---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: require-api-key-auth
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-02T22:28:00Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-02T22:28:00Z"
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
    bodyHash: "sha256:e3ce53eed6cf8dc95126265a1b8fbdbda9c25aebd90045e707bd7ae8502e5ba0"
  lifecycle:
    status: Delivered
    phases:
      frame:   { status: complete, at: "2026-08-02T22:22:00Z", run: "RUN-2026-08-03-chaos-propose-require-api-key-auth-8953c4", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: complete, at: "2026-08-02T22:25:00Z", run: "RUN-2026-08-03-chaos-apply-require-api-key-auth-4ada5c", mode: light, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-02T22:28:00Z", run: "RUN-2026-08-03-chaos-verify-require-api-key-auth-b2519f", mode: light, verdict: READY }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: "16/16"
      contract: "6/6"
      decisions: 1
      traceability: null
      syncState: null
      archiveReadiness: READY
---

# require-api-key-auth — Require API-key authentication on the task endpoints

## Intent

Close the open /tasks surface: every /tasks request must present a valid X-Api-Key header.
Key comes from configuration key ApiKey, defaulting to test-secret-key when unset; bad or missing key is 401 before any store access.
GET / stays public and the existing visible test suite is updated to supply the key and stay green.

## Contract

**auth-enforcement**

- [x] Every /tasks route (GET /tasks, GET /tasks/{id}, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}) requires a valid API key in the X-Api-Key request header.
- [x] A /tasks request with a missing or incorrect X-Api-Key header is rejected with HTTP 401 Unauthorized.
- [x] The key check runs before existence and payload-validation checks: a rejected request reads or mutates no task (an unknown id with no key returns 401, not 404; a blank-title POST with no key returns 401, not 400).

**configuration**

- [x] The valid API key is the string value of configuration key ApiKey, defaulting to test-secret-key when that configuration value is not set.

**compatibility**

- [x] The root health endpoint GET / stays public — no API key required.
- [x] CRUD behaviour of the /tasks endpoints is otherwise unchanged for authenticated callers, the visible test suite supplies the key, and dotnet build + dotnet test stay green (R-003), with Domain/** free of ASP.NET references (R-004) and TaskState naming intact (R-005).

OpenSpec: `openspec/changes/require-api-key-auth/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `openspec` CLI 1.6.0 (openspec/config.yaml)

Actual invocation: delta-only depth (classified openspec dimension 1): delta spec hand-authored at openspec/changes/require-api-key-auth/specs/task-api/spec.md exactly as the frozen baseline does, then validated with the openspec CLI. No proposal.md/tasks.md/design.md — the full set is not owed (C-13: M1 and M2 both cite surface auth, so they are correlated, not distinct).

Generated OpenSpec artifacts:

- `openspec/changes/require-api-key-auth/specs/task-api/spec.md`

`openspec status --change require-api-key-auth --json` reports `isComplete: true`; Delta spec present with one ADDED requirement and six scenarios covering C-001..C-005..

Validation command: `openspec validate require-api-key-auth --strict`

Validation result: **PASS** — "Change 'require-api-key-auth' is valid"

Confidence impact: None — the classified depth was met and validated.

## Framing record

verdict: READY_FOR_REVIEW · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW

Stage-C, no preset flag: zero floors. K1 classification fired M2 (scan, auth) and M1 (adjudication, auth) — dimension vector stops 1 / evidence.targeted 1 / evidence.breadth 0 / review 0 / verify 1 / openspec 1 / adr 2, classification confidence MEDIUM (adjudication used). newStops 0: both K1 materiality firings folded their named questions into the mandatory floor approval stop (design law 2), so PROP-DEC-001 carries all three folded questions. OpenSpec depth 1 (delta only) because M1 and M2 cite the SAME surface class `auth` — C-13 correlated-pair rule, not the full set. adr 2 is discharged by docs/adr/ADR-001-api-key-authentication.md. DOCUMENTED DEVIATION: no live human was available in this measurement run; PROP-DEC-001 was recorded as a real decision entry and resolved with a documented maintainer-style rationale, status RESOLVED-IN-ARM, tagged resolved-in-arm (no live human; Stage-C step-5 mechanized run). Answering that entry IS the approval.

Confidence limiters:

- `[ASSUMPTION · MEDIUM]` The classifier's own confidence is MEDIUM because the M1 firing came from the adjudication layer rather than a deterministic signal; the crossing itself is FACT (two explicit posture lines in .chaos/architecture.md).

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build`) |
| tests | 16/16 (Baseline was 5; 11 new cases (the 5-case route theory plus 6 facts) cover the auth contract.) |
| contract | 6/6 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

files: `src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs` (new), `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`

scope drift: **NO_DRIFT** — Diff (3 files, +173/-7) is a strict subset of the approved scope; K3's M5 detector confirmed no spill. src/TaskTracker.Api/Program.cs was predicted but proved unnecessary — the filter is registered on the /tasks group inside MapTaskEndpoints, so the composition root did not have to change.

status: Delivered · 2026-08-02 · run: RUN-2026-08-03-chaos-apply-require-api-key-auth-4ada5c
result: APPLIED · execution confidence: HIGH · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | dotnet test 16/16 green; the 5 baseline tests were updated to present the key, not weakened. |
| R-004 | Enforcement lives in src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs (HTTP layer). The diff touches no file under Domain/**; domain gains no ASP.NET reference. |
| R-005 | No enum or domain type renamed; TaskState naming untouched by the diff. |
| R-006 | AGENTS.md and root README.md are unmodified (not in the diff). |

### Delivery notes

All six contract statements are covered by executed integration tests; build is 0 warnings / 0 errors and the suite is 16/16 green (5 pre-existing CRUD tests, updated to present the key, plus 11 new auth cases). No deviation from the approved contract and no scope drift.

Stage-C checkpoints: K2 at entry fired nothing (one material decision in the ledger, below M4's threshold of 2) — dimensions unchanged. K3 at DELIVER end fired nothing new; M2 appears as a scanEcho (the actual diff re-evidences the K1 firing) and newStops is 0, so no mid-flight stop was owed. The approved contract's precedence requirement (401 before existence/validation) is met structurally: enforcement is an endpoint filter on the /tasks group, which ASP.NET runs before the route handler, so no store read or mutation can precede it. GET / is registered outside the group and is untouched.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY · confidence: HIGH · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY
verified: 2026-08-02 · run: RUN-2026-08-03-chaos-verify-require-api-key-auth-b2519f · mode: light

| check | result |
|---|---|
| build | 0 warn / 0 err — Re-run independently at verify. |
| tests | 16/16 — Re-run independently at verify; identical to the deliver pass. |
| contract | 6/6 ticked; Every statement covered by test evidence in the deliver record; each ref re-checked against the test file. |
| openspec | `validate --strict` PASS · `isComplete: true` |
| scope drift | **NO_DRIFT** — K3's M5 detector reported no spill; the diff is a subset of the approved scope. |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-006 ✅ |

### Findings

**VFY-001 — MINOR · FACT · HIGH · Auth-surface safeguard checks (verify 1, attributed to TRG-001/TRG-002) all pass**
Trigger refs: TRG-001 (M2 sensitive-surface, scan, auth) and TRG-002 (M1 posture-crossing, adjudication, auth) raised verify to 1, so the auth family of checks was run. (a) Enforcement coverage: all five /tasks routes are registered on the MapGroup("/tasks") builder that carries AddEndpointFilter<ApiKeyEndpointFilter>(); no /tasks route bypasses it. (b) Public surface: the only route outside the group is the health endpoint GET / in Program.cs, which is public by contract C-005 and tested. (c) Ordering: enforcement is an endpoint filter, which ASP.NET runs before the route handler, so 401 structurally precedes existence and validation checks (tested for both the 404 and 400 paths). (d) Key material: no key is committed to appsettings.json; the only literal is the contract-mandated development default constant. (e) No logging or echoing of presented or expected key material. (f) Comparison is fixed-time (CryptographicOperations.FixedTimeEquals), so a wrong key cannot be probed byte by byte. (g) An empty X-Api-Key header value is rejected, not treated as a match.
Recommend None — no action required..

**VFY-002 — ADVISORY · FACT · HIGH · The test-secret-key fallback is a development default and must be overridden in any real deployment**
Contract statement C-004 mandates the fallback, so this is accepted behaviour, not a defect. It is recorded because the M1 posture crossing (TRG-002) makes the auth posture newly load-bearing: leaving ApiKey unset ships a publicly known key. ADR-001 already records this as a consequence ('Any real deployment must set ApiKey in configuration'). Single shared key, no rotation, no per-caller identity — authorization and multi-tenancy remain non-goals.
Recommend Set ApiKey in deployment configuration; revisit key rotation/identity if the demo ever grows real callers..

**VFY-003 — MINOR · FACT · HIGH · Obligation audit against the final dimension vector is clean**
Final vector: stops 1 / evidence.targeted 1 / evidence.breadth 0 / review 0 / verify 1 / openspec 1 / adr 2 (classification-state.json after K4). adr 2 => docs/adr/ADR-001-api-key-authentication.md exists, so no READY block and no debt. openspec 1 => openspec/changes/require-api-key-auth/specs/task-api/spec.md exists and validates strict; the full set is correctly NOT owed because M1 and M2 both cite surface `auth` (C-13 correlated pair). verify 1 => the auth-attributed checks in VFY-001 were run. stops: exactly one placed stop (K1:floor-approval), surfaced and answered as PROP-DEC-001; newStops was 0 at K2, K3 and K4, and no stopSatisfiedBy was claimed. Monotonicity: dimensions rose only at K1 (M2 then M1) and never decreased at K2/K3/K4; no human override was recorded or needed. Legacy escalation shapes (ESC-*, escalatedFrom, the H1 warning) are correctly absent under Stage C.
Recommend None..

### Decision-event audit

1 entries: 1 `PROP-DEC`. No OPEN entry. Sync actions declared and syncable: `CREATE_ADR`. Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`

### Why READY and not NOT_READY

READY. Build and tests were re-run independently (0/0, 16/16) and every contract statement is ticked by an executed test. The full obligation audit against the final dimension vector passes: adr 2 is discharged by docs/adr/ADR-001-api-key-authentication.md (so the adr-2 READY block does not apply), openspec 1 is discharged by the validated delta spec, verify 1's auth-attributed safeguard checks all pass, the single placed stop (K1 floor approval) was surfaced and answered as PROP-DEC-001, and no dimension decreased across K1-K4.
