---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-report
  artifactScope: change
  changeId: soft-delete-tasks
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T18:10:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:10:00+02:00"
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
    bodyHash: "sha256:39d87fadb53285325d33cbfb21ad4e7e3c46eb9719229a8778b6a8c95f1b03e1"
---

# CHAOS Proposal Report — soft-delete-tasks

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "soft-delete for tasks (schema change + backward-compatible migration)" --strict
- Mode: strict
- Mode source: inferred (schema change in a decision-bearing architecture area → strict rigor)
- Date/time: 2026-07-19
- Change ID: soft-delete-tasks
- OpenSpec available: yes (openspec 1.6.0)
- OpenSpec validation: PASSED (`openspec validate soft-delete-tasks --strict` → "Change 'soft-delete-tasks' is valid")
- Proposal status: PROPOSED_READY_FOR_REVIEW
- Run context: **EA-X2 mechanized run — no live human available to answer runtime decisions.**
  Material decisions are recorded AND resolved with a documented maintainer-style rationale,
  tagged `resolved-in-arm (no live human; EA-X2 mechanized run)`. This is a **documented
  deviation** from the normal Decision-Center stop-and-resume flow (R-001), declared here and
  in `decision-events.md`.

## User intent

Change `DELETE /tasks/{id}` from a permanent delete to a **soft delete**: deleted tasks are
retained but hidden by default. Add a nullable `deletedAt` timestamp (`null` when active,
ISO-8601 when deleted); `GET /tasks` returns active tasks by default and all tasks when
`?includeDeleted=true`; `GET /tasks/{id}` 404s a soft-deleted task; the four seeds stay active
after startup (backward-compatible migration). Behaviour is checked against the contract.

## Change classification

- Type: BEHAVIOUR_CHANGE + SCHEMA_CHANGE (alters DELETE semantics; adds a model field). Additive
  and backward-compatible on the wire (new nullable field; existing calls unaffected).
- Risk: MEDIUM. Touches the task **domain model** (`TaskItem`) and the **DELETE** contract, and
  lands in a **decision-bearing architecture area** — data retention, adjacent to the
  `persistence` non-goal (`architecture.md` §Non-goals, §Data access posture).
- Reasoning: `--strict` rigor is warranted because the change edits the domain record and touches
  a non-goal boundary, even though the wire change is additive.

## Architecture non-goal / decision-bearing surface (surfaced explicitly)

`architecture.md` lists **persistence / durability across restarts** as a non-goal and states
that *"introducing persistence would be a `--strict`, decision-bearing change."* Soft delete is
**retention-adjacent**: it keeps rows that would otherwise be dropped. This proposal therefore
draws an explicit boundary (MDEC-003): retention is realized **in the existing in-memory store
only** — no database, no durability across restarts, no migration framework. The
"backward-compatible migration" is a **defaulted domain field**, not a schema/DB migration. This
is a deliberate, recorded scoping of a decision-bearing area, not a silent expansion into the
persistence non-goal.

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current behaviour | DELETE → `store.Remove` (hard delete, line 49-50); GET /tasks → `store.All()` unfiltered |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | store | in-memory `ConcurrentDictionary`; `Remove` = `TryRemove`; `All()`/`Get()` no active-filter |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | verified | domain model | immutable record; `TaskState`/`TaskPriority` enums; no delete marker |
| `src/TaskTracker.Api/Program.cs` | verified | host/JSON | `JsonStringEnumConverter` only; no `DefaultIgnoreCondition` → nulls emitted, web camelCase |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | test baseline | green 5/5; `Delete_removes_a_task` asserts 204 + 404-after (soft-delete satisfies both) |
| `.chaos/architecture.md` | verified | boundary/non-goals | persistence non-goal; domain→HTTP boundary posture |
| `.chaos/rules/index.md` | verified | rules | R-001, R-003, R-004, R-005, R-006 apply |
| `openspec/specs/task-api/spec.md` | verified | base spec | existing "List Tasks" requirement (MODIFIED by this change) |
| `.chaos/changes/add-task-query-filters/**` | verified | precedent | domain-owned querying pattern; artifact shapes |

