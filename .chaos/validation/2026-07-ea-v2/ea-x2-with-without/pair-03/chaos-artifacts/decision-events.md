---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: optimistic-concurrency-updates
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T18:23:30+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:23:30+02:00"
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

# Decision Events — optimistic-concurrency-updates

> **EA-X2 mechanized-run deviation (documented).** The normal CHAOS flow (R-001, AGENTS.md
> "Interaction runtime") requires material decisions to be created in the Decision Center and
> **stopped on** until a human answers, then resumed via `chaos:resume`. **In this EA-X2 run no
> live human is available.** Each material decision below is therefore both *recorded* and
> *resolved in-arm* with an explicit, documented maintainer-style rationale, tagged
> `resolved-in-arm (no live human; EA-X2 mechanized run)`. This is a deliberate, disclosed
> deviation from stop-and-resume — not a silent chat decision. Every decision retains its
> knowledge-type + confidence labels (R-002).

---

### PROP-DEC-001 — Version check + increment lives in the domain, endpoint maps outcome

Command: chaos:propose
Change ID: optimistic-concurrency-updates
Mode: strict
Type: DESIGN_DECISION
Status: RESOLVED_IN_ARM
Resolution tag: `resolved-in-arm (no live human; EA-X2 mechanized run)`
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
The `version` field and the compare-and-increment logic live in the domain (`TaskItem` +
`TaskStore.Update`). The endpoint only translates the domain's outcome into HTTP status codes
(200 / 404 / 409).

Rationale (maintainer-style):
R-004 requires the domain not to depend on the HTTP layer, and the accepted `add-task-query-filters`
precedent pushed the filter logic into `TaskStore.Query` with a thin endpoint. Concurrency control
is a data-integrity concern that belongs with the data owner (the store), not the transport. Placing
it in the endpoint would scatter invariant enforcement across the HTTP surface and risk divergent
behavior if another caller path were added.

Evidence:
- `.chaos/rules/index.md` — R-004 (domain must not depend on HTTP layer).
- `.chaos/architecture.md` — boundary posture: "new behaviour … belongs at the endpoint/query
  boundary, not in the store's public shape, unless a decision says otherwise" — this decision
  says otherwise for an invariant that must be enforced atomically by the data owner.
- `openspec/specs/task-api/spec.md` (base) — filter precedent is domain-owned.

Impact: domain shape changes (`TaskStore.Update` signature/return); endpoint gains a 409 branch.

Sync action: NONE (design detail internal to the change).
Follow-up owner: implementer.

---

### PROP-DEC-002 — Make the check-and-increment atomic (lock-guarded), not a naive read-then-write

Command: chaos:propose
Change ID: optimistic-concurrency-updates
Mode: strict
Type: DESIGN_DECISION
Status: RESOLVED_IN_ARM
Resolution tag: `resolved-in-arm (no live human; EA-X2 mechanized run)`
Knowledge type: INFERENCE
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`TaskStore.Update` performs the read → compare `expectedVersion` → increment → write as a single
atomic critical section (a `lock` inside the store). Reads (`Get`, `All`) remain lock-free on the
`ConcurrentDictionary`.

Rationale (maintainer-style):
The whole point of the feature is to stop lost updates. A version field with a non-atomic
read-check-write would still race: two concurrent PUTs each reading `version=1` could both pass the
check and both write, re-introducing the very lost-update the feature is meant to prevent (TOCTOU).
`ConcurrentDictionary` guarantees per-operation atomicity but not compound read-modify-write. A lock
is the simplest construct that makes the invariant correct and matches the store's documented
"thread-safe for the demo" posture. `TryUpdate(key, new, comparison)` was considered but relies on
value-equality of the `TaskItem` record for the comparison, which is subtle; an explicit lock is
clearer and unambiguous at demo scale.

Evidence:
- `src/TaskTracker.Api/Domain/TaskStore.cs` — singleton `ConcurrentDictionary`, shared across
  requests; current `Update` is a blind replace.
- `.chaos/architecture.md` — "Thread-safe for the demo via `ConcurrentDictionary`" (FACT).

Impact: adds a private lock object + critical section in `TaskStore.Update`. No public API impact
beyond the new signature/return from PROP-DEC-001/003.

Sync action: NONE.
Follow-up owner: implementer.

---

### PROP-DEC-003 — Domain signals outcome via a result type (NotFound / Conflict / Updated), not exceptions

Command: chaos:propose
Change ID: optimistic-concurrency-updates
Mode: strict
Type: DESIGN_DECISION
Status: RESOLVED_IN_ARM
Resolution tag: `resolved-in-arm (no live human; EA-X2 mechanized run)`
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`TaskStore.Update` returns a small domain result — an enum `TaskUpdateOutcome { NotFound, Conflict,
Updated }` plus the task — and the endpoint maps `NotFound → 404`, `Conflict → 409`, `Updated → 200`.
No exceptions for control flow; no HTTP types in the domain.

