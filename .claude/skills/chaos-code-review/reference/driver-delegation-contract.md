# Driver Delegation Contract — chaos:code-review

`chaos:code-review` does not re-implement code review. It **drives** the read-only
`code-reviewer` agent and `code-reviewer` skill, and overlays CHAOS governance.

## Roles

| Component | Responsibility |
|---|---|
| `code-reviewer` agent + skill (the **driver**) | Read-only review procedure: load `AGENTS.md` authority, apply project skills, classify issues with its severity model, produce findings in its output format, cap confidence honestly. |
| `chaos-code-review` skill (the **orchestrator**) | Config/scope/mode resolution, CHAOS severity/confidence mapping, `CR-DEC-*` decision events, change-scoped reporting, lifecycle update, next-command routing, and **all user-facing decisions**. |

## Delegation rules (CHAOS overlay)

Obey `.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- The **orchestrator owns user decisions.** The driver returns findings, options,
  confidence, and evidence; it must **not** ask final user decisions or assume approval.
- Pass the driver a clear brief: scope (change/PR/since/path), mode
  (`light|standard|strict`), and — for change-scoped reviews — the change intent/spec
  context from `.chaos/changes/<change-id>/` and the OpenSpec change.
- The driver stays **read-only**: no edits, no patches, no state-changing commands. The
  orchestrator writes only the CHAOS review report.
- If the driver surfaces a **material decision need** (missing `AGENTS.md`, missing
  mandatory skill, ambiguous authority), it returns that need; the orchestrator resolves it
  via the interactive decision protocol (one decision, **STOP and wait**), records a
  `CR-DEC-*` event, then resumes.
- Do not let the driver's "infer the review mode" shortcut bypass CHAOS mode resolution:
  show the resolved/inferred mode to the user and do not silently downgrade `strict`.

## Missing-authority handling (from the driver, gated by CHAOS)

When `AGENTS.md` or a mandatory project skill is missing, present one decision and STOP:

```text
Decision required: Missing review authority

Context:
<AGENTS.md or mandatory skill X is missing; it defines the rules this review must apply.>

Recommended option:
1. Provide the missing authority, then re-run the review with full confidence.

Options:
1. Provide AGENTS.md / the skill — re-run at full confidence.
2. Continue as a generic best-effort review — confidence capped to LOW/MEDIUM.
3. Stop / defer.

Select one option to continue.
```

Record the outcome as a `CR-DEC-*` event and reflect the confidence cap in the report.

## What the orchestrator must not do

- Must not edit code, tests, migrations, config, or governance indexes.
- Must not approve or archive the change.
- Must not present the driver's findings as approval or as applied remediation.
