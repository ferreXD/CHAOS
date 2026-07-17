---
applyTo: ".github/prompts/chaos-status.prompt.md,.github/skills/chaos-status/**"
---
# chaos-status Copilot Instructions

When the user asks to run or modify `chaos-status`, prefer:

- Prompt file: `.github/prompts/chaos-status.prompt.md`
- Skill: `.github/skills/chaos-status/SKILL.md`
- Custom agent: `.github/agents/chaos-status-auditor.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-status` operates on a change id.
- Do not silently update shared governance files.
