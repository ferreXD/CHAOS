---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: delete-tasks-product
  sourceCommand: "chaos:review"
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
    bodyHash: "sha256:9d18d285801dd1be16f5f7eac8034957af8823e9ee2fd50e1d04d95a8e6fc063"
---

# CHAOS Proposal Review — delete-tasks-product

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--standard`
- Mode source: `inferred` (behaviour change to an existing public endpoint; LOW–MEDIUM blast radius)
- Target change: `delete-tasks-product`
- Review date: `2026-07-21`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No` (nothing implemented — see verdict)

## 2. Final Verdict

- **Verdict: `BLOCKED_ON_DECISION`**
- Confidence: `HIGH`
- Evidence coverage: `PARTIAL`
- Assumption load: `LOW`
- OpenSpec validation: `NOT_RUN` (no spec authored while a material axis is open — by design)
- Approval eligible: `No` (a blocking human decision, MD-001, is open)

**Statement:** The proposal is correctly *stopped*. The request is under-specified on a material
product/architecture axis — **MD-001, the meaning of "delete" (permanent hard delete vs.
recoverable soft-delete/trash vs. archive-state vs. two-tier)** — which per **R-001** only a human
may resolve. That decision has been created in the interaction runtime
(`DEC-2026-07-21-delete-tasks-product-delete-semantics-what-do-715d`, `mustStop: true`) and is
**OPEN — awaiting human**. A dependent secondary decision (**MD-002**, DELETE 404-vs-204 idempotency)
is recorded OPEN and deferred. No design, spec, or ambiguous behaviour has been produced. This
verdict is a clean, expected gate — not a defect in the proposal.

> **Post-stop runtime update (recorded, not agent-resolved):** after this review recorded the gate,
> a human (`vscode-user`) answered MD-001 in the VS Code Decision Center — **`opt-soft-trash`**
> (soft-delete to recoverable Trash), rationale *"Easier as a first implementation and we can extend
> later on if needed with options 3 or 4."* Runtime state is now `ready-to-resume` (lock held,
> decision answered **but not consumed**). The verdict of THIS step stands at **BLOCKED_ON_DECISION**
> — that was the correct gate at which the agent stopped. Incorporating the answer and implementing
> soft-delete is the **next** governed step (`chaos:resume` → design/spec → `chaos:apply`); it is
> deliberately **not** done here, so no ambiguous behaviour has been implemented by the agent.

## 3. Executive Summary

`GET`/`DELETE` behaviour and the domain model were fully inspected (`[FACT · HIGH]`). The endpoint
already deletes mechanically, so "make deletion solid" is a request to define the *product meaning*
of deletion — information that lives with the human product owner, not in the code. The proposal
surfaces exactly one primary blocking decision (MD-001) plus one dependent one (MD-002), lists
realistic options with an **advisory** recommendation (`opt-soft-trash`), and stops. This is the
behaviour R-001 and constitution §§1–3, 5 require.

## 4. Source Manifest

| Source | Status | Purpose |
|---|---|---|
| `.chaos/changes/delete-tasks-product/proposal-report.md` | verified | framing + evidence + options |
| `.chaos/changes/delete-tasks-product/decision-events.md` | verified | MD-001 (OPEN/BLOCKING), MD-002 (OPEN/deferred) |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | DELETE hard-delete (204/404); GET unfiltered |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | `Remove` = `TryRemove` (permanent) |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | verified | no deleted/archived marker |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | `Delete_removes_a_task` pins hard-delete |
| `.chaos/architecture.md` | verified | NON-GOALS: persistence, auth |
| `.chaos/rules/index.md` | verified | R-001/R-003/R-004/R-005/R-006 |

## 5. Change Classification

- Change type: `BEHAVIOUR_CHANGE` (possibly surface-extending) — final shape undecidable until MD-001.
- Risk tier: `LOW–MEDIUM` inherent; contract blast radius pending MD-001.
- Brownfield impact: existing DELETE contract + `Delete_removes_a_task` test are directly affected by
  recoverable options (they pin hard-delete today).

## 6. Rule / Constitution Alignment

