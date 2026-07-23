# CHAOS Apply Output Contract

## Primary output

**Light-deliver exception:** on a `change.md`-based light change (`chaosMetadata.mode: light`),
the primary output is the **`change.md` §Delivery dashboard** (plus the `lifecycle.md` view
update) — **no `apply-report.md` is written**, and the required output properties below are
carried by the dashboard's fields (mode, result status, checks, files, deviations, run id).
Formats: `chaos-shared/reference/change-template.md`.

Otherwise, `chaos:apply` must produce or update (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/apply-report.md
```

It reads `.chaos/changes/<change-id>/lifecycle.md` when available and records
apply-time decision events under `.chaos/changes/<change-id>/decision-events.md`.
The legacy `.chaos/apply-reports/<change-id>-apply-report.md` may be READ for
compatibility but is no longer the preferred output location; do not migrate it.
Canonical layout: `.chaos/changes/README.md`.

If the host environment cannot write files, it must output the full report content and instruct the user where to save it.

## Required output properties

The report must include:

- explicit mode and mode source
- result state
- execution confidence
- validation evidence
- scope drift risk
- assumption load
- exact source manifest
- direct blockers and continuable gaps
- implementation boundary
- task execution log
- controlled amendments
- decision events
- validation attempts/skips
- next command recommendation

## Closing checklist

Before writing the final apply report, verify that every task in `tasks.md` confirmed complete
in the Task Execution Log is actually marked `[x]` in `tasks.md` itself — do not rely on archive
time to catch this. If a task's real-world completion is independently confirmed but its checkbox
was left unmarked, correct the checkbox as part of closing this apply pass, not as a later
archive-time correction.

Provenance: `implement-entra-id-authentication` archive (2026-07-03, ARC-DEC-001) — 23 checkboxes
were never marked `[x]` during apply despite independently-verified completion; caught and fixed
only at archive. Promoted via `chaos:sync --all`, 2026-07-06.

## Forbidden output patterns

Do not produce:

- a bare success/failure without confidence metadata
- a task completion claim without evidence
- an undocumented decision
- an unlabeled assumption
- a scope change without classification
- a validation claim without command/result evidence

## Recommended next command

Always end with one of:

- `chaos:verify <change-id>`
- `chaos:review <change-id>` if proposal/review must be fixed
- `chaos:propose <change intent>` if a new proposal is required
- `chaos:sync` if decision events require governance promotion

## Config Context section

Apply reports must include a `Config Context` section documenting config status, configured paths/commands used, inferred defaults, config conflicts, config-related user decisions, and confidence impact.
