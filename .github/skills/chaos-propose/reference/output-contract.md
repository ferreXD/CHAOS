# `chaos:propose` Output Contract

## Required outputs

When successful and OpenSpec is available (**`--standard` / `--strict`** — same artifact set
as light at deeper section depth; formats: `chaos-shared/reference/change-template.md`,
frontmatter `artifactType: change`, `mode: standard|strict`. Standard = short prose allowed
per section; strict = fuller analysis + extra sections (risk, traceability matrix) + the
overflow rule (any section > ~80 lines → `appendix/<section>.md`, one-line summary + link)):

```text
openspec/changes/<change-id>/...
.chaos/changes/<change-id>/change.md            # §Intent + §Contract + §Review (+ §Delivery, by apply)
.chaos/changes/<change-id>/lifecycle.md         # generated-view stub, status: Framed
.chaos/changes/<change-id>/decision-events.md   # PROP-DEC-* recorded here
```

No `proposal-report.md` in any mode (see "Proposal report template (retired)" below).

**`--light` (collapsed FRAME)** — the same artifact set at collapsed depth
(tables/checklists/single lines only; degraded OpenSpec auto-escalates):

```text
openspec/changes/<change-id>/...
.chaos/changes/<change-id>/change.md            # intent + contract + review line
.chaos/changes/<change-id>/lifecycle.md         # generated-view stub, status: Framed
.chaos/changes/<change-id>/decision-events.md   # lean entries; one with approves-change: true
```

When OpenSpec is unavailable or the user does not authorize OpenSpec writes, the
decision-gated degraded mode may produce a CHAOS pre-proposal brief under the change folder
(derive a provisional change-id slug from the intent when OpenSpec has not minted one):

```text
.chaos/changes/<change-id>/pre-proposal-brief.md
```

### v0 layout note

Per-change artifacts — including the degraded-mode `pre-proposal-brief.md` — are written
under `.chaos/changes/<change-id>/` (see `reference/change-artifacts-layout.md` and
`.chaos/changes/README.md`). The legacy `.chaos/proposals/` folder may be READ for
compatibility but is no longer a write target; do not migrate legacy artifacts.
`chaos:propose` does not update shared governance indexes; recommended ADR/decision-log
drafts use date-prefixed, slug-based filenames.

## Open questions policy

Open questions are a fallback, not the default output.

Before writing the final artifacts, the command must ask the user to resolve material missing context using the Runtime Decision Loop.

Only include open questions when they were:

- explicitly deferred by the user;
- impossible to answer without external evidence;
- outside current proposal scope;
- blocked by missing archaeology/source access;
- generated in non-interactive mode.

## Proposal report template (retired)

The legacy `# CHAOS Proposal Report` template is **retired as an output** in every mode; never
write `proposal-report.md` for a new change. New changes write `change.md` instead — formats in
`.github/skills/chaos-shared/reference/change-template.md`, at mode depth (standard = short
prose allowed per section; strict = fuller analysis + risk / traceability-matrix sections + the
>~80-line overflow rule).

The template's analytical content now lives in the change artifacts at standard/strict depth:

- change classification, source manifest, evidence assessment, OpenSpec Invocation Proof,
  ADR/rule alignment → `change.md` §Contract (and frontmatter);
- findings, assumption register, confidence summary, deferred/open questions → `change.md`
  §Review;
- runtime decision log + Decision Events → `.chaos/changes/<change-id>/decision-events.md`.

Legacy `proposal-report.md` files on old/archived changes remain readable for compatibility.

## Next command

Recommended (`--standard` / `--strict`; light STOPs for answers, then `chaos:apply`):

```text
chaos:review <change-id>
```
