---
agent: chaos-apply-orchestrator
description: "Run the chaos:apply workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-apply.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-apply`.
- Load `.github/skills/chaos-apply/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-apply-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

---
description: Apply an approved OpenSpec change under CHAOS governance
argument-hint: "<change-id> [--light|--standard|--strict] [--dry-run]"
allowed-tools: Read, Glob, Grep, Bash, Edit, MultiEdit, Write, Task
---

Use the `chaos-apply` skill and the `chaos-apply-orchestrator` agent to apply the requested OpenSpec change.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths, validation commands, and specialist delegation from config before defaults.
- Treat OpenSpec artifacts as source of truth; do not let config override ADRs/rules/gates/OpenSpec.
- Resolve and show the mode; if inferred, ask the user to accept or override. Do not silently downgrade `strict`.
- Ask one material decision at a time (blockers, scope drift/amendments, waivers). **After presenting a decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; a displayed plan is not approval.
- Delegate C#/.NET work to the C# implementation specialist within task boundaries; the orchestrator owns user decisions (the specialist returns findings/options/evidence, it does not ask final user decisions).
- Record every decision as a Decision Event; label findings with knowledge type + confidence.
- Write the apply report under `.chaos/changes/<change-id>/apply-report.md` (legacy `.chaos/apply-reports/` is read-only for compat). **Exception — light-deliver:** when `.chaos/changes/<change-id>/change.md` has `chaosMetadata.mode: light`, follow the skill's Light-deliver contract instead: output is the `change.md` §Delivery dashboard, no apply-report.

### Sonnet-safe execution checklist

- [ ] Config read; OpenSpec source-of-truth + approval state loaded?
- [ ] Mode resolved and accepted/overridden by the user?
- [ ] Scope-drift / amendments asked one at a time, stopping after each?
- [ ] Specialist delegation kept read-only-where-required and within task boundaries?
- [ ] Decision events recorded?
- [ ] Closing checklist: decision-event text verified against final implementation details (versions, paths, class names)? (RETRO-DEC-005 Sub-B)
- [ ] Apply report written under `.chaos/changes/<change-id>/`?
- [ ] Next command (`chaos:verify <change-id>`) recommended?

Invocation arguments:

```text
$ARGUMENTS
```

Mandatory behaviour:

1. Treat OpenSpec artifacts as source of truth.
2. Load CHAOS governance files when available.
3. Infer mode if omitted and ask the user to accept or override.
4. In light/standard, allow continuation through non-direct blockers only after explicit user decision.
5. In strict, block on unresolved non-ready proposal/review state.
6. Delegate C#/.NET implementation to the C# implementation specialist only within task boundaries.
7. Classify discovered amendments and ask whether to add now, amend OpenSpec first, defer, accept risk, or stop.
8. Record every decision as a Decision Event.
9. Write `.chaos/changes/<change-id>/apply-report.md` (legacy `.chaos/apply-reports/<change-id>-apply-report.md` is READ-only for compatibility, not a write target). On light-deliver: the `change.md` §Delivery dashboard instead (see golden rule above).
10. Recommend `chaos:verify <change-id>`.

Config requirement:

- Read `.chaos/config.yaml` if present before resolving paths, validation commands, or implementation specialist delegation.
- If config is missing or partial, infer defaults and record it in the apply report.
- In strict mode, missing config that affects implementation safety requires an explicit waiver before code mutation.
- Do not let config override ADRs, rules, gates, or OpenSpec source-of-truth artifacts.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.github/skills/chaos-interaction-runtime/SKILL.md`) — preflight, material-decision, resume-handoff, completion, diagnostics, and
fallback contracts.

For this command:

- sourceCommand: `chaos:apply`
- changeId: required
- compatibleWithPendingDecision: **false** — a pending same-change decision in the
  interaction runtime BLOCKS apply.
- Preflight: call `chaos_begin_command`. On `BLOCKED_BY_PENDING_DECISION`,
  `CONFLICTING_COMMAND_ACTIVE`, or any `mustStop: true`, STOP and route the user to the
  Decision Center or `chaos:resume`. Do not modify production files while a decision
  blocks the change.
- Enablement + batching: honour `policies.interactionRuntime.commands.enabled`
  (opt-out → classic in-chat decisions) and `commands.decisionBatching`
  (`batch-independent` default → create all independent decisions up front, then stop once).
- Material decisions (create via `chaos_create_decision`, then STOP on `mustStop: true`):
  risky-write approval; unresolved scope expansion/amendment; failed-validation
  continue/stop choice; strict-mode missing-config waiver.
- Resume: once answered, continue via `chaos-resume.prompt.md`; incorporate the selected
  option before marking the decision consumed (never before).
- Completion: call runtime completion only after apply reaches a safe terminal checkpoint,
  releasing the change lock; never leave a stale lock for diagnostics to flag.
