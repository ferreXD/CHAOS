---
name: chaos-code-review
description: "Run a post-implementation code review under CHAOS governance, driven by the code-reviewer agent. Reviews implemented code (change/PR/branch/diff/path) for architecture compliance, AGENTS.md conventions, skill usage, correctness, and maintainability. Supports --light, --standard, --strict."
allowed-tools: Read, Grep, Glob, Bash, LS, Write
agent: code-reviewer
---

# CHAOS Code Review

Use this skill when the user invokes:

```text
/chaos-code-review <change-id|--pr N|--since ref|--scope path> [--light|--standard|--strict]
```

or asks to code-review an implemented CHAOS change, PR, branch, diff, or path under CHAOS
governance.

`chaos:code-review` reviews **implemented code** (post-implementation). It is distinct from
`chaos:review`, which reviews an OpenSpec **proposal** (pre-implementation).

## Non-negotiable execution contract (model robustness)

This skill must be executable by the **weakest supported Claude model**. Do not depend on
inferring governance intent. Obey:

- `.claude/skills/chaos-shared/reference/model-robustness-policy.md`
- `.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`

Mandatory, non-inferable behaviours:

1. **Read-only.** Never edit production code, tests, migrations, config, or governance
   indexes. The review writes only its own report.
2. **Driver delegation.** Drive the review with the `code-reviewer` agent + skill. The
   orchestrator owns user decisions; the driver returns findings/options/confidence/
   evidence and does not ask final user decisions. See `reference/driver-delegation-contract.md`.
3. **Stop after material decisions.** Ask one decision at a time and STOP after presenting
   it (missing `AGENTS.md`/skill, remediation routing, accepted risk, scope confirmation).
4. **Change-scoped output.** Write change-scoped reports under
   `.chaos/changes/<change-id>/code-review.md`; non-change-scoped under
   `.chaos/code-reviews/YYYY-MM-DD-<slug>-code-review.md`.

## Purpose

Produce a governance-grade, evidence-based, read-only code review with CHAOS confidence and
decision auditability, reusing the `code-reviewer` driver for the actual review procedure.

## Repository context (vNext)

Resolve the provider-neutral repository context contract
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`) to source the diff,
using the `codeReview` tool profile (least privilege, read-only). MCP is optional; degrade
through CLI → local git.

- **GitHub** — prefer the current review-request (PR) diff via GitHub MCP or `gh pr diff`;
  use linked issues and, if configured, code/security context; fall back to `git diff` against
  the merge-base.
- **Azure DevOps** — prefer the current review-request (PR) diff via Azure DevOps MCP or
  `az repos pr`; use linked work items and build-validation status; fall back to `git diff`
  against the merge-base.

Record in the report: repository context source, diff source, changed files inspected, linked
issue/work-item context if available, and a confidence cap when only local git was available.
Include the shared **Repository Context** section.

## Required references

Before operating, read these reference files (and the shared policies above):

- `reference/driver-delegation-contract.md`
- `reference/config-awareness.md`
- `reference/modes.md`
- `reference/severity-confidence-mapping.md`
- `reference/decision-event-register.md`
- `reference/report-template.md`
- `reference/output-contract.md`
- `.claude/skills/chaos-shared/reference/repository-context-contract.md`
- `.claude/skills/chaos-shared/reference/repository-context-resolution-policy.md`
- `.claude/skills/chaos-shared/reference/mcp-tool-profiles.md`

Also rely on the driver's own procedure: the `code-reviewer` skill
(`authority-model.md`, `review-workflow.md`, `skill-applicability-policy.md`,
`severity-model.md`, `output-format.md`, `completion-checklist.md`).

## Workflow

1. Read `.chaos/config.yaml`; resolve paths, validation commands, and agent locations.
2. Parse invocation, scope, and mode. Show the resolved scope and mode; if mode is
   inferred, explain why. Do not silently downgrade `strict`.
3. Resolve the review target:
   - change-scoped: `<change-id>` (review the change's implementation; read
     `.chaos/changes/<change-id>/` and the OpenSpec change for intent/spec context);
   - `--pr <n>` / `--since <ref>` / `--scope <path>` / `--staged` / `--working`: resolve the
     diff/scope via read-only git/discovery.
4. Confirm `AGENTS.md` and applicable project skills are loadable. If `AGENTS.md` or a
   mandatory skill is missing, run the missing-authority decision (one decision, STOP); the
   only continuations are provide / capped-confidence generic review / stop.
5. Delegate the read-only review to the `code-reviewer` agent with the CHAOS overlay (scope,
   mode, change context). The driver returns findings using its severity model and output
   format.
6. Map driver findings into CHAOS classification: severity
   (`BLOCKING|MAJOR|MINOR|ADVISORY`), knowledge type
   (`FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT`), and confidence (`HIGH|MEDIUM|LOW`). See
   `reference/severity-confidence-mapping.md`.
7. Run the remediation-routing loop: for each material finding, present options (route to
   `chaos:apply` remediation, accept risk, defer, create governance draft via `chaos:sync`,
   stop) **one at a time and STOP**. Record each material choice as a `CR-DEC-*` Decision
   Event with a sync action.
8. Produce the final verdict with confidence, evidence coverage, and assumption load.
9. Write the report to the scope-correct path (unless `--dry-run`/`--no-write`). For
   change-scoped reviews, update `.chaos/changes/<change-id>/lifecycle.md`
   (`Last updated`, and a Code Review note) with confirmation, and record `CR-DEC-*` events
   in `.chaos/changes/<change-id>/decision-events.md`.
10. Recommend the next command.

## UX rule

Do not ask questions the repository already answers. Ask targeted decisions only when
missing authority/context materially affects review correctness or when remediation routing
needs a human choice. Open items left unresolved by the loop are recorded as findings with a
sync action, not dumped as a question list.

## Final response

Summarize:

- scope and mode (and whether mode was inferred);
- authorities loaded (`AGENTS.md`, project skills) and any caps;
- verdict and overall confidence (evidence coverage, assumption load);
- counts by CHAOS severity;
- material `CR-DEC-*` decisions recorded;
- report path;
- next command.

## Todo Candidates (optional)

`chaos:code-review` MAY end its report with an optional `## Todo Candidates` section listing
material high/medium findings, missing tests, security concerns, maintainability debt, or
scope drift, using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:code-review` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Boundaries

- Read-only; does not edit code, governance indexes, or config.
- Does not approve or archive a change.
- Register the command in `.chaos/commands/index.md` via `chaos:sync`, not from here.
