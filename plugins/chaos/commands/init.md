---
description: One-time bootstrap — AGENTS.md plus the .chaos workspace (architecture, decisions, config)
---

# /chaos-init

Run the CHAOS init workflow for this repository.

CHAOS means **Controlled Human-led Agent-Orchestrated SDLC**.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`${CLAUDE_PLUGIN_ROOT}/skills/chaos-shared/reference/model-robustness-policy.md` and
`${CLAUDE_PLUGIN_ROOT}/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Discover repository evidence before asking anything; do not ask what the repo already answers.
- Ask one high-impact decision at a time (excluding major tracks, treating Proposed ADRs as accepted, README generation). **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; a displayed plan is not approval.
- `chaos:init` is the one command that *generates* `.chaos/config.yaml`; if config exists, preserve it and ask before semantic changes.
- Seed config per `reference/config-contract.md`: `specGate` (when a `chaos:run` change owes an OpenSpec change) and `policies.protectedFiles` (no silent edits of `AGENTS.md` / root `README.md`).
- Label assumptions/conflicts with knowledge type + confidence; record decisions in `.chaos/bootstrap-report.md`.

### Sonnet-safe execution checklist

- [ ] Repo evidence discovered first?
- [ ] Mode (`default|--auto|--guided`) recorded in the bootstrap report?
- [ ] High-impact decisions asked one at a time, stopping after each?
- [ ] `.chaos/config.yaml` generated/preserved with hardening policy sections?
- [ ] Confidence/knowledge classification doctrine present in `AGENTS.md`?
- [ ] Bootstrap report written with questions, answers, and scope decisions?

Supported modes:

```text
/chaos-init
/chaos-init --auto
/chaos-init --guided
```

Default mode is guided-confirmation:

1. Discover repository evidence first.
2. Ask only high-impact missing questions.
3. Require explicit confirmation before excluding major tracks or treating Proposed ADRs as accepted.
4. Generate the required CHAOS files.
5. Include assumptions, confidence, conflicts, open questions, source inventory, and config inference.
6. Always generate `.chaos/config.yaml` and `.chaos/bootstrap-report.md`.

Required output (the lean workspace — nothing else):

```text
AGENTS.md
.chaos/config.yaml
.chaos/bootstrap-report.md
.chaos/context.md
.chaos/architecture.md
.chaos/decisions/index.md
```

Optional output:

```text
README.md
```

Generate README only when requested or allowed.

Prefer using the `chaos-bootstrap-architect` agent/persona when available.

## Confidence doctrine

Ensure `AGENTS.md` carries the CHAOS confidence and knowledge classification doctrine:

- material findings must be labelled `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`, or `CONFLICT`;
- material findings and final verdicts must include `HIGH`, `MEDIUM`, or `LOW` confidence;
- final verdicts must include evidence coverage and assumption load;
- no confidence-less verdicts, unlabeled assumptions, or inferences disguised as facts.

## Config concern

`chaos:init` must generate or update `.chaos/config.yaml` as a lightweight repository-conventions file.

The config centralises stable paths, toolchain commands, validation commands, agent locations, and protected-file policies. It must not encode architectural decisions, secrets, credentials, or hidden approval switches.

If an existing `.chaos/config.yaml` is found, preserve it by default, ask before semantic changes, and record config decisions in `.chaos/bootstrap-report.md`.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`${CLAUDE_PLUGIN_ROOT}/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:init`
- Initialize interaction-runtime config defaults in `.chaos/config.yaml`
  (`policies.interactionRuntime`) and the `.chaos/interactions/` structure when they are
  missing and within init scope.
- **Do not create pending decisions** during init.
- Mention Decision Center / MCP / live runner / diagnostics availability in the
  bootstrap report when relevant. Perform no runtime mutations beyond initialization.
