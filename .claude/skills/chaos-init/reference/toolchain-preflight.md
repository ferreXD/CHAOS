# CHAOS Toolchain Preflight Contract

## Purpose

`chaos:init` and `chaos:status` must verify whether the repository has the minimum external tools needed for CHAOS + OpenSpec operation.

The preflight exists to avoid producing a governance workspace that claims OpenSpec-driven workflows are available when the required CLI/runtime is missing.

## Required tools

Check tools one by one in this order:

| Tool | Required for | Detection command | Minimum / expected | Auto-install policy |
|---|---|---|---|---|
| Git | source/repo context, source manifests, change tracking | `git --version` | any working Git | Do not auto-install by default. Prompt with OS/package-manager-specific guidance if missing. |
| Node.js | OpenSpec CLI runtime | `node --version` | `>= 20.19.0` | Do not auto-install by default. Prompt. May install only after explicit user approval and detected package manager support. |
| npm | OpenSpec CLI install/update | `npm --version` | any working npm compatible with the detected Node.js | Do not auto-install separately unless package manager support is clear and user approves. |
| OpenSpec CLI | spec motor for `chaos:propose`, `chaos:apply`, `chaos:archive`, validation/status | `openspec --version` | installed and callable | May auto-install with `npm install -g @fission-ai/openspec@latest` only after Node/npm pass and the user explicitly approves. |

## Optional tools

Check optional tools only when relevant or when the command can detect a relevant project type:

| Tool | Trigger | Detection command | Behaviour if missing |
|---|---|---|---|
| .NET SDK | .NET repository / `.sln` / `.csproj` detected | `dotnet --info` | Report missing project validation capability; do not install automatically. |
| package manager / build tool | repo-specific lockfiles/config | tool-specific version command | Report; do not invent build commands. |
| Claude Code CLI | Claude-specific installation/setup checks | `claude --version` | Optional. Report only when relevant. |
| GitHub CLI | GitHub/Copilot workflow automation | `gh --version` | Optional. Report only when relevant. |

## Spec-engine project initialization

Verifying the spec-engine **CLI** (OpenSpec, above) is not the same as having an initialized
spec-engine **project**. CHAOS treats the spec engine as a swappable provider: `project.specEngine`
in `.chaos/config.yaml` (default `openspec`) selects it, and its `toolchain.<specEngine>` block
declares `command`, `installCommand`, `projectMarker`, and `initCommand`. **Scaffolding that
project is `chaos:init`'s responsibility** — never a manual step the user is left to discover after
a `chaos:doctor` nag.

After the spec-engine CLI check passes, `chaos:init` ensures the project exists:

1. Resolve the active engine from `project.specEngine` and read its `toolchain.<specEngine>` block.
   If `specEngine` is `none`/absent, skip this step entirely.
2. Check whether the project-marker directory (`toolchain.<specEngine>.projectMarker`, default
   `openspec/`) already exists. If it does, record `pass` (already-present) and do nothing —
   `initCommand` must be idempotent-safe, so never re-run it over an existing project.
3. If it is absent, initialize it by running `toolchain.<specEngine>.initCommand` (default
   `openspec init`) from the repo root, under the same safety posture as installs: show the exact
   command first and never run it silently. `--auto` may run it non-interactively; default and
   `--guided` confirm first.
4. Record the outcome (created / already-present / deferred / skipped) in `.chaos/bootstrap-report.md`.

This closes the biggest first-run gap: a fresh clone (or a freshly hand-copied tooling install)
that has the CLI but no project, so the first `chaos:propose` has nothing to wrap. `chaos:doctor`'s
`CD-RT-07` is only the **safety net** that flags the gap when `chaos:init` was skipped.

## Preflight modes

### Default

1. Run detection one tool at a time.
2. Report each result immediately or in a compact table.
3. If a required tool is missing, ask the user what to do before installing or continuing.

Allowed choices:

```text
1. Install now, if safe and supported
2. Show manual install instructions
3. Continue in degraded mode
4. Defer with rationale
5. Abort command
```

### `--auto`

- May continue in degraded mode when tools are missing.
- Must not install anything without explicit user approval or a dedicated `--install-missing-tools` flag.
- Must record missing tools in the relevant report.

### `--guided`

- Run preflight as an explicit first section.
- Ask tool remediation questions one by one.
- Record answers in `.chaos/bootstrap-report.md` for `chaos:init` or `.chaos/status-report.md` for `chaos:status`.

### `--install-missing-tools`

This flag means the user is open to installation, not that installation is automatically safe.

Even with this flag:

- Ask before each installation command.
- Show the exact command that will be run.
- Explain whether it is global, local, or user-scoped.
- Do not use elevated/admin operations unless the user explicitly approves.
- Prefer project-local installation if the ecosystem supports it; for OpenSpec global install is allowed because OpenSpec documents global CLI install.

## Required reporting

### For `chaos:init`

`.chaos/bootstrap-report.md` must include a `Toolchain Preflight` section:

| Tool | Required | Status | Detected version | Detection evidence | Action taken | Notes |
|---|---:|---|---|---|---|---|
| Git | yes | pass/fail/warn/skipped |  | command output summary | installed/deferred/continued/none |  |

Also record any installation/remediation questions in `Questions asked and user answers`.

### For `chaos:status`

`.chaos/status-report.md` must include:

- toolchain preflight in Status Summary;
- check results for required tools;
- remediation prompts for missing/invalid tools;
- machine-readable summary fields for toolchain readiness.

## Safety rules

- Never install a tool silently.
- Never run `sudo`, administrator elevation, system package installs, or global package installs without explicit confirmation.
- Never invent installation commands for unknown operating systems.
- Prefer official installation guidance or tool-reported instructions.
- If the command cannot inspect the local environment, mark tool status as `UNKNOWN`, not `PASS`.
- Missing OpenSpec does not necessarily block `chaos:init`, but it blocks OpenSpec-dependent commands from being marked ready.
- Missing OpenSpec should make `chaos:status` report `NEEDS_ATTENTION` unless the project explicitly does not use OpenSpec.
