---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: require-api-key-auth
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-19T17:49:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T17:49:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f (EA-X2 mechanized worktree p1-armA)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:hook-managed-pending"
---

# CHAOS Proposal Review — require-api-key-auth

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--strict`
- Mode source: `inferred` (decision-bearing change — crosses an architecture NON-GOAL)
- Target change: `require-api-key-auth`
- Review date: `2026-07-19`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No` (pre-implementation posture; apply/verify evidence recorded separately)
- Run context: `EA-X2 mechanized — no live human; posture decision resolved-in-arm (AUTH-DEC-001)`

## 2. Final Verdict

- Verdict: `READY_FOR_APPROVAL`
- Confidence: `MEDIUM`
- Evidence coverage: `PARTIAL`
- Assumption load: `LOW`
- OpenSpec validation: `PASSED`
- Approval eligible: `Yes` (conditional — see §3: the human approval gate is substituted by an
  in-arm resolution in this mechanized run)

## 3. Executive Summary

The proposal is coherent, rule-aligned, and OpenSpec-valid under `--strict`. Its defining feature
is that it **crosses a recorded architecture NON-GOAL** (authentication). The proposal handles that
correctly: it surfaces the posture explicitly and drives an explicit decision (AUTH-DEC-001) rather
than adopting auth silently, keeping the override minimal (single shared key; accounts/roles remain
out of scope). The enforcement design (group-level endpoint filter, AUTH-DEC-002) is the least-
surface, most idiomatic choice and preserves R-004. Confidence is `MEDIUM` — capped only because
(a) this is pre-implementation at review time and (b) R-001's human approval is substituted by an
in-arm resolution in this mechanized EA-X2 run. That single caveat is disclosed, not hidden.

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `openspec/changes/require-api-key-auth/proposal.md` | verified | proposal | Why/What/Capabilities/Impact present |
| `openspec/changes/require-api-key-auth/design.md` | verified | design | AUTH-DEC-001/002/003 + Non-Goals |
| `openspec/changes/require-api-key-auth/specs/task-api/spec.md` | verified | spec delta | ADDED "Authenticate Task Requests" + 6 scenarios |
| `openspec/changes/require-api-key-auth/tasks.md` | verified | tasks | spec/impl/test groups |
| `.chaos/changes/require-api-key-auth/proposal-report.md` | verified | governance | NON-GOAL notice; AUTH-DEC-001..003 |
| `.chaos/changes/require-api-key-auth/decision-events.md` | verified | governance | 3 decisions, resolved-in-arm |
| `.chaos/architecture.md` | verified | posture | auth NON-GOAL (drives AUTH-DEC-001) |
| `.chaos/constitution.md` | verified | principles | §6 posture change; §3 no silent assumptions |
| `.chaos/rules/index.md` | verified | rules | R-001..R-006 |
| `src/TaskTracker.Api/**` | verified | current behavior | `MapGroup("/tasks")`; `GET /` on `app` |

## 5. Change Classification

- Change type: `NEW_CAPABILITY` on an existing surface (auth gate added to `task-api`)
- Risk tier: `MEDIUM–HIGH` governance (NON-GOAL crossing) / `LOW` implementation
- Brownfield impact: breaking for unauthenticated `/tasks` callers (intended); `GET /` unaffected
- Archaeology requirement: `Not applicable` (current behavior directly evidenced)

## 6. OpenSpec Validation

- Command: `openspec validate require-api-key-auth --strict`
- Result: `PASSED` — "Change 'require-api-key-auth' is valid"
- Impact on confidence: positive — structural validity confirmed

## 7. Proposal Artefact Review

- **proposal.md** — Clear Why/What/Impact; correctly frames `task-api` as a MODIFIED capability
  and the change as breaking-for-unauthenticated. Confidence: HIGH.
- **design.md** — Records AUTH-DEC-001 (posture), AUTH-DEC-002 (filter vs middleware vs inline),
  AUTH-DEC-003 (config/default) with alternatives; Non-Goals bound the override. Confidence: HIGH.
