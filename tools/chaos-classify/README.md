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

## Wiring adapter (step 4 — commands call this)

```text
python tools/chaos-classify/classify.py --inline payload.json \
    --state .chaos/changes/<id>/classification-state.json [--adjudication raises.json]
```

`payload.json`: `{checkpoint, intent, scope, declaredTriggers, mode, postureFiles[],
mapFile, ledgerFile?, numstatFile?, patchFile?}` — the command reads nothing itself; the
adapter reads the named files, the core stays pure.

**`numstatFile`/`patchFile` scope (mandatory):** the diff describes the **governed subject only**.
Exclude `.chaos/**`, `openspec/**` and any ADR the change authored, and stage new files first
(`git add -N <subject paths>`) or the diff cannot see them. Counting a change's own governance
output makes governance self-amplifying: measured 2026-08-03, six of six governed arms crossed
X1's blast-radius threshold on their own paperwork
(`.chaos/validation/2026-08-stage-c-step5-rerun/results.md` §3). Blast radius is a property of the
subject, never of the bookkeeping. The **two-call pattern per checkpoint**:
(1) scan call → read the verdict's candidates/demoted list; (2) the command performs the
adjudication pass per `adjudication-prompt.md` and calls again with `--adjudication`
(`{"raises": [...]}` form). Running the same checkpoint twice is safe — firings dedupe; the
second verdict is authoritative. `--state` is the classifier's working state
(`classification-state.json` in the change folder — deliberately NOT a Stage-B `records/`
artifact).

## Continuous mode (Stage D — `chaos:run`)

Design: `docs/design/2026-08-03-cost-bar-and-run-collapse.md` §4.1. Checkpoints are **evidence
classes, not phases**: K1 = intent exists · K2 = an answered decision exists · K3 = the diff
exists *and grows* · K4 = the self-review verdict exists. The loop calls the same CLI; what
changes is cadence — **K3 repeats once per work unit** with the grown (C-15-scoped) diff.
Firings still dedupe, dimensions stay monotone (P4), re-detections still report as `scanEcho`.

Continuous verdict fields:

- `adjudicationDue` — the loop runs the model adjudication pass **only when this is true**
  (first K1 call, or a K3 scan whose diff grew new paths). The continuous form of C-12; K2/K4
  never set it.
- `newSurfacePaths` (K3 only) — paths this scan saw for the first time (state `seenPaths`
  accumulates them; the two-call merge replay sees an empty delta).
- `scanSeq` — call counter (state `scanCount`); the loop cursor for resume capsules.
- `stopAbsorbedBy` — **pending-stop absorption**: a stop demand fired while an earlier ledger
  entry is still unanswered. `newStops` stays 0; the caller's duty is to AMEND the pending
  entry (append the folded question, increment `folds:`) — never to surface a second
  interruption. MR-3 satisfaction (ANSWERED same-surface coverage) beats absorption.
  Corpus seed: SC-23.

**The loop drives this CLI through `tools/chaos-scan/scan.py` (L3):** the wrapper owns the
C-15 diff generation, section/payload assembly, the two-call merge sequence, `TRG-*` ledger
transcription, and the verdict digest + sanitized packet files under the change's `scan/`
folder. It imports `classify()` as a library and changes NOTHING about classification —
this adapter contract stays authoritative for what the core consumes; `--inline` remains
first-class for direct invocation.

**The obligation audit** (`audit.py`) is the deterministic close gate: it recomputes the owed
vector from `classification-state.json` via the same `compute_dimensions` and asserts the owed
artifacts exist (stops all answered + surfaced, ADR at `adr 2`, OpenSpec at depth, verify
record at `verify ≥ 1`, frame/deliver records, vector ≥ floors). Exit 0 = the run may close;
1 = failures, each naming the owed artifact; 2 = audit could not run. It reads `records/`
**by design** — the never-read-records constraint is about *classification inputs*, and the
audit is a gate, not a classifier. It never authors anything.

```text
python tools/chaos-classify/audit.py --state <classification-state.json> \
    --ledger <decision-events.md> --change-dir .chaos/changes/<id> \
    [--openspec-dir openspec/changes/<id>] [--adr-dir <dir>]
```

## Implementation notes (operationalizations, documented not silent)

- **MR-7 / 410 tombstone:** a route re-registered to return `Results.StatusCode(410)` counts as
  a removed route (breaking) — 410 Gone is HTTP's removal signal.
- **MR-3 stop satisfaction:** a resolved ledger decision covers a same-surface materiality stop;
  decision surfaces are inferred from a documented keyword map (`SURFACE_KEYWORDS`).
- **Ledger `answered` predicate:** a decision entry is pending only while `status: OPEN`.
  ANSWERED, RESOLVED-IN-ARM and RECORDED all read as resolved — the full decision-entry enum
  (`change-template.md` §2, `tools/chaos-render/schema/decision-entry.schema.json`). Fixed
  2026-08-03: the ANSWERED-only match made in-arm-resolved stops read as unanswered in the
  audit stop gate, MR-3 satisfaction, and pending-stop absorption (Stage-D results §5; all six
  arms hit it and invented dual-status workarounds).
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
- 2026-08-03 — **Stage-D continuous mode**: repeatable K3 scans, `adjudicationDue` /
  `newSurfacePaths` / `scanSeq`, pending-stop absorption (seed SC-23, corpus 28 → 29), and the
  obligation audit gate (`audit.py`). 28 classify + 8 audit unit tests; scan-only corpus 9/9
  PASS over all 29 seeds. Consumed by `.claude/skills/chaos-run/SKILL.md`.
- 2026-08-03 (later) — **Stage-D §5 defect fixed**: `parse_ledger` `answered` widened to the
  full terminal-status enum (RESOLVED-IN-ARM, RECORDED). 0/29 corpus seeds use either status
  (verified before the change) — no expectation moved; scan-only corpus 9/9 PASS unchanged.
  30 classify + 9 audit unit tests.
