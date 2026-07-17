# CHAOS Artifact Naming Policy

Shared, Copilot-facing naming policy for **newly generated governance artifacts**.
Machine-readable form: `.chaos/config.yaml` (`policies.artifactNaming`).

## Rule

Newly generated governance artifact **physical filenames** use a date prefix plus a slug,
not sequential IDs.

```text
docs/adr/2026-06-26-module-packaging-strategy.md
docs/decision-log/2026-06-26-test-assertion-library.md
.chaos/rules/2026-06-26-test-assertion-library-policy.md
.chaos/gates/2026-06-26-test-task-coverage-gate.md
```

Format: `YYYY-MM-DD-<slug>.md` (see `config.yaml` `policies.artifactNaming.dateFormat`
and `requireSlug`).

## Sequential IDs are display-only

Sequential IDs such as `ADR-0015`, `R-022`, and `G-010` belong in **indexes and
human-readable display references only**. They must **not** be used as the primary
physical filename for newly generated artifacts.

- Never create a new physical artifact whose primary filename is a sequential ID.
- `chaos:sync` may assign or normalize sequential **display** IDs when it promotes or
  updates the relevant index (`.chaos/decisions/index.md`, `.chaos/rules/index.md`,
  `.chaos/gates/index.md`, ADR index).

## Who applies this

- `chaos:propose`, `chaos:review`, `chaos:apply`, `chaos:verify`, `chaos:archive`,
  `chaos:retro`: when they *recommend* ADR/decision-log/rule/gate drafts, the recommended
  physical filename must be date-prefixed and slug-based. They do not assign sequential
  display IDs and do not edit shared indexes directly.
- `chaos:sync`: promotes date-prefixed drafts into indexes and assigns/normalizes
  display-only sequential IDs there, after one-by-one reconciliation and patch preview.

## Related

- `change-scoped-artifact-layout.md`
- `model-robustness-policy.md`
