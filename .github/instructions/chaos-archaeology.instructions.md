---
applyTo: ".github/prompts/chaos-archaeology.prompt.md,.github/skills/chaos-archaeology/**"
---
# chaos-archaeology Copilot Instructions

When the user asks to run or modify `chaos-archaeology`, prefer:

- Prompt file: `.github/prompts/chaos-archaeology.prompt.md`
- Skill: `.github/skills/chaos-archaeology/SKILL.md`
- Custom agent: `.github/agents/chaos-archaeology-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-archaeology` operates on a change id.
- Do not silently update shared governance files.
