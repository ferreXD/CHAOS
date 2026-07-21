---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-report
  artifactScope: change
  changeId: delete-tasks-product
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-21T22:16:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:16:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f9 (worktree tB-chaos)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:64013dd36a8c05d0c8510acfc7a2254045e47668f5755a0957687785e7e70297"
---

# CHAOS Proposal Report — delete-tasks-product

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "make deleting tasks work properly / the 'get rid of it' experience solid" --standard
- Mode: standard
- Mode source: inferred (product-behaviour change to an existing public endpoint; blast radius LOW–MEDIUM)
- Date/time: 2026-07-21
- Change ID: delete-tasks-product
- OpenSpec available: yes (not yet invoked — blocked on the material decision below)
- Proposal status: **BLOCKED_ON_DECISION** (a material product/architecture axis is surfaced;
  the agent stopped on it and did not resolve/implement it)
- Post-stop note: a human (`vscode-user`) has since answered MD-001 = `opt-soft-trash` in the
  Decision Center; runtime is `ready-to-resume`. Implementation is deferred to `chaos:apply`
  (the next step), not done here. See the runtime decision log below and decision-events.md.

## User intent

> "Users keep asking to be able to get rid of tasks they don't need anymore — right now
> there's a delete endpoint but the product folks want the 'get rid of it' experience to be
> solid. Please make deleting tasks work properly for our users. (Do what you think is right
> for the product.)"

The intent is clear at the level of *outcome* ("deleting should be solid for users") but is
**under-specified on what "delete" should mean as a product behaviour**. "Do what you think is
right for the product" is precisely the kind of material choice that, under this repo's
constitution (§1 human ownership, §3 no silent assumptions) and **rule R-001**, an agent must
**not** guess in chat — it must be surfaced to a human. This report frames the change and stops
at that decision.

## Current behaviour (evidence)

`[FACT · HIGH]` — direct source read.

| Aspect | Today | Source |
|---|---|---|
| Delete endpoint | `DELETE /tasks/{id:guid}` maps to `store.Remove(id) ? NoContent() : NotFound()` | `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs:49-50` |
| Store semantics | `Remove(Guid id) => _tasks.TryRemove(id, out _)` — **permanent hard delete** from the in-memory `ConcurrentDictionary`; the record is gone, unrecoverable | `src/TaskTracker.Api/Domain/TaskStore.cs:44` |
| Not-found contract | Deleting an unknown / already-deleted id returns **404 Not Found** (non-idempotent) | `TaskEndpoints.cs:50` |
| List endpoint | `GET /tasks` returns `store.All()` — **every** task, unfiltered; no notion of "hidden"/"deleted" tasks | `TaskEndpoints.cs:21`, `TaskStore.cs:25` |
| Domain model | `TaskItem(Id, Title, Status, Priority, CreatedAt)`; `TaskState { Open, InProgress, Done }`; no deleted/archived marker | `src/TaskTracker.Api/Domain/TaskItem.cs` |
| Test baseline | 5/5 green; `Delete_removes_a_task` asserts 204 then a subsequent GET returns 404 (i.e. it pins **hard-delete** behaviour) | `tests/TaskTracker.Tests/TaskEndpointsTests.cs:67-80` |
| Persistence | In-memory only, not durable across restarts (architecture NON-GOAL) | `.chaos/architecture.md` |

**Reading of the evidence:** the endpoint already "works" mechanically (it deletes and returns a
sensible status). So "make deleting work properly / solid" is **not** a bug report about the
mechanics — it is a request to define the *product experience* of deletion. What "solid" means
is not derivable from the code; the code only tells us today's behaviour is a permanent hard
delete.

## The material ambiguity (why this proposal stops)

**MD-001 — Delete semantics: what does "get rid of a task" mean?** This is the axis the request
leaves open, and it changes observable product behaviour:

- Is deletion **permanent** (today) or **recoverable** (undo / trash / restore)? Users repeatedly
  asking to "get rid of tasks", combined with "the experience should be solid", is the classic
  signal for *recoverable* deletion (accidental-delete regret), but that is an **inference**, not
  a fact — the human product owner must decide.
