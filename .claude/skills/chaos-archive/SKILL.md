---
name: chaos-archive
description: Archive a verified OpenSpec change under CHAOS governance, preserving decision/debt auditability and routing sync/retro follow-up.
---

# CHAOS Archive Skill

Use this skill when the user invokes:

```text
chaos:archive <change-id>
```

or asks to archive/close a CHAOS/OpenSpec change.

## Required references

Read these references before acting:

- `reference/archive-contract.md`
- `reference/modes-and-flags.md`
- `reference/verification-gate-policy.md`
- `reference/openspec-archive-integration.md`
- `reference/source-of-truth-confirmation.md`
- `reference/decision-event-closure.md`
- `reference/waiver-debt-governance-override.md`
- `reference/runtime-closure-loop.md`
- `reference/sync-retro-routing.md`
- `reference/report-template.md`
- `reference/question-bank.md`
- `reference/install-checklist.md`

## Procedure

1. Parse command and flags.
2. Check required tools one by one.
3. Discover OpenSpec change and lifecycle reports.
4. Infer mode if not provided.
5. Present archive dashboard.
6. Check verification gate.
7. If `--sync-first`, perform/guidance sync-first flow before archive.
8. If `--dry-run`, write dry-run readiness report and stop.
9. Audit tasks, decision events, waivers, accepted risks, and debt.
10. Ask runtime closure questions for material unresolved items.
11. Present archive execution plan.
12. Execute/guidance OpenSpec archive only after allowed.
13. Confirm source-of-truth update.
14. Write archive report.
15. Recommend sync/retro/follow-up change.

## Output

**Universal `change.md` awareness:** a change whose `change.md` frontmatter shows
`lifecycle.status: Delivered` or `Rejected` (e.g. the collapsed light path) is **already
terminal** — no per-change archive run is required; the `lifecycle.md` view satisfies the
existence contract. Repo-wide housekeeping may still index it; do not demand the legacy report
set for such changes.

Write (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/archive-report.md
```

Update `Status: Archived` and the Archive row in `.chaos/changes/<change-id>/lifecycle.md`
only with confirmation. The legacy `.chaos/archive-reports/` folder may be READ for
compatibility but is no longer the preferred output location; do not migrate it. Route
shared governance closure to `chaos:sync`. See `.chaos/changes/README.md`.

## Repository context (vNext)

The archive report may include repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`), tool profile
`archive` (least privilege, read-only): branch, review request (PR) / linked work item if
available, CI status if available, and context confidence. **Do not** require MCP for archive;
local git fallback is sufficient. Include the shared **Repository Context** section when
context is resolved.

## Todo Candidates (optional)

`chaos:archive` MAY end its report with an optional `## Todo Candidates` section listing
material archive-with-debt items, required sync follow-ups, or post-archive cleanup, using the
shared fields in `.claude/skills/chaos-todo/reference/todo-candidate-contract.md`.
`chaos:archive` does not create durable todo items — only `chaos:todo` curates
`.chaos/todo/items/`.

## Doctrine

- No silent closure.
- No confidence-less verdicts.
- No hidden debt.
- No production-code edits.
- No ADR/rule/decision-index edits from archive.
- Runtime user decisions are preferred over dumping open questions.
