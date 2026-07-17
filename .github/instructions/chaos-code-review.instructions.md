---
applyTo: ".github/prompts/chaos-code-review.prompt.md,.github/skills/chaos-code-review/**"
---
# chaos-code-review Copilot Instructions

When the user asks to run or modify `chaos-code-review`, prefer:

- Prompt file: `.github/prompts/chaos-code-review.prompt.md`
- Skill: `.github/skills/chaos-code-review/SKILL.md`
- Custom agent: `.github/agents/code-reviewer.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-code-review` operates on a change id.
- Do not silently update shared governance files.
