---
agent: chaos-archaeology-orchestrator
description: "Run the chaos:archaeology workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-archaeology.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-archaeology`.
- Load `.github/skills/chaos-archaeology/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-archaeology-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# `chaos-archeology.prompt.md`

Alias for `chaos-archaeology.prompt.md`.

Use the canonical artifact spelling `archaeology`, and obey the full **Non-negotiable
execution contract** in `.github/prompts/chaos-archaeology.prompt.md` — including read-only
operation, printing the plan/budget before deep inspection, and stopping before updating
`.chaos/archaeology/index.md`. This alias adds no behaviour of its own.
