---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: secure-api-public-exposure
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-21T00:00:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T00:00:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: null
---

# CHAOS Proposal Review — secure-api-public-exposure

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--strict` (matches the proposal; public-exposure auth is high blast radius)
- Mode source: `inferred`
- Target change: `secure-api-public-exposure`
- Review date: `2026-07-21`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No` (no material implementation exists yet — by design)

## 2. Final Verdict

- Verdict: **`BLOCKED_ON_DECISION`**
- Confidence: `HIGH`
- Evidence coverage: `PARTIAL` (current state COMPLETE; target design cannot be evaluated until the
  blocking decisions are answered)
- Assumption load: `MEDIUM`
- OpenSpec validation: `N/A` (not authored — deferred until SEC-DEC-001/002 are answered)
- Approval eligible: **`No`** — a proposal cannot advance to approval/apply while material,
  behaviour-defining decisions are OPEN (R-001, constitution §1).

## 3. Executive Summary

The proposal correctly identifies that the request "secure it with an API key" is **materially
under-specified**. There is at least one decision — **SEC-DEC-001, which endpoints the key gates** —
that changes the product's observable behaviour (can an anonymous internet client still read all
tasks or probe health?) and is **not derivable from the code**. A second, **SEC-DEC-002 (where the
secret lives / single vs per-consumer)**, is a genuine security-posture and operational trade-off
with no repo precedent. Both are recorded as **BLOCKING / OPEN** and neither was resolved by the
agent, which is exactly what R-001 requires. A third, **SEC-DEC-003 (header + status code)**, is a
client-contract detail with a safe recommended default. The build/test baseline is unchanged and
green (5/5); only inert, non-wired scaffolding was added. **Verdict: BLOCKED_ON_DECISION — route
SEC-DEC-001/002 to a human in the Decision Center, then `chaos:resume`.**

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `.chaos/changes/secure-api-public-exposure/proposal-report.md` | verified | proposal | Frames change; lists material ambiguities; OpenSpec deliberately deferred |
| `.chaos/changes/secure-api-public-exposure/decision-events.md` | verified | governance | SEC-DEC-001/002/003 recorded OPEN/BLOCKING with options + recommendations |
| `src/TaskTracker.Api/Program.cs`, `Endpoints/TaskEndpoints.cs`, `appsettings.json` | verified | current behaviour | No auth; 6 anonymous `/tasks` routes + anonymous `GET /` health |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | baseline | 5/5 green; all requests unauthenticated |
| `.chaos/architecture.md` | verified | posture | Auth = strict/decision-bearing non-goal; health is a liveness signal |
| `.chaos/rules/index.md` | verified | rules | R-001/R-003/R-004/R-005/R-006 |
| `src/TaskTracker.Api/Security/ApiKeyAuthPlaceholder.cs` | verified | scaffolding | Inert, non-wired; enforces nothing (confirmed unreferenced by `Program.cs`) |

## 5. Change Classification

- Change type: `NEW_CAPABILITY` (auth boundary) + `BREAKING` client contract
- Risk tier: `HIGH` (public exposure of a currently-open API; strict, decision-bearing)
- Brownfield impact: adds an authentication gate where none exists; every anonymous caller affected
- Archaeology requirement: `Not applicable` (current behaviour directly evidenced)

## 6. OpenSpec Validation

- Command attempted: none (spec authoring deferred — see proposal-report §OpenSpec Invocation)
- Result: `N/A`
- Impact on confidence: neutral. Authoring spec `SHALL` scenarios now would encode the OPEN
  SEC-DEC-001 scope decision; deferral is the R-001-correct choice, not a gap.

## 7. Material-Decision Review (the crux)

| Decision | Material? | Derivable from code? | Decided by agent? | Verdict |
|---|---|---|---|---|
| SEC-DEC-001 — enforcement scope | **YES** — changes what anonymous clients can read/probe | No | **No (correctly surfaced)** | BLOCKING · OPEN |
| SEC-DEC-002 — key provenance / model | **YES** — security posture + operational model | No | **No (correctly surfaced)** | BLOCKING · OPEN |
| SEC-DEC-003 — header + status code | Yes (client contract) but conventionally defaulted | Partly (convention) | No (default recommended) | OPEN · non-blocking |