Rationale (maintainer-style):
There are now three outcomes where the old `TaskItem?` (null = not-found) only encoded two. Encoding
"conflict" as `null` would be ambiguous, and throwing an exception for an expected, routine outcome
(a stale write) is poor control-flow design and would tempt the endpoint to catch. A discriminated
result keeps the domain HTTP-agnostic (R-004) and makes the endpoint mapping explicit and total.

Evidence:
- `src/TaskTracker.Api/Domain/TaskStore.cs` — current `Update` returns `TaskItem?` (two-state).
- `.chaos/rules/index.md` — R-004 (no HTTP dependency in domain).

Impact: new public domain types `TaskUpdateOutcome` (enum) + `TaskUpdateResult` (readonly record
struct) in `Domain`.

Sync action: NONE.
Follow-up owner: implementer.

---

### PROP-DEC-004 — Accept non-durable `version` (resets on process restart) as a surfaced limitation

Command: chaos:propose
Change ID: optimistic-concurrency-updates
Mode: strict
Type: POSTURE_DECISION (non-goal boundary)
Status: RESOLVED_IN_ARM
Resolution tag: `resolved-in-arm (no live human; EA-X2 mechanized run)`
Knowledge type: FACT
Confidence: MEDIUM
Evidence coverage: COMPLETE
Assumption load: MEDIUM

Decision:
The `version` counter lives only in the in-memory store and therefore **resets when the process
restarts**. This is accepted for the demo and **surfaced** (proposal, design, verification) rather
than fixed. Durable versioning is explicitly out of scope.

Rationale (maintainer-style):
`.chaos/architecture.md` lists persistence/durability as a **non-goal** and states that introducing
persistence "would be a `--strict`, decision-bearing change (not in current scope)." Making `version`
durable would require exactly that non-goal work. The honest, in-scope choice is to ship the
concurrency contract against the current runtime and document the limitation: after a restart a
client's stale `expectedVersion` could spuriously 409 or coincidentally match. This is the required
"touches a NON-GOAL / decision-bearing area" surfacing.

Evidence:
- `.chaos/architecture.md` — non-goals (persistence, durability, scale-out); store "not durable
  across restarts" (FACT).

Impact: no code beyond what the contract needs; recorded as a known limitation. If durability is
ever wanted, that is a separate `--strict` persistence change.

Sync action: CONSIDER_DECISION_LOG (concurrency posture on a non-durable store is a durable
convention worth promoting if the team keeps the API). Advisory, non-blocking.
Follow-up owner: team.

---

### PROP-DEC-005 — No extra 400 validation for out-of-band `expectedVersion`; any non-match → 409

Command: chaos:propose
Change ID: optimistic-concurrency-updates
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: RESOLVED_IN_ARM
Resolution tag: `resolved-in-arm (no live human; EA-X2 mechanized run)`
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`expectedVersion` values that are not positive/plausible (e.g. `0`, negative) are **not** given a
separate `400` path. Versions start at 1, so any `expectedVersion` that does not equal the current
`version` — including `≤ 0` — simply yields `409 Conflict`. Only a blank `Title` keeps its existing
`400` (unchanged behavior).

Rationale (maintainer-style):
The contract specifies exactly two `expectedVersion` outcomes when provided: equal → proceed,
not-equal → 409. Introducing a third (`400` for "implausible" values) would add contract surface the
task did not ask for and could surprise clients. Treating every non-match uniformly as 409 is the
minimal, unambiguous reading of the contract and leaves the task genuinely unchanged.

Evidence:
- Task contract (this change) — "provided and does not equal current version → 409".
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` — existing Title-required `400` is the only
  input-validation 400 on PUT and is preserved.

Impact: endpoint keeps a single `400` (blank Title); no new validation branch.

Sync action: NONE.
Follow-up owner: implementer.

---

### APP-DEC-001 — `version` naming relies on the web camelCase JSON policy (no `[JsonPropertyName]`)

Command: chaos:apply
Change ID: optimistic-concurrency-updates
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: RESOLVED_IN_ARM
Resolution tag: `resolved-in-arm (no live human; EA-X2 mechanized run)`
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`TaskItem.Version` and `UpdateTaskRequest.ExpectedVersion` are serialized/deserialized as `version`
/ `expectedVersion` via ASP.NET Core's default web JSON policy (camelCase) — no `[JsonPropertyName]`
attributes, consistent with the rest of the codebase (which has none).

Rationale (maintainer-style):
The API already relies on the web default camelCase policy everywhere: `Title` serializes as
`title`, `CreatedAt` as `createdAt`, and the existing tests round-trip them. Adding an attribute
only for these two properties would be inconsistent and unnecessary. The contract's "serialized as
`version`" is satisfied by the existing policy.

Evidence:
- `src/TaskTracker.Api/Program.cs` — `ConfigureHttpJsonOptions` + `JsonStringEnumConverter`; web
  defaults (camelCase, case-insensitive).
- `tests/TaskTracker.Tests/TaskEndpointsTests.cs` — existing tests send/read camelCase and pass;
  new tests assert `version` on the wire.

Impact: `src/TaskTracker.Api` domain/contracts only; verified by new tests reading `version`.

Sync action: NONE.
Follow-up owner: implementer.
