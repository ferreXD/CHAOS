---
name: chaos-review
description: Review and optionally remediate an OpenSpec proposal before implementation using CHAOS governance, ADR/rule alignment, evidence coverage, and confidence levels.
allowed-tools: Read, Grep, Glob, Bash, LS, Write, Edit
agent: chaos-proposal-reviewer
---

# chaos:review

Run a pre-implementation proposal review for an OpenSpec change.

Canonical CHAOS form:

```text
chaos:review <change-id-or-intent> [--light|--standard|--strict]
```

Claude invocation:

```text
/chaos-review <change-id-or-intent> --standard
```

## Inputs

- OpenSpec change id or intent.
- Optional mode: `--light`, `--standard`, `--strict`.

## Light collapsed-lifecycle changes

A `change.md`-based light change (`chaosMetadata.mode: light` — see
`chaos-shared/reference/change-template.md`) does **not** require `chaos:review`: the FRAME
self-review line plus the human-answered decisions are its gate, and `chaos:apply` is the next
command. If review is explicitly invoked on one anyway, review the `change.md` contract +
`decision-events.md` (do not demand `proposal-report.md`) and update the Review line in
`change.md` with the verdict — do not create `proposal-review.md`. Escalated changes
(`escalatedFrom: light`) follow the standard path below.

## Required output

Generate or update (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/proposal-review.md
```

After explicit approval handoff confirmation, optionally also write:

```text
.chaos/changes/<change-id>/approval.md
```

Record review-time decision events under `.chaos/changes/<change-id>/decision-events.md`
(or within the review report with lifecycle references) and update
`.chaos/changes/<change-id>/lifecycle.md` (Review row, `Last updated`) with confirmation.
The legacy `.chaos/reviews/` and `.chaos/approvals/` folders may be READ for
compatibility but are no longer the preferred output location; do not migrate them.
Do not update shared governance indexes directly. See `.chaos/changes/README.md`.

## Workflow

1. Resolve target OpenSpec change.
2. Detect or infer mode and risk tier.
3. Load CHAOS governance sources.
4. Load OpenSpec artefacts.
5. Check OpenSpec tool availability.
6. Run or request `openspec validate <change-id> --strict`.
7. Assess proposal/design/spec/tasks quality.
8. Assess evidence coverage.
9. Assess ADR/rule alignment.
10. Produce findings and assumption registers.
11. Classify fixability of material findings.
12. Run the Runtime Remediation Loop:
    - offer guided fixes/context prompts one by one;
    - patch OpenSpec artefacts only after explicit confirmation;
    - record every material choice as a `REV-DEC-*` Decision Event;
    - re-read/re-evaluate affected artefacts after amendments.
13. Produce final verdict with confidence.
14. Offer optional approval handoff only if eligible.

## Reference files

Read the reference files under `reference/` before executing the review:

- `review-contract.md`
- `config-awareness.md`
- `modes.md`
- `evidence-confidence-model.md`
- `runtime-remediation-loop.md`
- `decision-event-register.md`
- `guided-amendment-policy.md`
- `openspec-review.md`
- `ux-flow.md`
- `report-template.md`
- `question-bank.md`

## Repository context (vNext, optional)

When easily available, `chaos:review` may record **review request (PR) / branch context** from
the provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`, tool profile
`review`, read-only). This is additive provenance only — review does **not** require MCP, CLI,
or provider context; local git fallback is sufficient.

## Todo Candidates (optional)

`chaos:review` MAY end its report with an optional `## Todo Candidates` section listing
material remediation not applied, conditional-approval follow-up items, or missing
tests/spec clarifications, using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:review` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Hard boundary

`chaos:review` may amend OpenSpec/CHAOS review artefacts with confirmation.

It must not implement production/source code.

## Config awareness

Read `.chaos/config.yaml` when present before resolving OpenSpec, ADR, decision-log, archaeology, rules, gates, validation, and review report paths. Follow `reference/config-awareness.md`.

Do not edit config from `chaos:review`; report config drift and route to `chaos:status` or `chaos:sync`.
