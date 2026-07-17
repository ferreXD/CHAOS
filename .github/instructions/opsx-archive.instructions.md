---
applyTo: ".github/prompts/opsx-archive.prompt.md,.github/skills/openspec-archive-change/**"
---
# opsx-archive Copilot Instructions

When the user asks to run or modify `opsx-archive`, prefer:

- Prompt file: `.github/prompts/opsx-archive.prompt.md`
- Skill: `.github/skills/openspec-archive-change/SKILL.md`
- Dedicated agent: none — follow the `openspec-archive-change` skill contract above.

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `opsx-archive` operates on a change id.
- Do not silently update shared governance files.
