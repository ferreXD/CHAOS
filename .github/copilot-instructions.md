# CHAOS v0 Copilot Repository Instructions

This repository uses CHAOS: Controlled Human-led Agent-Orchestrated SDLC.

## Mandatory workflow posture

- CHAOS is human-led. A recommendation is not a decision; a displayed plan is not approval.
- Use OpenSpec as the spec/proposal engine for OpenSpec-backed commands. Do not manually replace OpenSpec when it is available.
- Read `.chaos/config.yaml` when present and resolve configured paths before defaults.
- Use `.github/skills/**/SKILL.md` and related `reference/` files as the reusable workflow procedure library.
- Use `.github/prompts/*.prompt.md` as the Copilot-native command surface.
- Use `.github/agents/*.agent.md` as specialized Copilot custom agents.
- Ask one material decision at a time. If no native choice UI is available, print numbered options and stop until the user chooses.
- Write change-scoped artifacts under `.chaos/changes/<change-id>/` (e.g. `lifecycle.md`, `proposal-review.md`, `approval.md`, `apply-report.md`, `code-review.md`, `verification.md`, `archive-report.md`, `sync-report.md`, `retro.md`, `decision-events.md`, `waivers.md`).
- Treat legacy scattered report folders as read-only compatibility inputs for future commands unless explicitly asked to migrate them. Do not make legacy folders preferred write targets.
- Use date-prefixed, slug-based physical filenames for new ADR/decision-log/rule/gate artifacts. Sequential IDs (e.g. `ADR-0015`, `R-022`, `G-010`) are assigned/normalized in indexes and display references only.
- `chaos:sync --all` is repository-wide and requires repo-owner / designated CHAOS maintainer confirmation unless dry-run. `chaos:sync --change <change-id>` is contributor-safe.

## Repository context / MCP posture

- Resolve repository context through the provider-neutral contract in `.github/skills/chaos-shared/reference/repository-context-contract.md` and `repository-context-resolution-policy.md`.
- GitHub is the public/default provider; Azure DevOps / Azure Repos is a first-class internal provider. Internally prefer "review request" over "PR".
- Prefer MCP when available; fall back to `gh` CLI, then `az devops` CLI, then local git. MCP is optional, not a hard dependency, and the read-only posture is the default. Remote writes require explicit confirmation. Never place secrets in config or docs. See `mcp-security-policy.md` and `mcp-tool-profiles.md`.

## Interaction Runtime, decisions & resume

- Material decisions route **runtime-first**: when `policies.interactionRuntime.commands.enabled` is `true` (default) and the runtime is available, create the decision through the runtime → the **Decision Center** and STOP on `mustStop`. Chat-numbered options (see "Decision fallback format") are the configured fallback only when command integration is disabled or the runtime is unavailable — never a silent bypass. Full protocol: `.github/skills/chaos-shared/reference/interactive-decision-protocol.md` and `.github/skills/chaos-interaction-runtime/SKILL.md`.
- **Writer path (Copilot):** use the runtime CLI via the terminal — `node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts … --adapter copilot`. The `chaos_*` MCP tools are equivalent and may be used instead **when** the `chaos-interaction` MCP server is registered in the workspace and its tools are in the prompt/agent allowlist. Both write the same file-backed state under `.chaos/interactions/`. Never hand-write runtime JSON.
- **Resume is manual in Copilot.** After answering in the Decision Center, run `.github/prompts/chaos-resume.prompt.md` to continue the paused command from its capsule `nextStep`. There is **no** auto-resume runner or in-session Stop-hook on the Copilot surface (those are Claude-harness only); treat `policies.interactionRuntime.autoResume` as off regardless of its value.
- Resume reads structured runtime state only (capsule + answered decisions + required artifacts), never chat memory. Skills: `.github/skills/chaos-resume/**` and `.github/skills/chaos-interaction-runtime/**`.

## Hooks, runtime observability, and metadata

- Hook enforcement is currently **Claude-first**. GitHub Copilot does not execute Claude hooks natively unless a Copilot-equivalent runtime is added; treat hook material as advisory/reference on the Copilot surface.
- Copilot can consume the same CHAOS runtime files when present: `.chaos/runtime/session-context.json`, `active-command.json`, `touched-files.jsonl`, `hook-violations.jsonl`, `decision-waits.jsonl`. Preserve these runtime contracts so both adapters can share them.
- CHAOS-owned Markdown artifacts may carry `chaosMetadata` frontmatter (writer, auditor, timestamps, source command, repository context, confidence). Avoid timestamp churn, raw email, and secrets. Root `README.md` and `AGENTS.md` are not stamped unless explicitly managed/confirmed.

## Todo backlog curation

- `chaos:todo` is the only durable backlog owner. Its durable source of truth is Markdown item files under `.chaos/todo/items/*.md` plus `.chaos/todo/index.md`.
- Generated digest views are static, self-contained, HTML-escaped HTML with no external JS/CSS/CDN (`.chaos/todo/views/*.html`, `.chaos/todo/todo-report-YYYY-MM-DD.html`). They are not the source of truth.
- Other commands (`chaos:status`, `chaos:doctor`, `chaos:archaeology`, `chaos:propose`, `chaos:review`, `chaos:apply`, `chaos:code-review`, `chaos:verify`, `chaos:archive`, `chaos:sync`, `chaos:retro`) MAY emit an optional `## Todo Candidates` section but MUST NOT write durable todo items.

## Key prompt files

- `.github/prompts/chaos-init.prompt.md`
- `.github/prompts/chaos-help.prompt.md`
- `.github/prompts/chaos-status.prompt.md`
- `.github/prompts/chaos-doctor.prompt.md`
- `.github/prompts/chaos-archaeology.prompt.md`
- `.github/prompts/chaos-propose.prompt.md`
- `.github/prompts/chaos-review.prompt.md`
- `.github/prompts/chaos-apply.prompt.md`
- `.github/prompts/chaos-code-review.prompt.md`
- `.github/prompts/chaos-verify.prompt.md`
- `.github/prompts/chaos-archive.prompt.md`
- `.github/prompts/chaos-sync.prompt.md`
- `.github/prompts/chaos-retro.prompt.md`
- `.github/prompts/chaos-todo.prompt.md`
- `.github/prompts/chaos-resume.prompt.md`

## Decision fallback format

When a material decision is required and Copilot does not expose a native selection UI, use:

```text
Decision required: <short title>

Context: <brief context>

Recommended option:
<option number and reason>

Options:
1. <option> — <consequence>
2. <option> — <consequence>
3. <option> — <consequence>
4. Stop / defer

Select one option to continue.
```

After presenting the decision, STOP.

## Copilot adapter maturity

- The Claude-native adapter is the **primary/reference** CHAOS implementation.
- The GitHub Copilot adapter is **experimental** until fully validated, and follows the same workflow contracts.
- Known limitation: Copilot may not provide the same native interactive decision UX as Claude. The numbered decision fallback is compliant **only if** it stops and waits for an explicit user selection.
- Known limitation: hook enforcement is Claude-first. Copilot consumes the same `.chaos/runtime/*` files but does not execute Claude hooks natively.
- Known limitation: **auto-resume is Claude-harness only.** Copilot has no headless runner or in-session Stop-hook, so a command that stops on a Decision-Center decision is resumed **manually** via `chaos-resume.prompt.md`. The interaction runtime, Decision Center, and manual resume otherwise reach parity with the Claude adapter.
