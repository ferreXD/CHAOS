---
agent: chaos-archaeology-orchestrator
description: "Run the chaos:archaeology workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-archaeology.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-archaeology`.
- Load `.github/skills/chaos-archaeology/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-archaeology-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# `chaos-archaeology.prompt.md`

Run the CHAOS archaeology workflow for a bounded evidence investigation.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve `paths.archaeology` and budgets from config before defaults.
- Operate **read-only** on production code; this command investigates, it does not modify source.
- Print the archaeology plan/budget in chat before deep inspection.
- Ask before creating/updating `.chaos/archaeology/index.md`. **After presenting that decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- Classify every material finding with knowledge type + confidence + evidence; do not present inference as fact.
- For change-linked investigations (`--from-change <id>`), reference the change folder `.chaos/changes/<change-id>/`; the archaeology report itself lives under `paths.archaeology`.

### Sonnet-safe execution checklist

- [ ] Config read; scope/budget resolved and shown?
- [ ] Plan/budget printed before deep inspection?
- [ ] Read-only respected (no source mutation)?
- [ ] Findings classified (knowledge type + confidence + evidence)?
- [ ] Index update asked before writing, stopping after the prompt?
- [ ] Archaeology report written under `paths.archaeology`?

Canonical user-facing invocation:

```text
chaos:archaeology <topic> [--light|--standard|--strict]
```

Additional supported flags:

```text
--dry-run
--scope <path-or-module>
--entrypoint <file-or-symbol>
--from-change <change-id>
--since <git-ref-or-date>
--focus <api|contracts|data|side-effects|auth|tests|observability|dependencies|failure-modes>
--max-files <n>
--max-depth <n>
--include-tests
--include-db
--include-side-effects
--include-callers
--include-callees
--include-config
--include-docs
--no-code
```

## Execution

Delegate to the `chaos-archaeology-orchestrator` agent and the `chaos-archaeology` skill.

The command must print the archaeology plan/budget in chat before deep inspection and must ask before creating/updating `.chaos/archaeology/index.md`.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:archaeology`
- **Read-only** evidence discovery; preflight with `chaos_begin_command` and honour
  `mustStop: true`. Report blockers (including a pending decision), do not fix them.
- Material scope/approval choices, if any, use `chaos_create_decision` then STOP.
