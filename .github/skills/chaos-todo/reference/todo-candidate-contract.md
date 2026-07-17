# CHAOS Todo Candidate Contract

A **candidate** is a not-yet-durable observation that might become a todo item. Candidates are
produced two ways:

1. Internally, while `chaos:todo` scans evidence sources (`todo-source-contract.md`).
2. Externally, as an optional **Todo Candidates** section emitted by another CHAOS command's
   own report (`chaos:status`, `chaos:doctor`, `chaos:archaeology`, `chaos:propose`,
   `chaos:review`, `chaos:apply`, `chaos:code-review`, `chaos:verify`, `chaos:archive`,
   `chaos:sync`, `chaos:retro`). `chaos:todo` reads those sections as an additional source.

Only `chaos:todo` writes durable todo item files. Every other command stops at "candidate."

## Candidate fields

| Field | Meaning |
|---|---|
| `title` | Short imperative title. |
| `sourceArtifactPath` | Path to the artifact the candidate was extracted from. |
| `sourceIds` | Finding/roadmap/verification IDs if present (`F-01`, `RM-001`, `VFY-001`, `CR-DEC-*`, ...). |
| `sourceKind` | `finding \| roadmap-promotion \| sync-debt \| accepted-risk \| waiver \| unresolved-decision \| missing-evidence \| missing-test \| missing-doc \| deferred-work \| hook-violation \| doctor-warning \| code-review-finding \| todo-fixme-marker` |
| `recommendedPriority` | `BLOCKER \| HIGH \| MEDIUM \| LOW` |
| `target` | `current-change \| internal-alpha \| public-alpha \| beta \| v1 \| vNext \| later` |
| `type` | `documentation \| implementation \| adapter \| sanitization \| governance \| hook \| mcp \| test \| decision \| research \| cleanup` |
| `scope` | `repository \| current-change` |
| `owner` | Known owner, or absent. |
| `nextAction` | One-line next step. |
| `recommendedCommand` | A CHAOS command to run next, if any. |
| `closureCriteria` | List of concrete done-conditions. |
| `knowledgeType` | `FACT \| INFERENCE \| ASSUMPTION \| UNKNOWN \| CONFLICT` |
| `confidence` | `HIGH \| MEDIUM \| LOW` |

A candidate without a resolvable `sourceArtifactPath` (and, where applicable, `sourceIds`)
cannot be promoted to a durable item — see `todo-write-policy.md`.

## Shared "Todo Candidates" report section

Any CHAOS command's report MAY end with this optional section. It is descriptive only — it
does not create a durable backlog entry.

```markdown
## Todo Candidates

> Optional. Present only when this run surfaced material, actionable follow-up work. This
> command does not create durable todo items — run `chaos:todo` to curate the backlog.

| Title | Source ID(s) | Kind | Priority | Target | Type | Next action | Knowledge type | Confidence |
|---|---|---|---|---|---|---|---|---|
| <title> | <ids> | <kind> | <priority> | <target> | <type> | <next action> | <knowledge type> | <confidence> |
```

Omit the section entirely when a run produced no material candidates. Do not pad it with
routine advisory noise (see "What counts as material" below).

## What counts as material (guardrail)

Not every finding, warning, or open question is a todo candidate. Emit a candidate only when
**all** of the following hold:

- it names a concrete, actionable next step (not "investigate further" with no direction);
- it is not already fully tracked by an existing open todo, roadmap item, or lifecycle
  decision-event with a clear owner/next-step;
- it is not a routine, expected, per-run advisory (e.g. "MCP not configured" from
  `chaos:doctor` in standard mode is expected/optional, not a candidate by default — promote it
  only if repeated, severe, or the user explicitly asks);
- closing it would move the repository, change, or release measurably forward.

`chaos:todo` itself re-applies this guardrail before writing durable items — an emitted
candidate is still subject to deduplication and evidence checks in `chaos:todo`.

## Do not

- Do not make every warning a todo candidate.
- Do not turn every command into a todo writer (only `chaos:todo` writes `.chaos/todo/items/`).
- Do not fabricate `sourceIds` — omit the field rather than invent an ID.
- Do not promote routine runtime/hook events automatically (see `todo-source-contract.md`).

## Related

- `todo-source-contract.md`
- `todo-item-schema.md`
- `todo-deduplication-policy.md`
- `todo-write-policy.md`
