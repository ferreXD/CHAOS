# CHAOS Todo Examples

Worked examples using a repository's own evidence
(`.chaos/roadmap/oss-readiness-audit-2026-07-01.md`, `.chaos/roadmap/roadmap.md`).

## Example 1 — full item file

`.chaos/todo/items/2026-07-01-create-public-readme.md`:

```markdown
---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-01T10:30:00+02:00"
  lastWrittenBy: <resolved-user-or-unknown>
  lastAuditedAt: "2026-07-01T10:30:00+02:00"
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
  id: TODO-2026-07-01-create-public-readme
  title: Create canonical public README and positioning
  status: open
  priority: BLOCKER
  target: public-alpha
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - F-01
    - RM-001
  relatedChanges: []
  relatedRoadmapItems:
    - RM-001
  relatedFindings:
    - F-01
  nextStep: Draft a public README covering what/who-for/who-not-for/OpenSpec relationship/maturity.
  recommendedCommand: none
  closureCriteria:
    - Public README exists.
    - README avoids universal-framework claims.
    - README includes fit / non-fit section.
    - README points to installation and demo docs.
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-01T10:30:00+02:00"
  lastSeenAt: "2026-07-01T10:30:00+02:00"
  closedAt: null
---

# TODO — Create canonical public README and positioning

## Why this exists

The OSS readiness audit found that CHAOS has no public-facing positioning document.

## Source Evidence

- F-01 — No public-facing positioning document exists
- RM-001 — Create canonical public README and positioning

## Next Action

Draft a public README that explains:

- what CHAOS is
- who it is for
- who it is not for
- relationship to OpenSpec
- current maturity and limitations

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Public README exists.
- README avoids universal-framework claims.
- README includes fit / non-fit section.
- README points to installation and demo docs.
```

## Example 2 — dashboard output

```markdown
## CHAOS Todo Dashboard

Open blockers: 4
Public-alpha blockers: 4
v1 blockers: 6
Stale items: 0
Duplicate candidates: 2
Items needing owner decision: 1

Recommended next:

1. Choose OSS license
2. Fix sanitization leaks
3. Draft public README

Write/update todo backlog and HTML views?

1. Yes, write proposed updates
2. Dry-run only
3. Show details
4. Stop
```

(This mirrors `.chaos/roadmap/roadmap.md`'s public-alpha blockers RM-001/RM-003/RM-005/RM-006 —
4 blockers — and v1 rows RM-009/RM-010/RM-007(full)/RM-011/RM-012/RM-013 — 6 items — as of
2026-07-01.)

## Example 3 — deduplicated import from `--from-roadmap`

Raw roadmap row `RM-005` ("Sanitize repository for public release (fix F-07 hardcoded org-name
default, F-15 username; define tool-vs-instance packaging boundary)") bundles three concerns.
Choosing option 2 ("split into smaller actionable todos") in the `--from-roadmap` decision
produces:

- `TODO-2026-07-01-fix-hardcoded-org-default-leak` — `sourceIds: [F-07, RM-005]`, `type: sanitization`.
- `TODO-2026-07-01-fix-hardcoded-username-leak` — `sourceIds: [F-15, RM-005]`, `type: sanitization`.
- `TODO-2026-07-01-define-tool-vs-instance-packaging-boundary` — `sourceIds: [RM-005]`,
  `type: governance`.

All three carry `relatedRoadmapItems: [RM-005]` so the HTML `by-change`/index views can still
show they trace back to one roadmap row.

## Example 4 — Copilot adapter dedup (see `todo-deduplication-policy.md` for the full walk-through)

`F-08`, `F-13`, `RM-011` collapse into one item (`type: adapter`); `RM-010` may stay a second,
broader item if the user chooses not to merge it. Never four unrelated items for one gap.

## Related

- `todo-item-schema.md`
- `todo-deduplication-policy.md`
- `todo-roadmap-bridge.md`
- `todo-report-template.md`
