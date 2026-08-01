# Next Command Policy

`chaos:help next` recommends the next useful command. It does not execute it.

## Use the lifecycle manifest when available

When a change id is known and `.chaos/changes/<change-id>/lifecycle.md` exists, read it
first. It is a **generated view** of `change.md` frontmatter (`chaos-shared/reference/change-template.md`
§3) and carries no next-command field: derive the recommendation from its `Status` plus the phase
table — `Framed` → review, `Approved` → apply, `Delivered` → verify, `Archived` → terminal — treating
the first `Pending` phase as the next step. That is the highest-priority signal. Fall back to artifact
presence (per-change folder first, then legacy scattered folders) only when the view is missing.
Canonical layout: `.chaos/changes/README.md`.

## Recommendation format

```md
## Recommended Next Command

Command:
`chaos:review <change-id> --standard`

Confidence: HIGH

Reason:
- OpenSpec change exists.
- Proposal review report is missing.
- Implementation should not start before proposal review.

Alternatives:
- `chaos:propose <intent>` if the existing change is not the intended work.
- `chaos:status` if the workspace state feels stale.
```

## Priority order

1. If uninitialized -> `chaos:init`
2. If initialized but not audited/stale -> `chaos:status`
3. If brownfield change intent is known but evidence missing -> `chaos:archaeology`
4. If no active change and workspace ready -> `chaos:propose`
5. If proposal exists and review missing -> `chaos:review`
6. If review permits implementation and apply missing -> `chaos:apply`
7. If apply exists and verification missing -> `chaos:verify`
8. If verification permits closure and archive missing -> `chaos:archive`
9. If archive exists and sync debt exists -> `chaos:sync --change <change-id>`
10. If retro recommended and missing -> `chaos:retro <change-id>`

## Important nuance

`chaos:archaeology` is optional and context-driven. Recommend it when:

- brownfield migration
- unclear current behavior
- legacy side effects
- persistence/data-flow risk
- auth/security/replay/idempotency risk
- user asks to understand existing behavior

Do not require it for new/greenfield work.