- **specs/** — ADDED "Authenticate Task Requests" with 6 scenarios (valid/missing/incorrect,
  before-existence, before-validation+no-mutation, public root). Each requirement has ≥1 scenario.
  Confidence: HIGH.
- **tasks.md** — spec/impl/test groups map to the design and the contract. Confidence: HIGH.

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current routing | `/tasks` group + `GET /` mapping | TaskEndpoints.cs / Program.cs | COMPLETE | none |
| Enforcement point | filter runs before handler | ASP.NET endpoint-filter semantics | COMPLETE | none |
| Posture decision | explicit NON-GOAL override | AUTH-DEC-001 | COMPLETE | none |
| Public root | `GET /` outside group | Program.cs | COMPLETE | none |
| Auth tests | passing tests | land at apply (now green) | PARTIAL→COMPLETE | caps to MEDIUM at review |
| Human approval (R-001) | Decision-Center answer | substituted in-arm (EA-X2) | WEAK | disclosed caveat |

## 9. ADR / Decision / Rule Alignment

| Source | Alignment | Finding | Severity | Confidence |
|---|---|---|---|---|
| R-001 Human owns material decisions | DEVIATION (documented) | No live human; decisions resolved-in-arm with rationale, not chat-guessed | MAJOR (disclosed) | HIGH |
| R-002 Label knowledge & confidence | ALIGNED | all findings/decisions/verdicts labelled | — | HIGH |
| R-003 Preserve green baseline | ALIGNED | 5 baseline tests retained + 8 new; green | — | HIGH |
| R-004 Domain→HTTP boundary | ALIGNED | auth is an HTTP-layer filter; domain untouched | — | HIGH |
| R-005 Keep `TaskState` | ALIGNED | no domain/enum change | — | HIGH |
| R-006 Protected files | ALIGNED | AGENTS.md / root README untouched | — | HIGH |
| Architecture §6 posture | ALIGNED | posture crossing made explicit via AUTH-DEC-001 | — | HIGH |

## 10. Findings Register

| ID | Severity | Type | Confidence | Status | Finding | Required action |
|---|---|---|---|---|---|---|
| REV-001 | MAJOR | FACT | HIGH | ACKNOWLEDGED | R-001 human approval is substituted by an in-arm resolution (EA-X2, no human) | Disclose in every artifact (done); re-confirm with a human before real merge |
| REV-002 | ADVISORY | FACT | HIGH | DEFERRED | `.chaos/architecture.md` auth posture still says "None/NON-GOAL" | Update posture at `chaos:sync` (AUTH-DEC-001 → UPDATE_ARCHITECTURE_POSTURE); out of this change's edit scope |
| REV-003 | ADVISORY | INFERENCE | MEDIUM | ACCEPTED | Single shared key, ordinal compare (no rotation/timing-safety) | Bounded by design Non-Goals; acceptable for the demo |

## 11. Runtime Remediation Log

| Finding | Action | Decision | Result |
|---|---|---|---|
| REV-001 | Disclose deviation + cap confidence | resolved-in-arm (no human) | verdict READY_FOR_APPROVAL at MEDIUM confidence |

## 12. Decision Events

See `.chaos/changes/require-api-key-auth/decision-events.md`: AUTH-DEC-001 (posture change,
sync UPDATE_ARCHITECTURE_POSTURE), AUTH-DEC-002 (endpoint filter, sync NONE), AUTH-DEC-003
(config/default, sync NONE). All RESOLVED_IN_ARM.

## 13. Assumption Register

| ID | Assumption | Confidence | Validation |
|---|---|---|---|
| A-1 | Group filter runs before handler → 401 before read/mutate | HIGH | tests 3.4/3.5 green at verify |
| A-2 | `GET /` outside the group stays public | HIGH | test 3.7 green |
| A-3 | "not set" = null/whitespace | MEDIUM | AUTH-DEC-003 |

## 14. Conflicts and Unknowns

- One reconciled CONFLICT: task vs architecture NON-GOAL — resolved by the explicit posture
  decision AUTH-DEC-001 (the task is the human-authored instruction that authorizes the override).
- No unknowns that block implementation readiness.

## 15. Deferred / Remaining Open Questions

| ID | Question | Owner | Sync action |
|---|---|---|---|
| Q-1 | Promote auth posture into `.chaos/architecture.md` | maintainer | UPDATE_ARCHITECTURE_POSTURE |
| Q-2 | Re-confirm AUTH-DEC-001 with a human before real merge | maintainer | (governance) |

## 16. Approval Handoff

- Eligible for approval: `Yes` (in-arm; a human re-confirmation is recommended before real merge)
- Required human decision (normal flow): approve the posture change AUTH-DEC-001. In this EA-X2
  mechanized run it is resolved-in-arm and disclosed.

## 17. Next Suggested Command

```text
chaos:apply require-api-key-auth
```
