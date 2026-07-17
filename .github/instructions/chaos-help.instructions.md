---
applyTo: ".github/prompts/chaos-help.prompt.md,.github/skills/chaos-help/**"
---
# chaos-help Copilot Instructions

When the user asks to run or modify `chaos-help`, prefer:

- Prompt file: `.github/prompts/chaos-help.prompt.md`
- Skill: `.github/skills/chaos-help/SKILL.md`
- Custom agent: `.github/agents/chaos-help-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-help` operates on a change id.
- Do not silently update shared governance files.
