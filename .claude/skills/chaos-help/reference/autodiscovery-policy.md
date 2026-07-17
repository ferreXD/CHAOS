# Autodiscovery Policy

`chaos:help` must be autodiscoverable and repository-aware.

## Preferred sources

1. `.chaos/commands/index.md`
2. `.chaos/changes/README.md` (per-change layout + team concurrency policy)
3. `.chaos/changes/<change-id>/lifecycle.md` (per-change lifecycle manifests)
4. `.chaos/workflow-map.md`
5. `.chaos/status-report.md`
6. OpenSpec folders
7. CHAOS lifecycle report folders (per-change folder first; legacy folders read-only)
8. installed Claude/Copilot command files
9. `AGENTS.md` and workflow README files

## State discovery signals

Resolve change-scoped artifacts under `.chaos/changes/<change-id>/` first; fall back to
legacy scattered folders only for read-compatibility.

| Signal | Meaning |
|---|---|
| `.chaos/` missing | likely uninitialized |
| `.chaos/context.md` + `.chaos/constitution.md` exist | initialized |
| fresh `.chaos/status-report.md` with READY/STRONG | ready for proposal |
| `.chaos/changes/<id>/lifecycle.md` exists | read its `Current Next Command` first |
| `openspec/changes/<id>/proposal.md` exists | proposal exists |
| `.chaos/changes/<id>/proposal-review.md` missing | review likely next |
| `.chaos/changes/<id>/apply-report.md` missing | apply likely next |
| `.chaos/changes/<id>/verification.md` missing | verify likely next |
| `.chaos/changes/<id>/archive-report.md` missing | archive likely next |
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