## Evidence assessment

### Evidence required
- Current DELETE + GET behaviour; task model shape; JSON serialization defaults; test baseline;
  applicable rules; the architecture non-goal boundary.

### Evidence found
- All of the above (FACT, direct source read). Serialization behaviour confirmed by reading
  `Program.cs` (no `DefaultIgnoreCondition` → `deletedAt: null` is emitted) and the existing
  camelCase wire shape the current tests already rely on.

### Evidence missing
- No prior soft-delete/retention decision or ADR exists (greenfield for this repo).
- No test exercised soft-delete before this change (expected; lands at apply/verify).

### Impact on proposal confidence
- Current-behaviour and model evidence are COMPLETE. Absence of a prior retention decision caps
  nothing (this change *is* that decision); overall confidence MEDIUM until apply/verify land the
  tests, then HIGH.

## Runtime decision log

| Decision ID | Type | Question | Resolution (mechanized) | Status | Confidence impact |
|---|---|---|---|---|---|
| MDEC-001 | SCHEMA/DESIGN | How is soft-delete modeled on the task? | Nullable `DeletedAt` timestamp on `TaskItem` (trailing defaulted param) | RESOLVED_IN_ARM | none (HIGH) |
| MDEC-002 | ARCH/DESIGN | Where does visibility + mutation logic live? | Domain-owned in `TaskStore` (R-004); thin endpoints | RESOLVED_IN_ARM | none (HIGH) |
| MDEC-003 | SCOPE/ARCH boundary | Does soft-delete cross the persistence non-goal? | In-memory retention only; no DB/durability/migration engine | RESOLVED_IN_ARM | none (HIGH) |

Full records (with maintainer rationale + the documented no-human deviation) in
`.chaos/changes/soft-delete-tasks/decision-events.md`.

## Approach alignment record

### Candidate approaches presented
- Option A — Boolean `IsDeleted` flag on `TaskItem`. Rejected: loses the `deletedAt` *timestamp*
  the contract mandates.
- Option B — **Nullable `DeletedAt` timestamp on the domain record + domain-owned filtering
  (recommended)**. One field marks *and* time-stamps deletion; visibility owned by `TaskStore`.
- Option C — Separate "deleted tasks" store / tombstone table. Rejected: splits the source of
  truth, over-engineered for an in-memory demo, and drifts toward the persistence non-goal.

### Recommended approach
- Option B.

### Resolution (mechanized)
- Option B accepted via the recorded material decisions (MDEC-001/002/003). No live human;
  resolved with maintainer-style rationale per the EA-X2 deviation.

## OpenSpec Invocation

Status: INVOKED

Actual invocation: authored `openspec/changes/soft-delete-tasks/` (proposal.md, design.md,
specs/task-api/spec.md, tasks.md, .openspec.yaml) and validated.

Validation command: `openspec validate soft-delete-tasks --strict`
Validation result: PASS ("Change 'soft-delete-tasks' is valid")
Confidence impact: none (OpenSpec fully invoked and validated).

## OpenSpec artefacts

- Change path: `openspec/changes/soft-delete-tasks/`
- Proposal: `openspec/changes/soft-delete-tasks/proposal.md`
- Design: `openspec/changes/soft-delete-tasks/design.md`
- Specs: `openspec/changes/soft-delete-tasks/specs/task-api/spec.md` (MODIFIED List Tasks + 3 ADDED requirements)
- Tasks: `openspec/changes/soft-delete-tasks/tasks.md`

## ADR/rule alignment

