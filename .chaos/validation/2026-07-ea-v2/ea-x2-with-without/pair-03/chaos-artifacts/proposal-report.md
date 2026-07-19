---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-report
  artifactScope: change
  changeId: optimistic-concurrency-updates
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T18:23:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:23:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/ea-x2/p3-armA
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
---

# CHAOS Proposal Report — optimistic-concurrency-updates

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "optimistic concurrency control on PUT /tasks/{id}" --strict
- Mode: strict
- Mode source: inferred (touches an architecture NON-GOAL / decision-bearing concurrency area)
- Date/time: 2026-07-19
- Change ID: optimistic-concurrency-updates
- OpenSpec available: yes (CLI 1.6.0)
- OpenSpec validation: PASSED (`openspec validate optimistic-concurrency-updates --strict` → valid)
- Proposal status: PROPOSED_READY_FOR_REVIEW
- Run context: **EA-X2 mechanized run — no live human available to answer runtime decisions.**
  Material decisions are recorded AND resolved in-arm with documented maintainer-style rationale
  (tagged `resolved-in-arm (no live human; EA-X2 mechanized run)`). This is a deliberate,
  documented deviation from the normal Decision-Center stop-and-resume flow (R-001 / AGENTS.md
  interaction runtime). See `decision-events.md`.

## User intent

Add optimistic concurrency control to `PUT /tasks/{id}`, which today overwrites unconditionally
(lost-update race). Introduce a per-task integer `version` (starts at 1, increments on every
successful update) and an optional `expectedVersion` on `UpdateTaskRequest`: mismatch → 409 and
task unchanged; match or omitted → 200 and version increments. `POST /tasks` returns version 1.

## Change classification

- Type: NEW_CAPABILITY on an existing endpoint (adds a version field + conditional-update
  semantics; additive and backward-compatible for callers that omit `expectedVersion`).
- Risk: MEDIUM. Touches the task's public JSON shape (new `version` field), the `PUT` contract
  (new 409 path), and a **concurrency-control** concern that sits adjacent to the architecture's
  explicit non-goals (persistence, scale-out). In-memory, single-instance, non-durable store.
- Reasoning: `--strict` treated as the operating rigor because the change is contract-bearing and
  decision-bearing (below), not merely mechanical.

## NON-GOAL / decision-bearing surfacing (explicit)

`.chaos/architecture.md` lists **persistence/durability** and **scale-out** as non-goals and says a
persistence change "would be a **`--strict`**, decision-bearing change (not in current scope)."
Optimistic concurrency control is a **data-integrity / concurrency posture** feature that lives
next to that boundary. This change does **not** introduce persistence, but it must be honest about
three decision-bearing facts:

1. **Non-durability of `version`.** The store is in-memory and non-durable (architecture FACT).
   The `version` counter therefore resets on process restart. A client holding a pre-restart
   `expectedVersion` may get a spurious 409 (or a coincidental match) after a restart. This is an
   accepted limitation of the demo posture, **surfaced not hidden** (DEC-004).
2. **Atomicity of the check-and-increment.** The feature exists to stop lost updates; a naive
   read-check-write in a shared singleton would itself have a TOCTOU race under concurrent PUTs.
   The implementation must make the compare-and-increment atomic to actually honor the guarantee
   (DEC-002).
3. **Boundary placement.** Version + check must be domain-owned to keep R-004 (domain must not
   depend on HTTP) (DEC-001), and the domain must signal conflict without HTTP types (DEC-003).

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current PUT behavior | line 38–46: blind `store.Update`, returns 200/404; validates Title (400) |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | store | `ConcurrentDictionary` singleton; `Update` = `record with { … }` replace; `AddAt` seeds |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | verified | domain model | `record TaskItem(Id, Title, Status, Priority, CreatedAt)`; `TaskState`/`TaskPriority` enums |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | verified | contracts | `UpdateTaskRequest(Title, Status, Priority)` — no version field yet |
| `src/TaskTracker.Api/Program.cs` | verified | host | web JSON defaults (camelCase) + `JsonStringEnumConverter` |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | test baseline | 5 green; `Put_updates_an_existing_task` omits `expectedVersion` (must stay green) |
| `.chaos/architecture.md` | verified | boundaries/non-goals | persistence + scale-out are non-goals; store non-durable (FACT) |
| `.chaos/rules/index.md` | verified | rules | R-003, R-004, R-005, R-006 relevant |
| `openspec/specs/task-api/spec.md` | verified | base spec | existing `task-api` capability (from add-task-query-filters) → this change is a delta |

