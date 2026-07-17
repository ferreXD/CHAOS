---
applyTo: ".github/prompts/opsx-propose.prompt.md,.github/skills/openspec-propose/**"
---
# opsx-propose Copilot Instructions

When the user asks to run or modify `opsx-propose`, prefer:

- Prompt file: `.github/prompts/opsx-propose.prompt.md`
- Skill: `.github/skills/openspec-propose/SKILL.md`
- Dedicated agent: none — follow the `openspec-propose` skill contract above.

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `opsx-propose` operates on a change id.
- Do not silently update shared governance files.
