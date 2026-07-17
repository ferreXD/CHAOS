---
applyTo: ".github/prompts/chaos-doctor.prompt.md,.github/skills/chaos-doctor/**"
---
# chaos-doctor Copilot Instructions

When the user asks to run or modify `chaos-doctor`, prefer:

- Prompt file: `.github/prompts/chaos-doctor.prompt.md`
- Skill: `.github/skills/chaos-doctor/SKILL.md`
- Custom agent: `.github/agents/chaos-doctor-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-doctor` operates on a change id.
- Do not silently update shared governance files.