| Source | Alignment | Finding | Confidence |
|---|---|---|---|
| R-001 Human owns material decisions | **ALIGNED** | MD-001 created in runtime + stopped; not guessed. MD-002 deferred OPEN. | HIGH |
| Constitution §3 No silent assumptions | ALIGNED | Product intent labelled `UNKNOWN` and surfaced, not filled with a guess. | HIGH |
| R-003 Preserve green test baseline | ALIGNED | 5/5 tests green; only a behaviour-neutral governance comment added to the endpoint. | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED (forward-looking) | Recoverable designs would filter/mark in the domain, not HTTP. | MEDIUM |
| R-005 Keep `TaskState` naming | FLAGGED for design | Options C/D (and some B) may add a lifecycle value — must extend `TaskState`, never `TaskStatus`. | HIGH |
| R-006 Protected files | ALIGNED | `AGENTS.md` / `README.md` untouched. | HIGH |

## 7. Findings Register

| ID | Severity | Type | Confidence | Status | Finding | Required action |
|---|---|---|---|---|---|---|
| REV-001 | BLOCKER | INFERENCE | HIGH | OPEN (surfaced) | Request under-specified on delete semantics (MD-001) — a material product axis only a human may decide | Human answers MD-001 in the Decision Center |
| REV-002 | MAJOR | INFERENCE | MEDIUM | OPEN (deferred) | Recoverable options change `GET /tasks` contract + domain model (R-004/R-005) | Design *after* MD-001; do not assume now |
| REV-003 | MAJOR | FACT | HIGH | OPEN (deferred) | DELETE idempotency (404 vs 204) is material but dependent (MD-002) | Create MD-002 in runtime after MD-001 answered |
| REV-004 | ADVISORY | FACT | HIGH | RESOLVED | Scaffolding must not implement the axis | Only a behaviour-neutral comment added; build/tests green |

## 8. Evidence Coverage Matrix

| Area | Evidence required | Found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current delete behaviour | read of DELETE handler + store | TaskEndpoints.cs:49-50, TaskStore.cs:44 | COMPLETE | none |
| List behaviour (deleted visibility) | read of GET handler | TaskEndpoints.cs:21, TaskStore.cs:25 | COMPLETE | none |
| Domain model markers | read of TaskItem/TaskState | TaskItem.cs | COMPLETE | none |
| Test baseline | run `dotnet test` | 5/5 green (pins hard-delete) | COMPLETE | none |
| **Product intent (what "delete" means)** | human product decision | **absent — UNKNOWN** | **WEAK** | **caps proposal → BLOCKED_ON_DECISION** |

## 9. Conflicts and Unknowns

- **UNKNOWN (decisive):** the intended meaning of "delete" (MD-001). Surfaced, not resolved.
- **CONFLICT (latent):** the existing `Delete_removes_a_task` test asserts hard-delete (204→404); any
  recoverable option (B/C/D) will require that test to change. Not resolved here — it is a direct
  consequence of MD-001 and must be handled in design/apply after the human decides.

## 10. Deferred / Remaining Open Questions

| ID | Question | Reason unresolved | Owner | Blocks approval? |
|---|---|---|---|---|
| MD-001 | Delete semantics (hard/soft/archive/two-tier) | Material product axis — R-001 | human (product) | **Yes** |
| MD-002 | DELETE 404 vs 204 idempotent | Dependent on MD-001 | human (product/API) | Yes |

## 11. Recommended Remediation

| Priority | Action | Owner | Blocks approval? |
|---|---|---|---|
| Now | Answer MD-001 in the Decision Center | human | Yes |
| After MD-001 | `chaos:resume` → create MD-002 → author design/spec/tasks → OpenSpec validate | agent (orchestrated) | — |
| At apply | Update `Delete_removes_a_task` to match the chosen semantics; keep suite green (R-003) | implementer | — |

## 12. Approval Handoff

- Eligible for approval: **No** — blocked on MD-001.
- Next gate: human decision, not `approval.md`. The command is stopped and holds a change lock.

## 13. Next Suggested Command

```text
# After MD-001 is answered in the Decision Center:
chaos:resume --run RUN-2026-07-21-chaos-propose-delete-tasks-product-740f43
```

## Config Context

- Status: `CONFIG_OK`
- Interaction runtime: `commands.enabled: true` · `decisionBatching: batch-independent`
- Runtime session: `RUN-2026-07-21-chaos-propose-delete-tasks-product-740f43` (waiting-for-decision; lock held)
- Material decision open: `DEC-2026-07-21-delete-tasks-product-delete-semantics-what-do-715d`
