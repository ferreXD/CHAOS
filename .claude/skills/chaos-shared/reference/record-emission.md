# Record emission — Stage-B writer protocol

How every CHAOS command records its phase outcome. Commands **emit structured
records**; the deterministic renderer (`tools/chaos-render/render.py`) projects
`change.md`, `lifecycle.md`, `sync-report.md`, `archive-report.md` and
`appendix/*` from them. Commands link here instead of repeating the protocol
(same pattern as `chaos-interaction-runtime`).

Design of record: `docs/design/2026-07-24-artifact-model-roadmap.md` §Stage B.
Formats: `chaos-shared/reference/change-template.md` (§5 = machine layer).
Machine schemas: `tools/chaos-render/schema/*.schema.json` — the renderer's truth,
**not reading material**.

**Authoring protocol (L2 + L4): never read the schemas.** For frame/deliver/verify, start
from the emitter — `python tools/chaos-record/record.py <phase> --change-dir <dir> --run
<runId> ...` writes the partial record at the real path with the facts derived and every
judgement field empty; you fill the judgement (verdict, assessment, rationale, coverage
evidence, `whyNotTest`, deviations, findings) and `render.py --check` gates completion. The
emitter never guesses: an underivable fact stays empty. For `contract.json` (agent-authored
end-to-end) copy `tools/chaos-render/examples/contract.example.json`; the other examples
show the filled shape of each record. The examples are schema-validated by unit test, so
they cannot drift from the machine truth. **An aborted pass deletes its partial record** —
rule 3 below is about completed passes, and a partial left by an abandoned attempt is
debris, not a record.

## The three writer rules (hard)

1. **Never hand-write or hand-edit a rendered artifact.** `change.md`,
   `lifecycle.md`, `sync-report.md`, `archive-report.md` and `appendix/*` are
   renderer-owned. The fix direction is always source-first: fix the record (or
   ledger entry), re-render.
2. **Decision entries stay hand-appended.** `decision-events.md` is append-only and a
   *source*, not a render target. Every `*-DEC-*` and `ESC-*` entry is agent-written per
   `change-template.md` §2; a decision entry whose answer changes the mode MUST carry
   `- escalates: <from> → <to>`. `TRG-*` trigger events are the one exception (L3-D6,
   creator 2026-08-03): `chaos-scan` appends them mechanically, byte-derived from the
   classifier verdict — never hand-write or edit one.
3. **A record is emitted only for a COMPLETED pass.** A deferred or aborted
   attempt writes no record — the deferral lives in its ledger entry
   (e.g. an `ARC-DEC` deferral). Re-runs append the next pass number; a pass
   file is never rewritten.

## What each command writes

Records live in `.chaos/changes/<change-id>/records/`:

| Command | Record file(s) | Envelope `verdict` |
|---|---|---|
| `chaos:propose` (FRAME) | `contract.json` + `frame.pass-NN.facts.json` | `READY_FOR_REVIEW` · `BLOCKED` |
| `chaos:review` | `review.pass-NN.facts.json` (+ amend `contract.json` under stable ids, `addedBy` set) | `READY_FOR_APPROVAL` · `READY_WITH_CONDITIONS` · `NEEDS_REVISION` · `BLOCKED` · `INSUFFICIENT_EVIDENCE` |
| `chaos:apply` (DELIVER) | `deliver.pass-NN.facts.json` | `APPLIED` · `PARTIALLY_APPLIED` |
| `chaos:verify` | `verify.pass-NN.facts.json` | `READY` · `READY_WITH_DEBT` · `NOT_READY` |
| `chaos:sync --change` | `sync.pass-NN.facts.json` | `RECONCILED` · `PARTIALLY_RECONCILED` · `NOT_RECONCILED` |
| `chaos:archive` | `archive.pass-NN.facts.json` (only when an archive EXECUTED) | `ARCHIVED` · `ARCHIVED_WITH_DEBT` · `ARCHIVED_UNDER_GOVERNANCE_OVERRIDE` |

Every phase record shares the envelope (see `phase-facts.schema.json`):
`schemaVersion: 1`, `recordType: "phase-facts"`, `phase`, `pass`, `changeId`,
`sourceCommand`, `run` (**the completing run id** — a re-issued session must
record the run that finished, never an earlier cancelled one), `mode`,
`verdict`, `at` (ISO-8601 Z), `assessment` {`confidence`, `evidenceCoverage`,
`assumptionLoad`}, plus optional `confidenceLimiters`, `verdictRationale`,
`commentary`, `todoCandidates`, and the phase-specific `facts` payload.

**Authored voice goes in the sanctioned fields only**: `commentary` (rendered
verbatim into the phase's designated subsection), per-finding `detail`, and
`verdictRationale`. Everything else is data.

Contract statements carry stable ids (`C-001`…). They are **never renumbered**;
later phases add statements with `addedBy: <decision-ref>`. The contract record
carries **no tick state** — deliver's `facts.coverage` must enumerate every
statement id exactly once with its evidence (`test` | `code` | `doc`; non-test
evidence requires `whyNotTest`), and the renderer ticks mechanically.

## Rendering

After writing the record(s) and ledger entries, from the repository root:

```bash
python tools/chaos-render/render.py <change-id> --write
```

Idempotent; re-renders every artifact the change's records support, stamps
provenance mechanically, enforces the ~80-line overflow rule, and validates:
schema conformance, per-phase verdict enums, coverage↔contract completeness,
deviation→decision resolution, archive closure matrix ↔ §2 scan rule, and every
cross-referenced id. **A non-zero exit is a blocking defect in the records —
fix the record, never the rendered file.** Use `--check` first when unsure.

Fallback: if the renderer cannot run in the environment (no `python`), write
the artifacts by hand per `change-template.md` §1–§3 exactly, record the
degradation in the run output, and leave the records in place so the next
render reconciles.
