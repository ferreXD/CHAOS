# Direct Blocker Taxonomy

`chaos:apply` must distinguish direct blockers from continuable gaps.

## Direct blockers

Direct blockers prevent implementation unless explicitly impossible to enforce in the host environment. In strict mode they always block.

- OpenSpec change folder is missing.
- `tasks.md` is missing.
- Proposal review explicitly says `BLOCKED`.
- The change conflicts with accepted ADRs or CHAOS rules.
- Required toolchain is missing and the user declines installation/remediation.
- Target codebase is unavailable.
- Implementation cannot be safely scoped.
- User refuses a required missing decision.
- The requested implementation requires secrets/environment unavailable and no safe fallback exists.
- The command cannot identify the intended change.

## Continuable gaps

Continuable gaps may proceed in `--light` and `--standard` only after explicit user confirmation and decision-event capture.

- Proposal not fully ready for approval but not blocked.
- Review verdict is `READY_WITH_CONDITIONS`, `NEEDS_REVISION`, or `INSUFFICIENT_EVIDENCE` with no direct blocker.
- Missing naming decision.
- Missing exact test detail.
- Missing persistence detail that is aligned with approved behaviour.
- Partial archaeology for a medium-risk change.
- Medium-confidence assumptions.
- Non-blocking major findings with clear mitigation.

## Strict mode

In strict mode, continuable gaps become blockers unless the user first amends the OpenSpec change, review, or decision record.

## Required prompt for continuable gaps

When continuable gaps exist, ask:

```text
The proposal is not fully ready, but no direct blocker was found.

Mode: <light|standard>
Gaps:
- <gap 1>
- <gap 2>

Options:
1. Continue and record accepted risk
2. Provide missing decision/context now
3. Defer the gap and limit implementation scope
4. Stop and revise the OpenSpec proposal/review
```

Each selected option must create a Decision Event.

## Config-related blockers

Direct blockers:

- configured OpenSpec change path cannot be resolved and no safe fallback exists;
- configured validation/specialist requirement is mandatory in strict mode and cannot be satisfied or waived;
- config explicitly protects a file that the apply step would need to modify;
- config version is unsupported and affects execution semantics.

Continuable gaps:

- config missing in light/standard mode with inferable defaults;
- optional validation command missing;
- configured specialist unavailable but user accepts generic/limited delegation with reduced confidence.
