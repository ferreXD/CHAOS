---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: prevent-concurrent-edit-loss
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-21T22:35:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:35:00+02:00"
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

# CHAOS Proposal Review — prevent-concurrent-edit-loss

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--strict`
- Mode source: `inferred` (data-loss incident on a public write contract; MEDIUM–HIGH blast radius)
- Target change: `prevent-concurrent-edit-loss`
- Command run: `RUN-2026-07-21-chaos-propose-prevent-concurrent-edit-loss-89b9ee`
- Review date: `2026-07-21`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No` (nothing on the material axis is implemented — by design)

## 2. Final Verdict

- Verdict: **`BLOCKED_ON_DECISION`**
- Confidence: `HIGH`
- Evidence coverage: `COMPLETE`
- Assumption load: `LOW`
- OpenSpec validation: `N/A` (spec deliberately deferred until the material decision resolves)
- Approval eligible: `No` — a material human decision (PROP-DEC-001) is OPEN and mustStop

> The proposal correctly diagnoses a real lost-update defect and correctly refuses to choose the
> fix strategy, because that strategy is a human-owned material decision (R-001). The blocker is
> **intentional and healthy**, not a defect in the proposal. The review's job here is to confirm
> the stop was warranted, the options are complete and fair, and nothing material was silently
> decided.

## 3. Executive Summary

`PUT /tasks/{id}` is unconditional last-write-wins (`TaskEndpoints.cs:38-46` → `TaskStore.cs:34-42`)
and the domain model has no token to even detect a stale base (`TaskItem.cs`). The incident is
reproducible by construction. Closing it requires a **concurrency-control contract**, and the shape
of that contract (optimistic reject / pessimistic lock / detect-and-merge / PATCH) is a
product+contract decision that changes behaviour and is not derivable from the code. The proposal
surfaced this as **PROP-DEC-001** (live in the runtime, mustStop) with a dependent **PROP-DEC-002**
(token transport, failure status, and missing-token back-compat posture), gave an advisory
recommendation (optimistic concurrency via ETag/If-Match), and stopped. **No blocking issues with
the proposal itself; the single blocker is the un-answered human decision.**

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `.chaos/changes/prevent-concurrent-edit-loss/proposal-report.md` | verified | proposal | Diagnosis + option matrix + BLOCKED_ON_DECISION |
| `.chaos/changes/prevent-concurrent-edit-loss/decision-events.md` | verified | governance | PROP-DEC-001 (OPEN/mustStop), PROP-DEC-002 (dependent) |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current behaviour | PUT overwrite, no precondition (38-46) |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | store | blind full-object replace (34-42) |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | verified | model | no version/ETag field |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | verified | contract | `UpdateTaskRequest`; inert `ExpectedVersion` scaffold added |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | baseline | 5/5 green; no conflict coverage |
| `.chaos/architecture.md` | verified | constraints | persistence + auth NON-GOALs; single-instance in-memory |
| `.chaos/rules/index.md` | verified | rules | R-001/R-003/R-004/R-005/R-006 |
| `openspec/changes/**` | not-created | spec | deferred until PROP-DEC-001 resolves (see §6) |

## 5. Change Classification

- Change type: `BEHAVIOUR_CHANGE` + `CONTRACT_CHANGE`
- Risk tier: `MEDIUM–HIGH` (public write contract; every update client; embeds a UX decision)
- Brownfield impact: `Yes` — modifies the primary write path and likely the `TaskItem` shape
- Archaeology requirement: `Not applicable` (current behaviour directly evidenced)

## 6. OpenSpec Validation

- Command attempted: none.
- Result: `N/A` — intentionally deferred. The normative spec delta (status code, token, missing-
  token posture) is *determined by* PROP-DEC-001/002. Authoring it now would bake in an un-decided
  contract, which R-001 forbids. OpenSpec is invoked at `chaos:resume` after the human answers.
- Impact on confidence: none (deferral is correct sequencing, not missing evidence).

## 7. Material Decision Review (the crux)

| Check | Result | Evidence |
|---|---|---|
| Is there a genuinely material, human-owned decision here? | **Yes** | Four strategies produce different products/contracts/UX; not code-derivable |
| Did the agent avoid deciding it in chat/code? | **Yes** | PROP-DEC-001 OPEN in runtime, mustStop; no strategy implemented |
| Are the options realistic and reasonably complete? | **Yes** | optimistic / pessimistic / merge / PATCH — the standard solution space |
| Are consequences + risks stated per option? | **Yes** | decision-events.md option table |
| Is the recommendation labelled advisory, not applied? | **Yes** | "advisory — NOT a resolution" throughout |
| Is the recommendation defensible? | **Yes (MEDIUM–HIGH)** | optimistic respects persistence/auth NON-GOALs; smallest blast radius |
| Is the dependent decision (transport/back-compat) surfaced, not silently assumed? | **Yes** | PROP-DEC-002 documented as dependent/deferred |

