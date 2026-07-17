# CHAOS Change-Scoped Artifact Layout

Shared, Claude-facing layout contract for change-scoped CHAOS commands. Canonical
human-readable contract: `.chaos/changes/README.md`. Machine-readable form:
`.chaos/config.yaml` (`paths.changes`, `policies.changeArtifacts`).

## Rule

Change-scoped commands write **new** artifacts under:

```text
.chaos/changes/<change-id>/
```

Resolve `<change-id>` from the invocation/OpenSpec change, and resolve the base path from
`.chaos/config.yaml` `paths.changes` (default `.chaos/changes`) before using any default.

## Expected per-change outputs

```text
.chaos/changes/<change-id>/
  proposal-report.md      # chaos:propose
  proposal-review.md      # chaos:review
  approval.md             # approval record
  apply-report.md         # chaos:apply
  verification.md         # chaos:verify
  archive-report.md       # chaos:archive
  sync-report.md          # chaos:sync --change <change-id>
  retro.md                # chaos:retro <change-id>
  decision-events.md      # PROP-DEC-*/REV-DEC-*/APP-DEC-*/... events
  waivers.md              # recorded waivers / accepted risk / debt
  lifecycle.md            # lifecycle manifest (status + links)
```

(Exact filenames may already exist per command; prefer the command's own output-contract
filename and keep it under the change folder.)

## Legacy compatibility

Commands **may READ** legacy scattered folders for compatibility:

```text
.chaos/reviews/  .chaos/proposals/  .chaos/approvals/
.chaos/apply-reports/  .chaos/verification/  .chaos/archive-reports/  .chaos/retros/
```

But **new** artifacts must target the change-scoped layout above.

- Do **not** migrate legacy artifacts as part of normal command execution.
- A command may *surface* a legacy-layout finding and recommend a future migration task,
  but must not perform or require migration.

## Repository-wide (non-change) outputs

Repository-wide outputs are not change-scoped:

```text
.chaos/sync-reports/repo-sync-YYYY-MM-DD.md   # chaos:sync --all
.chaos/status-report.md                       # chaos:status
.chaos/archaeology/                           # chaos:archaeology (+ index.md)
.chaos/retros/periodic-<period>-retro.md      # periodic retros
```

## Related

- `artifact-naming-policy.md`
- `model-robustness-policy.md`
