# CHAOS Todo Status Model

## Statuses

| Status | Meaning |
|---|---|
| `open` | Actionable, not started, source evidence confirmed. |
| `in-progress` | Work has started (recorded via `--update`). |
| `blocked` | Cannot proceed; blocked by another item, decision, or external dependency. |
| `needs-decision` | Requires a human/maintainer decision before work can proceed. |
| `deferred` | Explicitly postponed with a rationale, not abandoned. |
| `done` | Closure criteria met. |
| `wont-do` | Explicitly rejected; kept for audit trail, not re-surfaced. |
| `superseded` | Replaced by another todo item (record the superseding `id`). |
| `stale` | Source evidence could not be reconfirmed (see below); needs re-triage. |

## Transitions

```text
open -> in-progress -> done
open -> blocked -> open | needs-decision
open -> needs-decision -> open | deferred | wont-do
open -> deferred -> open | wont-do
open -> stale -> open (evidence found) | wont-do | superseded
any (except done/wont-do/superseded) -> superseded
```

`done`, `wont-do`, and `superseded` are terminal: reaching them sets `closedAt`. Reopening a
terminal item (`--reopen <todo-id>`) clears `closedAt`, sets status back to `open`, and appends
a `## History` entry with rationale.

## `--close <todo-id>`

Ask which terminal status applies (`done | wont-do | superseded`) unless already unambiguous
from context (e.g. the user says "close as won't do"). Set `closedAt`, append a `## History`
entry. Closing a repository-level (non-`current-change`) todo is maintainer-sensitive — see
`todo-write-policy.md`.

## `--reopen <todo-id>`

Only valid from a terminal status. Set status to `open`, clear `closedAt`, append a `##
History` entry with rationale. Re-run the evidence check before leaving it `open`.

## `--update <todo-id>`

Updates non-status fields (owner, priority, target, nextStep, closureCriteria) or moves to
`in-progress`/`blocked`/`needs-decision`/`deferred`. Always append a `## History` entry noting
what changed and why. `lastSeenAt` is refreshed.

## Stale detection (`--strict`)

`chaos:todo --strict` validates every `open`/`in-progress`/`blocked`/`needs-decision` item still
resolves to its `sourceArtifacts` (file exists) and, where `sourceIds` are given, that the
referenced ID is still present in that artifact. If not:

- mark the item `stale` (do not delete it, do not silently keep it `open`);
- surface it in the dashboard "Stale items" count and the HTML "Stale items" section;
- ask (one at a time, for material/repository-level items) whether to re-link evidence,
  re-classify as `wont-do`/`superseded`, or leave `stale` pending investigation.

`--standard` reports likely-stale items as a warning without demoting them automatically.
`--light` does not run stale detection (see `todo-command-contract.md` mode table).

## Related

- `todo-item-schema.md`
- `todo-write-policy.md`
