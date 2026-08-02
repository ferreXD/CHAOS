# chaos-render — Stage-B deterministic artifact renderer

Stage B of the artifact-model refactor (design of record:
`docs/design/2026-07-24-artifact-model-roadmap.md` §Stage B; entry point:
`docs/design/2026-08-01-stage-b-renderer-handoff.md`). Agents emit **structured
records**; this tool projects `change.md` and `lifecycle.md` from the sources of
truth. Currently **read-only** (`--check` stage; no `--write` yet).

## Usage

```bash
python tools/chaos-render/render.py <changeId> [--root DIR] [--check] [--only change|lifecycle]
```

- default: render both artifacts to stdout
- `--check`: diff rendered output against the files on disk. Exit 0 clean,
  1 differences, 2 validation/render errors.

## Sources (never the prose)

| Source | Provides |
|---|---|
| `.chaos/changes/<id>/records/contract.json` | contract statements, stable ids `C-###` |
| `.chaos/changes/<id>/records/<phase>.pass-NN.facts.json` | per-pass phase facts (run/mode/verdict + payload) |
| `.chaos/changes/<id>/decision-events.md` | decision entries + escalation events (§2 scan rule) |
| `.chaos/interactions/sessions/*.json` | which phases *ran* (existence only — never run/verdict) |
| `.claude/hooks/scripts/chaos-artifact-metadata-hook.py` | `_yaml_scalar` serialization, repository context |

Schemas: `schema/*.schema.json` (JSON Schema 2020-12, style-matched to
`.chaos/interactions/schema/`). The human-readable format spec is
`chaos-shared/reference/change-template.md` (§5 = machine layer).

Validation enforced at render time: schema conformance of every record;
per-phase verdict enums; deliver coverage must enumerate the contract exactly;
deviations must cite resolvable decisions; the archive closure matrix must
enumerate the ledger exactly (§2 scan rule); every `*-DEC-*`/`ESC-*` token in
rendered output must resolve. Counts (`lifecycle.current`) are always derived,
never copied.

## Tests

```bash
python tools/chaos-render/test_chaos_render.py   # 35 tests, stdlib-only unittest
```

## Golden-corpus acceptance status (2026-08-01)

Rendered against the golden reference (`demo/dotnet` @ `df26104`,
`secure-task-api`, worktree `D:/Proyectos/CHAOS/demo-light`) with hand-authored
records transcribed from the committed artifacts:

- **`lifecycle.md`: byte-identical (CLEAN).**
- **`change.md`: all remaining diffs are explainable**, in three buckets:

| Bucket | Diffs | Explanation |
|---|---|---|
| Renderer is *more correct* than golden | `phases.review.run` `…dffba6` → `…252c7b`; coverage honesty 15/17 → 14/17 (+ ADR row) | The golden frontmatter carries the round-3 stale-run-id defect (prose and `lifecycle.md` already said `252c7b`); the golden prose counted the ADR statement as "test-covered". The renderer derives both from records — the defect class is structurally gone. |
| Single-source canonicalization | approval conditions, deviations, decision-event audit, todo candidates | These sections now render from the ledger/records verbatim instead of hand-expanded prose. The golden's fuller phrasings live in exactly one place (the ledger entry / record field) rather than being retold. |
| Prose Stage B deliberately drops | escalation-warning gloss ("confirm-based"), group-header suffixes, "(why MEDIUM, not HIGH)" headers, "(correctly)" asides, line-wrapping | Editorial color with no data backing. Accepted trade per the roadmap ("generated prose is drier"); the `commentary`/`detail`/`verdictRationale` fields are the sanctioned home for authored voice. |

Live-context fields (`repositoryContext.confidence`) resolve at render time and
may differ from write-time values; provenance stamping
(`lastWrittenAt/By`, `bodyHash`) is deferred to the `--write` stage.

## Built since (2026-08-01, second pass)

- **`--write`** — idempotent (second run reports `unchanged`); provenance stamped mechanically
  (`lastWrittenAt/By`, `lastAuditedAt/By`, `metadata.bodyHash`) with **deterministic timestamps**
  (newest source-record `at`, never the wall clock; `timestampSource: records`).
- **Overflow by measurement** — any `##` section beyond ~80 lines moves to `appendix/<slug>.md`
  with a one-line summary + link (round-3 rule). Note: the golden §Verification renders at 73
  lines (the mechanical form is tighter than the authored ~110), so no overflow triggers on the
  golden corpus; the mechanism is covered by unit test.
- **`sync-report.md` / `archive-report.md` render targets** — same section structure as the
  golden reports (sync's "Planned Patch Preview" canonicalized into Applied Sync Actions);
  archive's closure matrix is derived and hard-checked against the §2 scan rule.
- `--check` now covers the full artifact set; `lifecycle.md`'s only golden diff is the added
  provenance block (body still byte-identical).
- Writer protocol: `chaos-shared/reference/record-emission.md` (both trees, PARITY OK).

## Writer swap (2026-08-02) — DONE

All six command skills now emit records per `record-emission.md` and call the renderer instead
of authoring artifacts, in both trees (`.claude/` + `.github/`, PARITY OK), in the agreed order
propose → review → apply → sync → archive → verify last:

- `chaos-propose`: emits `contract.json` + frame facts (OpenSpec proof lives in
  `facts.openspec`); escalation needs no artifact surgery (ledger chain drives warnings).
- `chaos-review`: review facts + contract amendments under stable ids; approval conditions
  project from the approving ledger entry only.
- `chaos-apply`: deliver facts (per-statement coverage renders Coverage honesty mechanically).
- `chaos-sync --change`: sync facts → rendered `sync-report.md` (repo-scoped sync unchanged).
- `chaos-archive`: archive facts only when an archive executed; closure matrix hard-checked.
- `chaos-verify`: verify facts; blocked verification emits NO record (renders as attempted).

Also updated: `chaos-shared/reference/change-scoped-artifact-layout.md` (records/ + appendix/ +
renderer ownership) and `chaos-propose/reference/change-artifacts-layout.md` (both trees).

## Not yet done

1. Re-measure with `.chaos/validation/2026-07-ea-v2/ea-x2-stage-a-light/`; add a dated row to the frozen `RUNKIT.md`.