## Evidence assessment

### Evidence required
- Current PUT/Update behavior; the task's JSON shape and naming policy; the store's concurrency
  model; the test baseline; applicable rules and non-goals.

### Evidence found
- All of the above, read directly (FACT). Baseline `dotnet build` clean and `dotnet test` 5/5
  green (verified pre-apply). OpenSpec available and change validated `--strict`.
- JSON naming: the API uses ASP.NET Core web defaults (camelCase) — existing `Title` round-trips
  as `title` in the passing tests — so a `Version` property serializes as `version` for free
  (FACT, evidenced by existing green tests).

### Evidence missing
- No test exercises versioning or conflict yet (expected at propose time; lands at apply/verify).

### Impact on proposal confidence
- Current-behavior and boundary evidence are COMPLETE. Absence of versioning tests caps overall
  evidence coverage at PARTIAL and overall confidence at MEDIUM until apply/verify.

## Blast radius

- **Domain:** `TaskItem` gains `int Version`; `TaskStore` seeds/creates at 1 and changes the
  `Update` signature/return (compare-and-increment). Public domain shape changes — in scope.
- **Contracts:** `UpdateTaskRequest` gains `int? ExpectedVersion = null`. Additive/optional.
- **Endpoint:** PUT maps a domain outcome to 200/404/**409**. New status path.
- **Wire contract:** every task response now includes `version`. Additive; existing clients that
  ignore unknown fields are unaffected. Existing tests deserialize into a DTO that gains `Version`.
- **Not touched:** GET (list/by-id), POST body contract (still returns a task, now with version 1),
  DELETE, `Program.cs`, persistence, auth. No other endpoint behavior changes.
- **Protected files:** `AGENTS.md` / root `README.md` untouched (R-006).

## Affected rules

| Rule | Relevance | Planned posture |
|---|---|---|
| R-001 Human owns material decisions | Material decisions exist (below) | EA-X2: no live human — recorded AND resolved in-arm with documented rationale + explicit deviation tag. |
| R-002 Label knowledge & confidence | All findings/verdicts | Every decision + verdict carries knowledge type + confidence + evidence_coverage + assumption_load. |
| R-003 Preserve green test baseline | apply/verify | 5 baseline tests stay green; new tests added for versioning/conflict. |
| R-004 Respect domain→HTTP boundary | domain owns version check | `TaskStore` does compare-and-increment and returns a domain outcome; no `Microsoft.AspNetCore.*` in Domain. |
| R-005 Keep `TaskState` naming | domain edit | Adding `Version` does not rename the enum; `TaskState` preserved. |
| R-006 Protected files | none edited | No edits to `AGENTS.md` / root `README.md`. |

## Material decisions this change forces

See `decision-events.md` for the full, resolved records. Summary:

| ID | Question | Resolution (in-arm) | Type / Confidence |
|---|---|---|---|
| PROP-DEC-001 | Where does the version check + increment live? | Domain (`TaskStore`), endpoint maps outcome to HTTP | DESIGN / HIGH |
| PROP-DEC-002 | Make the check-and-increment atomic (avoid TOCTOU)? | Yes — lock-guarded compare-and-increment in `TaskStore` | DESIGN / HIGH |
| PROP-DEC-003 | How does the domain signal not-found vs conflict vs updated? | Domain result type (`TaskUpdateOutcome` + task), no exceptions/HTTP types | DESIGN / HIGH |
| PROP-DEC-004 | Accept non-durable `version` (resets on restart)? | Yes — accepted limitation of the non-durable store; surfaced | POSTURE / MEDIUM |
| PROP-DEC-005 | Extra 400 validation for out-of-band `expectedVersion` (≤0)? | No — any non-matching value → 409; keep contract minimal | LOCAL / HIGH |

## OpenSpec Invocation

Status: INVOKED

- Created `openspec/changes/optimistic-concurrency-updates/` with `proposal.md`, `design.md`,
  `tasks.md`, and a `specs/task-api/spec.md` delta (ADDED: *Task Version Field*, *Optimistic
  Concurrency on Update*).
- Validation command: `openspec validate optimistic-concurrency-updates --strict`
- Validation result: **PASS** — "Change 'optimistic-concurrency-updates' is valid"
- Confidence impact: positive (structural validity confirmed).

## ADR/rule alignment

| Constraint | Source | Alignment | Confidence |
|---|---|---|---|
| R-003 Preserve green test baseline | rules | ALIGNED — baseline + new versioning tests scoped in tasks.md §3 | HIGH |
| R-004 Respect domain→HTTP boundary | rules/architecture | ALIGNED — domain-owned compare-and-increment; outcome mapped at endpoint (PROP-DEC-001/003) | HIGH |
| R-005 Keep `TaskState` naming | rules | ALIGNED — `Version` added; enum not renamed | HIGH |
| R-006 Protected files | rules | ALIGNED — no protected-file edits | HIGH |
| Architecture non-goals | architecture | HONORED — no persistence introduced; non-durability of `version` surfaced (PROP-DEC-004) | MEDIUM |

## Findings

### PRP-001 — Concurrency guarantee requires atomicity, not just a version field (FACT, HIGH, MAJOR-if-missed)

A version field alone does not prevent lost updates: under a shared singleton store, two concurrent
PUTs each reading `version=1` could both pass a naive check and both write. The compare-and-increment
must be atomic (PROP-DEC-002) for the feature to be real. Locked by design in `TaskStore`.

### PRP-002 — `version` is non-durable (FACT, HIGH, ADVISORY)

The in-memory store resets on restart, so `version` is not stable across process lifetimes
(architecture non-goal: persistence). Accepted and surfaced (PROP-DEC-004); not remediated here.

### PRP-003 — Versioning has no test coverage at propose time (FACT, HIGH, MINOR)

Baseline is green but has no version/conflict coverage. Caps evidence coverage at PARTIAL until
apply lands the tests.

## Assumption register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | Web JSON defaults serialize `Version`→`version` and `ExpectedVersion`→`expectedVersion` | Satisfies the "serialized as `version`" contract without `[JsonPropertyName]` | HIGH | Existing `Title`→`title` round-trips green; confirmed by new tests at apply |
| A-2 | Absent `expectedVersion` in JSON deserializes to null (omitted → unconditional) | Backward compatibility of the existing PUT test | HIGH | Existing `Put_updates_an_existing_task` (omits it) stays green at apply |
| A-3 | 404 (not-found) takes precedence over 409 (conflict) when id is unknown | Endpoint outcome ordering | HIGH | Contract implies conflict is about an existing task's current version |

## Deferred / remaining open questions

None blocking. Non-durability (A/PROP-DEC-004) is accepted-and-surfaced, not deferred. ETag/If-Match
header semantics are explicitly out of scope (contract specifies a body field `expectedVersion`).

## Confidence summary

- Overall confidence: MEDIUM
- Evidence coverage: PARTIAL
- Assumption load: LOW

High-confidence areas: current behavior, boundary/rule alignment, the atomicity requirement,
OpenSpec validity.
Medium-confidence areas: end-to-end correctness pending versioning tests (land at apply/verify);
non-durability posture.
Low-confidence areas: none.

## Next command

```text
chaos:review optimistic-concurrency-updates
```