Finding: the stop is **correct and required**. Downgrading or auto-answering PROP-DEC-001 would
violate R-001.

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Lost-update root cause | read of PUT + store | `TaskEndpoints.cs:38-46`, `TaskStore.cs:34-42` | COMPLETE | none |
| Absence of a staleness token | read of model/contract | `TaskItem.cs`, `TaskRequests.cs` | COMPLETE | none |
| Constraint bounds (non-goals) | architecture | `architecture.md` NON-GOALs | COMPLETE | none |
| Baseline green | test run | build clean, 5/5 pass | COMPLETE | none |
| Chosen strategy | human decision | PROP-DEC-001 OPEN | **PENDING** | **blocks approval (by design)** |

## 9. Rule Alignment

| Rule | Alignment | Finding | Confidence |
|---|---|---|---|
| R-001 Human owns material decisions | **ALIGNED** | PROP-DEC-001 routed through runtime as mustStop; not guessed | HIGH |
| R-002 Label knowledge & confidence | ALIGNED | findings/verdict carry type + confidence + coverage + load | HIGH |
| R-003 Preserve green test baseline | ALIGNED | baseline unchanged (5/5); scaffold is inert; no behaviour change | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED (planned) | proposal places the conflict check in `TaskStore`, endpoint maps to status | HIGH |
| R-005 Keep `TaskState` naming | ALIGNED | no rename; any new field must not reintroduce `TaskStatus` | HIGH |
| R-006 Protected files previewed-only | ALIGNED | AGENTS.md / README untouched | HIGH |

## 10. Findings Register

| ID | Severity | Type | Confidence | Status | Finding | Required action |
|---|---|---|---|---|---|---|
| REV-001 | BLOCKING (governance) | INFERENCE | HIGH | OPEN | Fix strategy is a material human decision; unanswered | Human answers PROP-DEC-001 in Decision Center |
| REV-002 | MAJOR | FACT | HIGH | OPEN (bound to REV-001) | Root-cause lost-update path is unguarded | Implement chosen strategy at apply (post-decision) |
| REV-003 | ADVISORY | INFERENCE | MEDIUM | DEFERRED | PATCH-only would be a partial fix (same-field edits still lost) | Ensure human weighs this when answering PROP-DEC-001 |
| REV-004 | ADVISORY | INFERENCE | HIGH | DEFERRED | Even optimistic path needs atomic check-then-write in `TaskStore` (CAS/`TryUpdate`) | Apply-time correctness note; not a material decision |
| REV-005 | ADVISORY | FACT | HIGH | NEEDS_DECISION_LOG | Concurrency-control contract is a new API-wide convention | Route PROP-DEC-001/002 to `chaos:sync` (CREATE_DECISION_LOG) |

## 11. Conflicts and Unknowns

- No conflict between the code, the rules, and the request.
- The only `UNKNOWN` that matters is the human's intended strategy — correctly externalised as
  PROP-DEC-001 rather than assumed.

## 12. Decision Events

See `.chaos/changes/prevent-concurrent-edit-loss/decision-events.md`.

- **PROP-DEC-001 — Concurrency-control strategy** — DESIGN_DECISION, **OPEN / mustStop**, runtime
  `DEC-2026-07-21-prevent-concurrent-edit-loss-concurrency-control-stra-5b6c`. Recommendation
  (advisory): optimistic concurrency. Sync action on resolution: `CREATE_DECISION_LOG`.
- **PROP-DEC-002 — Token transport + failure contract + back-compat** — DESIGN_DECISION, OPEN
  (dependent/deferred). Recommendation (advisory): ETag/`If-Match` with a time-boxed grandfather →
  strict-reject migration.

## 13. Approval Handoff

- Eligible for approval: **No** — a material decision is OPEN.
- Required human action: answer **PROP-DEC-001** in the Decision Center, then
  `chaos:resume --change prevent-concurrent-edit-loss`. Resume incorporates the answer, surfaces
  PROP-DEC-002, then (once both are answered) drives OpenSpec + apply.
- The agent must NOT proceed to design/apply of the concurrency mechanism until the decisions are
  answered.

## 14. Next Suggested Command

```text
# After PROP-DEC-001 is answered in the Decision Center:
chaos:resume --change prevent-concurrent-edit-loss
```
