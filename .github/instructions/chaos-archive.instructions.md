---
applyTo: ".github/prompts/chaos-archive.prompt.md,.github/skills/chaos-archive/**"
---
# chaos-archive Copilot Instructions

When the user asks to run or modify `chaos-archive`, prefer:

- Prompt file: `.github/prompts/chaos-archive.prompt.md`
- Skill: `.github/skills/chaos-archive/SKILL.md`
- Custom agent: `.github/agents/chaos-archive-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-archive` operates on a change id.
- Do not silently update shared governance files.
