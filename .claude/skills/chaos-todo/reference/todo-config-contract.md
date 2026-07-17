# CHAOS Todo Config Contract

`chaos:todo` reads `.chaos/config.yaml` before scanning or writing. It does not edit config
(config drift routes to `chaos:status`/`chaos:sync` like every other command).

## Required config additions

```yaml
paths:
  todo: .chaos/todo
  todoItems: .chaos/todo/items
  todoViews: .chaos/todo/views

policies:
  todo:
    defaultWriteMode: confirm
    requireSourceEvidence: true
    dedupeBeforeWrite: true
    allowGlobalTodoWritesForContributors: false
    maintainerConfirmationRequiredForAllWrite: true
    scanCodeMarkers: false
    htmlViews:
      enabled: true
      selfContained: true
      externalAssetsAllowed: false
      regenerateOnlyWhenSourcesChange: true
```

## Field semantics

| Field | Meaning |
|---|---|
| `paths.todo` | Root of the todo workspace. |
| `paths.todoItems` | Durable Markdown item files (source of truth). |
| `paths.todoViews` | Generated static HTML views (digest only). |
| `policies.todo.defaultWriteMode` | `confirm` (default) — always ask before writing unless `--write`/`--dry-run` given. |
| `policies.todo.requireSourceEvidence` | An item cannot be created/kept open without a resolvable source artifact. |
| `policies.todo.dedupeBeforeWrite` | Run dedup before every write. |
| `policies.todo.allowGlobalTodoWritesForContributors` | `false` by default — repository-level writes are maintainer-sensitive. |
| `policies.todo.maintainerConfirmationRequiredForAllWrite` | Gate for repository-wide writes (see `todo-write-policy.md`). |
| `policies.todo.scanCodeMarkers` | Opt-in TODO/FIXME code-comment scanning (default off). |
| `policies.todo.htmlViews.enabled` | Whether HTML views are generated at all. |
| `policies.todo.htmlViews.selfContained` | HTML must be self-contained (inline CSS, no external assets). |
| `policies.todo.htmlViews.externalAssetsAllowed` | Must stay `false`. |
| `policies.todo.htmlViews.regenerateOnlyWhenSourcesChange` | Skip HTML regeneration when no item file changed, unless `--refresh` is explicit. |

## Missing / partial config

- `--light`: infer the defaults above, warn once, proceed.
- `--standard`: infer defaults, warn, recommend `chaos:status`/`chaos:init` to add the missing
  section.
- `--strict`: ask whether to continue with inferred paths/policies or stop, since a missing
  `policies.todo` section affects write-safety guarantees (evidence requirement, dedupe, the
  maintainer gate). One decision, STOP.

## Do not

- Do not edit `.chaos/config.yaml` from `chaos:todo`. Report drift; route fixes to
  `chaos:status` / `chaos:sync` / `chaos:init` (for new-repo defaults).
- Do not duplicate an existing config section — additions are new keys only.

## Related

- `.chaos/config.yaml`
- `.claude/skills/chaos-init/reference/config-contract.md` (bootstrap defaults for new repos)
- `todo-write-policy.md`
