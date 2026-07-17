# Chat-First Dashboard UX

Before asking decision questions or editing files, print a dashboard in chat.

Required dashboard fields:

```md
## CHAOS Sync Dashboard

Scope: <scope>
Role level: <contributor-safe | maintainer | repo-owner>
Sync report target: <.chaos/changes/<id>/sync-report.md | .chaos/sync-reports/repo-sync-YYYY-MM-DD.md | .chaos/sync-reports/<scope-or-date>-sync-report.md>
Mode: <mode>
OpenSpec active changes: <n>
OpenSpec archived changes since last sync: <n>
New/changed ADRs: <n>
Decision events requiring classification: <n>
ADR candidates: <n>
Decision-log candidates: <n>
Rule updates suggested: <n>
Gate updates suggested: <n>
AGENTS.md / AGENT.md drift: <none|minor|major|blocked-by-policy>
README.md drift: <none|minor|major|blocked-by-policy>
Command index drift: <yes/no>
Protected-doc updates suggested: <n>
Protected-doc rewrite suggested: <yes/no>
Sync debt detected: <n>
Recommended outcome: <verdict>
Confidence: <HIGH|MEDIUM|LOW>
```

Then ask:

```text
Proceed to decision reconciliation?
1. Review decisions one by one
2. Apply only safe index updates
3. Dry-run only
4. Stop
```

Do not continue into a decision loop before the dashboard has been shown.

## Repository-wide sync gate (`--all`)

When scope is `--all`, after the dashboard and before any reconciliation, ask the
maintainer confirmation question:

```text
chaos:sync --all is a repository-wide governance reconciliation command.
It may update shared CHAOS governance artifacts such as decisions, rules, gates,
AGENTS.md, README.md, ADR drafts, and decision logs.

Are you acting as the repository owner or designated CHAOS maintainer?

1. Yes, continue and record maintainer confirmation.
2. No, switch to chaos:sync --change <change-id>.
3. Dry-run only.
4. Stop.
```

- In `--strict`, lack of maintainer confirmation blocks repository-wide sync.
- In `--dry-run`, no confirmation is required (no files change).
- `--yes` must not bypass this gate. Record the outcome in the sync report.
