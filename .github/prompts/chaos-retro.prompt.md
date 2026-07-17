---
agent: chaos-retro-orchestrator
description: "Run the chaos:retro workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-retro.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-retro`.
- Load `.github/skills/chaos-retro/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-retro-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# chaos:retro

Run a CHAOS retrospective.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths from config before defaults.
- Resolve scope (change-scoped vs periodic/repo-wide) and show it.
- Show the retro dashboard in chat first.
- Ask one improvement decision at a time. **After presenting a decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; an improvement is adopted only when the user selects it.
- Recommended rules/gates/ADR drafts use date-prefixed, slug-based filenames; do not assign sequential-ID filenames and do not edit shared governance indexes directly (route promotions to `chaos:sync`).
- Write change-scoped retros under `.chaos/changes/<change-id>/retro.md`; periodic/repo-wide retros under `.chaos/retros/periodic-<period>-retro.md`.

### Sonnet-safe execution checklist

- [ ] Config read; scope resolved?
- [ ] Lifecycle evidence loaded?
- [ ] Dashboard shown before decisions?
- [ ] Improvement decisions asked one at a time, stopping after each?
- [ ] Retro action register + sync handoff produced (promotions routed to `chaos:sync`)?
- [ ] Retro report written to the scope-correct path?

## Usage

```text
chaos-retro.prompt.md <change-id> [--light|--standard|--strict]
chaos-retro.prompt.md <change-id> --dry-run
chaos-retro.prompt.md <change-id> --yes
chaos-retro.prompt.md --period <date-range>
chaos-retro.prompt.md --since <git-ref-or-date>
chaos-retro.prompt.md --all
```

## Behaviour

Delegate to the `chaos-retro-orchestrator` agent and the `chaos-retro` skill.

The command must:

1. Resolve scope.
2. Load lifecycle evidence.
3. Show the retro dashboard in chat first.
4. Ask one improvement decision at a time.
5. Produce a retro action register.
6. Produce sync handoff.
7. Write the retro report to the scope-correct location unless running dry-run/chat-only:
   - change-scoped retro → `.chaos/changes/<change-id>/retro.md`
   - periodic / repo-wide retro → `.chaos/retros/periodic-<period>-retro.md`

## Output

```text
.chaos/changes/<change-id>/retro.md      # change-scoped
.chaos/retros/periodic-<period>-retro.md # periodic / repo-wide
```

Legacy `.chaos/retros/<change-id>-retro.md` may be READ for compatibility but is not a write
target for change-scoped retros. Do not migrate legacy artifacts.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:retro`
- Mostly read-only over completed lifecycle + interaction-runtime history; preflight
  with `chaos_begin_command` and honour `mustStop: true`.
- Material decisions (via `chaos_create_decision`, then STOP): adopting a workflow/rule
  change that requires user approval.
- Prefer emitting **Todo Candidates** over durable todo writes unless the `chaos:todo`
  policy allows a durable write.
- Does not perform destructive auto-repair; it reports and recommends.
