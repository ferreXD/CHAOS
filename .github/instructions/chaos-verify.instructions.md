---
applyTo: ".github/prompts/chaos-verify.prompt.md,.github/skills/chaos-verify/**"
---
# chaos-verify Copilot Instructions

When the user asks to run or modify `chaos-verify`, prefer:

- Prompt file: `.github/prompts/chaos-verify.prompt.md`
- Skill: `.github/skills/chaos-verify/SKILL.md`
- Custom agent: `.github/agents/chaos-verify-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-verify` operates on a change id.
- Do not silently update shared governance files.
