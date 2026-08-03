# chaos-record — record facts derived, judgement kept (lever L4)

Emitter for partial phase records: facts filled mechanically, **every judgement field
empty** for the agent (`verdict`, `assessment`, rationale/commentary, coverage
`covered/evidence/whyNotTest`, deviations, rules status/evidence, findings, traceability,
`archiveReadiness`). Design of record:
[`docs/design/2026-08-03-l3-l4-scan-and-record.md`](../../docs/design/2026-08-03-l3-l4-scan-and-record.md)
(L4-D1..D5). Stdlib only, own tests.

```text
python tools/chaos-record/record.py frame   --change-dir <dir> --run <id> [--title ...]
python tools/chaos-record/record.py deliver --change-dir <dir> --run <id> --build-log <f> --test-log <f> [--rule R-...]...
python tools/chaos-record/record.py verify  --change-dir <dir> --run <id> --run-checks [--openspec-validate-cmd "..."]
```

- Writes `records/<phase>.pass-NN.facts.json` at the **real path** (auto-incrementing NN);
  `render.py --check` is the completion gate; **an aborted pass deletes its partial**.
- Derives: envelope · frame intent verbatim + classified OpenSpec depth (depth 0 ⇒
  `NOT_INVOKED` is a fact) · deliver build/tests parsed from the loop's own logs, `files`
  from `git status` over the scan subjects, coverage/rules scaffolds, `scopeDrift` from
  classifier state (M5 never fired ⇒ `NO_DRIFT`) · verify **re-runs the checks itself**
  (L4-D4 — the independent re-run) + the contract tick join.
- **The honesty guard (L4-D5):** the emitter never fills a judgement field, and an
  underivable fact stays empty rather than guessed — enforced by unit test.

## Status

- 2026-08-03 — built (L4): 8 unit tests incl. the honesty guard. Consumed by
  `chaos-run/SKILL.md` and `record-emission.md`.
