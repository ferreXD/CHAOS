# chaos:review Mode Reference

## `--light`

Use for low-risk changes such as documentation, small spec clarifications, low-risk internal refactors, or proposal drafts.

Required checks:

- Resolve target OpenSpec change.
- Check required OpenSpec artefacts exist.
- Run OpenSpec validation if available.
- Check `.chaos/constitution.md` and `.chaos/rules/index.md` exist.
- Produce final verdict with confidence.

May skip deep ADR and archaeology review if not relevant.

A light review cannot produce `READY_FOR_APPROVAL` with HIGH confidence unless evidence coverage is complete.

## Default mode

If no mode is supplied, infer the mode from change risk and tell the user the result. Use `--standard` as the fallback when risk cannot be confidently classified.

## `--standard` default

Use for normal product, API, backend, frontend, mobile, or workflow changes.

Required checks:

- Everything in `--light`.
- ADR / decision index alignment.
- Rule alignment.
- Evidence coverage matrix.
- Proposal/design/spec/tasks quality review.
- Archaeology relevance assessment.
- Findings and assumption registers.

## `--strict`

Use for high-risk or high-impact changes:

- Brownfield migration.
- Architecture changes.
- Data model or persistence changes.
- Auth/security changes.
- External side effects.
- Offline/replay/idempotency.
- Release/cutover/deployment.
- Customer-visible behavior changes.
- Changes with unclear legacy behaviour.

Additional strict checks:

- Required archaeology when brownfield impact is confirmed or likely.
- Exact source manifest, no range summaries.
- OpenSpec validation is mandatory unless tool unavailable and recorded.
- Missing ADR/rule alignment is blocking.
- High assumption load prevents `READY_FOR_APPROVAL`.
- Major unknowns produce `INSUFFICIENT_EVIDENCE` or `BLOCKED`.

## Automatic mode escalation

The command may escalate mode automatically:

```text
--light -> --standard
```

when it detects medium/high risk.

```text
--standard -> --strict
```

when it detects brownfield impact, architecture change, external side effects, data mutation, auth/security, offline/replay, or release/cutover impact.

The agent must tell the user when mode escalation happens and why.


## Runtime remediation by mode

| Mode | Behaviour when issues are found |
|---|---|
| `--light` | Offer fixes for high-impact issues only. Advisory/minor issues may remain as deferred or accepted risk with confidence impact. |
| `--standard` | Offer guided fixes for all material issues. If no direct blocker remains, allow continuation after recording user decisions. |
| `--strict` | Blocking/material issues must be fixed, explicitly waived where allowed, or the final verdict must remain blocked/not ready. |

## Direct blockers vs continuable gaps

Direct blockers usually include:

- missing OpenSpec change;
- missing required OpenSpec artefacts;
- OpenSpec validation failure that invalidates the proposal;
- explicit ADR/rule conflict;
- confirmed brownfield/high-risk work with missing required evidence and no waiver;
- user refuses a required decision;
- attempted production-code implementation during review.

Continuable gaps may include:

- missing test task detail;
- ambiguous naming;
- partial evidence with user waiver;
- missing non-critical design rationale;
- proposal ready only with conditions.

Only `--strict` blocks over non-direct but material approval-readiness gaps by default.
