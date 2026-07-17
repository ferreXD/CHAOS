# CHAOS Todo ↔ Roadmap Bridge

## Relationship

- Roadmap (`.chaos/roadmap/*.md`, produced by roadmap/audit work) is **strategic/release-level**:
  what release/product direction is intended.
- Todo (`.chaos/todo/items/*.md`, produced by `chaos:todo`) is **operational/action-level**:
  what concrete work is pending right now.
- A roadmap item may produce **one or more** todos. A todo always traces back to zero or more
  roadmap items via `relatedRoadmapItems`.
- `chaos:todo` never mutates roadmap files. It only reads them and references their IDs
  (`sourceIds`, `relatedRoadmapItems`).

## `chaos:todo --from-roadmap`

Read the configured roadmap path(s) (`.chaos/roadmap/*.md` by default). Show how many roadmap
promotion rows (`RM-*`) were found, grouped by target (public-alpha / v1 / vNext / later), then
ask exactly this decision and STOP:

```text
Decision required: Import roadmap items into the todo backlog

Context: <N> roadmap promotions found in <path(s)>, grouped:
public-alpha: <n> · v1: <n> · vNext: <n> · later: <n>

Options:
1. Import one todo per roadmap item
2. Split roadmap items into smaller actionable todos
3. Import only blockers
4. Dry-run only
5. Stop

Select one option to continue.
```

- **Option 1** — one todo item per `RM-*` row, `sourceIds: [RM-xxx]` plus any `F-*` findings the
  roadmap row cites, `target`/`priority` copied from the roadmap row.
- **Option 2** — for roadmap rows that bundle multiple concerns (e.g. "RM-005 sanitize +
  fix F-07 + fix F-15 + define packaging boundary"), propose splitting into multiple todos with
  narrower closure criteria; confirm the split list with the user before writing (this is
  itself a second, smaller decision if the split is non-obvious — otherwise proceed once
  option 2 is chosen).
- **Option 3** — import only rows whose `priority: BLOCKER`.
- **Option 4** — show the would-be import list, write nothing.
- **Option 5** — stop.

Run deduplication (`todo-deduplication-policy.md`) against existing open items before writing
any imported todo — a roadmap item already tracked by an open todo should update that todo, not
duplicate it.

## Traceability

Every todo item created from a roadmap import must carry:

- `sourceArtifacts`: the roadmap file path(s) (e.g. `.chaos/roadmap/roadmap.md`,
  `.chaos/roadmap/oss-readiness-audit-2026-07-01.md`);
- `sourceIds`: the `RM-*` id and any `F-*` ids it references;
- `relatedRoadmapItems`: the `RM-*` id(s).

## Do not

- Do not mark a roadmap row as "done" or edit `.chaos/roadmap/*.md` from `chaos:todo` — closing
  the corresponding todo item is the record of completion; roadmap file updates (if ever
  needed) are out of scope for this command.
- Do not invent roadmap items that don't exist in the roadmap file.

## Related

- `todo-deduplication-policy.md`
- `todo-item-schema.md`
- `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`
