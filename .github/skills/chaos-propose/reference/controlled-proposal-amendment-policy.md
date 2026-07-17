# Controlled Proposal Amendment Policy

`chaos:propose` may generate or amend OpenSpec proposal artefacts only after the user confirms the intended approach or answers the material runtime decisions.

It must not silently change proposal/design/spec/tasks based on hidden assumptions.

## Amendment classes

| Class | Meaning | Allowed in propose? |
|---|---|---|
| `PROPOSAL_SCOPE_AMENDMENT` | Changes included/excluded scope, goals, non-goals. | Yes, after confirmation. |
| `DESIGN_AMENDMENT` | Changes implementation approach in design.md. | Yes, after confirmation. |
| `SPEC_AMENDMENT` | Changes observable behaviour or acceptance criteria. | Yes, after confirmation. |
| `TASK_AMENDMENT` | Adds/changes tasks needed for implementation readiness. | Yes, after confirmation. |
| `RISK_ACCEPTANCE` | Records user acceptance of known evidence/risk gap. | Yes, with confidence impact. |
| `EVIDENCE_WAIVER` | Allows proposal despite missing archaeology/ADR/source evidence. | Yes, mode-dependent. |
| `ARCHITECTURAL_DECISION_CANDIDATE` | Potential ADR-level decision. | Record; do not pretend ADR exists. |

## Runtime options

When a material amendment is needed, ask:

```text
The proposal needs an amendment before it can be generated/reviewed confidently.

Issue: <description>
Recommended amendment: <proposal>
Classification: <class>
Confidence: <HIGH|MEDIUM|LOW>

Options:
1. Apply suggested amendment now
2. Provide custom amendment
3. Defer with rationale
4. Mark accepted risk and continue
5. Stop
```

## Mode behaviour

| Mode | Behaviour |
|---|---|
| `--light` | Allow deferral and accepted risk for non-critical amendments. Ask only high-impact questions. |
| `--standard` | Prefer resolving material amendments now. Allow continuation with explicit rationale if no direct blocker exists. |
| `--strict` | Blocking/material amendments must be resolved before the proposal can be marked ready for review/approval. |

## No silent OpenSpec mutation

The command must explain what it will write before writing OpenSpec artefacts.

Minimum confirmation before final write:

```text
I will create/update these OpenSpec artefacts:
- openspec/changes/<change-id>/proposal.md
- openspec/changes/<change-id>/design.md
- openspec/changes/<change-id>/specs/...
- openspec/changes/<change-id>/tasks.md

Proceed?
```

## After-amendment recheck

After applying a runtime amendment, re-read or re-evaluate the affected proposal/design/spec/task section before producing the final report.

Do not claim an issue is resolved unless the affected artefact reflects the user-approved answer.
