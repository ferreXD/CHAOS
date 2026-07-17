---
applyTo: ".github/prompts/opsx-explore.prompt.md,.github/skills/openspec-explore/**"
---
# opsx-explore Copilot Instructions

When the user asks to run or modify `opsx-explore`, prefer:

- Prompt file: `.github/prompts/opsx-explore.prompt.md`
- Skill: `.github/skills/openspec-explore/SKILL.md`
- Dedicated agent: none — follow the `openspec-explore` skill contract above.

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `opsx-explore` operates on a change id.
- Do not silently update shared governance files.
