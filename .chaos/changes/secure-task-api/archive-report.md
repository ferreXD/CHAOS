---
chaosMetadata:
  schemaVersion: 1
  artifactType: archive-report
  artifactScope: change
  changeId: secure-task-api
  sourceCommand: "chaos:archive"
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: local-git
    confidence: LOW
---

# CHAOS Archive Report — secure-task-api

## 1. Archive Dashboard

| | |
|---|---|
| Verdict | **ARCHIVED_WITH_DEBT** |
| Confidence | HIGH · evidence coverage COMPLETE · assumption load LOW |
| Mode | strict (inferred from `change.md`) |
| Source-of-truth confirmation | **CONFIRMED** |
| Decision closure | **15 enumerated / 15 classified / 0 UNCLASSIFIED** |
| Debt load | MEDIUM — 5 items, all implementation-side |
| Governance contradictions | **none** |

## 2. Invocation

Command: `chaos:archive secure-task-api`
Run: `RUN-2026-08-01-chaos-archive-secure-task-api-7ef4f8`
Mode: strict · Dry-run: no · Force waiver: **not used**
Archive gate: ARC-DEC-002 (`confirmation`) — answered `confirm-archive-with-debt`, "demo purposes"

This is the **second** archive attempt. The first (`RUN-…-a27117`, ARC-DEC-001) was deliberately
deferred by the human to `sync-first-then-archive`; no archive was executed then, and no
archive report was written for it.

## 3. Verification Gate

| | |
|---|---|
| Verification verdict | `READY_WITH_DEBT` (run `RUN-…-4efeab`, strict) |
| Gate result | **PASS with debt routing** — not a blocking verdict, so no override was needed |
| Confidence | MEDIUM · evidence COMPLETE · assumption load LOW |
| Traceability | 8 SATISFIED / 5 PARTIAL / 0 MISSING |
| Scope drift | NO_DRIFT |

`--force-waiver` was **not** used. No blocking verdict was overridden, so this is a normal
archive-with-debt, not `ARCHIVED_UNDER_GOVERNANCE_OVERRIDE`.

## 4. Pre-Archive Validation (re-run at archive time)

| Check | Result |
|---|---|
| `dotnet build` | 0 warnings / 0 errors |
| `dotnet test` | **34/34** |
| `openspec validate secure-task-api --strict` | PASS |
| Tasks | 39/39 ticked |
| Contract | 17/17 ticked |
| Governance drift re-grep | **none** — zero stale auth claims in `architecture.md`, `context.md`, `decisions/index.md` |
| R-009 / R-010 present | yes |

## 5. Decision Event Closure Matrix

**15 enumerated (§2 scan rule) / 15 classified / 0 UNCLASSIFIED — balanced.**
Two `## Runtime note` headings in the ledger are narrative and correctly excluded.

| ID | Source | Type | Closure Status | Sync Action | Retro Topic | Confidence |
|---|---|---|---|---|---|---|
| ESC-001 | propose | escalation | CLOSED | NONE | light-valve behaviour | HIGH |
| PROP-DEC-001 | propose | scope | OPENSPEC_AMENDED | NONE | — | HIGH |
| PROP-DEC-002 | propose | exposure | CLOSED | NONE (reconciled 2026-08-01) | — | HIGH |
| PROP-DEC-003 | propose | rigor | CLOSED | NONE | — | HIGH |
| PROP-DEC-004 | propose | credential mechanism | CLOSED | NONE (ADR-0001 indexed) | PoC-rationale vs strict posture | HIGH |
| PROP-DEC-005 | propose | transport | CLOSED | NONE (ADR-0001) | — | HIGH |
| PROP-DEC-006 | propose | archaeology waiver | **ACCEPTED_RISK** | RECORD_ACCEPTED_RISK | waiver-equivalence claim | MEDIUM |
| REV-DEC-001 | review | governance obligation | CLOSED | NONE (discharged by `--adrs`) | — | HIGH |
| REV-DEC-002 | review | spec + rule | CLOSED | NONE (R-009 promoted) | — | HIGH |
| REV-DEC-003 | review | accepted risk + rule | **ACCEPTED_RISK** | RECORD_ACCEPTED_RISK (bounded by R-010) | dev-bypass pattern | HIGH |
| REV-DEC-004 | review | approval (`approves-change: true`) | CLOSED | NONE | — | HIGH |
| APPLY-DEC-001 | apply | design placement | CLOSED | NONE | — | HIGH |
| APPLY-DEC-002 | apply | unreachable spec clause | **FOLLOW_UP_CHANGE_REQUIRED** | AMEND_OPENSPEC_SPEC | spec-vs-ordering conflict | HIGH |
| ARC-DEC-001 | archive | deferral | CLOSED | NONE | value of sync-before-archive | HIGH |
| ARC-DEC-002 | archive | archive-with-debt | CLOSED | NONE | — | HIGH |

## 6. OpenSpec Archive Execution

Command resolved and run: `openspec archive secure-task-api --yes`

Output (verbatim highlights):

- `api-authentication: create` → `+ 6 added`
- `api-edge-hardening: create` → `+ 7 added`
- `Totals: + 13, ~ 0, - 0, → 0` · `Specs updated successfully.`
- `Change 'secure-task-api' archived as '2026-08-01-secure-task-api'.`

