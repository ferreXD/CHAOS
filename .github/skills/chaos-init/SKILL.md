---
name: chaos-init
description: "Bootstrap a repository into CHAOS governance/workflow files using guided-confirmation, auto, or guided mode."
---

> Copilot agent skill. Keep this file named `SKILL.md`; supplementary material lives in `reference/`.

# CHAOS Init Skill

Initialize this repository into **CHAOS** — **Controlled Human-led Agent-Orchestrated SDLC**.

## Public command

Methodology name: `chaos:init`

Copilot slash command name may be:

```text
chaos-init.prompt.md
chaos-init.prompt.md --auto
chaos-init.prompt.md --guided
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

Record all detection results and any installation/remediation answers in `.chaos/bootstrap-report.md`.

## Config requirement

`chaos:init` must generate `.chaos/config.yaml` using `reference/config-contract.md`.

The config must centralise repository conventions such as paths, toolchain commands, validation commands, agent locations, and protected-file policies. It must not encode architecture decisions, secrets, credentials, environment-specific private values, or hidden approval switches.

If config values are inferred, defaulted, or provided by the user, record that provenance in `.chaos/bootstrap-report.md`.