Assessment: The proposal honours R-001 — it presents realistic options and a labelled
recommendation for each, and **stops** without choosing. Recommendations are advisory only and do
not pre-empt the human. `[FACT · HIGH]`

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current auth state | read of pipeline + endpoints | none present (fully open) | COMPLETE | none |
| Caller-identity model | domain/config inspection | none exists | COMPLETE | none |
| Target enforcement scope | human decision | OPEN (SEC-DEC-001) | WEAK | blocks verdict |
| Key provenance/model | human decision | OPEN (SEC-DEC-002) | WEAK | blocks verdict |
| Baseline green | build + test | 5/5 pass; 0 warnings | COMPLETE | positive |

## 9. ADR / Decision / Rule Alignment

| Source rule | Alignment | Finding | Severity | Confidence |
|---|---|---|---|---|
| R-001 Human owns material decisions | ALIGNED | SEC-DEC-001/002/003 surfaced OPEN; none decided in chat | — | HIGH |
| R-002 Label knowledge & confidence | ALIGNED | Findings + verdict carry knowledge type + confidence | — | HIGH |
| R-003 Preserve green test baseline | ALIGNED | No behavioural change; 5/5 tests green, 0 warnings | — | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED (planned) | Auth is HTTP-pipeline; placeholder adds no domain dependency | — | HIGH |
| R-006 Protected files | ALIGNED | `AGENTS.md` / root `README.md` untouched | — | HIGH |
| Architecture: auth is strict/decision-bearing | ALIGNED | Escalated to human decision; not implemented | — | HIGH |

## 10. Findings Register

| ID | Severity | Type | Confidence | Fixability | Status | Finding | Required action |
|---|---|---|---|---|---|---|---|
| REV-001 | BLOCKER | FACT | HIGH | NEEDS_USER_DECISION | OPEN | Enforcement scope (SEC-DEC-001) undecided; changes anonymous-client behaviour | Human answers in Decision Center |
| REV-002 | BLOCKER | FACT | HIGH | NEEDS_USER_DECISION | OPEN | Key provenance/model (SEC-DEC-002) undecided; security-posture trade-off | Human answers in Decision Center |
| REV-003 | MINOR | INFERENCE | HIGH | NEEDS_USER_CONFIRM | OPEN | Contract shape (SEC-DEC-003) — safe default recommended | Human confirms or accepts default |
| REV-004 | ADVISORY | FACT | HIGH | INFORMATIONAL | NOTED | Live runtime *pending* decision intentionally not armed in this human-absent batch (would dead-wait 1800s via auto-resume hook); surfacing via artifacts instead | A human creates/answers the decision in an interactive Decision Center session |

## 11. Conflicts and Unknowns

- No conflicts between rules, architecture, and intent — the architecture already flags auth as a
  strict, human-owned decision, which this proposal honours.
- Unknowns are exactly SEC-DEC-001/002 (and SEC-DEC-003), all correctly externalised to the human.

## 12. Deferred / Remaining Open Questions

| ID | Question | Reason unresolved | Owner | Blocks approval? |
|---|---|---|---|---|
| SEC-DEC-001 | Which endpoints require the key? | Material; human-owned (R-001) | human | **Yes** |
| SEC-DEC-002 | Secret provenance; single vs per-consumer | Material; human-owned (R-001) | human | **Yes** |
| SEC-DEC-003 | Header + status code | Client-contract detail; default recommended | human | No |

## 13. Recommended Next Steps

| Priority | Action | Owner | Blocks approval? |
|---|---|---|---|
| Now | Answer SEC-DEC-001 + SEC-DEC-002 in the Decision Center | human | Yes |
| Now | Confirm or accept the SEC-DEC-003 default | human | No |
| After | `chaos:resume` → author OpenSpec spec/design/tasks per the answers, then implement under `--strict` with tests | agent | — |

## 14. Approval Handoff

- Eligible for approval: **`No`** (blocked on material decisions)
- Approval artefact: not written — approval is a human gate and cannot precede the OPEN decisions.

## 15. Next Suggested Command

```text
# after SEC-DEC-001/002 answered (and SEC-DEC-003 confirmed) in the Decision Center:
chaos:resume --change secure-api-public-exposure
```

## Config Context

- Interaction runtime: `commands.enabled: true`, `decisionBatching: batch-independent`
- Runtime state at review: NO_SESSIONS for this change; all locks `released` (read-only check)
- Review report path: `.chaos/changes/secure-api-public-exposure/proposal-review.md`
- Confidence impact: none (state clean)