Non-blocking warning recorded honestly: *"Consider splitting changes with more than 10 deltas."*
The change did carry 13 requirements across two capabilities — a fair observation, and worth
weighing at framing time on the next change of this size.

## 7. Source-of-Truth Confirmation — **CONFIRMED**

| Check | Result |
|---|---|
| Active change removed | PASS — `openspec/changes/` now contains only `archive/` |
| Archived at expected location | PASS — `openspec/changes/archive/2026-08-01-secure-task-api/` |
| Proposal/design/specs/tasks preserved in archive | PASS — all four present |
| Base specs updated from deltas | PASS — `openspec/specs/api-authentication/spec.md` (6 requirements), `openspec/specs/api-edge-hardening/spec.md` (7) |
| `openspec list` reflects closure | PASS — "No active changes found." |
| CHAOS archive report written | PASS — this file |

No confidence cap applied: confirmation is CONFIRMED, not PARTIAL or UNCONFIRMED.

## 8. Waiver / Accepted Risk Ledger

| ID | Waived condition | Accepted by | Impact | Confidence impact | Follow-up |
|---|---|---|---|---|---|
| PROP-DEC-006 | strict brownfield archaeology requirement | vscode-user, 2026-08-01 ("Not needed") | none observed — the source manifest plus the 5-test baseline were claimed as equivalent evidence, and verification did not contradict that | none (equivalence accepted) | none |
| REV-DEC-003 / RK-8 | shipping a development-gated auth bypass on a service intended for public exposure | vscode-user, 2026-08-01 ("Risk accepted") | Critical **if** it reaches a deployed environment | verification confidence held at MEDIUM | **bounded by R-010** (blocker) — future work cannot repeat the pattern behind a single gate |

## 9. Debt Ledger (carried into archive)

| Item | Reason | Impact | Route |
|---|---|---|---|
| RK-8 dev issuance endpoint | deliberate, human-accepted | Critical if deployed; mitigated by two registration-time gates + 5 tests | `chaos:retro`; constrained by R-010 |
| RK-5 no production token issuer | scoped out at framing | a real deployment is not usable until an issuer exists | follow-up change |
| VFY-001 test signing key vs spec scenario | spec wording broader than intended | not a security defect; the scenario as written is false | follow-up change — narrow the scenario or generate the key at runtime |
| VFY-002 chunked-body `413` gap | `Content-Length`-only guard | a chunked oversized body may surface as `400`; **inferred, not executed** | follow-up change — add a chunked-body test |
| APPLY-DEC-002 unreachable partition branch | spec clause conflicts with mandated middleware order | a spec clause can never execute | spec amendment |
| SYNC-006 ADR `chaosMetadata` | advisory (`docs/adr/**` is `optional` in config) | provenance only | defer |

Debt load: **MEDIUM**. None of it is a governance contradiction — that class was cleared by the
`--adrs` and `--rules` syncs before this archive ran.

## 10. Final Verdict

Verdict: **ARCHIVED_WITH_DEBT**
Confidence: **HIGH** · Evidence coverage: COMPLETE · Assumption load: LOW · Debt load: MEDIUM
Governance override: **not used** · Force waiver: **not used**

Confidence is HIGH here (versus MEDIUM at verification) because every archive-time claim was
re-executed or re-grepped rather than inherited: build, tests, OpenSpec validation, the drift
re-check, and the six source-of-truth confirmations. The MEDIUM-confidence items from
verification are carried as *named debt*, not as uncertainty about the archive itself.

## 11. Closure Summary

`secure-task-api` is closed. It began as `chaos:propose "secure the API before we expose it"
--light`, auto-escalated light → standard on an architecture non-goal crossing, then
standard → strict by human decision, and ends archived with 13 requirements promoted into the
base specs.

Fifteen decisions were surfaced to the human and none was decided by a command. Three review
findings were remediated before implementation, one of them (REV-002, unauthenticated rate
limiting) a genuine threat-model gap rather than a documentation nit. Two durable rules —
R-009 and R-010 — came out of the review and now constrain future work; R-010 in particular
converts a one-off RK-8 mitigation into an enforceable invariant.

Next: `chaos:retro secure-task-api` is worth running — this lifecycle produced several
process observations (the light-valve escalation chain, the sync-before-archive ordering, and a
recurring interaction-runtime defect) that are more valuable as process improvements than as
per-change notes.

## Todo Candidates

- **RK-5 production token issuer** — highest functional gap; the API is not independently usable.
- **APPLY-DEC-002 spec amendment** — the unreachable partition-key clause.
- **VFY-002 chunked-body `413` test** — the only inferred (unexecuted) finding in the change.
- **VFY-001 spec scenario narrowing** — or generate the test signing key at runtime.
- **SYNC-006** — ADR `chaosMetadata`, or move `docs/adr/**` to `include`.
- **Interaction-runtime defect (4 occurrences this session)** — `createDecision` writes the
  decision artifact before validating the session transition, stranding a `waiting` decision when
  the session is `ready-to-resume`. Cost two run IDs; worth fixing in
  `tools/chaos-interaction-runtime`.
- **OpenSpec size warning** — "more than 10 deltas"; consider splitting changes of this size at
  framing time.
