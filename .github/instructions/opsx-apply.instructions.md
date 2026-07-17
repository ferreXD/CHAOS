---
applyTo: ".github/prompts/opsx-apply.prompt.md,.github/skills/openspec-apply-change/**"
---
# opsx-apply Copilot Instructions

When the user asks to run or modify `opsx-apply`, prefer:

- Prompt file: `.github/prompts/opsx-apply.prompt.md`
- Skill: `.github/skills/openspec-apply-change/SKILL.md`
- Dedicated agent: none — follow the `openspec-apply-change` skill contract above.

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `opsx-apply` operates on a change id.
- Do not silently update shared governance files.
