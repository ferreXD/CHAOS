# Results — Stage-C classifier vs the pre-registered fidelity corpus

Run date: 2026-08-02 · Classifier: `tools/chaos-classify/` (deterministic core) + blind
model adjudication per `adjudication-prompt.md` v2+r13/14 · Corpus: the 27 registered seeds ·
Bar: [`acceptance.md`](acceptance.md) (frozen before any classifier code existed).

## Final scorecard — ALL PASS

| Criterion | Result |
|---|---|
| A1 materiality under-detection | **0** (bar: 0) |
| A2 stop over-detection | **0** (bar: 0) |
| A3 non-stop materiality over-detection | **0 seeds** (bar: ≤2) |
| A4 mechanical mis-detection | **0 per direction** (bar: ≤1) |
| A5 property tests P1–P6 | **100%** |
| A6 citations on every adjudication raise | **100%** |
| A7 scan determinism | byte-identical across runs |
| A8 confidence honesty | exact, incl. the two registered LOWs |
| dims / scanEcho exact | exact on every registered checkpoint |
| **Semantic subset** (adjudication-only firings) | **11/11 hit** |

Scan-only (deterministic core alone): 9/9 PASS. Unit suite: 17/17.
Evidence: [`evidence-full-run.md`](evidence-full-run.md) (harness report) ·
[`evidence-adjudication-results.json`](evidence-adjudication-results.json) (the blind
verdicts, verbatim).

## How the adjudication layer was scored (blindness protocol)

The expectations' author is contaminated as a judge, so the semantic layer was scored via
**blind subagents**: `run_corpus.py --emit-packets` writes sanitized, **evidence-gated**
packets (no Expected sections, no seed notes, no future evidence — a K1 packet contains no
ledger and no diff); independent judges each received a band-mixed batch, the pinned prompt,
and nothing else; their JSON verdicts were merged and scored by the harness.

## Iteration log (three rounds — what the corpus caught)

1. **Round 1 (diagnostic, discarded):** caught a packet bug (K1 judges saw ledgers/diffs that
   don't exist yet — fixed: `PACKET_EVIDENCE` gating), two judge blind spots that became prompt
   rules 8–9 (hedged posture is crossable; M3 domain limits), two of the author's own fixture
   patches that contradicted their frozen rows (ADV-03/ADV-04 — corrected, changelogged), and
   the missing `firedEarlier`/breaking context in packets.
2. **Round 2 (scored):** 40/44 packets exact. Residual: three K1 over-raises, all one failure
   family — *anticipation* (problem-statement intent SC-09; capability-word M2 ADV-03; a
   fixture-wording invitation ADV-05). Became prompt rules 13–14 + one wording fix.
3. **Round 3 (four re-judged packets):** all four declined — exact. Full bar passes.

## Caveats (kept honest)

- One judge per packet, no multi-vote; judge model = the session's model family. The measured
  fidelity is for **this prompt + this model class**; the prompt (now rules 1–14) is part of
  the classifier's tested surface — changing either re-opens the corpus run.
- This corpus is a calibration set (observation O-8); step 3 iterated openly against it —
  three rounds, every iteration logged above and in the README changelog, no expectation
  edited to make anything pass (the two expectation-adjacent changes were input corrections,
  changelogged with causes). The blind test of the *calibration* is the step-5 re-run.
- X2/K4 remains uncovered by seeds (O-9); unit-tested only.

## Gate consequence

The design doc §11 **step-3 gate is cleared**: the classifier may now be wired into commands,
one at a time, propose first, verify last (step 4). Nothing is wired yet.
