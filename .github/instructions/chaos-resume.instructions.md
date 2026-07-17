---
applyTo: ".github/prompts/chaos-resume.prompt.md,.github/skills/chaos-resume/**,.github/skills/chaos-interaction-runtime/**"
---
# chaos-resume Copilot Instructions

When the user asks to resume a paused CHAOS command, or run/modify `chaos-resume`, prefer:

- Prompt file: `.github/prompts/chaos-resume.prompt.md`
- Skill: `.github/skills/chaos-resume/SKILL.md`
- Runtime protocol skill: `.github/skills/chaos-interaction-runtime/SKILL.md`
- Custom agent: `.github/agents/chaos-resume-orchestrator.agent.md`

Mandatory behaviour:
- Read the interaction runtime **first** (MCP `chaos_*` when the `chaos-interaction` server is wired, else the runtime CLI with `--adapter copilot`); never resume from chat memory.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md`.
- Follow `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Resume only from a valid resume capsule; if required fields are missing, STOP and report exactly which.
- If multiple candidates match, present a numbered list and STOP; if none, report nothing to resume and do not fabricate.
- Validate answered decisions, incorporate them, and only then mark them consumed — never before.
- Do not bypass pending unresolved decisions; route the user to the Decision Center.
- Respect same-change locks; do not modify production files beyond the approved `nextStep`.
- Resume is manual in Copilot: there is no auto-resume runner or Stop-hook.
- Do not hand-write runtime JSON state.
