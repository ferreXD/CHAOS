# CHAOS Artifact Naming Policy

Shared, Claude-facing naming policy for **newly generated governance artifacts**.
Machine-readable form: `.chaos/config.yaml` (`policies.artifactNaming`).

## Rule

Newly generated governance artifact **physical filenames** use a date prefix plus a slug,
not sequential IDs.

```text
docs/adr/2026-06-26-module-packaging-strategy.md
docs/decision-log/2026-06-26-test-assertion-library.md
.chaos/decisions/2026-08-06-picking-duplicate-scan.md
docs/adr/2026-08-06-adr-completion-payload-guard.md
```

Format: `YYYY-MM-DD-<slug>.md` (see `config.yaml` `policies.artifactNaming.dateFormat`
and `requireSlug`).

## Sequential IDs are display-only

Sequential IDs such as `ADR-0015`, `R-022`, and `G-010` belong in **indexes and
human-readable display references only**. They must **not** be used as the primary
physical filename for newly generated artifacts.

- Never create a new physical artifact whose primary filename is a sequential ID.
- Sequential **display** IDs live only in indexes (`.chaos/decisions/index.md`, the ADR
  index) and are assigned when an index entry is added.

## Who applies this

- `chaos:run` / `chaos:resume`: decision records are written as
  `.chaos/decisions/<YYYY-MM-DD>-<slug>.md`; ADR drafts and amendments recommended during a
  run use date-prefixed, slug-based filenames. Sequential display IDs are assigned only in
  the index entry added in the same change.
- `chaos:init`: seeds the decision-record index and (if present) the ADR index with this
  convention.

## Related

- `model-robustness-policy.md`
