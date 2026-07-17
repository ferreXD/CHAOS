# Guided Amendment Policy

`chaos:review` may help the user fix proposal issues on the fly, but only within OpenSpec/CHAOS artefacts and only after explicit confirmation.

## Allowed amendments

| Artefact | Allowed? | Notes |
|---|---:|---|
| `proposal.md` | Yes | Scope, goals, non-goals, rationale, risks. |
| `design.md` | Yes | Design constraints, selected approach, alternatives. |
| `specs/**` | Yes | Observable behaviour, acceptance criteria, requirements. |
| `tasks.md` | Yes | Implementation tasks, validation tasks, sequencing. |
| `.chaos/changes/<change-id>/proposal-review.md` | Yes | Review report and decision events (v0 layout; legacy `.chaos/reviews/**` read-only for compat). |
| `.chaos/changes/<change-id>/approval.md` | Conditional | Only after explicit approval handoff confirmation (legacy `.chaos/approvals/**` read-only for compat). |
| Production/source code | No | Use `chaos:apply` after review/approval. |

## Runtime options

When an issue can be amended, offer:

```text
Options:
1. Apply suggested OpenSpec amendment now
2. Provide custom amendment text
3. Defer with rationale
4. Mark accepted risk and continue
5. Keep issue unresolved/blocking
6. Stop review
```

## Strict mode guardrails

In `--strict`:

- Blocking issues cannot be converted to accepted risk unless the issue type explicitly allows a waiver and the final verdict reflects the waiver.
- ADR conflicts require governance decision/ADR handling; do not paper over them with tasks.md edits.
- Missing required archaeology for confirmed brownfield work remains blocking unless explicitly waived, and confidence must be downgraded.

## No silent patching

Before editing any OpenSpec artefact, show:

```text
I will update:
- <path>

Change summary:
- <summary>

Proceed?
```

## Re-evaluation requirement

After any patch:

- re-read the changed file;
- re-run relevant checks where possible;
- update finding status;
- update final verdict/confidence.
