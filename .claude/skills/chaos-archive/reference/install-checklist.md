# CHAOS Archive Install Checklist

## Install Claude Code variant

Copy:

```text
claude-code/.claude/agents/chaos-archive-orchestrator.md -> .claude/agents/chaos-archive-orchestrator.md
claude-code/.claude/commands/chaos-archive.md -> .claude/commands/chaos-archive.md
claude-code/.claude/skills/chaos-archive -> .claude/skills/chaos-archive
```

## Install GitHub Copilot / VS Code variant

Copy:

```text
github-copilot/.github/agents/chaos-archive-orchestrator.agent.md -> .github/agents/chaos-archive-orchestrator.agent.md
github-copilot/.github/prompts/chaos-archive.prompt.md -> .github/prompts/chaos-archive.prompt.md
github-copilot/.github/instructions/chaos-archive.instructions.md -> .github/instructions/chaos-archive.instructions.md
```

## Required tools

`chaos:archive` should check one by one:

```text
git --version
node --version
npm --version
openspec --version
```

If OpenSpec is missing, prompt before install:

```bash
npm install -g @fission-ai/openspec@latest
```

Do not silently install tools.

## Required CHAOS files

Expected:

```text
AGENTS.md
.chaos/context.md
.chaos/architecture.md
.chaos/constitution.md
.chaos/decisions/index.md
.chaos/rules/index.md
.chaos/gates/index.md
```

Recommended prior lifecycle reports (v0 change-scoped layout; legacy folders read-only for compat):

```text
.chaos/changes/<change-id>/lifecycle.md
.chaos/changes/<change-id>/proposal-review.md   # legacy fallback: .chaos/reviews/<change-id>-proposal-review.md
.chaos/changes/<change-id>/apply-report.md      # legacy fallback: .chaos/apply-reports/<change-id>-apply-report.md
.chaos/changes/<change-id>/verification.md      # legacy fallback: .chaos/verification/<change-id>-verification.md
```
