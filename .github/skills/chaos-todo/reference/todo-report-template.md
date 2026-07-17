# CHAOS Todo Dashboard & Index Templates

## Chat-first dashboard (shown before any decision)

```markdown
## CHAOS Todo Dashboard

Open blockers: <n>
Public-alpha blockers: <n>
v1 blockers: <n>
Stale items: <n>
Duplicate candidates: <n>
Items needing owner decision: <n>

Recommended next:

1. <item title>
2. <item title>
3. <item title>

Write/update todo backlog and HTML views?

1. Yes, write proposed updates
2. Dry-run only
3. Show details
4. Stop
```

Show this dashboard before any write decision, in every mode. In `--light`, the counts may be
derived only from the existing index + latest status/doctor report (no deep scan) — say so.

## `.chaos/todo/index.md` structure

`index.md` is a durable repository index (Markdown is acceptable here — only the *digest views*
must be HTML). It should not become the sole source of truth; item files remain authoritative
for full detail.

```markdown
---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-index
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "<iso-8601>"
  lastWrittenBy: <resolved-user-or-unknown>
  lastAuditedAt: "<iso-8601>"
  lastAuditedBy: <resolved-user-or-unknown>
  repositoryContext:
    provider: <github | azure-devops | local-git | unknown>
    branch: <branch>
    reviewRequest: null
    contextSource: <mcp | cli | git | unknown>
    confidence: <HIGH | MEDIUM | LOW>
  metadata:
    identitySource: <provider | git-config | configured-alias | unknown>
    timestampSource: local-system
    confidence: <HIGH | MEDIUM | LOW>
---

# CHAOS Todo Index

> Durable index of todo items. Full detail lives in each item file under
> `.chaos/todo/items/`. Human digest views (HTML) are generated at
> `.chaos/todo/views/` and `.chaos/todo/todo-report-YYYY-MM-DD.html`.

| Todo ID | Title | Status | Priority | Target | Type | Owner | Item file |
|---|---|---|---|---|---|---|---|
| TODO-2026-07-01-create-public-readme | Create canonical public README and positioning | open | BLOCKER | public-alpha | documentation | TBD | `items/2026-07-01-create-public-readme.md` |
```

Sequential display order in this table (or in generated HTML) is presentation-only; the durable
identity is always the `Todo ID` column value, never a row number.

## Related

- `todo-html-view-contract.md` — the HTML digest views generated from this index + item files.
- `todo-command-contract.md` — when the dashboard is shown and what happens after each option.
