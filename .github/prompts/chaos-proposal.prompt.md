---
agent: chaos-proposal-architect
description: "Run the chaos:proposal workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-proposal.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-proposal`.
- Load `.github/skills/chaos-propose/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-proposal-architect.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# `chaos-proposal.prompt.md`

Alias for `chaos-propose.prompt.md`.

Use this wrapper only to support users who type the noun form.

Delegate to the `chaos-propose` skill, and obey the full **Non-negotiable execution
contract** in `.github/prompts/chaos-propose.prompt.md` — including the hard OpenSpec invocation
gate, one-decision-at-a-time with stop-after-decision, and the OpenSpec Invocation Proof
section. This alias adds no behaviour of its own.
