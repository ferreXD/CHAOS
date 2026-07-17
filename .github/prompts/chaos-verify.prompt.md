---
agent: chaos-verify-orchestrator
description: "Run the chaos:verify workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-verify.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-verify`.
- Load `.github/skills/chaos-verify/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-verify-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# `chaos-verify.prompt.md` command

Use this command as the GitHub Copilot slash-command wrapper for CHAOS verification.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths and validation commands from config before defaults.
- Resolve the change folder; read OpenSpec artifacts and implementation evidence (do not fabricate validation results).
- Resolve and show the mode; if inferred, state why. Do not silently downgrade `strict`.
- Ask one material decision at a time (verification gaps, accepted-risk, archive-readiness). **After presenting a decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- Delegate C#/.NET inspection to the C# specialist in **read-only** mode; the specialist returns findings/options/evidence and does not ask final user decisions.
- Classify findings with knowledge type + confidence; a displayed verdict is not approval.
- Write verification output under `.chaos/changes/<change-id>/verification.md` (legacy `.chaos/verification/` is read-only for compat).
- Do not edit production code.

### Sonnet-safe execution checklist

- [ ] Config read; change folder + OpenSpec artifacts + evidence resolved?
- [ ] Mode resolved (and inference explained)?
- [ ] Validation attempted honestly (run / not run / failed recorded)?
- [ ] Material decisions asked one at a time, stopping after each?
- [ ] Specialist kept read-only?
- [ ] Verification report written under `.chaos/changes/<change-id>/`?
- [ ] Archive-readiness verdict recorded with confidence?

## Usage

```text
chaos-verify.prompt.md <change-id> [--light|--standard|--strict] [--dry-run] [--continue]
```

Natural-language aliases:

```text
chaos:verify <change-id>
verify CHAOS change <change-id>
verify OpenSpec change <change-id> with CHAOS
```

## Execution

Delegate to the `chaos-verify-orchestrator` agent.

Pass the full user request, including:

- change id;
- requested mode, if any;
- whether this is a rerun / `--continue`;
- whether this is `--dry-run`;
- any user-provided validation constraints.

The command must produce or update:

```text
.chaos/changes/<change-id>/verification.md
```

Legacy `.chaos/verification/<change-id>-verification.md` may be READ for compatibility but is
not a write target. Do not migrate legacy artifacts.

It must not edit production code.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:verify`
- changeId: required
- compatibleWithPendingDecision: **false** for the verified change.
- Preflight: call `chaos_begin_command`; honour `mustStop: true`; on a pending
  decision, STOP and route to the Decision Center / `chaos-resume.prompt.md`.
- Material decisions (via `chaos_create_decision`, then STOP): verification-blocker
  resolution (accept / fix / waive); continue-vs-stop after a failed gate.
- Resume: incorporate the answer, then mark it consumed.
- Completion: if verify owns a runtime session, complete it (releasing locks) once
  verification reaches a safe terminal point; otherwise leave state untouched and report.
