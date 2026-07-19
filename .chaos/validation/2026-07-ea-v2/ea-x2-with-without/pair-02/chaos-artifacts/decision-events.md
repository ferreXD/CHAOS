---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: soft-delete-tasks
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T18:14:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:14:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "p2-armA (worktree; detached from main)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:f174c9c404bb4fc3f1e155a1dc9b2d2088d58402b4c0e18b1678502d543f4772"
---

# Decision Events — soft-delete-tasks

> **Run mode: EA-X2 mechanized — no live human available.** Normally every material decision is
> created in the interaction runtime and **stops** for a human answer in the Decision Center
> (R-001). In this run there is no human to answer. Each material decision below is therefore
> **recorded AND resolved in-arm** with an explicit, documented maintainer-style rationale, tagged
> `resolved-in-arm (no live human; EA-X2 mechanized run)`. This is a **documented deviation** from
> the normal stop-and-resume flow, declared here and in the proposal report. All resolutions stay
> inside the approved contract and the recorded architecture posture.

---

### MDEC-001 — Model soft-delete as a nullable `DeletedAt` timestamp on the `TaskItem` domain record

Command: chaos:propose
Change ID: soft-delete-tasks
Mode: strict
Type: SCHEMA_DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run)
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Add a nullable `DateTimeOffset? DeletedAt` to the `TaskItem` record as a **trailing, defaulted
positional parameter** (`= null`). `null` = active; a non-null value = the soft-delete instant.
Serialized as `deletedAt` (web camelCase).

Rationale (maintainer-style):
The contract mandates a `deletedAt` *timestamp* (ISO-8601 when set, `null` when active). A single
nullable timestamp both marks deletion and records *when* — strictly more information than a
boolean, and exactly the contract's shape. A trailing defaulted positional param means every
existing construction site (the four seeds, `Add`) compiles unchanged and yields an active task:
this *is* the backward-compatible "migration" for existing rows, with no migration engine.
Alternatives rejected: a `bool IsDeleted` flag (drops the required timestamp); a separate
deleted-tasks store (splits the source of truth, drifts toward the persistence non-goal).

Evidence:
- src/TaskTracker.Api/Domain/TaskItem.cs — immutable record; C# positional records accept trailing defaulted params.
- src/TaskTracker.Api/Domain/TaskStore.cs — seeds via `AddAt(...)`, `Add(...)`; all 5-arg constructions stay valid.
- src/TaskTracker.Api/Program.cs — web-default JSON (camelCase, nulls emitted) → `deletedAt`.

Scope impact: src/TaskTracker.Api/Domain/TaskItem.cs.
Sync action: NONE (local schema shape; no rule promotion needed).
Follow-up owner: implementer.

---

### MDEC-002 — Own soft-delete visibility + mutation in the domain `TaskStore` (R-004); endpoints stay thin

Command: chaos:propose
Change ID: soft-delete-tasks
Mode: strict
Type: ARCHITECTURE_DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run)
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Place the active/all visibility filter and the delete mutation in the domain store:
`All(bool includeDeleted = false)` (active-only by default), `Get(id)` returns `null` for a
soft-deleted row (so GET-by-id 404s it), and `SoftDelete(id, when)` stamps `DeletedAt`. Endpoints
only bind query params and delegate.

Rationale (maintainer-style):
R-004 requires endpoints to depend on the domain, not the reverse, and the architecture posture
says new query/visibility behaviour belongs at the store boundary. This mirrors the accepted
add-task-query-filters precedent (domain-owned querying) and keeps the filter/mutation logic
directly unit-testable while the HTTP layer stays thin.

