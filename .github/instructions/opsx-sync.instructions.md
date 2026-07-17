---
applyTo: ".github/prompts/opsx-sync.prompt.md,.github/skills/openspec-sync-specs/**"
---
# opsx-sync Copilot Instructions

When the user asks to run or modify `opsx-sync`, prefer:

- Prompt file: `.github/prompts/opsx-sync.prompt.md`
- Skill: `.github/skills/openspec-sync-specs/SKILL.md`
- Dedicated agent: none — follow the `openspec-sync-specs` skill contract above.

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `opsx-sync` operates on a change id.
- Do not silently update shared governance files.
