# /chaos-review

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve OpenSpec/governance/evidence/report paths from config before defaults.
- Resolve the change folder; read the OpenSpec proposal/spec/tasks artifacts (do not invent them).
- Classify review findings with knowledge type + confidence + severity.
- Ask one remediation decision at a time. **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- Approval is never assumed: do not approve without explicit human confirmation; a displayed verdict is not approval.
- Patch OpenSpec artefacts only after explicit confirmation; re-read amended artefacts before the final verdict.
- Record remediation choices as `REV-DEC-*` Decision Events with sync actions.
- Write the review report under `.chaos/changes/<change-id>/proposal-review.md` (legacy `.chaos/reviews/` is read-only for compat).
- Do not implement code, apply, or archive the change. Route config remediation to `chaos:sync`.

### Sonnet-safe execution checklist

- [ ] Config read and change folder resolved?
- [ ] OpenSpec artefacts read?
- [ ] Review findings classified (knowledge type + confidence + severity)?
- [ ] Remediation decisions asked one at a time, stopping after each?
- [ ] Approval not assumed (explicit human confirmation only)?
- [ ] `REV-DEC-*` decisions recorded?
- [ ] Review report written under `.chaos/changes/<change-id>/`?

Delegate to the `chaos-review` skill and `chaos-proposal-reviewer` agent.

Arguments are passed through as:

```text
chaos:review $ARGUMENTS
```

You must perform a pre-implementation OpenSpec proposal review and write:

```text
.chaos/changes/<change-id>/proposal-review.md
```

Legacy `.chaos/reviews/<change-id>-proposal-review.md` may be READ for compatibility but is
not a write target. Do not migrate legacy artifacts.

Rules:

- Do not implement code.
- Do not apply or archive the OpenSpec change.
- Do not approve without explicit human confirmation.
- Offer guided remediation for material/fixable proposal issues.
- Patch OpenSpec artefacts only after explicit confirmation.
- Record runtime remediation choices as `REV-DEC-*` Decision Events with sync actions.
- Re-read/re-evaluate amended artefacts before final verdict.

Config requirement:

- Read `.chaos/config.yaml` if present before resolving OpenSpec/governance/evidence/report paths.
- Use configured OpenSpec validation command when available.
- If config is missing/partial/conflicting, record it in the review report and ask for runtime context only when material.
- Do not edit config from review; route config remediation to `chaos:sync`.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:review`
- changeId: required
- compatibleWithPendingDecision: **false** for a materially blocking review.
- Preflight: `chaos_begin_command`; honour `mustStop: true`.
- Material decisions (via `chaos_create_decision`, then STOP): accept / reject /
  rework / waive when the outcome materially blocks the change. Do not continue after
  requesting approval through the runtime; the review report still records the outcome.
- Resume: incorporate the answered decision, then mark it consumed.
- Completion: release locks via runtime completion when review reaches a terminal state.
