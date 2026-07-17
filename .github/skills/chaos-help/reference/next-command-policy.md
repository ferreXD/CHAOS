# Next Command Policy

`chaos:help next` recommends the next useful command. It does not execute it.

## Use the lifecycle manifest when available

When a change id is known and `.chaos/changes/<change-id>/lifecycle.md` exists, read it
first. Its `Current Next Command`, phase checklist, and `Status` are the highest-priority
signal for the recommendation. Fall back to artifact presence (per-change folder first,
then legacy scattered folders) only when the manifest is missing. Canonical layout:
`.chaos/changes/README.md`.

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
