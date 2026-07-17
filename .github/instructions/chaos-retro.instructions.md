---
applyTo: ".github/prompts/chaos-retro.prompt.md,.github/skills/chaos-retro/**"
---
# chaos-retro Copilot Instructions

When the user asks to run or modify `chaos-retro`, prefer:

- Prompt file: `.github/prompts/chaos-retro.prompt.md`
- Skill: `.github/skills/chaos-retro/SKILL.md`
- Custom agent: `.github/agents/chaos-retro-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-retro` operates on a change id.
- Do not silently update shared governance files.