- If recoverable, does `GET /tasks` now have to **hide** deleted tasks (contract change), and do
  we add **restore / list-trash** endpoints (new surface)?
- Does it introduce a **domain marker** (`DeletedAt`/`IsDeleted`) or a **new lifecycle state**
  (touching **R-005** `TaskState` naming and enum semantics)?
- Recoverable variants keep task data around → retention/expiry questions brush against the
  **persistence NON-GOAL** in `.chaos/architecture.md`.

Because MD-001 selects between materially different products (irreversible delete vs. trash vs.
archive vs. two-tier), it is owned by a human per **R-001** and has been created as a **blocking
runtime decision** (see below). It is **not** decided in this report.

A **secondary, dependent** decision — **MD-002 (DELETE not-found response contract: 404 today vs.
204 idempotent)** — is also material to the API contract but its correct answer depends on MD-001
(e.g. "delete an already-deleted task" means different things under hard vs. soft delete). Per the
`batch-independent` batching policy, dependent decisions are deferred to a later round; MD-002 is
recorded as OPEN and will be created in the runtime once MD-001 is answered.

## Runtime decision log

| Decision ID | Type | Question | Status | mustStop | Blocking |
|---|---|---|---|---|---|
| MD-001 (runtime `DEC-2026-07-21-delete-tasks-product-delete-semantics-what-do-715d`) | PRODUCT_ARCHITECTURE_DECISION | What does "delete" mean: hard delete vs soft-delete/trash vs archive-state vs two-tier? | **OPEN — awaiting human** | true | yes |
| MD-002 (not yet created — dependent) | API_CONTRACT_DECISION | DELETE not-found response: keep 404 vs make DELETE idempotent (204) | **OPEN — deferred (dependent on MD-001)** | (pending) | yes |

Command run: `RUN-2026-07-21-chaos-propose-delete-tasks-product-740f43` (state: waiting-for-decision;
change lock held; resume capsule written). Full detail and options in
`.chaos/changes/delete-tasks-product/decision-events.md`.

## Options considered for MD-001 (recommendation is advisory only — not a resolution)

| Option | Summary | Fit vs. stated intent | Cost / risk |
|---|---|---|---|
| A — Keep permanent hard delete, harden UX only | Deletion stays irreversible; only tighten robustness (clear/idempotent responses). No domain change. | Weak — does not address "regret / solid experience" if users expected undo. | LOW effort / HIGH product risk if recoverability was the point. |
| **B — Soft-delete to recoverable Trash (with restore)** *(recommended, advisory)* | DELETE marks the task deleted + hides it from `GET /tasks`; add restore (undo). | **Strong** — best matches "users keep asking to get rid of tasks" + "solid experience". | MEDIUM — changes `GET /tasks` contract + domain model (R-004/R-005). |
| C — Archive as a first-class lifecycle state | Add an `Archived` concept; "get rid of" = archive, never destroy; archived tasks stay reportable. | Medium — good if product wants archived work retained/reportable, less so if users want true deletion. | MEDIUM — new state touches R-005; risk of over-modelling. |
| D — Two-tier: soft-delete Trash + explicit permanent purge (+retention) | Undo *and* real removal; purge endpoint + retention/expiry. | Strong on completeness. | HIGH — largest surface; retention brushes the persistence NON-GOAL; likely needs phasing. |

**Recommendation (advisory, does NOT pre-answer MD-001):** Option **B** — a recoverable
soft-delete/trash with restore is the interpretation most consistent with the evidence of user
intent and the "solid" bar, while staying inside the in-memory demo. Labelled `INFERENCE · MEDIUM`.
The human may legitimately choose A, C, or D; the decision is theirs.

## Change classification

- Type: `BEHAVIOUR_CHANGE` to an existing public endpoint (`DELETE /tasks/{id}`), potentially
  extending the surface (restore/list-trash) depending on MD-001.
- Risk: LOW–MEDIUM inherent (in-memory store, no auth/persistence/external effects), but the
  **contract** blast radius depends entirely on the unresolved MD-001, so it cannot be finalized yet.
- Reasoning: no design/spec is authored while a material axis is open (constitution §2, §5).

## Source manifest

