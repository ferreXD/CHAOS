# Governance-digest maintenance

`chaos:sync` is the sole maintainer of
`.claude/skills/chaos-shared/reference/governance-digest.md` — the hash-keyed projection the
`chaos:run` loop reads instead of the full governance sources (design of record:
`docs/design/2026-08-03-l2-corpus-amortization.md`, decisions L2-D1/D2/D5/D8).

## Standing rules

- The digest is a **projection**. The sources named in its manifest remain the only truth;
  any content conflict is a digest defect, resolved source-first.
- **Never hand-edit** the digest outside this procedure. Consumers fail closed: a stale
  digest is never read for content — `chaos:run` falls back to the full sources.
- `verbatim` sections are byte-copies of a source span, moved only by
  `digest.py --stamp` (mechanical). `compiled` sections are curated compressions —
  re-authoring them is model work and belongs HERE, with the diff in the sync report.
- Hash-keying detects **staleness, not wrongness**. The review surface for a fresh-but-wrong
  compiled section is this procedure's report diff.
- Adding or removing a digest *section* is a design change, not maintenance — record it
  (register table in `docs/design/2026-08-03-cost-bar-and-run-collapse.md` §5e) rather than
  doing it silently.

## Procedure (every sync run; mandatory after any governance-source edit)

1. `python tools/chaos-digest/digest.py --check`
   - **Exit 0** → report "digest: fresh" and stop here.
   - **Exit 2** → the digest itself is broken (missing/unparseable/manifest-body mismatch):
     surface it as drift, repair the structure, and re-run.
2. For each section the check names stale:
   - **`verbatim`** → nothing to author; the stamp in step 3 re-copies the span mechanically.
   - **`compiled`** → re-read the changed source and re-author the compression: checklists,
     not prose; keep every load-bearing specific (mode names, commands, enum values, stop
     rules); compress by dropping narration, never by dropping constraints.
3. `python tools/chaos-digest/digest.py --stamp <stale section ids>` (bare `--stamp` when
   everything moved).
4. Re-run `--check` — it MUST exit 0 before the sync completes.
5. Record in the sync report: the sections touched, verbatim vs compiled, and the compiled
   diffs (patch preview, same as any other reconciliation).
