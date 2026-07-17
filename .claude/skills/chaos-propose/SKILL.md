---
name: chaos-propose
description: "Create evidence-aware, ADR/rule-aligned OpenSpec proposals through CHAOS. Supports --light, --standard, and --strict modes with runtime decision resolution."
---

# CHAOS Propose

Use this skill when the user invokes:

```text
/chaos-propose "<change intent>" [--light|--standard|--strict]
```

or asks to create a CHAOS/OpenSpec proposal.

## Purpose

Create a proposal for a change using CHAOS governance and OpenSpec as the spec motor.

The skill must not implement code.

## Repository context (vNext, optional)

When easily available, `chaos:propose` may record the **branch / change source** from the
provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`, tool profile
`propose`, read-only). This is purely additive provenance — propose does **not** require MCP,
CLI, or provider context, and local git fallback is sufficient.

## Non-negotiable execution contract (model robustness)

This skill must be executable by the **weakest supported Claude model**. Do not depend on
inferring governance intent. Obey:

- `.claude/skills/chaos-shared/reference/model-robustness-policy.md`
- `.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`

Two behaviours are mandatory and non-inferable:

1. **Hard OpenSpec invocation gate.** `chaos:propose` MUST use OpenSpec as the proposal
   engine before any CHAOS wrapping. Detect → invoke → confirm change folder → confirm
   artifacts → validate → only then wrap. Never hand-write proposal/design/spec/tasks when
   OpenSpec is available. See `reference/openspec-integration-contract.md`.
2. **Stop after material decisions.** Ask one decision at a time and STOP after presenting
   it; never continue until the user selects an option. A recommendation is not a
   decision; a displayed approach is not approval.

## Required references

Before operating, read the reference files in this skill (and the shared policies above):

- `reference/mode-reference.md`
- `reference/risk-classification.md`
- `reference/evidence-and-confidence-model.md`
- `reference/runtime-decision-loop.md`
- `reference/decision-event-register.md`
- `reference/controlled-proposal-amendment-policy.md`
- `reference/approach-alignment-contract.md`
- `reference/openspec-integration-contract.md`
- `reference/output-contract.md`
- `reference/change-artifacts-layout.md`
- `reference/question-bank.md`

## Workflow

1. Parse mode. If absent, infer mode from risk and tell the user why.
2. Discover CHAOS/OpenSpec/ADR context.
3. Classify change and risk.
4. Assess evidence coverage.
5. Load archaeology only when available and relevant; require it only when risk/classification demands it.
6. Detect missing material context or decisions.
7. Run the Runtime Decision Loop:
   - ask focused questions one by one;
   - offer recommended options when supported by evidence;
   - let the user answer, defer, accept risk, or stop;
   - record each material answer as a `PROP-DEC-*` Decision Event.
8. Present the Approach Alignment Checkpoint. STOP and wait for explicit confirmation.
9. After user confirmation, run the **hard OpenSpec invocation gate** (mechanical, in order):
   1. Detect OpenSpec availability (`.chaos/config.yaml` `project.specEngine`/`toolchain.openspec`, or `/opsx:propose`, `openspec` CLI, `openspec/changes/`).
   2. Invoke OpenSpec via one acceptable path — `/opsx:propose`, the `openspec-propose` skill, or driving the `openspec` CLI (all first-class; see "CHAOS overlay invocation rules" in `reference/openspec-integration-contract.md`). Pass the CHAOS brief as input and let OpenSpec own artifact paths. Do not hand-write artifacts when OpenSpec is available; if no path can run, there is no automatic fallback — go to degraded mode (6).
   3. Confirm the OpenSpec change folder exists (`openspec/changes/<change-id>/`).
   4. Confirm proposal/spec/task artifacts were created or updated.
   5. Run OpenSpec validation (`openspec validate <change-id> --strict`) when available; record run/not-run/failed honestly.
   6. If OpenSpec is unavailable/failed: apply degraded-mode handling — strict blocks; standard/light ask one decision and STOP, then cap confidence; record the degraded-mode decision event.
   7. Only after the gate, apply CHAOS wrapping (confidence, decision events, archaeology references, lifecycle, review routing, governance recommendations).
   8. Record the **OpenSpec Invocation Proof** in the report (see `reference/openspec-integration-contract.md`).
10. Re-read/re-evaluate amended proposal artefacts when runtime decisions changed them.
11. When a change id is known, initialize the change folder `.chaos/changes/<change-id>/`
    and write `lifecycle.md` (status `Proposed`). Record proposal-time decision events
    in `.chaos/changes/<change-id>/decision-events.md` and link them from `lifecycle.md`.
    Write the proposal report to `.chaos/changes/<change-id>/proposal-report.md`. See
    `reference/change-artifacts-layout.md`.
12. Recommend `chaos:review <change-id>`.

## UX rule

Do not ask questions the repository already answers.

Do ask targeted runtime decision questions when missing context materially changes proposal scope, approach, OpenSpec artefacts, confidence, or implementation readiness.

Open questions are a fallback, not the default output. Only unresolved/deferred/external questions should remain open in the report.

## Runtime amendment rule

The command may amend OpenSpec proposal/design/spec/tasks only after explicit user confirmation.

No silent proposal mutation.

## Todo Candidates (optional)

`chaos:propose` MAY end its report with an optional `## Todo Candidates` section listing
material deferred proposal questions, degraded-mode follow-up (e.g. OpenSpec unavailable), or
missing context that should be tracked, using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:propose` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Final response

Summarize:

- change ID;
- mode and whether it was inferred;
- proposal status;
- confidence;
- material runtime decisions recorded;
- OpenSpec artefacts created or not created;
- remaining open questions, if any;
- next command.