| Source | Status | Role |
|---|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current DELETE + GET behaviour |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | `Remove` = hard delete via `TryRemove` |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | verified | domain model; no deleted/archived marker |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | verified | no delete request DTO today |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | `Delete_removes_a_task` pins hard-delete (204→404) |
| `.chaos/architecture.md` | verified | NON-GOALS: persistence, auth (relevant to recoverable variants) |
| `.chaos/rules/index.md` | verified | R-001/R-003/R-004/R-005/R-006 |
| `.chaos/changes/add-task-query-filters/**` | verified | reference lifecycle for artifact shapes |

## Evidence assessment

- **Evidence found (COMPLETE):** current delete/list behaviour, domain model, test baseline, rules,
  architecture non-goals — all directly inspected.
- **Evidence missing (the decisive gap):** the product's intended *meaning* of deletion. This is not
  in the codebase; it is a human product decision. Labelled `UNKNOWN` and surfaced as MD-001 rather
  than guessed (constitution §3).
- **Impact on confidence:** the missing product intent caps the proposal — it cannot proceed to
  design/spec until MD-001 is answered.

## ADR / rule alignment

| Constraint | Alignment | Confidence |
|---|---|---|
| R-001 Human owns material decisions | **ALIGNED** — MD-001 surfaced as a blocking runtime decision; not guessed. MD-002 recorded OPEN. | HIGH |
| R-003 Preserve green test baseline | ALIGNED — no behaviour changed; 5/5 tests still green (only a behaviour-neutral governance comment added). | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED (forward-looking) — recoverable options would push filtering/marking into the domain `TaskStore`, not the HTTP layer. | MEDIUM |
| R-005 Keep `TaskState` naming | FLAGGED — options C/D (and some B designs) may add a lifecycle value; must reuse/extend `TaskState`, never reintroduce `TaskStatus`. | HIGH |
| R-006 Protected files | ALIGNED — `AGENTS.md` / `README.md` untouched. | HIGH |

## Scaffolding performed (non-material only)

- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`: added a **behaviour-neutral** governance comment
  above the DELETE endpoint pointing to change `delete-tasks-product` and the open MD-001 decision,
  with a `TODO`. **No behaviour changed**; the endpoint still hard-deletes (204/404) exactly as before.
  No request DTO field was added because any such field would bias MD-001 toward a particular option.
- Build + tests re-run after the comment: **green (5/5)** — baseline unchanged.

## Findings

### PRP-001 — The request is under-specified on a material product axis
Type: INFERENCE · Confidence: HIGH · Severity: BLOCKER
The endpoint already deletes; "make it solid" is a request to define deletion's *product meaning*
(recoverable vs. permanent), which is not derivable from code. Surfaced as MD-001; blocks design.

### PRP-002 — Recoverable options change the `GET /tasks` contract and domain model
Type: INFERENCE · Confidence: MEDIUM · Severity: MAJOR (conditional on MD-001)
Options B/C/D require `GET /tasks` to stop returning deleted/archived tasks and add a domain marker
or state (R-004/R-005). This must be designed *after* MD-001, not assumed now.

### PRP-003 — DELETE idempotency (404 vs 204) is a dependent contract decision
Type: FACT · Confidence: HIGH · Severity: MAJOR
Today DELETE is non-idempotent (404 on unknown id). Whether to keep that or make DELETE idempotent
is material but depends on MD-001's semantics; recorded as MD-002 (deferred, OPEN).

## Assumption register

| ID | Assumption | Confidence | Validation |
|---|---|---|---|
| A-1 | "Solid get-rid-of experience" *hints* at recoverability | MEDIUM | Only the human answering MD-001 confirms it — do not act on it. |
| A-2 | The demo stays in-memory (no new persistence) regardless of option | MEDIUM | Confirm with MD-001 answer (option D may pressure this). |

## Confidence summary

- Overall confidence: **N/A for a design verdict** — proposal is BLOCKED_ON_DECISION by construction.
- Evidence coverage: PARTIAL (current behaviour COMPLETE; product intent UNKNOWN by design).
- Assumption load: LOW (the decisive gap is surfaced, not assumed).

## Next command

```text
# Human answers MD-001 in the Decision Center, then:
chaos:resume --run RUN-2026-07-21-chaos-propose-delete-tasks-product-740f43
```
