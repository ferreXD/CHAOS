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

## Expected per-change outputs (current model, every mode)

```text
.chaos/changes/<change-id>/
  change.md               # the change story (all modes): §Intent/§Contract/§Review/§Delivery
  lifecycle.md            # lifecycle manifest / generated state view (status + links)
  decision-events.md      # PROP-DEC-*/REV-DEC-*/APP-DEC-*/ESC-*/... events (append-only)
  records/                # Stage-B source records: contract.json + <phase>.pass-NN.facts.json
                          # (formats: chaos-shared/reference/record-emission.md)
  appendix/               # renderer-managed overflow sections (~80-line rule)
  archive-report.md       # chaos:archive
  sync-report.md          # chaos:sync --change <change-id>
  retro.md                # chaos:retro <change-id>
  waivers.md              # recorded waivers / accepted risk / debt
```

Canonical `change.md` / decision-entry / `lifecycle.md` formats:
`chaos-shared/reference/change-template.md`. Approval is the `approves-change: true` marker
on the approving decision entry — no `approval.md`.

**Renderer-owned artifacts (Stage B):** `change.md`, `lifecycle.md`, `sync-report.md`,
`archive-report.md` and `appendix/*` are projected from `records/` + the ledger by
`python tools/chaos-render/render.py <change-id> --write`. Commands emit records and render;
they never hand-write or hand-edit these files (protocol:
`chaos-shared/reference/record-emission.md`).

Legacy per-change reports — read-only, present only on old changes that predate `change.md`
(never produced for new changes in any mode):

```text
.chaos/changes/<change-id>/
  proposal-report.md      # retired output of chaos:propose  -> change.md §Intent + §Contract
  proposal-review.md      # retired output of chaos:review   -> change.md §Review
  approval.md             # retired approval record          -> approves-change: true decision entry
  apply-report.md         # retired output of chaos:apply    -> change.md §Delivery
  verification.md         # retired output of chaos:verify   -> change.md §Delivery / §Verification
```

Readers are presence-conditioned: use `change.md` when present (any mode); fall back to the
legacy report set only when it is absent. (Exact filenames may already exist per command;
prefer the command's own output-contract filename and keep it under the change folder.)

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
