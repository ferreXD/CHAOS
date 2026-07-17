# CHAOS Todo Item Schema

Defines the durable todo item: physical file location, filename policy, frontmatter shape,
required fields, and body structure. Markdown item files under `.chaos/todo/items/` are the
**source of truth**. Generated HTML views are digests, never source of truth.

## Physical location and filename policy

```text
.chaos/todo/items/YYYY-MM-DD-<slug>.md
```

- Date-prefixed, slug-based filenames only (per
  `.github/skills/chaos-shared/reference/artifact-naming-policy.md`).
- **Never** use a sequential ID (`TODO-001`) as the physical filename.
- The date prefix is the item's `createdAt` date, not `lastSeenAt`.
- The slug is a short kebab-case rendering of the title (e.g.
  `2026-07-01-create-public-readme.md`).

## Durable ID policy

The stable, auditable `id` field (frontmatter, not filename) is:

```text
TODO-YYYY-MM-DD-<slug>
```

- Stable once assigned; do not renumber when other items close or when sequential display
  order changes in generated HTML views.
- Sequential display numbers (`#1`, `#2`, …) may appear only in generated HTML views/index
  ordering — never as the durable `id` or the physical filename.

## Frontmatter shape

Two frontmatter blocks: `chaosMetadata` (shared CHAOS provenance, same shape as every other
CHAOS Markdown artifact) and `todo` (item-specific fields).

```yaml
---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null                # or the change id when scope: current-change
  sourceCommand: chaos:todo
  lastWrittenAt: "<iso-8601-with-offset>"
  lastWrittenBy: <resolved-user-or-unknown>
  lastAuditedAt: "<iso-8601-with-offset>"
  lastAuditedBy: <resolved-user-or-unknown>
  repositoryContext:
    provider: <github | azure-devops | local-git | unknown>
    branch: <branch-or-unknown>
    reviewRequest: null
    contextSource: <mcp | cli | git | unknown>
    confidence: <HIGH | MEDIUM | LOW>
  metadata:
    identitySource: <provider | git-config | configured-alias | unknown>
    timestampSource: local-system
    confidence: <HIGH | MEDIUM | LOW>

todo:
  id: TODO-YYYY-MM-DD-<slug>
  title: <short imperative title>
  status: open | in-progress | blocked | needs-decision | deferred | done | wont-do | superseded | stale
  priority: BLOCKER | HIGH | MEDIUM | LOW
  target: current-change | internal-alpha | public-alpha | beta | v1 | vNext | later
  type: documentation | implementation | adapter | sanitization | governance | hook | mcp | test | decision | research | cleanup
  scope: repository | current-change
  owner: <name-or-TBD>
  sourceArtifacts:
    - <path>
  sourceIds:
    - <F-01 | RM-001 | VFY-001 | ...>
  relatedChanges:
    - <change-id>
  relatedRoadmapItems:
    - <RM-id>
  relatedFindings:
    - <F-id or other finding id>
  nextStep: <one-line next action>
  recommendedCommand: <chaos command or "none">
  closureCriteria:
    - <criterion>
  knowledgeType: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
  confidence: HIGH | MEDIUM | LOW
  createdAt: "<iso-8601-with-offset>"
  lastSeenAt: "<iso-8601-with-offset>"
  closedAt: null
---
```

## Required field notes

- `sourceArtifacts` / `sourceIds` are **required** for `status: open` items — see
  `todo-write-policy.md` (`requireSourceEvidence`). An item with no resolvable source artifact
  cannot be created or kept open; `chaos:todo --strict` demotes/flags such items as `stale`.
- `lastSeenAt` updates every time `chaos:todo --scan` / `--refresh` re-confirms the source
  evidence still exists. It does not update on cosmetic HTML regeneration.
- `closedAt` is set only when `status` becomes `done`, `wont-do`, or `superseded`.
- `relatedChanges` / `relatedRoadmapItems` / `relatedFindings` may be empty arrays but the key
  should be present for traceability tooling.
- `owner: TBD` is valid; do not invent an owner.

## Body structure

After the frontmatter, the human-readable body is free-form Markdown but must include, in
order:

```markdown
# TODO — <title>

## Why this exists

<1-3 sentences tying the item to its source evidence>

## Source Evidence

- <source id> — <one-line description>
- ...

## Next Action

<concrete next step>

## Recommended Command

<chaos command, or "No specific CHAOS command required.">

## Closure Criteria

- <criterion>
- ...
```

Optional trailing sections: `## History` (status changes, e.g. `--close`/`--reopen`/`--update`
events with date + rationale) and `## Notes`.

## Example

See `todo-examples.md` for a fully worked example item file
(`2026-07-01-create-public-readme.md`, sourced from `F-01`/`RM-001`).

## Related

- `todo-candidate-contract.md` — how a candidate becomes an item.
- `todo-status-model.md` — status transitions.
- `todo-write-policy.md` — when an item may be created/updated/closed.
- `.github/skills/chaos-shared/reference/artifact-naming-policy.md`
