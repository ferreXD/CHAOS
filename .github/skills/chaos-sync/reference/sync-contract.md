# Sync Contract

`chaos:sync` reconciles the living CHAOS workspace with:

- OpenSpec active and archived changes
- OpenSpec specs
- ADR files
- decision events from proposal/review/apply/verify/archive reports
- `.chaos/decisions/index.md`
- `.chaos/rules/index.md`
- `.chaos/gates/index.md`
- `.chaos/commands/index.md`
- `.chaos/context.md`
- `.chaos/architecture.md`
- `AGENTS.md` / `AGENT.md`
- root `README.md`
- installed Copilot command artifacts when visible

The command writes its report to a **scope-appropriate** location (see
`change-scope-and-roles.md`):

```text
chaos:sync --change <change-id>  ->  .chaos/changes/<change-id>/sync-report.md   (contributor-safe)
chaos:sync --all                 ->  .chaos/sync-reports/repo-sync-YYYY-MM-DD.md  (repo-owner-only)
chaos:sync <other scope>         ->  .chaos/sync-reports/<scope-or-date>-sync-report.md  (maintainer)
```

It may update governance files only after confirmation.

## Roles and contributor-safety

- `chaos:sync --change <change-id>` is **contributor-safe**: it reconciles only that
  change folder and must not silently edit shared governance. It may recommend
  promotions and route them to a maintainer/repo-owner sync.
- `--since/--adrs/--rules/--gates/--agents` are **maintainer-level**.
- `--all` is **repo-owner-only** and requires the maintainer confirmation gate (see
  `dashboard-ux.md` and `change-scope-and-roles.md`). In `--strict`, missing
  confirmation blocks; in `--dry-run`, confirmation is not required.

## Artifact naming during promotion

When `chaos:sync` promotes drafts into governance, physical filenames stay
date-prefixed and slug-based (`docs/adr/YYYY-MM-DD-<slug>.md`,
`docs/decision-log/YYYY-MM-DD-<slug>.md`, `.chaos/rules/YYYY-MM-DD-<slug>.md`,
`.chaos/gates/YYYY-MM-DD-<slug>.md`). Sequential display IDs (`ADR-0015`, `R-022`,
`G-010`) are assigned/normalized only inside indexes. Duplicate sequential IDs are
reconciled one by one under `--all`.

## Source-of-truth distinction

OpenSpec owns spec lifecycle mechanics.
CHAOS owns governance reconciliation.

`chaos:sync` may recommend or invoke OpenSpec sync when appropriate, but it must also reconcile ADRs, rules, gates, decisions, indexes, and agent instructions.

## Config reconciliation

`chaos:sync` is responsible for reconciling `.chaos/config.yaml` with repository reality when config drift is detected. Config updates are semantic governance updates: they require a chat-visible recommendation, one-by-one user decision, planned patch preview, and sync report entry.

## Protected documentation reconciliation

`chaos:sync` must reconcile protected documentation drift for:

- `AGENTS.md`;
- `AGENT.md` when present or configured;
- root `README.md`.

These files may be patched or rewritten after explicit confirmation, patch preview, and sync-report audit trail. Protected-file policy controls the interaction, not immutability.

If protected docs are stale, `chaos:sync` must propose one-by-one actions. If config blocks edits, offer a one-time protected-doc override with rationale or a config-policy update. `--yes` must not bypass this.
