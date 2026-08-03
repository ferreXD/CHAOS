# chaos-digest — governance-digest staleness gate (lever L2)

Deterministic gate around `.claude/skills/chaos-shared/reference/governance-digest.md`, the
curated projection the `chaos:run` loop reads instead of the ~147.6k-char governance corpus.
Design of record: [`docs/design/2026-08-03-l2-corpus-amortization.md`](../../docs/design/2026-08-03-l2-corpus-amortization.md)
(L2-D1/D2/D5/D6/D8). Stdlib only, own test suite — house style per `tools/chaos-render`.

| File | Role |
|---|---|
| `digest.py` | manifest parsing, source hashing, verbatim byte-compare, `--check`/`--stamp` |
| `test_chaos_digest.py` | stdlib unittest suite (tmpdir fixtures) |

## Contract

```text
python tools/chaos-digest/digest.py --check              # exit 0 fresh · 1 stale · 2 broken
python tools/chaos-digest/digest.py --stamp [SECTION...] # chaos:sync completion step only
```

- `--check` recomputes every manifest source sha256 and byte-compares each `verbatim`
  section against its heading-delimited source span. Every failure names the section, its
  source, and the reason (including hand-edited verbatim bodies whose source hash still
  matches). JSON report on stdout.
- `--stamp` re-copies verbatim spans mechanically and re-stamps hashes, then re-runs the
  check. It never authors `compiled` content — that is `chaos:sync`'s model work
  (`.claude/skills/chaos-sync/reference/governance-digest-maintenance.md`).
- Consumers **fail closed**: any non-zero check means the digest is not read at all —
  `chaos:run` falls back to the full source list and recommends `chaos:sync`.
- Hashes and comparisons run over newline-normalized utf-8, so CRLF checkouts are not drift.
- Hash-keying detects **staleness, not wrongness**; the sync report diff reviews compiled
  content.

## Status

- 2026-08-03 — built with digest v1 (13 sections: 5 verbatim spans incl. the pinned
  adjudication + classifier contracts, 8 compiled; 32.4 KB vs the ~147.6 KB source corpus).
  13/13 unit tests. Consumed by `chaos-run/SKILL.md` (reading protocol) and maintained by
  `chaos:sync`.
