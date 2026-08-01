# Change-Scoped Artifacts & Lifecycle Manifest — chaos:propose

`chaos:propose` is the **owner** of the per-change folder. When a change id is
known, it initializes the change-scoped layout and the lifecycle manifest.

Canonical contract: `.chaos/changes/README.md` (layout, naming policy, team
concurrency policy, sync role model).

## Initialize the change folder

When a change id is known (OpenSpec change created or selected), create:

**`--standard` / `--strict`** (same artifact set as light, deeper sections — formats in
`chaos-shared/reference/change-template.md`; standard = short prose allowed per section,
strict = fuller analysis + extra sections (risk, traceability matrix) + the >~80-line
overflow rule):

```text
.chaos/changes/<change-id>/
  change.md                   # the story: §Intent + §Contract + §Review (+ Delivery, by apply)
  lifecycle.md                # generated-view stub, status: Framed
  decision-events.md          # PROP-DEC-* recorded here, append-only
  pre-proposal-brief.md       # degraded mode only (OpenSpec unavailable/declined)
  appendix/<section>.md       # strict overflow only (any section > ~80 lines)
```

**`--light` (collapsed FRAME — formats in `chaos-shared/reference/change-template.md`):**

```text
.chaos/changes/<change-id>/
  change.md                   # the story: intent + contract + review line (+ Delivery, by apply)
  lifecycle.md                # 10-line generated-view stub, status: Framed
  decision-events.md          # lean append-only entries; one carries approves-change: true
```

No `proposal-report.md` in any mode. On light, degraded OpenSpec auto-escalates to standard
instead of writing a brief; on standard/strict, degraded mode may write the decision-gated
`pre-proposal-brief.md`.

OpenSpec remains the source of truth for `proposal.md`, `design.md`, `specs/`,
and `tasks.md` under `openspec/changes/<change-id>/`. Do not duplicate them into
the change folder.

In decision-gated **degraded mode** (OpenSpec unavailable or its writes not authorized),
the optional `pre-proposal-brief.md` is written here — never to the legacy
`.chaos/proposals/` folder. Derive a provisional change-id slug from the intent when
OpenSpec has not minted a change id. See
`reference/openspec-integration-contract.md` ("If OpenSpec is not available").

## Lifecycle stub (`lifecycle.md` — generated state view)

Authoritative state lives in the `change.md` frontmatter (`chaosMetadata.lifecycle`);
`lifecycle.md` is a **view** of it — never a second source of truth, never narrative — edited
only at phase transitions.

The `lifecycle.md` shape is defined in **one place only**:
`chaos-shared/reference/change-template.md` §3 — the 6-column phase table
(`| Phase | Status | Mode | Verdict | Date | Pointer |`) plus the `Current:` rollup line.
Write the stub in exactly that format (all modes; light renders only its Frame/Deliver rows,
per §3) and obey its purity rule. Do not copy or restyle the template here.

Legacy `lifecycle.md` manifests (the phase-per-artifact table listing `proposal-review.md`,
`approval.md`, `apply-report.md`, `verification.md`, `archive-report.md`, …) remain readable
on old changes; never write that format for a new change.

## Naming rules for recommended drafts

`chaos:propose` does not update shared governance indexes. When it recommends a
decision-log or ADR draft, it must use **date-prefixed, slug-based** physical
filenames (e.g. `docs/decision-log/YYYY-MM-DD-<slug>.md`,
`docs/adr/YYYY-MM-DD-<slug>.md`). Sequential display IDs are assigned later by
`chaos:sync`, not at propose time.

## Compatibility

Read legacy `.chaos/proposals/` artifacts when present for context, but write new
artifacts under `.chaos/changes/<change-id>/`. Do not migrate legacy artifacts;
you may recommend a future migration.
