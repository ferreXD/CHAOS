# chaos-scan — the classifier operating protocol, mechanized (lever L3 / Stage E)

Deterministic wrapper owning what the agent used to reason through by hand: C-15 diff
generation, payload assembly, the two-call adjudication sequence, `TRG-*` ledger
transcription (L3-D6), and the verdict digest. Design of record:
[`docs/design/2026-08-03-l3-l4-scan-and-record.md`](../../docs/design/2026-08-03-l3-l4-scan-and-record.md).
Prediction: cost-bar doc §5c, frozen before this build. Stdlib only, own tests; imports
`classify()` as a library — the classifier core is untouched and the corpus did not move.

| Subcommand | Does |
|---|---|
| `k1 --intent --scope --subject ... [--declared] [--mode] [--posture]...` | captures `scan-inputs.json`, classifies at intent |
| `rescan` | `git add -N` + C-15-scoped diff (persisted under `scan/`), K3 scan |
| `k2` | ledger rescan after an answered decision (scan-only M4) |
| `k4 --self-review <verdict>` | self-review checkpoint |
| `merge --raises <file>` | applies adjudication raises — **fails closed (exit 2) on a cite-less or non-materiality raise** |
| `update-scope --decision <RUN-DEC-*>` | the only way scope/subjects change after k1 |

Every call prints (and appends under `scan/verdict-<seq>.md`) the **verdict digest** —
firings with verbatim cites, demoted candidates with reasons, the stop duty, the vector,
`adjudicationDue`. When due, the sanitized packet (`scan/packet-<seq>.json`, the
corpus-validated blindness contract) is what the orchestrator judges at ceiling per the
pinned `adjudication-prompt.md`.

## Status

- 2026-08-03 — built (L3): 11 unit tests against real git fixtures. Consumed by
  `chaos-run/SKILL.md`; `TRG-*` writer-rule amendment recorded in `record-emission.md`.
