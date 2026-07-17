# `chaos:code-review` Output Contract

## Required outputs

Change-scoped review (`<change-id>` known):

```text
.chaos/changes/<change-id>/code-review.md
```

Also update, with confirmation:

```text
.chaos/changes/<change-id>/lifecycle.md          # Last updated + Code Review note
.chaos/changes/<change-id>/decision-events.md    # when CR-DEC-* recorded
```

Non-change-scoped review (PR / since / scope / staged / working):

```text
.chaos/code-reviews/YYYY-MM-DD-<slug>-code-review.md
```

`--dry-run` and `--no-write` keep the review report-only (chat). Neither edits code.

## Layout & naming rules

- Resolve the base path from `.chaos/config.yaml` (`paths.changes`, `paths.codeReviews`)
  before defaults. See `config-awareness.md`.
- Non-change reports use **date-prefixed, slug-based** filenames (no sequential-ID
  filenames). See `.github/skills/chaos-shared/reference/artifact-naming-policy.md`.
- New artifacts target the change-scoped layout; legacy folders are read-only for
  compatibility and are not migrated. See
  `.github/skills/chaos-shared/reference/change-scoped-artifact-layout.md`.

## Report contract

Use `reference/report-template.md`. The report must include: metadata, resolved scope/mode,
authorities loaded (and caps), CHAOS final verdict with confidence/evidence-coverage/
assumption-load, findings classified with CHAOS severity + knowledge type + confidence,
the remediation-routing log, `CR-DEC-*` decision events, positive observations, config
context, and the next command.

## Open items policy

Resolve material decisions with the user at runtime (one at a time, STOP after each). Only
record an open item when the user defers it, it needs external context, or the command runs
non-interactively. Open items carry a sync action, not a bare question.
