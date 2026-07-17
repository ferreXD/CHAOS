# chaos:help

Use the `chaos-help` skill and the `chaos-help-orchestrator` agent to guide the user through the CHAOS workflow.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths from config before defaults.
- `chaos:help` is read-only except for the `--readme` render, which previews by default and **writes only after explicit confirmation** or `--write`.
- For `--readme`, after showing the preview, **STOP** and wait for the user to confirm the write.
- When explaining CHAOS, state the model-robustness rationale: commands are designed to be model-portable; Opus may infer intent but weaker models require explicit gates; native interactive selection is preferred with numbered options as fallback; OpenSpec-backed commands must invoke OpenSpec. See `.claude/skills/chaos-shared/reference/model-robustness-policy.md`.
- Do not silently overwrite a README that is already up to date (`README_UP_TO_DATE`).

Parse the user intent:

```text
chaos:help
chaos:help workflow
chaos:help commands
chaos:help modes
chaos:help artifacts
chaos:help next
chaos:help <command>
chaos:help --readme
chaos:help --readme --dry-run
chaos:help --readme --write
chaos:help --readme --target <path>
```

Do not treat `demo` as a supported subcommand.

If the user asks `chaos:help next`, inspect the workspace and recommend the next command based on available artifacts.

If the user asks `--readme`, render a candidate README and compare it with the existing target. Preview by default. Write only when `--write` is present or when the user explicitly confirms the write after seeing the preview. If the target is already up to date, report `README_UP_TO_DATE` and do not rewrite it.

## Interaction Runtime

`chaos:help` explains the CHAOS Interaction Runtime at a high level: material human
decisions are runtime state, not chat messages; a command that creates a pending
decision stops (`mustStop: true`); humans answer in the **Decision Center**; work
continues via **`chaos:resume`** (or the Iteration 5 live runner while its lease is
live — never after runner death); and **`chaos:doctor` / `chaos:status`** surface
runtime health (Iteration 7 diagnostics). See
`.claude/skills/chaos-interaction-runtime/SKILL.md`. `chaos:help` performs no runtime
mutations.
