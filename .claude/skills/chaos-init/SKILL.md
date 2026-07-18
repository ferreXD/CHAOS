---
name: chaos-init
description: "Bootstrap a repository into CHAOS governance/workflow files using guided-confirmation, auto, or guided mode."
---

# CHAOS Init Skill

Initialize this repository into **CHAOS** — **Controlled Human-led Agent-Orchestrated SDLC**.

## Public command

Methodology name: `chaos:init`

Claude slash command name may be:

```text
/chaos-init
/chaos-init --auto
/chaos-init --guided
```

## Required behavior

Follow the contract in:

- `reference/interaction-model.md`
- `reference/output-contract.md`
- `reference/bootstrap-report-contract.md`
- `reference/config-contract.md`
- `reference/source-inventory-contract.md`
- `reference/question-bank.md`
- `reference/toolchain-preflight.md`

## Required output

Always generate or update:

```text
AGENTS.md
.chaos/config.yaml
.chaos/bootstrap-report.md
.chaos/constitution.md
.chaos/context.md
.chaos/architecture.md
.chaos/decisions/index.md
.chaos/rules/index.md
.chaos/commands/index.md
.chaos/gates/index.md
```

Optionally generate or update:

```text
README.md
```

only when explicitly requested or allowed.

## Mandatory acceptance rules

- Always generate `.chaos/bootstrap-report.md`.
- Always generate `.chaos/config.yaml` as the lightweight repository-conventions contract.
- Record mode used.
- Record questions asked and user answers.
- Record scope decisions explicitly.
- Record source inventory with `verified`, `missing`, or `inferred` status.
- Mark commands as `implemented` or `defined-only` when applicable.
- Require explicit confirmation before excluding a major available documentation track.
- Require explicit confirmation before treating Proposed ADRs as accepted working posture.

## Constitution confidence requirement

`chaos:init` must ensure `.chaos/constitution.md` includes a **confidence and knowledge classification doctrine**.

The generated constitution must state that every CHAOS judgement, recommendation, approval, verification, gate result, or review finding distinguishes:

- `FACT`
- `INFERENCE`
- `ASSUMPTION`
- `UNKNOWN`
- `CONFLICT`

and carries confidence metadata:

- `HIGH`
- `MEDIUM`
- `LOW`

Final verdicts must also include evidence coverage and assumption load. No confidence-less verdicts, unlabeled assumptions, or inferences disguised as facts are allowed.

Use `reference/confidence-model.md` as the canonical doctrine.

## Toolchain preflight requirement

Before generating or updating the CHAOS workspace, run the toolchain preflight from `reference/toolchain-preflight.md`.

At minimum, check one by one:

1. `git --version`
2. `node --version` and verify Node.js `>= 20.19.0` for OpenSpec compatibility
3. `npm --version`
4. `openspec --version`

If a required tool is missing, unsupported, or unknown, ask the user whether to install, show manual instructions, continue in degraded mode, defer with rationale, or abort.

Do not install anything silently. If installation is requested, show the exact command first and ask for explicit confirmation before running it. For OpenSpec, the default install command is:

```bash
npm install -g @fission-ai/openspec@latest
```

After the spec-engine CLI check passes, **initialize the spec-engine project** if it is not
already present — this is `chaos:init`'s job, not a manual step left to the user. Resolve
`project.specEngine` (default `openspec`) and, when the `toolchain.<specEngine>.projectMarker`
directory (default `openspec/`) is missing, run `toolchain.<specEngine>.initCommand`
(default `openspec init`) from the repo root. Show the command first; never run it silently;
skip when `specEngine: none`. Canonical rules: `reference/toolchain-preflight.md` →
"Spec-engine project initialization".

Record all detection results, the spec-engine project-init outcome, and any
installation/remediation answers in `.chaos/bootstrap-report.md`.

## Config requirement

`chaos:init` must generate `.chaos/config.yaml` using `reference/config-contract.md`.

The config must centralise repository conventions such as paths, toolchain commands, validation commands, agent locations, and protected-file policies. It must not encode architecture decisions, secrets, credentials, environment-specific private values, or hidden approval switches.

## Repository integration placeholders (vNext)

`chaos:init` seeds new repositories with the provider-neutral repository-context / MCP
integration placeholders so the resolver and `chaos:doctor` work out of the box. Canonical
contract: `.claude/skills/chaos-shared/reference/repository-context-contract.md`.

GitHub-native public defaults:

- `integrations.repository.provider: auto`
- `integrations.repository.github.enabled: true`
- `integrations.repository.azureDevOps.enabled: false`
- `mcp.defaultMode: read-only`; `policies.repositoryContext.*` per the contract.

Do **not** prompt for Azure DevOps `organization` / `project` unless the provider is
explicitly `azure-devops`, the remote URL clearly indicates Azure DevOps, or the user chooses
to configure Azure DevOps. Never write secrets/tokens/PATs/connection strings to config —
declare non-secret intent only (`mcp-security-policy.md`).

If config values are inferred, defaulted, or provided by the user, record that provenance in `.chaos/bootstrap-report.md`.

## Todo backlog defaults

`chaos:init` seeds `.chaos/config.yaml` with the `chaos:todo` path/policy defaults
(`paths.todo`/`todoItems`/`todoViews`, `policies.todo.*`) from `reference/config-contract.md` so
`chaos:todo` works out of the box. `chaos:init` does not create `.chaos/todo/` itself — that
workspace is created lazily by the first `chaos:todo` run.
