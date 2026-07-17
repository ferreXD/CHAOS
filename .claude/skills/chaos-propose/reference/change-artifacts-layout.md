# Change-Scoped Artifacts & Lifecycle Manifest — chaos:propose

`chaos:propose` is the **owner** of the per-change folder. When a change id is
known, it initializes the change-scoped layout and the lifecycle manifest.

Canonical contract: `.chaos/changes/README.md` (layout, naming policy, team
concurrency policy, sync role model).

## Initialize the change folder

When a change id is known (OpenSpec change created or selected), create:

```text
.chaos/changes/<change-id>/
  lifecycle.md                # created now, status: Proposed
  decision-events.md          # PROP-DEC-* recorded here, linked from lifecycle.md
  proposal-report.md          # the full CHAOS proposal report
  pre-proposal-brief.md       # degraded mode only (OpenSpec unavailable/declined)
```

OpenSpec remains the source of truth for `proposal.md`, `design.md`, `specs/`,
and `tasks.md` under `openspec/changes/<change-id>/`. Do not duplicate them into
the change folder.

In decision-gated **degraded mode** (OpenSpec unavailable or its writes not authorized),
the optional `pre-proposal-brief.md` is written here — never to the legacy
`.chaos/proposals/` folder. Derive a provisional change-id slug from the intent when
OpenSpec has not minted a change id. See
`reference/openspec-integration-contract.md` ("If OpenSpec is not available").

## Lifecycle manifest template (`lifecycle.md`)

```md
# CHAOS Lifecycle — <change-id>

Change ID: <change-id>
OpenSpec path: openspec/changes/<change-id>
Status: Proposed
Owner: <optional>
Created: YYYY-MM-DD
Last updated: YYYY-MM-DD

## Lifecycle

| Phase    | Artifact           | Status                        |
| -------- | ------------------ | ----------------------------- |
| Proposal | OpenSpec proposal  | Complete                      |
| Review   | proposal-review.md | Pending                       |
| Approval | approval.md        | Pending/Not required          |
| Apply    | apply-report.md    | Pending                       |
| Verify   | verification.md    | Pending                       |
| Archive  | archive-report.md  | Pending                       |
| Sync     | sync-report.md     | Pending                       |
| Retro    | retro.md           | Pending                       |

## Decision Events

<List PROP-DEC-* events or "None recorded yet.">

## Waivers / Accepted Risks

<List waivers or "None recorded yet.">

## Current Next Command

chaos:review <change-id>

## Confidence / Evidence summary

<Overall confidence, evidence coverage, assumption load when available.>
```

## Naming rules for recommended drafts

`chaos:propose` does not update shared governance indexes. When it recommends a
decision-log or ADR draft, it must use **date-prefixed, slug-based** physical
filenames (e.g. `docs/decision-log/YYYY-MM-DD-<slug>.md`,
`docs/adr/YYYY-MM-DD-<slug>.md`). Sequential display IDs are assigned later by
`chaos:sync`, not at propose time.

## Compatibility

Read legacy `.chaos/proposals/` artifacts when present for context, but write new
artifacts under `.chaos/changes/<change-id>/`. Do not migrate legacy artifacts;
you may recommend a future migration.
