# CHAOS Review Evidence and Confidence Model

## Knowledge types

Every review finding must be labelled.

| Type | Meaning |
|---|---|
| FACT | Directly supported by inspected source, command output, or user-confirmed statement. |
| INFERENCE | Reasonable conclusion drawn from evidence, but not directly stated. |
| ASSUMPTION | Belief required to proceed, not fully validated. |
| UNKNOWN | Material information is missing. |
| CONFLICT | Two or more sources disagree. |

## Confidence levels

| Level | Use when |
|---|---|
| HIGH | Direct evidence exists, validation ran or was evidenced, no material unresolved assumptions. |
| MEDIUM | Evidence exists but is partial; assumptions are bounded; validation may be incomplete. |
| LOW | Critical files are missing, validation did not run, conclusion is mainly inferred, or conflicts exist. |

## Evidence coverage

| Level | Meaning |
|---|---|
| COMPLETE | Required sources were found and reviewed; validation available; no major gaps. |
| PARTIAL | Key sources exist but some supporting evidence is missing. |
| WEAK | The review depends heavily on assumptions, user text, or incomplete files. |

## Assumption load

| Level | Meaning |
|---|---|
| LOW | Few assumptions; none materially affect implementation readiness. |
| MEDIUM | Some assumptions affect implementation details but are manageable. |
| HIGH | Assumptions materially affect correctness, scope, risk, or feasibility. |

## Final verdict constraints

- `READY_FOR_APPROVAL` requires at least MEDIUM confidence and cannot have HIGH assumption load.
- `READY_WITH_CONDITIONS` allows MEDIUM confidence and PARTIAL evidence coverage.
- `NEEDS_REVISION` applies when proposal quality issues are fixable but not safe to approve yet.
- `BLOCKED` applies when a blocking conflict, missing artefact, or rule violation prevents approval.
- `INSUFFICIENT_EVIDENCE` applies when the command cannot fairly assess readiness.

## Anti-patterns

Forbidden:

```text
Looks good.
Probably fine.
No issues found.
Confidence: high because the design seems reasonable.
```

Required:

```text
Finding type: INFERENCE
Confidence: MEDIUM
Evidence: ADR-0010 says mandatory ERP side effects require outbox; proposal mentions outbox but tasks.md lacks idempotency validation task.
Impact: Proposal should not be approved until task coverage is added.
```


## Fixability classification

Every material review finding must also be classified by fixability:

- `FIXABLE_NOW`: safe OpenSpec/CHAOS artefact amendment can be proposed during review.
- `NEEDS_USER_DECISION`: user must choose scope/design/risk direction.
- `NEEDS_CONTEXT`: user can provide missing context now.
- `NEEDS_ARCHAEOLOGY`: requires source/code/domain evidence gathering.
- `NEEDS_ADR_OR_DECISION_LOG`: governance decision must be created or amended.
- `NEEDS_MANUAL_REWRITE`: too broad/risky for automatic remediation.
- `NOT_FIXABLE_IN_REVIEW`: belongs to another command or process.

Fixability does not reduce severity. A blocking issue may be `FIXABLE_NOW`, but it remains blocking until actually fixed/re-evaluated.

## Confidence after remediation

If an issue is fixed during review, confidence may improve only after the amended artefact is re-read/re-evaluated.

If the user defers or accepts risk, confidence must remain capped according to evidence quality and assumption load.
