---
applyTo: ".github/prompts/chaos-sync.prompt.md,.github/skills/chaos-sync/**"
---
# chaos-sync Copilot Instructions

When the user asks to run or modify `chaos-sync`, prefer:

- Prompt file: `.github/prompts/chaos-sync.prompt.md`
- Skill: `.github/skills/chaos-sync/SKILL.md`
- Custom agent: `.github/agents/chaos-sync-orchestrator.agent.md`

Mandatory behaviour:
- Read `.chaos/config.yaml` if present.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Ask one material decision at a time and STOP after presenting options.
- Use change-scoped artifact layout when `chaos-sync` operates on a change id.
- Do not silently update shared governance files.