| Constraint | Source | Alignment | Confidence |
|---|---|---|---|
| R-001 Human owns material decisions | rules/index.md | DEVIATION (documented): no live human in this mechanized EA-X2 run; MDEC-001/002/003 recorded + resolved-in-arm with maintainer rationale instead of Decision-Center stop-and-resume | HIGH (deviation is explicit + auditable) |
| R-003 Preserve green test baseline | rules/index.md | ALIGNED — 5 baseline tests preserved; soft-delete + visibility tests added at apply | HIGH |
| R-004 Respect domain→HTTP boundary | rules/index.md | ALIGNED — `DeletedAt` is a pure-domain nullable timestamp; visibility/mutation owned by `TaskStore`; endpoints only bind/delegate | HIGH |
| R-005 Keep `TaskState` naming | rules/index.md | ALIGNED — no enum rename; only a new field added to the record | HIGH |
| R-006 Protected files previewed-only | rules/index.md | ALIGNED — `AGENTS.md` / root `README.md` untouched | HIGH |

## Findings

### PRP-001 — Soft-delete behaviour has no test coverage at propose time
Type: FACT · Confidence: HIGH · Severity: MINOR
Source: `tests/TaskTracker.Tests/TaskEndpointsTests.cs`
Finding: the green suite exercises only pre-soft-delete behaviour; no test covers `deletedAt`,
`includeDeleted`, GET-by-id 404-on-deleted, or seed-active-after-startup.
Impact: caps evidence coverage at PARTIAL and overall confidence at MEDIUM until apply lands tests.
Required action: implement tasks 3.1–3.6 during apply.

### PRP-002 — Change touches the persistence / retention non-goal
Type: INFERENCE · Confidence: HIGH · Severity: ADVISORY
Source: `architecture.md` (Non-goals; Data access posture); this change adds row retention.
Finding: retaining deleted rows is retention-adjacent to the declared persistence non-goal.
Impact: requires an explicit scope boundary so the change does not silently drift toward
persistence. Addressed by MDEC-003 (in-memory retention only).
Required action: keep retention in-memory; defer durable persistence / purge / TTL to future,
decision-bearing work.

### PRP-003 — `Delete_removes_a_task` baseline test name becomes semantically loose
Type: FACT · Confidence: HIGH · Severity: ADVISORY
Source: `tests/TaskTracker.Tests/TaskEndpointsTests.cs`
Finding: the existing test asserts 204 + 404-after, which soft-delete still satisfies, but its
name implies physical removal.
Impact: none on correctness; the assertions remain valid and are kept green (R-003). New tests
add the precise soft-delete semantics; the baseline test is left unmodified to preserve the
baseline exactly.
Required action: none (optional future rename, out of scope).

## Assumption register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | Default web JSON emits `deletedAt: null` for active tasks (no `DefaultIgnoreCondition` set) | Contract requires `null` present when active | HIGH | Verified: `Program.cs` sets no ignore condition; asserted by raw-JSON test at apply |
| A-2 | Adding a trailing defaulted positional record param is a safe, source-compatible migration | Existing seeds/`Add` must keep compiling & stay active | HIGH | Confirmed at apply (build clean, seeds active) |
| A-3 | Re-deleting an already-soft-deleted (physically present) task returning 204 is acceptable | Contract only defines "unknown id → 404" | MEDIUM | Resolved as APP-DEC-002 at apply (physical-existence semantics) |

## Deferred / remaining open questions

- Restore/undelete + hard-purge endpoints and a retention/TTL policy — deferred (out of scope,
  future decision-bearing work).
- PUT on a soft-deleted task — left as physical-row behaviour (contract: don't change unrelated
  endpoints); undefined by the contract, flagged for a future change.

## Confidence summary

- Overall confidence: MEDIUM
- Evidence coverage: PARTIAL
- Assumption load: LOW

High-confidence areas: current behaviour, domain model, serialization defaults, rule alignment,
the non-goal boundary decision, OpenSpec validation.
Medium-confidence areas: end-to-end correctness pending soft-delete tests (land at apply/verify).
Low-confidence areas: none.
Confidence limiters: no soft-delete test coverage exists yet (PRP-001).

## Next command

```text
chaos:review soft-delete-tasks
```
