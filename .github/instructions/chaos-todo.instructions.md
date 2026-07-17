---
applyTo: ".github/prompts/chaos-todo.prompt.md,.github/skills/chaos-todo/**"
---
# chaos-todo Copilot Instructions

When the user asks to run or modify `chaos-todo`, prefer:

- Prompt file: `.github/prompts/chaos-todo.prompt.md`
- Skill: `.github/skills/chaos-todo/SKILL.md`
- Custom agent: `.github/agents/chaos-todo-curator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-todo` operates on a change id.
- Do not silently update shared governance files.
