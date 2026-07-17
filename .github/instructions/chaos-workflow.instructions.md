---
applyTo: "**"
---
# CHAOS Workflow Instructions for GitHub Copilot

> This is the single intentionally-global CHAOS instruction file (`applyTo: "**"`): it is the
> shared workflow router that applies to any CHAOS task. Command-specific instruction files are
> scoped narrowly to their own `.github/prompts/*.prompt.md` and `.github/skills/*/**` artifacts.

Use this instruction file for all CHAOS workflow tasks.

- Prefer the matching `.github/prompts/<command>.prompt.md` prompt file for each command-like request.
- Load the matching `.github/skills/<skill>/SKILL.md` file and its references before acting.
- Select or delegate to the matching `.github/agents/<agent>.agent.md` custom agent when the task benefits from specialization.
- Keep the workflow human-led: material decisions require explicit selection and stop-after-decision behaviour.
- For OpenSpec-backed proposals, use the OpenSpec prompt/skill path. Never silently hand-generate OpenSpec-shaped artifacts when OpenSpec is available.
- For change-scoped artifacts, use `.chaos/changes/<change-id>/`.
- Shared governance changes require patch preview and confirmation.
- Repository-wide sync (`chaos:sync --all`) requires maintainer confirmation unless dry-run.
- `chaos:doctor` diagnoses local runtime/tooling/MCP/repository-context readiness (execution readiness); it is distinct from `chaos:status` (governance/workspace health).
- `chaos:todo` is the only durable backlog curator: Markdown item files under `.chaos/todo/items/` plus `.chaos/todo/index.md`, with static self-contained HTML digest views under `.chaos/todo/views/`. Other commands may emit an optional `## Todo Candidates` section but must not write durable todo items.
- Hook enforcement is Claude-first; on the Copilot surface treat hook material as advisory/reference. Both adapters share the `.chaos/runtime/*` runtime files.
- The Copilot adapter is experimental until validated; the numbered decision fallback is compliant only if it stops and waits.
