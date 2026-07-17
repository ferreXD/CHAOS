# CHAOS Review Output Contract

`chaos:review` must produce a Markdown report at (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/proposal-review.md
```

After explicit approval handoff confirmation, it may also write:

```text
.chaos/changes/<change-id>/approval.md
```

Legacy `.chaos/reviews/<change-id>-proposal-review.md` and
`.chaos/approvals/<change-id>-approval.md` may be READ for compatibility but are no
longer the preferred output location. Do not migrate legacy artifacts. Do not update
shared governance indexes directly. Canonical layout: `.chaos/changes/README.md`.

## Purpose

`chaos:review` is a pre-implementation proposal review and guided remediation command.

It reviews OpenSpec proposal/design/spec/tasks and may amend OpenSpec artefacts only after explicit user confirmation.

It must not modify production/source implementation code.

## Required report structure

```md
# CHAOS Proposal Review — <change-id>

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--light|--standard|--strict`
- Mode source: `explicit|inferred|user-overridden`
- Target change: `<change-id>`
- Review date: `<date>`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No`

## 2. Final Verdict

- Verdict: `READY_FOR_APPROVAL|READY_WITH_CONDITIONS|NEEDS_REVISION|BLOCKED|INSUFFICIENT_EVIDENCE`
- Confidence: `HIGH|MEDIUM|LOW`
- Evidence coverage: `COMPLETE|PARTIAL|WEAK`
- Assumption load: `LOW|MEDIUM|HIGH`
- OpenSpec validation: `PASSED|FAILED|NOT_RUN|NOT_AVAILABLE`
- Approval eligible: `Yes|No|Conditional`

## 3. Executive Summary

Short, decision-oriented summary.

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `.chaos/constitution.md` | verified | governance | ... |

Status values: `verified`, `missing`, `inferred`, `user-provided`, `not-applicable`.

## 5. Change Classification

- Change type: `NEW_CAPABILITY|BROWNFIELD_CHANGE|BUGFIX|REFACTOR|MIGRATION_SLICE|ARCHITECTURAL_CHANGE|OPERATIONAL_CHANGE|DOCUMENTATION_ONLY|SPIKE|UNKNOWN`
- Risk tier: `LOW|MEDIUM|HIGH|CRITICAL`
- Brownfield impact: `None|Possible|Confirmed|Unknown`
- Archaeology requirement: `Required|Recommended|Optional|Not applicable|Missing but waived`

## 6. OpenSpec Validation

- Command attempted: `openspec validate <change-id> --strict`
- Result: `PASSED|FAILED|NOT_RUN|NOT_AVAILABLE`
- Evidence: ...
- Impact on confidence: ...

## 7. Proposal Artefact Review

### proposal.md
### design.md
### specs/
### tasks.md

For each artefact:
- Present/missing
- Quality finding
- Blocking gaps
- Confidence
- Runtime remediation offered/applied, if any

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|

## 9. ADR / Decision / Rule Alignment

| Source decision/rule | Alignment | Finding | Severity | Confidence |
|---|---|---|---|---|

## 10. Findings Register

| ID | Severity | Type | Confidence | Fixability | Status | Finding | Evidence | Required action |
|---|---|---|---|---|---|---|---|---|

Severity: `BLOCKING|MAJOR|MINOR|ADVISORY`.
Type: `FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT`.
Confidence: `HIGH|MEDIUM|LOW`.
Fixability: `FIXABLE_NOW|NEEDS_USER_DECISION|NEEDS_CONTEXT|NEEDS_ARCHAEOLOGY|NEEDS_ADR_OR_DECISION_LOG|NEEDS_MANUAL_REWRITE|NOT_FIXABLE_IN_REVIEW`.
Status: `OPEN|RESOLVED_DURING_REVIEW|PARTIALLY_RESOLVED|DEFERRED|ACCEPTED_RISK|BLOCKING_REMAINS`.

## 11. Runtime Remediation Log

| Finding ID | Action offered | User decision | Artefact changed | Result | Confidence impact |
|---|---|---|---|---|---|

## 12. Decision Events

### REV-DEC-001 — <short title>

Command: chaos:review
Change ID: <change-id>
Mode: <light|standard|strict>
Type: PROPOSAL_AMENDMENT | DESIGN_AMENDMENT | SPEC_AMENDMENT | TASK_AMENDMENT | EVIDENCE_WAIVER | RISK_ACCEPTANCE | APPROVAL_CONDITION | ARCHITECTURAL_DECISION_CANDIDATE | DEFERRED_DECISION
Status: ACCEPTED_DURING_REVIEW | DEFERRED | REJECTED | RESOLVED_DURING_REVIEW | PARTIALLY_RESOLVED | UNRESOLVED | NEEDS_SYNC | NEEDS_ADR | NEEDS_DECISION_LOG
Knowledge type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Evidence coverage: COMPLETE | PARTIAL | WEAK
Assumption load: LOW | MEDIUM | HIGH

Decision:
...

Rationale:
...

Evidence:
- ...

Affected artefacts:
- ...

Review impact:
...

Sync action:
- NONE | AMEND_OPENSPEC_PROPOSAL | AMEND_OPENSPEC_DESIGN | AMEND_OPENSPEC_SPEC | AMEND_OPENSPEC_TASKS | CREATE_DECISION_LOG | CREATE_ADR | UPDATE_CHAOS_RULES | RECORD_ACCEPTED_RISK

## 13. Assumption Register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|

## 14. Conflicts and Unknowns

- Conflicts between OpenSpec, ADRs, rules, archaeology, or user intent.
- Unknowns that materially affect implementation readiness.

## 15. Deferred / Remaining Open Questions

Only include items not resolved by runtime remediation.

| ID | Question/issue | Reason unresolved | Owner | Confidence impact | Sync action |
|---|---|---|---|---|---|

## 16. Recommended Remediation

| Priority | Action | Owner | Blocks approval? |
|---|---|---|---|

## 17. Approval Handoff

- Eligible for approval: `Yes|No|Conditional`
- Approval artefact recommended: `Yes|No`
- Required human decision: ...

## 18. Next Suggested Command

Usually one of:
- `chaos:apply <change-id>` after explicit approval
- `chaos:review <change-id>` after remediation
- `chaos:propose <intent>` if proposal must be regenerated
- `chaos:archaeology <topic>` if evidence is insufficient
```

## Rules

- No final verdict may be emitted without confidence, evidence coverage, and assumption load.
- No finding may be emitted without knowledge type and confidence.
- No material runtime decision may be omitted from the Decision Events section.
- No OpenSpec change may be marked approval-ready if required artefacts are missing.
- In strict mode, missing required archaeology for confirmed brownfield/high-risk work is blocking unless explicitly waived by the user and recorded.
- Open questions are a fallback. Ask runtime remediation questions first when possible.

## Config resolution

`chaos:review` must use `.chaos/config.yaml` when available to resolve repository conventions. Config-driven path/tool resolution is evidence metadata, not governance authority. ADRs, rules, gates, and OpenSpec remain authoritative over architectural and behavioural decisions.
