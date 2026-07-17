# chaos:retro

Run a CHAOS retrospective.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths from config before defaults.
- Resolve scope (change-scoped vs periodic/repo-wide) and show it.
- Show the retro dashboard in chat first.
- Ask one improvement decision at a time. **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
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
/chaos-retro <change-id> [--light|--standard|--strict]
/chaos-retro <change-id> --dry-run
/chaos-retro <change-id> --yes
/chaos-retro --period <date-range>
/chaos-retro --since <git-ref-or-date>
/chaos-retro --all
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

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:retro`
- Mostly read-only over completed lifecycle + interaction-runtime history; preflight
  with `chaos_begin_command` and honour `mustStop: true`.
- Material decisions (via `chaos_create_decision`, then STOP): adopting a workflow/rule
  change that requires user approval.
- Prefer emitting **Todo Candidates** over durable todo writes unless the `chaos:todo`
  policy allows a durable write.
- Does not perform destructive auto-repair; it reports and recommends.
