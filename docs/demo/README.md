# CHAOS worked example — adding query-param filters to the Task Tracker API

This is a guided walkthrough of using **CHAOS** to make one small change to a **real, runnable**
API: adding optional `?status=` and `?priority=` filters to a `GET /tasks` endpoint that today
returns everything.

- **The starting point is real code you can run:**
  [`examples/task-tracker/dotnet/`](../../examples/task-tracker/dotnet/README.md) — an ASP.NET
  Core Minimal API with in-memory CRUD and a green test suite. `GET /tasks` has no filtering.
  That gap is the exercise.
- **The demo is the governance, not the code.** The change is ~12 lines of LINQ. The point is
  to watch **one decision** — *what should happen when a client sends an invalid filter value?* —
  get surfaced, written down, carried from propose through the lifecycle, and finally promoted
  into a durable decision-log entry. That traceable thread is what CHAOS is for.

> **Variant: C#/.NET.** This is the reference cut, built on CHAOS's first-class C#/.NET path.
> The governance flow is language-agnostic; as CHAOS adds language specialists, the same
> scenario will be re-cut under `examples/task-tracker/<language>/` (see
> [Other language variants](#other-language-variants)).
>
> **Fictional domain, no private data.** The `task-tracker` project is made up. The CHAOS
> artifacts below are representative excerpts of what each command produces — enough to teach
> the flow, not a byte-for-byte dump.

This walkthrough covers the essential CHAOS lifecycle commands:

```
chaos:propose → chaos:review → chaos:apply → chaos:verify → chaos:archive → chaos:sync
```

> CHAOS also has a read-only `chaos:archaeology` command for reconstructing how unfamiliar code
> behaves before you touch it. This change is small and the code is right in front of us, so we
> skip it here — reach for it on brownfield changes where current behavior isn't obvious.

---

## The change at a glance

| # | Command | Human does | CHAOS produces | Material decision |
|---|---|---|---|---|
| 1 | `chaos:propose` | states the intent | OpenSpec change + `.chaos/changes/add-task-query-filters/` | **PROP-DEC-001** — invalid filter value → `400` |
| 2 | `chaos:review` | asks for a pre-implementation review | `proposal-review.md` (+ `approval.md`) | **REV-DEC-001** — add a negative-path test task |
| 3 | `chaos:apply` | approves, runs apply | code + tests, `apply-report.md`, tasks checked off | **APP-DEC-001** — parse enums case-insensitively |
| 4 | `chaos:verify` | verifies before archive | `verification.md` (spec traceability) | — (audits the upstream decisions) |
| 5 | `chaos:archive` | closes the change | `archive-report.md`; OpenSpec change moved to `archive/` | **ARC-DEC-001** — route PROP-DEC-001 to sync |
| 6 | `chaos:sync` | reconciles governance | `sync-report.md`, decision-log entry, base spec updated | — (promotes the decision) |

Everything runs in the repo's **`standard`** mode (the configured default) and through the
**interaction runtime**: material decisions surface in the VS Code **Decision Center**, not as
free-text chat questions.

---

## First, run the starting point

Before governing a change, see the thing you're changing actually work:

```bash
cd examples/task-tracker/dotnet
dotnet run --project src/TaskTracker.Api      # http://localhost:5080
# in another shell:
curl http://localhost:5080/tasks
```

You get the seeded list back — note there is **no way to narrow it**:

```json
[
  { "title": "Write the project README",             "status": "Done",       "priority": "Medium" },
  { "title": "Add query-param filters to GET /tasks", "status": "Open",       "priority": "High"   },
  { "title": "Review the CHAOS proposal",            "status": "InProgress", "priority": "High"   },
  { "title": "Clean up sample data",                 "status": "Open",       "priority": "Low"    }
]
```

The endpoint today, in
[`src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`](../../examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs):

```csharp
// GET /tasks — returns every task in the store. No filtering (yet).
group.MapGet("/", (TaskStore store) => Results.Ok(store.All()));
```

**The goal:**

```
GET /tasks?status=open
GET /tasks?priority=high
GET /tasks?status=inprogress&priority=high      # both → AND
```

Simple enough to hold in your head — which is the point. Now let's make the change *the CHAOS way*.

---

## How to read the rest of this walkthrough

Two things recur, so here they are once.

**1. There are two parallel trees, and CHAOS keeps them separate.**

| Tree | Owner | Holds |
|---|---|---|
| `openspec/changes/<id>/` | **OpenSpec** | `proposal.md`, `design.md`, `specs/<capability>/spec.md`, `tasks.md` — the *what/how/spec/steps*, the source of truth |
| `.chaos/changes/<id>/` | **CHAOS** | `*-report.md`, `decision-events.md`, `lifecycle.md` — the *governance & audit trail* |

CHAOS never copies OpenSpec files into `.chaos/`; it **links** to them from `lifecycle.md`.

**2. Material decisions go through the interaction runtime, not chat.**

When a CHAOS command hits a decision only a human should make, it does **not** guess and it
does **not** ask in the chat. It:

1. creates a runtime decision (an MCP `chaos_create_decision` call) → the tool returns
   `mustStop: true`;
2. **stops**, holding a lock on the change, and tells you the decision is waiting in the
   **Decision Center** (with a `decisionId` and a `chaos:resume --run <run-id>`);
3. you answer in the Decision Center UI (choose an option, optionally add a rationale);
4. the command resumes, **incorporates** your answer into the artifacts, marks the decision
   **consumed**, and continues.

Every decision leaves *two* records, linked by the same change id:

- a **runtime JSON record** under `.chaos/interactions/decisions/<DEC-…>/` (`decision.json`,
  `response.json`, per-decision `audit.jsonl`) — the machine-level trail; and
- a **CHAOS markdown decision-event** (`PROP-DEC-001`, `REV-DEC-001`, …) in the change's
  `decision-events.md` — the human-readable governance record.

You'll see both at step 1, then just the markdown records after that.

---

## Step 1 — `chaos:propose`: turn intent into a governed change

```bash
chaos:propose "add optional status/priority filters to GET /tasks" --standard
```

### The material decision (this is the heart of it)

Propose reads the endpoint and reaches a question only a human should answer: *what should
`GET /tasks` do with an invalid filter value* (e.g. `?status=banana`)? Instead of picking for
you, it creates a runtime decision and **stops**:

```jsonc
// .chaos/interactions/decisions/DEC-2026-07-17-add-task-query-filters-invalid-filter-a1b2/decision.json  (excerpt)
{
  "decisionId": "DEC-2026-07-17-add-task-query-filters-invalid-filter-a1b2",
  "commandRunId": "RUN-2026-07-17-chaos-propose-add-task-query-filters-4f9c02",
  "changeId": "add-task-query-filters",
  "sourceCommand": "chaos:propose",
  "interactionType": "single-choice-decision",
  "state": "created",
  "title": "How should GET /tasks handle an invalid filter value?",
  "context": "e.g. ?status=banana. status/priority map to the TaskState/TaskPriority enums.",
  "recommendedOptionId": "reject-400",
  "options": [
    { "id": "reject-400",  "label": "Reject with 400 Bad Request",
      "consequence": "Clear client error; strictest contract.", "recommended": true },
    { "id": "ignore-filter", "label": "Ignore the unknown filter",
      "consequence": "Lenient; can mask client typos." },
    { "id": "empty-result", "label": "Return an empty list",
      "consequence": "Ambiguous — looks like 'no matches'." }
  ]
}
```

In the chat you see only:

```
⏸  chaos:propose is waiting on a decision.
   Decision: How should GET /tasks handle an invalid filter value?
   Answer it in the Decision Center, then it continues automatically
   (in-session auto-resume is on). Or run:  chaos:resume --run RUN-2026-07-17-chaos-propose-add-task-query-filters-4f9c02
   decisionId: DEC-2026-07-17-add-task-query-filters-invalid-filter-a1b2
```

You pick **Reject with 400** in the Decision Center and add a rationale. The UI writes:

```jsonc
// …/DEC-…-invalid-filter-a1b2/response.json  (excerpt)
{
  "selectedOptionId": "reject-400",
  "rationale": "Fail fast on bad input; a typo'd status should be a visible client error, not silent.",
  "selectedBy": "vscode-user",
  "source": "vscode-decision-center"
}
```

Propose resumes, **incorporates** the answer, marks the decision **consumed**, and records the
governance-level event:

```markdown
# .chaos/changes/add-task-query-filters/decision-events.md  (excerpt)

### PROP-DEC-001 — Invalid filter value returns 400

Command: chaos:propose
Change ID: add-task-query-filters
Mode: standard
Type: DESIGN_DECISION
Status: ACCEPTED_DURING_PROPOSAL
Knowledge type: FACT
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Decision:
GET /tasks rejects an unparseable status/priority value with 400 Bad Request.

Rationale:
Fail fast on bad input; a typo'd status should be a visible client error, not silent.
(Runtime decision DEC-2026-07-17-add-task-query-filters-invalid-filter-a1b2, answered
in the Decision Center by vscode-user.)

Evidence:
- src/TaskTracker.Api/Domain/TaskItem.cs — status/priority are the TaskState/TaskPriority enums

Impact on proposal:
Adds a "reject invalid filter" scenario to the spec delta and a validation task.

Sync action:
- CREATE_DECISION_LOG        # this API convention should outlive the change

Follow-up owner: team
```

> Note the `Sync action: CREATE_DECISION_LOG`. Propose already knows this decision is bigger
> than one change — it's an API convention. That routing tag is what step 6 (sync) will act on.

### What propose produced

**OpenSpec tree** (`openspec/changes/add-task-query-filters/`) — the source of truth:

```markdown
# openspec/changes/add-task-query-filters/proposal.md

## Why
GET /tasks returns the entire task list. As the number of tasks grows, clients need to narrow
by status and priority without pulling everything and filtering client-side.

## What Changes
- Add optional `status` and `priority` query parameters to GET /tasks.
- Multiple filters combine with AND.
- An invalid filter value returns 400 Bad Request (see PROP-DEC-001).

## Impact
- Affected specs: task-api
- Affected code: examples/task-tracker/dotnet/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
```

```markdown
# openspec/changes/add-task-query-filters/specs/task-api/spec.md  (delta)

## MODIFIED Requirements

### Requirement: List Tasks
The GET /tasks endpoint SHALL accept optional `status` and `priority` query-param filters.
Multiple filters SHALL combine with logical AND. An unrecognized filter value SHALL result
in a 400 Bad Request.

#### Scenario: Filter by status
- **WHEN** a client sends `GET /tasks?status=open`
- **THEN** the API returns only tasks whose status equals Open

#### Scenario: Combined filters use AND
- **WHEN** a client sends `GET /tasks?status=inprogress&priority=high`
- **THEN** the API returns only InProgress tasks with High priority

#### Scenario: Invalid filter value is rejected
- **WHEN** a client sends `GET /tasks?status=banana`
- **THEN** the API returns 400 Bad Request
```

```markdown
# openspec/changes/add-task-query-filters/tasks.md

## 1. Spec & design
- [ ] 1.1 Confirm delta spec scenarios for status/priority/AND/invalid-value

## 2. Implementation
- [ ] 2.1 Bind optional `status` and `priority` query params on GET /tasks
- [ ] 2.2 Parse values to TaskState/TaskPriority; return 400 on invalid input
- [ ] 2.3 Apply AND filtering over the in-memory store

## 3. Tests
- [ ] 3.1 Test: filter by status returns only matching tasks
- [ ] 3.2 Test: combined status+priority uses AND
```

**CHAOS tree** (`.chaos/changes/add-task-query-filters/`) — governance:

```markdown
# .chaos/changes/add-task-query-filters/lifecycle.md

Change ID: add-task-query-filters
OpenSpec path: openspec/changes/add-task-query-filters
Status: Proposed
Created: 2026-07-17
Last updated: 2026-07-17

## Lifecycle
| Phase    | Artifact           | Status   |
| -------- | ------------------ | -------- |
| Proposal | OpenSpec proposal  | Complete |
| Review   | proposal-review.md | Pending  |
| Approval | approval.md        | Pending  |
| Apply    | apply-report.md    | Pending  |
| Verify   | verification.md    | Pending  |
| Archive  | archive-report.md  | Pending  |
| Sync     | sync-report.md     | Pending  |

## Decision Events
- PROP-DEC-001 — Invalid filter value returns 400

## Current Next Command
chaos:review add-task-query-filters
```

The `proposal-report.md` records the whole run (metadata, source manifest, the runtime decision
log, OpenSpec invocation proof, confidence summary). Its verdict here:
`PROPOSED_READY_FOR_REVIEW`, confidence `MEDIUM` — the design is sound, but no test yet exercises
filtering, so evidence coverage is only `PARTIAL`. (Watch that confidence climb once the tests
land at verify.)

---

## Step 2 — `chaos:review`: check it before you build it

```bash
chaos:review add-task-query-filters --standard
```

Review reads the OpenSpec artifacts and the CHAOS governance trail, then writes
`.chaos/changes/add-task-query-filters/proposal-review.md`. Excerpt:

```markdown
# CHAOS Proposal Review — add-task-query-filters

## 2. Final Verdict
- Verdict: `READY_WITH_CONDITIONS`
- Confidence: `MEDIUM`
- Evidence coverage: `PARTIAL`
- Approval eligible: `Conditional`

## 8. Evidence Coverage Matrix
| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current behavior | read of GET /tasks handler | Endpoints/TaskEndpoints.cs | COMPLETE | none |
| Invalid-value contract | explicit decision | PROP-DEC-001 | COMPLETE | none |
| Negative-path test | test for the 400 case | **missing** | PARTIAL | condition raised |

## 10. Findings Register
| ID | Severity | Type | Status | Finding | Required action |
|---|---|---|---|---|---|
| REV-001 | MINOR | ASSUMPTION | RESOLVED_DURING_REVIEW | tasks.md tests the happy paths but not the 400 that PROP-DEC-001 promises | Add a negative-path test task |

## 17. Approval Handoff
- Eligible for approval: `Conditional`
- Condition: incorporate REV-DEC-001 (test the 400 contract), then approve.
```

The condition is recorded as a decision event that *amends the OpenSpec tasks*:

```markdown
### REV-DEC-001 — Add a negative-path test for the 400 contract

Command: chaos:review
Change ID: add-task-query-filters
Type: TASK_AMENDMENT
Status: ACCEPTED_DURING_REVIEW
Knowledge type: FACT
Confidence: HIGH

Decision:
Add task 3.3 — "Test: invalid status value returns 400" — so the PROP-DEC-001 contract is
actually verified, not just asserted in the spec.

Affected artefacts:
- openspec/changes/add-task-query-filters/tasks.md

Sync action:
- AMEND_OPENSPEC_TASKS
```

`tasks.md` gains:

```markdown
## 3. Tests
- [ ] 3.1 Test: filter by status returns only matching tasks
- [ ] 3.2 Test: combined status+priority uses AND
- [ ] 3.3 Test: invalid status value returns 400          # added by REV-DEC-001
```

You approve. Because approval is a human gate, review asks before writing the approval record —
it never self-approves:

```
This change is eligible for approval. Create .chaos/changes/add-task-query-filters/approval.md?
```

You confirm → `approval.md` is written, and the review verdict flips to `READY_FOR_APPROVAL`.
Next command: `chaos:apply add-task-query-filters`.

---

## Step 3 — `chaos:apply`: implement inside the approved boundary

```bash
chaos:apply add-task-query-filters --standard
```

Apply is the orchestrator. On a .NET change it **delegates the code** to the C# implementation
specialist — but one OpenSpec task at a time, keeping scope and workflow ownership itself. The
specialist gets a bounded brief ("implement task 2.2 from tasks.md; allowed files:
Endpoints/TaskEndpoints.cs; stop if scope exceeds the approved change") and reports back files
changed, tests added, assumptions, and decisions discovered.

While implementing, the specialist hits a small local design choice — should `?status=Open`
and `?status=open` both work? That's a genuine (if minor) decision, so it's recorded:

```markdown
### APP-DEC-001 — Parse filter enums case-insensitively

Command: chaos:apply
Change ID: add-task-query-filters
Type: LOCAL_DESIGN_DECISION
Status: ACCEPTED_DURING_APPLY
Knowledge type: FACT
Confidence: HIGH

Decision:
Use `Enum.TryParse<T>(value, ignoreCase: true, out …)` so `open`/`Open`/`OPEN` all match.

Rationale:
Query-string values are user-facing; case-sensitivity would be a surprising 400. Stays within
the approved contract (still 400 on a genuinely unknown value).

Scope impact:
src/TaskTracker.Api/Endpoints/TaskEndpoints.cs only. No spec change.

Sync action:
- NONE            # implementation detail; nothing to promote
```

**The resulting code** — `GET /tasks` after apply
(`src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`):

```csharp
// GET /tasks?status=open&priority=high
group.MapGet("/", (TaskStore store, string? status, string? priority) =>
{
    TaskState? stateFilter = null;
    if (status is not null)
    {
        if (!Enum.TryParse<TaskState>(status, ignoreCase: true, out var parsed))   // APP-DEC-001
            return Results.BadRequest(new { error = $"Unknown status filter '{status}'." }); // PROP-DEC-001
        stateFilter = parsed;
    }

    TaskPriority? priorityFilter = null;
    if (priority is not null)
    {
        if (!Enum.TryParse<TaskPriority>(priority, ignoreCase: true, out var parsed))
            return Results.BadRequest(new { error = $"Unknown priority filter '{priority}'." });
        priorityFilter = parsed;
    }

    var results = store.All()
        .Where(t => stateFilter    is null || t.Status   == stateFilter)   // AND semantics
        .Where(t => priorityFilter is null || t.Priority == priorityFilter)
        .ToList();

    return Results.Ok(results);
});
```

…and the new tests, including the one review insisted on
(`tests/TaskTracker.Tests/TaskEndpointsTests.cs`):

```csharp
[Fact] public async Task Filters_by_status() { /* 3.1 */ }
[Fact] public async Task Combined_filters_use_AND() { /* 3.2 */ }
[Fact] public async Task Invalid_status_returns_400() { /* 3.3 — from REV-DEC-001 */ }
```

Apply flips the OpenSpec `tasks.md` checkboxes to `[x]` **as it finishes each one** (not at
archive time) and records validation evidence — no "tests pass" claim without the command +
result behind it. Excerpt:

```markdown
# .chaos/changes/add-task-query-filters/apply-report.md  (excerpt)

## 1. Summary
Change ID: `add-task-query-filters`
Mode: `standard`
Result: `APPLIED`
Implementation specialist: `chaos-csharp-implementation-specialist`
Execution confidence: `HIGH`
Validation evidence: `COMPLETE`
Scope drift risk: `LOW`

## 6. Task Execution Log
### Task 2.2 — Parse values; return 400 on invalid input
Status: COMPLETE
Specialist used: chaos-csharp-implementation-specialist
Files changed:
- src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
Decisions discovered:
- APP-DEC-001 (case-insensitive enum parse)

## 9. Validation
Commands run:
- `dotnet build`  → success
- `dotnet test`   → 3 new tests, 8 total, all passing

## 10. Scope Drift Assessment
Scope drift class: NO_DRIFT
```

Next command: `chaos:verify add-task-query-filters`.

---

## Step 4 — `chaos:verify`: prove it does what the spec says

```bash
chaos:verify add-task-query-filters --standard
```

Verify is the independent check before archive. Its backbone is the **spec traceability
matrix** — every requirement/scenario mapped to implementation *and test* evidence.

```markdown
# CHAOS Verification Report — add-task-query-filters  (excerpt)

## Verification Dashboard
| Area | Status | Confidence | Notes |
|---|---|---|---|
| OpenSpec validation | Passed | HIGH | `openspec validate add-task-query-filters --strict` |
| Build | Passed | HIGH | dotnet build |
| Tests | Passed | HIGH | 8 passing, incl. the 3 new ones |
| Decision events | Complete | HIGH | PROP-DEC-001, REV-DEC-001, APP-DEC-001 all recorded |
| Scope drift | None | HIGH | matches approved boundary |
| Archive readiness | READY | HIGH | — |

## Spec Traceability Matrix
| Requirement / Scenario | Implementation evidence | Test evidence | Status |
|---|---|---|---|
| Filter by status | TaskEndpoints.cs stateFilter | Filters_by_status | SATISFIED |
| Combined filters use AND | .Where chain | Combined_filters_use_AND | SATISFIED |
| Invalid value → 400 | BadRequest branch (PROP-DEC-001) | Invalid_status_returns_400 (REV-DEC-001) | SATISFIED |

## Decision Event Audit
| Decision ID | Source | Status | Sync action | Confidence |
|---|---|---|---|---|
| PROP-DEC-001 | chaos:propose | consumed | CREATE_DECISION_LOG | HIGH |
| REV-DEC-001 | chaos:review | consumed | AMEND_OPENSPEC_TASKS (done) | HIGH |
| APP-DEC-001 | chaos:apply | consumed | NONE | HIGH |

## Final Verdict
Verdict: `VERIFIED`
Confidence: `HIGH`
Archive readiness: `READY`
```

Notice confidence rose to `HIGH`: the test-coverage gap that kept the proposal at `MEDIUM` is
now closed by real passing tests. The matrix also shows the decision thread paying off — the
`Invalid value → 400` row traces cleanly from **PROP-DEC-001** (contract) to **REV-DEC-001**
(the test) to a passing assertion.

Next command: `chaos:archive add-task-query-filters`.

---

## Step 5 — `chaos:archive`: close the change, keep the trail

```bash
chaos:archive add-task-query-filters --standard
```

Archive does two distinct things:

1. **Moves the OpenSpec change** out of the active set:
   `openspec/changes/add-task-query-filters/` → `openspec/changes/archive/2026-07-17-add-task-query-filters/`
   (and promotes the delta into base specs unless `--skip-specs`).
2. **Leaves the CHAOS folder in place** — `.chaos/changes/add-task-query-filters/` is *not*
   moved; archive just flips its `lifecycle.md` to `Status: Archived` and writes the archive report.

The report's job is closure accounting — especially auditing every decision and routing anything
that must outlive the change:

```markdown
# CHAOS Archive Report — add-task-query-filters  (excerpt)

## 1. Archive Dashboard
| Field | Value |
|---|---|
| Verification verdict | VERIFIED |
| Tasks complete | Yes |
| Decision events | 3 found, 0 unclassified, 1 sync-required |
| Archive readiness | Ready |
| Recommended outcome | ARCHIVED |

## 8. Source-of-Truth Update Confirmation
| Confirmation | Result | Evidence |
|---|---|---|
| Active change removed | CONFIRMED | not in `openspec/changes/` |
| Archived change found | CONFIRMED | `openspec/changes/archive/2026-07-17-add-task-query-filters/` |
| Base specs updated | CONFIRMED | `openspec/specs/task-api/spec.md` |

## 10. Decision Event Closure Audit
| ID | Source | Closure Status | Sync Action | Confidence |
|---|---|---|---|---|
| PROP-DEC-001 | propose | DECISION_LOG_REQUIRED | promote to decision log | HIGH |
| REV-DEC-001 | review | OPENSPEC_AMENDED | none (tasks already amended) | HIGH |
| APP-DEC-001 | apply | CLOSED | none | HIGH |

## 15. Runtime Closure Decisions
### ARC-DEC-001 — Route the invalid-filter convention to sync
Type: sync-routing
Status: accepted
Decision:  Carry PROP-DEC-001 to chaos:sync for promotion to a decision-log entry.
Sync action: DECISION_LOG_REQUIRED

## 16. Archive Verdict
Verdict: `ARCHIVED`
Confidence: HIGH
Retro recommended: NO
```

The change is done — but PROP-DEC-001 has been flagged `DECISION_LOG_REQUIRED`, so there's one
governance step left. Next command: `chaos:sync --change add-task-query-filters`.

---

## Step 6 — `chaos:sync`: promote the decision so it outlives the change

```bash
chaos:sync --change add-task-query-filters --standard
```

Sync reconciles the change's decisions with durable governance. The change-scoped form is
contributor-safe (it writes into the change folder, not repo-wide indexes). It writes
`.chaos/changes/add-task-query-filters/sync-report.md`:

```markdown
# CHAOS Sync Report — add-task-query-filters  (excerpt)

## 6. Decision Event Reconciliation
| Decision | Source | Promotion | User action | Status |
|---|---|---|---|---|
| PROP-DEC-001 | propose/archive | DECISION_LOG | create decision-log entry | applied |
| REV-DEC-001 | review | NO_PROMOTION | already in OpenSpec tasks | closed |
| APP-DEC-001 | apply | NO_PROMOTION | implementation detail | closed |

## 7. Planned Patch Preview
### Will create
- docs/decision-log/2026-07-17-task-filter-validation.md
### Will update
- openspec/specs/task-api/spec.md   (promote List Tasks delta into base spec)

## 12. Final Sync Verdict
Verdict: SYNCED
Confidence: HIGH
Manual follow-up required: NO
```

And the durable artifact PROP-DEC-001 finally becomes:

```markdown
# docs/decision-log/2026-07-17-task-filter-validation.md

# Decision — Invalid query-param filter values return 400

Status: Accepted
Date: 2026-07-17
Source: PROP-DEC-001
Related change: add-task-query-filters

## Decision
List endpoints reject an unrecognized filter value with 400 Bad Request (rather than ignoring
it or returning an empty list).

## Rationale
Fail fast on bad input; a typo'd filter should be a visible client error, not silent.

## Scope
GET /tasks today; the convention applies to future list endpoints.

## Consequences
New list filters must validate their inputs and return 400 on unknown values.

## Sync metadata
Requires ADR: No
Created by: chaos:sync
Promotion source: PROP-DEC-001
```

That is the payoff. A design decision made once — in a Decision Center prompt during
`chaos:propose` — is now a **first-class, discoverable convention** any future change can find
and follow, with an unbroken trail back to who decided it and why.

---

## The audit trail you end up with

After the full run, the working code lives in the demo project and the governance lives in the
two CHAOS/OpenSpec trees:

```
examples/task-tracker/dotnet/
  src/TaskTracker.Api/Endpoints/TaskEndpoints.cs   # GET /tasks now filters
  tests/TaskTracker.Tests/TaskEndpointsTests.cs    # + 3 filter tests (8 total)

.chaos/
  changes/
    add-task-query-filters/                         # stays here after archive
      lifecycle.md            → Status: Archived
      proposal-report.md      # step 1
      proposal-review.md      # step 2
      approval.md             # step 2
      apply-report.md         # step 3
      verification.md         # step 4
      archive-report.md       # step 5
      sync-report.md          # step 6
      decision-events.md      # PROP-DEC-001, REV-DEC-001, APP-DEC-001
  interactions/
    decisions/DEC-2026-07-17-…-invalid-filter-a1b2/ # runtime record of PROP-DEC-001
      decision.json · response.json · audit.jsonl

openspec/
  specs/task-api/spec.md                            # base spec, now includes the filter reqs
  changes/archive/2026-07-17-add-task-query-filters/
    proposal.md · design.md · specs/… · tasks.md    # all tasks [x]

docs/
  decision-log/2026-07-17-task-filter-validation.md # step 6 — the promoted decision
```

A reviewer who has never seen this change can reconstruct, from disk alone: **what** changed
(spec delta + code), **why** (proposal + decision log), **who decided the one judgment call**
and with what rationale (runtime `response.json` → `PROP-DEC-001`), **that it was independently
verified** (traceability matrix, passing tests), and **that nothing drifted out of scope**
(apply's scope assessment + verify's audit). That reconstruction — not the twelve lines of
filtering code — is the thing CHAOS produces.

## What each decision taught

| Decision | Where it was made | Where it ended up | Lesson |
|---|---|---|---|
| **PROP-DEC-001** invalid → 400 | Decision Center, during propose | a decision-log convention | material design calls are surfaced *before* coding and promoted to durable governance |
| **REV-DEC-001** add 400 test | review | an OpenSpec task, then a passing test | review adds coverage the proposal missed, traceably |
| **APP-DEC-001** case-insensitive | apply | recorded, `Sync action: NONE` | even small local choices are written down — but not everything needs promoting |

## Other language variants

CHAOS's implementation specialist is C#/.NET today, so this is the C#/.NET cut of the example.
The governance flow — propose → review → apply → verify → archive → sync, with material
decisions through the Decision Center — is **language-agnostic**. As CHAOS adds specialists for
other stacks, this same `add-task-query-filters` scenario will be re-cut under
`examples/task-tracker/<language>/`, swapping only the runnable project and the code/test
excerpts in the apply and verify steps. The artifact shapes, decision records, and audit trail
stay identical.

## Where to go next

- **Run the starting point:** [`examples/task-tracker/dotnet/`](../../examples/task-tracker/dotnet/README.md)
- **Install & onboarding:** [`docs/installation.md`](../installation.md)
- **Roadmap:** [project roadmap](../../.chaos/roadmap/roadmap.md)
- **The commands used here:** each has a skill under `.claude/skills/chaos-*` with a reference
  folder documenting its contract, report template, and decision-event register.
