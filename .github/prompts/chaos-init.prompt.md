---
agent: chaos-bootstrap-architect
description: "Run the chaos:init workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-init.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-init`.
- Load `.github/skills/chaos-init/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-bootstrap-architect.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# chaos-init.prompt.md

Run the CHAOS init workflow for this repository.

CHAOS means **Controlled Human-led Agent-Orchestrated SDLC**.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Discover repository evidence before asking anything; do not ask what the repo already answers.
- Ask one high-impact decision at a time (excluding major tracks, treating Proposed ADRs as accepted, README generation). **After presenting a decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; a displayed plan is not approval.
- `chaos:init` is the one command that *generates* `.chaos/config.yaml`; if config exists, preserve it and ask before semantic changes.
- Seed config with the hardening policies so later commands inherit them: `policies.changeArtifacts` (change-scoped layout), `policies.artifactNaming` (date-prefixed filenames, display-only sequential IDs), and `policies.sync` (role boundaries + maintainer confirmation).
- Label assumptions/conflicts with knowledge type + confidence; record decisions in `.chaos/bootstrap-report.md`.

### Sonnet-safe execution checklist

- [ ] Repo evidence discovered first?
- [ ] Mode (`default|--auto|--guided`) recorded in the bootstrap report?
- [ ] High-impact decisions asked one at a time, stopping after each?
- [ ] `.chaos/config.yaml` generated/preserved with hardening policy sections?
- [ ] Confidence/knowledge classification doctrine present in `.chaos/constitution.md`?
- [ ] Bootstrap report written with questions, answers, and scope decisions?

Supported modes:

```text
chaos-init.prompt.md
chaos-init.prompt.md --auto
chaos-init.prompt.md --guided
```

Default mode is guided-confirmation:

1. Discover repository evidence first.
2. Ask only high-impact missing questions.
3. Require explicit confirmation before excluding major tracks or treating Proposed ADRs as accepted.
4. Generate the required CHAOS files.
5. Include assumptions, confidence, conflicts, open questions, source inventory, and config inference.
6. Always generate `.chaos/config.yaml` and `.chaos/bootstrap-report.md`.

Required output:

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

Optional output:

```text
README.md
```

Generate README only when requested or allowed.

Prefer using the `chaos-bootstrap-architect` agent/persona when available.

## Confidence doctrine

Ensure `.chaos/constitution.md` contains the CHAOS confidence and knowledge classification doctrine:

- material findings must be labelled `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`, or `CONFLICT`;
- material findings and final verdicts must include `HIGH`, `MEDIUM`, or `LOW` confidence;
- final verdicts must include evidence coverage and assumption load;
- no confidence-less verdicts, unlabeled assumptions, or inferences disguised as facts.

## Config concern

`chaos:init` must generate or update `.chaos/config.yaml` as a lightweight repository-conventions file.

The config centralises stable paths, toolchain commands, validation commands, agent locations, and protected-file policies. It must not encode architectural decisions, secrets, credentials, or hidden approval switches.

If an existing `.chaos/config.yaml` is found, preserve it by default, ask before semantic changes, and record config decisions in `.chaos/bootstrap-report.md`.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:init`
- Initialize interaction-runtime config defaults in `.chaos/config.yaml`
  (`policies.interactionRuntime`) and the `.chaos/interactions/` structure when they are
  missing and within init scope.
- **Do not create pending decisions** during init.
- Mention Decision Center / MCP / diagnostics availability in the bootstrap report when
  relevant (note: the live auto-resume runner and Stop-hook are Claude-harness only — not
  available on the Copilot surface, where resume is manual via `chaos-resume.prompt.md`).
  Perform no runtime mutations beyond initialization.
