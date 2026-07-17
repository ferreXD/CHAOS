---
applyTo: ".github/prompts/chaos-apply.prompt.md,.github/skills/chaos-apply/**"
---
# chaos-apply Copilot Instructions

When the user asks to run or modify `chaos-apply`, prefer:

- Prompt file: `.github/prompts/chaos-apply.prompt.md`
- Skill: `.github/skills/chaos-apply/SKILL.md`
- Custom agent: `.github/agents/chaos-apply-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-apply` operates on a change id.
- Do not silently update shared governance files.
