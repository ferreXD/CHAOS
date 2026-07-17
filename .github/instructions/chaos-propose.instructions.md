---
applyTo: ".github/prompts/chaos-propose.prompt.md,.github/skills/chaos-propose/**"
---
# chaos-propose Copilot Instructions

When the user asks to run or modify `chaos-propose`, prefer:

- Prompt file: `.github/prompts/chaos-propose.prompt.md`
- Skill: `.github/skills/chaos-propose/SKILL.md`
- Custom agent: `.github/agents/chaos-proposal-architect.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-propose` operates on a change id.
- Do not silently update shared governance files.
