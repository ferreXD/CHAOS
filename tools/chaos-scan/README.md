# chaos-scan — the classifier operating protocol, mechanized (lever L3 / Stage E)

Deterministic wrapper owning what the agent used to reason through by hand: C-15 diff
generation, payload assembly, the two-call adjudication sequence, `TRG-*` ledger
transcription (L3-D6), and the verdict digest. Design of record:
[`docs/design/2026-08-03-l3-l4-scan-and-record.md`](../../docs/design/2026-08-03-l3-l4-scan-and-record.md).
Prediction: cost-bar doc §5c, frozen before this build. Stdlib only, own tests; imports
`classify()` as a library — the classifier core is untouched and the corpus did not move.

| Subcommand | Does |
|---|---|
| `k1 --intent --scope --subject ... [--declared] [--mode] [--posture]...` | captures `scan-inputs.json`, classifies at intent. **Needs `--map` (default `.chaos/path-class-map.json`) or an explicit `--no-map`** |
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

## The path-class map is not optional

M2 is decided entirely by the map, so **without one M2 can never fire** and a change on a
sensitive surface scans as `fired: none` at **HIGH confidence** — material work certified as
immaterial. `k1` therefore **fails closed (exit 2)** when the map is absent, and a map that is
named in `scan-inputs.json` but has since moved is an error rather than a degrade-to-empty.
Running without classes is possible but must be *said*: `--no-map` records the choice and every
verdict digest then carries a note that `fired: none` does not mean nothing sensitive was
touched. Same rule as `--mode` and `--self-review` (D4/D5).

## Status

- 2026-08-03 — built (L3): 11 unit tests against real git fixtures. Consumed by
  `chaos-run/SKILL.md`; `TRG-*` writer-rule amendment recorded in `record-emission.md`.

## Tier banding (L1 §8)

`scan.py tier` bands ONE work unit deterministically — tier selection is a tool verdict, never
a model judgement (L1-D15). **T2 (ceiling) is the default and the fallback.**

```text
python tools/chaos-scan/scan.py tier --change-dir <dir> --unit-path <file>... \
    [--covers C-001,C-002] [--acceptance-check "<cmd that must already FAIL>"]
python tools/chaos-scan/scan.py tier --change-dir <dir> --escalate T0|T1
```

Gates, in order: budget intact → no path in a class carrying a **fired** trigger's surface →
no path in **any** sensitive class (prospective; stops unit 1 walking into auth pre-scan) →
no evidence for a contract statement **coupled** to a fired surface (keyword match via
`SURFACE_KEYWORDS`). That establishes **T1**. **T0** additionally needs file-level paths,
fewer than 8 declared files, and Route **A** — the acceptance check is run here and must
**fail**. `--escalate` climbs one rung (T0→T1→T2), spends one of the budget of 2, and latches
to ceiling once spent.

**Route B is closed (2026-08-04).** It reached T0 on pinned contract statements alone, with no
pre-existing validator. Its first real test failed: the floor tier shipped a contract violation
and reported `COMPLETE`, 41/41 green — because "suite green" counted tests the executor itself
wrote, so one misreading of the spec produced both the code and the evidence for it. **A
self-written validator is not a validator.** Route A survives because its check pre-exists the
unit and cannot be authored by the executor. `--covers` is still required and still live: gate 3
uses it to send evidence coupled to a fired surface straight to ceiling.

**Consequence, not hidden:** Route A has never fired in any measured run — it needs a failing
check to pre-exist, and the collapsed loop writes tests and code in one unit — so **T0 is
dormant in practice** until the loop puts a ceiling-authored acceptance check first.