Evidence:
- .chaos/rules/index.md — R-004 (domain→HTTP boundary).
- .chaos/architecture.md — "new behaviour belongs at the endpoint/query boundary … in the store".
- .chaos/changes/add-task-query-filters/** — established domain-owned querying precedent.

Scope impact: src/TaskTracker.Api/Domain/TaskStore.cs (+ thin endpoint delegation).
Sync action: NONE.
Follow-up owner: implementer.

---

### MDEC-003 — Scope retention to the in-memory store only; do NOT cross the persistence non-goal

Command: chaos:propose
Change ID: soft-delete-tasks
Mode: strict
Type: SCOPE_ARCHITECTURE_BOUNDARY_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run)
Knowledge type: INFERENCE
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
Realize soft-delete retention **within the existing in-memory `ConcurrentDictionary` store only**:
rows are retained (not `TryRemove`d) and hidden by default. **No** database, **no** durability
across restarts, **no** migration framework, **no** restore/purge/TTL endpoints. The
"backward-compatible migration" means the defaulted domain field (MDEC-001), nothing more.

Rationale (maintainer-style):
`architecture.md` lists persistence/durability as a **non-goal** and flags it as `--strict`,
decision-bearing. Soft-delete is retention-adjacent and could drift into that non-goal. This
decision draws an explicit boundary so the change delivers the retention *semantic* the contract
requires without silently expanding into persistence. Durable retention, purge, and TTL are
deferred to future, explicitly decision-bearing work. This is the material decision the task
flagged as touching a non-goal / decision-bearing area, surfaced and bounded here.

Evidence:
- .chaos/architecture.md — Non-goals ("Persistence / durability across restarts"); Data access posture ("Introducing persistence would be a **--strict**, decision-bearing change (not in current scope)").
- src/TaskTracker.Api/Domain/TaskStore.cs — in-memory singleton; state not durable across restarts.

Scope impact: bounds the whole change; no persistence code introduced.
Sync action: CONSIDER_DECISION_LOG (retention-is-in-memory-only convention may be worth promoting if a future change proposes durable retention).
Follow-up owner: team.

---

### APP-DEC-001 — `GET /tasks/{id}` returns 404 for a soft-deleted task via `TaskStore.Get` hiding deleted rows

Command: chaos:apply
Change ID: soft-delete-tasks
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run) / ACCEPTED_DURING_APPLY
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`TaskStore.Get(id)` returns the task only when it physically exists **and** `DeletedAt is null`;
otherwise `null`. The GET-by-id endpoint is unchanged (`Get(id) is {} task ? Ok : NotFound`), so a
soft-deleted task yields 404.

Rationale (maintainer-style):
The contract requires GET-by-id to 404 a soft-deleted task. Centralizing the active-only rule in
the store (rather than adding a branch in the endpoint) keeps the visibility policy in one place,
consistent with `All()`'s default, and leaves the endpoint thin (R-004). `Update` (PUT) still
resolves the physical row directly and is intentionally left unchanged (don't alter unrelated
endpoints).

Evidence:
- src/TaskTracker.Api/Domain/TaskStore.cs — `Get` returns null when `DeletedAt` is non-null.
- src/TaskTracker.Api/Endpoints/TaskEndpoints.cs — GET-by-id unchanged; 404 path already present.
- tests — `Delete_soft_deletes_task_returns_204_and_hides_it` asserts GET-by-id 404 after delete.

Scope impact: src/TaskTracker.Api/Domain/TaskStore.cs.
Sync action: NONE (enforces the approved contract).
Follow-up owner: implementer.

---

### APP-DEC-002 — DELETE resolves against physical existence; re-deleting a soft-deleted task returns 204

Command: chaos:apply
Change ID: soft-delete-tasks
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run) / ACCEPTED_DURING_APPLY
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
`SoftDelete(id, when)` returns `true` (→ 204) whenever the id physically exists in the store —
including a task already soft-deleted (its `DeletedAt` is refreshed). Only a **never-existent** id
returns `false` (→ 404).

Rationale (maintainer-style):
The contract defines only "Deleting an unknown id still returns 404." An already-soft-deleted row
physically exists, so it is not *unknown*; treating it as 404 would require a second visibility
concept for DELETE and complicate the store. Physical-existence resolution is simple,
idempotent-friendly, and least surprising, and it never removes a row (soft-delete invariant
preserved). Materiality is LOW; recorded for auditability.

Evidence:
- Task contract — "Deleting an unknown id still returns 404" (no rule for re-deleting a soft-deleted task).
- src/TaskTracker.Api/Domain/TaskStore.cs — `SoftDelete` uses `TryGetValue` (physical existence), never `TryRemove`.
- tests — `Delete_unknown_id_returns_404` locks the 404 path.

Scope impact: src/TaskTracker.Api/Domain/TaskStore.cs + src/TaskTracker.Api/Endpoints/TaskEndpoints.cs.
Sync action: NONE.
Follow-up owner: implementer.

---

### APP-DEC-003 — Rely on default web JSON serialization for `deletedAt` (camelCase, null-emitting; no attributes)

Command: chaos:apply
Change ID: soft-delete-tasks
Mode: strict
Type: LOCAL_DESIGN_DECISION
Status: RESOLVED_IN_ARM (no live human; EA-X2 mechanized run) / ACCEPTED_DURING_APPLY
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
No JSON attribute or serializer change: `DeletedAt` serializes as `deletedAt` via the ASP.NET Core
web defaults (camelCase), and `null` is emitted for active tasks because `Program.cs` sets no
`DefaultIgnoreCondition`.

Rationale (maintainer-style):
The contract requires the field to be named `deletedAt` and to be literally `null` when active.
Web defaults already produce exactly that (the existing `id/title/status/priority/createdAt` wire
shape confirms camelCase; nulls are emitted by default). Adding attributes would be redundant and
risk diverging from the rest of the model. A raw-JSON test (`Active_task_serializes_deletedAt_as_null`)
asserts the literal `"deletedAt":null` to lock the behaviour.

Evidence:
- src/TaskTracker.Api/Program.cs — only `JsonStringEnumConverter` added; no `DefaultIgnoreCondition`.
- tests — `Active_task_serializes_deletedAt_as_null` asserts `"deletedAt":null` in the raw payload.

Scope impact: none beyond the model field (verification-only).
Sync action: NONE.
Follow-up owner: implementer.
