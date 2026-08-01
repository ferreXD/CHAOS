# Autodiscovery Policy

`chaos:help` must be autodiscoverable and repository-aware.

## Preferred sources

1. `.chaos/commands/index.md`
2. `.chaos/changes/README.md` (per-change layout + team concurrency policy)
3. `.chaos/changes/<change-id>/change.md` + `lifecycle.md` (per-change story + lifecycle manifests)
4. `.chaos/workflow-map.md`
5. `.chaos/status-report.md`
6. OpenSpec folders
7. CHAOS lifecycle report folders (per-change folder first; legacy folders read-only)
8. installed Claude/Copilot command files
9. `AGENTS.md` and workflow README files

## State discovery signals

Resolve change-scoped artifacts under `.chaos/changes/<change-id>/` first; fall back to
legacy scattered folders only for read-compatibility. When
`.chaos/changes/<id>/change.md` exists (any mode), infer the phase from it — frontmatter
`chaosMetadata.lifecycle.status`, §Review verdict, §Delivery status — and do **not** treat
the absence of the retired narrative reports (proposal-review / apply-report / verification)
as a signal; those exist only on legacy changes without `change.md`.

| Signal | Meaning |
|---|---|
| `.chaos/` missing | likely uninitialized |
| `.chaos/context.md` + `.chaos/constitution.md` exist | initialized |
| fresh `.chaos/status-report.md` with READY/STRONG | ready for proposal |
| `.chaos/changes/<id>/change.md` exists | current model (any mode): read frontmatter lifecycle + §Review/§Delivery first |
| `.chaos/changes/<id>/lifecycle.md` exists | generated view of `chaosMetadata.lifecycle` — it carries no next-command field; derive next command from `lifecycle.status` + the `phases` block (Framed → review, Approved → apply, Delivered → verify, Archived → terminal) |
| `openspec/changes/<id>/proposal.md` exists | proposal exists |
| `change.md` present: §Review verdict missing / status `Framed` | review likely next |
| `change.md` present: §Delivery missing / status `Approved` | apply likely next |
| `change.md` present: status `Delivered`/`Rejected` | change already terminal — optional post-hoc verify, sync/retro housekeeping at most |
| no `change.md` (legacy change): `proposal-review.md` missing | review likely next |
| no `change.md` (legacy change): `apply-report.md` missing | apply likely next |
| no `change.md` (legacy change): `verification.md` missing | verify likely next |
| no `change.md` (legacy change): `archive-report.md` missing | archive likely next |
| archive report exists but sync missing/stale | `chaos:sync --change <id>` likely next |
| sync exists but retro missing and retro recommended | retro likely next |

## Confidence

Every next-command recommendation must include confidence:

```text
HIGH   -> direct artifact evidence found
MEDIUM -> partial artifact evidence found
LOW    -> inferred from weak or stale signals
```

If multiple active changes exist, ask the user to choose which change to inspect before recommending a lifecycle command.
