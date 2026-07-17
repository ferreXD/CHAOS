---
agent: chaos-help-orchestrator
description: "Run the chaos:help workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-help.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-help`.
- Load `.github/skills/chaos-help/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-help-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# chaos:help

Use the `chaos-help` skill and the `chaos-help-orchestrator` agent to guide the user through the CHAOS workflow.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths from config before defaults.
- `chaos:help` is read-only except for the `--readme` render, which previews by default and **writes only after explicit confirmation** or `--write`.
- For `--readme`, after showing the preview, **STOP** and wait for the user to confirm the write.
- When explaining CHAOS, state the model-robustness rationale: commands are designed to be model-portable; Opus may infer intent but weaker models require explicit gates; native interactive selection is preferred with numbered options as fallback; OpenSpec-backed commands must invoke OpenSpec. See `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Do not silently overwrite a README that is already up to date (`README_UP_TO_DATE`).

Parse the user intent:

```text
chaos:help
chaos:help workflow
chaos:help commands
chaos:help modes
chaos:help artifacts
chaos:help next
chaos:help <command>
chaos:help --readme
chaos:help --readme --dry-run
chaos:help --readme --write
chaos:help --readme --target <path>
```

Do not treat `demo` as a supported subcommand.

If the user asks `chaos:help next`, inspect the workspace and recommend the next command based on available artifacts.

If the user asks `--readme`, render a candidate README and compare it with the existing target. Preview by default. Write only when `--write` is present or when the user explicitly confirms the write after seeing the preview. If the target is already up to date, report `README_UP_TO_DATE` and do not rewrite it.
