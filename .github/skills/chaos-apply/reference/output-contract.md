# CHAOS Apply Output Contract

## Primary output

`chaos:apply` must produce or update (v0 change-scoped layout):

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
