# chaos-classify — Stage-C progressive-rigor trigger classifier

Deterministic core of the Stage-C classifier (design of record:
[`docs/design/2026-08-02-stage-c-progressive-rigor.md`](../../docs/design/2026-08-02-stage-c-progressive-rigor.md),
decisions C-1..C-14). Stdlib only, no dependencies, own test suite — house style per
`tools/chaos-render`. **Not wired into any command** until the corpus acceptance bar passes
(design doc §11 step-3 gate).

| File | Role |
|---|---|
| `classify.py` | pure deterministic core (`classify()`) + fixture adapter + CLI |
| `run_corpus.py` | scores the core against the pre-registered fidelity corpus, both error directions (A1–A8, P1–P6) |
| `adjudication-prompt.md` | the **pinned** semantic-layer contract (C-6/C-7/C-12): raise-only, cites required |
| `test_chaos_classify.py` | stdlib unittest suite for the primitives + checkpoint engine |

## Architecture (who judges what)

- **Scan (this tool):** M2 path/marker classes, M3 route/dependency/contract-artifact deltas +
  breaking heuristic, M4 ledger scan rule, M5 scope spill, X1 thresholds, X2 verdict, X3 dep
  churn, C-14 rename-shape guard, dimension assembly (max-of, stop folding, floors, C-13
  distinct-surface openspec), confidence, monotone state.
- **Adjudication (a model, never this tool):** may only RAISE materiality triggers, with cites;
  runs at K1/K3 (C-12). Supplied to the tool as a results file — in corpus runs, produced by
  **blind** judges from sanitized packets (no Expected sections).

## Corpus workflow

```text
python tools/chaos-classify/run_corpus.py --scan-only          # deterministic side
python tools/chaos-classify/run_corpus.py --emit-packets DIR   # sanitized adjudication inputs
<blind model judges DIR/*.json per adjudication-prompt.md -> adjudication-results.json>
python tools/chaos-classify/run_corpus.py --adjudication adjudication-results.json   # full bar
python -m unittest discover -s tools/chaos-classify            # unit suite
```

Single seed: `python tools/chaos-classify/classify.py <seed.md> [--adjudication FILE]`.

## Implementation notes (operationalizations, documented not silent)

- **MR-7 / 410 tombstone:** a route re-registered to return `Results.StatusCode(410)` counts as
  a removed route (breaking) — 410 Gone is HTTP's removal signal.
- **MR-3 stop satisfaction:** an ANSWERED ledger decision covers a same-surface materiality stop;
  decision surfaces are inferred from a documented keyword map (`SURFACE_KEYWORDS`).
- **MR-4 LOW confidence:** nothing fired AND vague scope (no file entries; all entries depth ≤ 2;
  a trailing slash marks a directory regardless of dots in its name).
- **Numstat totals trailer:** `# totals: files=N loc=M` is authoritative for abbreviated fixture
  diffs (corpus changelog 2026-08-02).
- **Packets show per-checkpoint scan firings**, so blind judges evaluate each checkpoint fresh;
  duplicate re-raises of already-fired triggers are deduped by the raise-only merge.
- Fire-once semantics: a trigger fires once per change; K3 re-detection of an earlier firing is
  reported as `scanEcho` (deterministic-layer accountability), limited to diff-evidenced
  triggers (M2/M3/X1/X3).

## Status

- 2026-08-02 — built; 17/17 unit tests; scan-only corpus run 9/9 PASS over all 27 seeds.
- 2026-08-02 (same day) — **full acceptance bar: ALL PASS** (A1–A8, P1–P6, dims/echo exact,
  semantic subset 11/11) with blind-judged adjudication, after three iteration rounds (packet
  evidence-gating; prompt rules 8–14). Scorecard + evidence:
  `.chaos/validation/2026-08-stage-c-classifier/results.md`. **Step-3 gate cleared** — wiring
  (step 4: propose first, verify last) is unblocked. The pinned prompt is part of the tested
  surface: changing it re-opens the corpus run.
