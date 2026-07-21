---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-report
  artifactScope: change
  changeId: prevent-concurrent-edit-loss
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-21T22:34:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:34:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "prevent-concurrent-edit-loss (worktree tC-chaos)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:pending-metadata-hook"
---

# CHAOS Proposal Report — prevent-concurrent-edit-loss

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "stop concurrent edits from silently losing data" --strict
- Mode: strict
- Mode source: inferred (data-loss incident touching a public API contract; blast radius on
  every write client → strict rigor)
- Date/time: 2026-07-21
- Change ID: prevent-concurrent-edit-loss
- Command run: RUN-2026-07-21-chaos-propose-prevent-concurrent-edit-loss-89b9ee
- OpenSpec available: yes (not yet invoked — see "Why OpenSpec is deferred")
- Proposal status: **BLOCKED_ON_DECISION** (awaiting human on PROP-DEC-001)

## User intent

An incident occurred: two people had the same task open, both saved, and the second save
**silently overwrote** the first. A manager's status update was wiped and went unnoticed until it
caused a missed handoff. The request: change how task updates work so this class of
"silently lost edit" cannot happen again. Keep build and tests green.

The request is deliberately **under-specified on a material axis** — it names the *symptom* (silent
lost update) and the *goal* (make it impossible) but not the *mechanism*. The mechanism is a
product/architecture decision, not a code detail.

## Problem evidence (FACT)

The lost-update path is directly evidenced in the governed subject:

| Evidence | Location | What it shows |
|---|---|---|
| PUT handler | `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs:38-46` | `PUT /tasks/{id}` binds the full `UpdateTaskRequest` and calls `store.Update(...)`; only `Title` non-blank is validated. No precondition, no version check. `[FACT]` |
| Store update | `src/TaskTracker.Api/Domain/TaskStore.cs:34-42` | `Update` does `existing with { Title, Status, Priority }` and `_tasks[id] = updated` — a blind, unconditional full-object replace. Whoever writes last wins; the first writer's fields are gone with no signal. `[FACT]` |
| Task model | `src/TaskTracker.Api/Domain/TaskItem.cs:24-29` | `TaskItem(Id, Title, Status, Priority, CreatedAt)` — **no version, rowversion, `UpdatedAt`, or ETag field** exists to detect a stale write. `[FACT]` |
| Update contract | `src/TaskTracker.Api/Contracts/TaskRequests.cs:9` | `UpdateTaskRequest(Title, Status, Priority)` carries no concurrency token. `[FACT]` |
| Test baseline | `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | 5/5 green; `Put_updates_an_existing_task` asserts blind overwrite succeeds. No concurrency/conflict coverage. `[FACT]` |

Diagnosis `[INFERENCE · HIGH]`: this is the textbook **lost-update problem**. `PUT` is
full-object last-write-wins with no optimistic or pessimistic concurrency control, and the domain
model has no token that would even let the server *detect* that the base a client edited from is
now stale. So the fix is not a bug patch — it requires introducing a concurrency-control contract,
and the *shape* of that contract is a decision.

## Change classification

- Type: BEHAVIOUR_CHANGE + CONTRACT_CHANGE (alters the write contract of `PUT /tasks/{id}`; likely
  introduces a new response status and a new required/optional token on the request).
- Risk: MEDIUM–HIGH. Touches a public API contract on the primary write path; every update client
  is affected; the choice embeds a product UX decision (does a conflicting saver get an error and
  redo work, or does the system merge?).
- Blast radius: all writers of `/tasks/{id}`; the `TaskItem` domain shape; the test baseline.

## The material ambiguity (why this proposal STOPS)

The request does not determine — and the code does not imply — **how** an overwrite of unseen
changes should be prevented. That is a human-owned material decision under constitution §1 and
**R-001**. Four realistic strategies produce four genuinely different products with different
client contracts and different UX. They are not interchangeable implementation details:

| Strategy | Client contract impact | UX on conflict | Cost | Fully closes the hole? |
|---|---|---|---|---|
| **Optimistic concurrency** (reject stale writes) — *recommended* | client round-trips a version/token; new conflict status | "someone changed this; re-fetch & retry" | LOW–MED | Yes |
| **Pessimistic locking** (lock while editing) | new lock acquire/release/lease endpoints + lock state | second editor is blocked until release/expiry | MED–HIGH | Yes, but heavy |
| **Detect + merge** (three-way merge, surface conflicts) | conflict-resolution contract/UI | auto-merge non-overlapping; resolve overlaps | HIGH | Yes, best UX |
| **PUT → PATCH** (field-level merge-patch) | change verb/semantics to partial update | non-overlapping edits both survive | MED | **No** — same-field edits still lose one |

This is surfaced as **PROP-DEC-001** and recorded as **BLOCKING / mustStop / status=OPEN**. Per
R-001 the agent does **not** pick it. A dependent second decision (**PROP-DEC-002**: how the
concurrency token is transported — HTTP `ETag`/`If-Match` → `412`/`428` vs a body `version` field →
`409` — and what happens when a client omits the token) only becomes meaningful once PROP-DEC-001
selects optimistic concurrency, so it is documented as a dependent follow-up (batch-independent
policy: dependent decisions are surfaced in a later round).

See `.chaos/changes/prevent-concurrent-edit-loss/decision-events.md`.

## Runtime decision log

| Decision ID | Runtime ID | Type | Status | mustStop |
|---|---|---|---|---|
| PROP-DEC-001 | `DEC-2026-07-21-prevent-concurrent-edit-loss-concurrency-control-stra-5b6c` | DESIGN_DECISION (material) | **OPEN — awaiting human** | true |
| PROP-DEC-002 | (not yet created — dependent on PROP-DEC-001) | DESIGN_DECISION (material) | OPEN — dependent/deferred | — |

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current behaviour | PUT full-object overwrite, no precondition (38-46) |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | store | blind `record with {…}` replace (34-42) |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | verified | domain model | no version/ETag field to detect staleness |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | verified | contract | `UpdateTaskRequest` carries no token |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | baseline | 5/5 green; no conflict coverage |
| `.chaos/architecture.md` | verified | constraints | NON-GOALS: persistence + auth; single-instance in-memory store |
| `.chaos/rules/index.md` | verified | rules | R-001/R-003/R-004/R-005/R-006 apply |

## Architectural constraints that bound the options

- **NON-GOAL: persistence/durability** (`architecture.md`). The store is a single-instance
  in-memory `ConcurrentDictionary`; state is not durable across restarts. `[FACT]` This matters:
  *pessimistic locking* implies durable server-side lock/lease state, which leans into the
  persistence non-goal and enlarges scope. Optimistic concurrency needs only an in-memory token on
  the existing record.
- **NON-GOAL: auth** (`architecture.md`). "Who holds a lock / who may break it" (a pessimistic
  concern) has no identity model to hang on — another reason locking is heavier here. `[INFERENCE ·
  MEDIUM]`
- **R-004 domain→HTTP boundary**: the conflict check must live in the domain (`TaskStore`), not the
  HTTP layer; the endpoint only translates a domain conflict into a status code. `[FACT · rule]`
- **R-005 `TaskState` naming**: any new field must not reintroduce `TaskStatus`. `[FACT · rule]`
- **Concurrency correctness**: even the recommended optimistic path must make its
  check-then-write atomic in `TaskStore` (e.g. `ConcurrentDictionary.TryUpdate` / compare-and-swap),
  or two racing requests could both pass a stale-check and still lose an update. This is an
  apply-time correctness note, not a material decision. `[INFERENCE · HIGH]`

## Recommended approach (advisory only — does NOT resolve PROP-DEC-001)

**Optimistic concurrency, rejecting stale writes.** Rationale: smallest blast radius; REST-idiomatic;
no lock lifecycle or identity model required (respects the persistence/auth non-goals); turns the
silent overwrite into a visible, recoverable `409/412` the losing writer must resolve — which is
exactly "this class of lost edit can't happen silently again." The recommendation is recorded for
the human but is **not** applied. The human owns the call.

## Why OpenSpec is deferred

OpenSpec proposal/design/spec/tasks are intentionally **not** generated yet. The normative spec
delta (which status code, which token, the missing-token posture) is *determined by* PROP-DEC-001
and PROP-DEC-002. Authoring specs now would either bake in an un-decided contract (an R-001
violation) or be thrown away. OpenSpec is invoked on `chaos:resume` once the human answers.

## Findings

### PRP-001 — Lost-update is real and unguarded (root cause confirmed)

- Type: FACT · Confidence: HIGH · Severity: MAJOR
- Source: `TaskEndpoints.cs:38-46`, `TaskStore.cs:34-42`, `TaskItem.cs:24-29`
- Finding: `PUT /tasks/{id}` is unconditional last-write-wins; the domain has no token to detect a
  stale base. The incident is reproducible by construction.
- Required action: introduce a concurrency-control contract — *shape pending PROP-DEC-001*.

### PRP-002 — The fix is a product/contract decision, not a mechanical patch

- Type: INFERENCE · Confidence: HIGH · Severity: BLOCKING (governance)
- Source: option matrix above; `architecture.md` non-goals
- Finding: the four strategies yield different client contracts and UX; the choice is material and
  human-owned (R-001). Proposing code now would guess it.
- Required action: **STOP**; PROP-DEC-001 created in the runtime as mustStop.

### PRP-003 — A partial fix (PATCH-only) could give false assurance

- Type: INFERENCE · Confidence: MEDIUM · Severity: ADVISORY
- Finding: switching PUT→PATCH reduces but does not eliminate the class of bug — two people editing
  the *same* field still silently lose one. If the human's true requirement is "no silent loss
  ever," PATCH-only does not satisfy it. Flagged so the decision is made with eyes open.

## Assumption register

| ID | Assumption | Why it matters | Confidence | Validation |
|---|---|---|---|---|
| A-1 | "Cannot happen again" means the loser is *told* (conflict surfaced), not that all saves succeed | Distinguishes optimistic/lock (reject) from merge (accept+merge) | MEDIUM | Confirm via PROP-DEC-001 answer |
| A-2 | Persistence stays a NON-GOAL for this change | Keeps in-memory token viable; caps pessimistic-locking scope | MEDIUM | Confirm with human if locking is chosen |
| A-3 | Single-instance store remains (no scale-out) | An in-memory compare-and-swap token is sufficient; no distributed lock needed | HIGH | `architecture.md` NON-GOALS |

## Non-material scaffolding done in this step

To frame the change without implementing the undecided axis, an **inert, TODO-gated** optional
field `ExpectedVersion` was added to `UpdateTaskRequest` (`Contracts/TaskRequests.cs`). It is
**not read by any code**, so behaviour is unchanged and the baseline stays green (build clean, 5/5
tests). The TODO explicitly states the field may be replaced by an `If-Match`/`ETag` header
depending on PROP-DEC-002 — so the scaffolding does **not** prejudge the transport decision. No
domain, store, or endpoint logic was changed.

## Confidence summary

- Overall verdict: **BLOCKED_ON_DECISION**
- Confidence: HIGH (in the diagnosis and in the fact that a material decision is required)
- Evidence coverage: COMPLETE (current behaviour + constraints fully inspected)
- Assumption load: LOW–MEDIUM (bounded, all registered; none resolve the material axis)

## Next command

```text
# Human answers PROP-DEC-001 in the Decision Center, then:
chaos:resume --change prevent-concurrent-edit-loss
```
