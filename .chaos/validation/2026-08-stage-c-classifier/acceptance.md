# Pre-registered acceptance bar — Stage-C classifier fidelity corpus

> Registered 2026-08-02, **before any classifier code exists** (design doc
> [`2026-08-02-stage-c-progressive-rigor.md`](../../../docs/design/2026-08-02-stage-c-progressive-rigor.md)
> §7, step 2 of §11). These thresholds are frozen with the corpus; they are not tuned after the
> classifier exists. Changing any of them requires a dated entry in the README changelog with a
> reason, recorded BEFORE the classifier change that motivates it.

## Error-direction definitions

- **Under-detection** — an expected firing (in `newlyFired` or `scanEcho` at its checkpoint) that
  the classifier misses. For materiality triggers this is a **governance bypass**.
- **Over-detection** — a firing the expectations don't list, or a dimension above the expected
  vector. For stops this makes **"start small" a lie**.

Scoring is per checkpoint: compare `newlyFired` as a set of `{trigger, by, surface}`; `newStops`
exactly; the `dimensions` vector exactly; `confidence` per A8. Adjudication cites match if they
reference the same input line/section the expectation cites (reviewer-judged for paraphrase; the
cited *input* must be the same).

## The bar

| # | Criterion | Threshold | Severity |
|---|---|---|---|
| A1 | Materiality under-detection (M1–M5) | **0 missed firings** across the corpus | hard FAIL |
| A2 | Stop over-detection | **0 trigger-created stops** where expected `newStops` is 0 | hard FAIL |
| A3 | Materiality over-detection, non-stop | unexpected M-fire or dimension over-raise on ≤2 seeds, each ≤1 level, never a stop | above ⇒ FAIL |
| A4 | Mechanical mis-detection (X1–X3) | ≤1 seed wrong per direction | above ⇒ FAIL |
| A5 | Property tests P1–P6 | 100% | hard FAIL |
| A6 | Citation discipline | 100% of adjudication raises carry cites resolving to actual fixture input | hard FAIL |
| A7 | Scan determinism | scan-layer output byte-identical across 2 runs on every seed | hard FAIL |
| A8 | Confidence honesty | no checkpoint registered MEDIUM/LOW reports HIGH; SC-08 K1 and SC-09 K1 report LOW | FAIL |

**Reported separately (diagnostic, same A1 bar):** the semantic subset — the firings only the
adjudication layer can produce: SC-01 K1 (M1) · SC-02 K1 (M1) · SC-03 K1 (M1) · SC-07 K1
(M1+M2) · SC-08 K3 (M1) · ADV-01 K1 (M1) · ADV-03 K3 (M2) · SC-12 K1 (M2) · SC-21 K1 (M1+M3).
This is the model
layer's own score; a miss anywhere here is the exact failure mode C-12 kept the K1/K3 adjudication
for.

## Property tests (design doc §7, operationalized)

| P | Statement | Seeds that pin it |
|---|---|---|
| P1 | mechanical-only ⇒ stops/adr/openspec/evidence.targeted stay at floor | ADV-02 · SC-13 · SC-16 · SC-18 |
| P2 | materiality-only ⇒ review ≤ 1 and evidence.breadth = 0 (absent floors) | every seed whose fired set is M-only |
| P3 | no preset/adjudication lowers a fired level; floors create no trigger records | ADV-06 + harness-level check on all seeds |
| P4 | checkpoint replay is monotone per dimension | SC-07 · SC-08 · SC-09 + every multi-checkpoint seed |
| P5 | every adjudication raise carries a citation; adjudication never removes | ADV-03 + all raises |
| P6 | N materiality firings at one checkpoint ⇒ ≤1 new stop; at K1, 0 (fold into floor) | SC-01 · SC-02 · SC-03 · SC-07 · ADV-04 · SC-15 · SC-21 |

## What passing means (and doesn't)

Passing this bar clears the **§11 step-3 gate**: the classifier may be wired into commands
(propose first, verify last). It does **not** validate the calibration itself — whether the rigor
lands where materiality is remains the step-5 frozen-kit re-run's question. This corpus is a
**calibration set, not a blind oracle** (observation O-8): step 3 iterates against it openly; the
blind test is step 5.
