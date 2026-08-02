# Change-Scoped Artifacts & Lifecycle Manifest — chaos:propose

`chaos:propose` is the **owner** of the per-change folder. When a change id is
known, it initializes the change-scoped layout and the lifecycle manifest.

Canonical contract: `.chaos/changes/README.md` (layout, naming policy, team
concurrency policy, sync role model).

## Initialize the change folder

When a change id is known (OpenSpec change created or selected), create:

**`--standard` / `--strict`** (same artifact set as light, deeper record payloads — protocol in
`chaos-shared/reference/record-emission.md`; standard adds confidence limiters, strict adds the
source-manifest, risk and framing-traceability payloads):

```text
.chaos/changes/<change-id>/
  decision-events.md          # PROP-DEC-* recorded here, append-only (hand-written, a SOURCE)
  records/contract.json       # contract statements with stable ids C-001… (emitted by FRAME)
  records/frame.pass-NN.facts.json   # frame phase record (title, intent, OpenSpec proof, …)
  change.md                   # RENDERED by tools/chaos-render (never hand-written)
  lifecycle.md                # RENDERED state view (never hand-written)
  appendix/<section>.md       # RENDERED overflow (~80-line rule, applied by measurement)
  pre-proposal-brief.md       # degraded mode only (OpenSpec unavailable/declined; hand-written)
```

**`--light` (collapsed FRAME — same protocol, light-depth payloads):**

```text
.chaos/changes/<change-id>/
  decision-events.md          # lean append-only entries; one carries approves-change: true
  records/contract.json       # contract statements
  records/frame.pass-01.facts.json   # title + intent + OpenSpec proof only
  change.md                   # RENDERED
  lifecycle.md                # RENDERED
```

After emitting the records, run `python tools/chaos-render/render.py <change-id> --write`.

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

## Lifecycle view (`lifecycle.md` — rendered, never hand-written)

`lifecycle.md` and the `change.md` frontmatter `lifecycle` block are **renderer output**,
projected from the phase records + the ledger (shape: `chaos-shared/reference/change-template.md`
§3, purity rule included; light renders only its Frame/Deliver rows). `chaos:propose` never
writes or edits them — it emits the frame record and renders. If the view looks wrong, fix the
record or ledger entry and re-render; never the file.

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
