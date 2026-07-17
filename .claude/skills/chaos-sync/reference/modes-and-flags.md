# Modes and Flags

## Modes

### `--light`

Use for small or low-risk sync.

- Ask only high-impact questions.
- Permit deferrals with rationale.
- Apply safe index updates with confirmation.
- Do not create ADRs unless explicitly requested.

### `--standard`

Default.

- Full drift detection across selected scope.
- Reconcile material decision events.
- Confirm semantic governance updates.
- Update indexes after creating artifacts.

### `--strict`

High-governance sync.

- Blocks on unclassified material decisions.
- Requires source traceability.
- Requires rule/gate quality checks.
- Requires exact planned patch preview.
- Does not allow vague deferrals.

## Scope flags

Scope flags carry a **role level** (see `change-scope-and-roles.md`):

- `--change <change-id>` *(contributor-safe)*: sync around one OpenSpec/CHAOS
  lifecycle; reconciles only `.chaos/changes/<change-id>/` and writes
  `.chaos/changes/<change-id>/sync-report.md`. Must not silently edit shared governance.
- `--all` *(repo-owner-only)*: full repository-wide governance reconciliation. Requires
  the maintainer confirmation gate and writes `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md`.
- `--adrs` *(maintainer)*: ADR-focused sync.
- `--openspec`: OpenSpec-focused sync.
- `--decisions`: decision event promotion only.
- `--rules` *(maintainer)*: rule consistency only.
- `--gates` *(maintainer)*: gate consistency only.
- `--agents` *(maintainer)*: AGENTS.md / command parity sync.
- `--since <git-ref-or-date>` *(maintainer)*: limit source discovery; typically
  `--since main` before PR completion or after merge.

## Repository-wide sync gate (`--all`)

Before reconciling, `--all` must show the dashboard and ask the maintainer
confirmation question (Yes / No-switch-to-`--change` / Dry-run / Stop). In `--strict`,
lack of confirmation blocks. In `--dry-run`, confirmation is not required because no
files change. `--yes` must not bypass this gate.

## Behaviour flags

- `--dry-run`: no file writes. Produce planned actions only.
- `--yes`: apply safe, already-selected non-semantic actions without repeated confirmation. Never bypass semantic governance decisions.

## Config-specific mode behaviour

- `--light`: report config drift and ask only high-impact questions.
- `--standard`: reconcile material config drift one-by-one before semantic file updates.
- `--strict`: block on unsupported config versions, conflicting configured paths, or unclassified protected-file policy conflicts.
- `--dry-run`: show config patch preview but do not write.
- `--yes`: may apply already-selected safe config/index updates, but never semantic config policy changes without explicit prior selection.
