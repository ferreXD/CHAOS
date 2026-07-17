# Runtime Remediation Loop

`chaos:review` must not merely report proposal issues when they can be fixed, clarified, or explicitly deferred during command runtime.

The command should act as a proposal quality reviewer with guided remediation.

## Purpose

A review that only says "fix these issues" creates friction.

A CHAOS review should:

1. Detect proposal/design/spec/task issues.
2. Classify whether each issue is fixable now.
3. Ask the user whether to apply a suggested amendment, provide custom context, defer, accept risk, or stop.
4. Patch OpenSpec artefacts only after explicit user confirmation.
5. Re-read/re-evaluate affected artefacts after any amendment.
6. Record every material remediation decision as a `REV-DEC-*` Decision Event.
7. Produce a final review report that distinguishes fixed, deferred, accepted-risk, and still-blocking issues.

## Remediation issue classes

| Class | Meaning | Runtime action |
|---|---|---|
| `FIXABLE_NOW` | The reviewer can propose a direct OpenSpec artefact patch. | Offer suggested patch. |
| `NEEDS_USER_DECISION` | A product/design/scope decision is missing. | Ask one focused decision question. |
| `NEEDS_CONTEXT` | User can provide missing context now. | Ask for context and re-evaluate. |
| `NEEDS_ARCHAEOLOGY` | Missing evidence requires code/docs exploration. | Offer to stop and run archaeology or record waiver. |
| `NEEDS_ADR_OR_DECISION_LOG` | Issue affects architecture/governance. | Record decision event and recommend sync/ADR. |
| `NEEDS_MANUAL_REWRITE` | Patch is too broad or risky for automatic review remediation. | Provide remediation checklist. |
| `NOT_FIXABLE_IN_REVIEW` | Must be handled by another command/process. | Record blocker or next action. |

## Required issue prompt

```text
Review issue <ID>: <short title>

Severity: BLOCKING | MAJOR | MINOR | ADVISORY
Type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Fixability: FIXABLE_NOW | NEEDS_USER_DECISION | NEEDS_CONTEXT | NEEDS_ARCHAEOLOGY | NEEDS_ADR_OR_DECISION_LOG | NEEDS_MANUAL_REWRITE | NOT_FIXABLE_IN_REVIEW

Why this matters:
<impact on approval readiness, implementation safety, confidence, or scope>

Suggested remediation:
<concrete amendment or action>

Options:
1. Apply suggested fix now
2. Provide custom context/amendment
3. Defer with rationale
4. Mark accepted risk and continue
5. Keep as blocking
6. Stop
```

## Mode behaviour

| Mode | Runtime remediation behaviour |
|---|---|
| `--light` | Offer fixes for high-impact issues only. Defer/advisory issues may remain with confidence impact. |
| `--standard` | Offer fixes for all material issues. Allow continuation if no direct blocker remains and decisions are recorded. |
| `--strict` | Blocking/material issues must be fixed, explicitly waived where allowed, or final verdict must remain blocked/not ready. |

## Amendment boundary

`chaos:review` may amend:

- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/design.md`
- `openspec/changes/<change-id>/specs/**`
- `openspec/changes/<change-id>/tasks.md`
- `.chaos/changes/<change-id>/proposal-review.md`
- `.chaos/changes/<change-id>/approval.md` only after explicit handoff confirmation
  (legacy `.chaos/reviews/` and `.chaos/approvals/` are read-only for compatibility)

`chaos:review` must not amend production/source implementation code.

## Re-review rule

After applying a remediation patch:

1. Re-read the amended artefact.
2. Re-evaluate the original finding.
3. Mark it as `RESOLVED_DURING_REVIEW`, `PARTIALLY_RESOLVED`, or `UNRESOLVED`.
4. Update confidence/verdict accordingly.

Do not claim a fix is complete without rechecking the artefact.
