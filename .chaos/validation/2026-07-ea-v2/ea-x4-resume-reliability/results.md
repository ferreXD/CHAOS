# EA-X4 — Resume reliability under abuse (results)

**Experiment:** EA-X4 (kill/resume abuse suite ×20, incl. concurrent panel+runner writes)
**Spec:** `15-validation-experiments.md` §15.2 · **Hypothesis:** *pause/resume is trustworthy under abuse.*
**Provenance:** **Observed** — agent-executed, deterministic, no humans. This experiment is
fully agent-executable (§15.1/README); no human stood in for anyone, so no agent-vs-human
caveat is needed. What *is* caveated is timing nondeterminism (see "Reproducibility").
**Date:** 2026-07-19 · **Platform:** win32 x64, Node v24.18.0

---

## Verdict (against the spec thresholds)

| Metric | Threshold | Observed (headline run) | Result |
|---|---|---|---|
| Correct-continuation rate | **≥95%** (≥19/20) | **12/20 = 60%** | ❌ **FAIL** |
| State corruption | **0** | **0/20** (no torn JSON, no torn audit line, no schema-invalid record) | ✅ **PASS** |
| **Overall** | both | correctness bar missed | ❌ **FAIL → route to EA-V3 / EA-I09** |

**Plainly: the threshold is NOT met.** Per the spec's failure interpretation, this triggers
*"harden (EA-V3 / EA-I09) before promoting auto-resume."* That is the expected, valid,
publishable outcome the gate exists to produce — not a harness defect. The raw log is
[`abuse-run.json`](abuse-run.json); concrete repros + cross-links are in
[`failures.md`](failures.md).

The two halves of the result point in different directions and both matter:

- **Durability is strong.** The runtime's atomic-write design (temp file → `fsync` →
  `rename`) held under 20/20 hard kills: **zero torn files, zero torn audit lines, zero
  schema-invalid persisted records**, both immediately post-kill and again after resume.
  Discovery reading source-of-truth session/decision files (not the derived pointers) makes
  it robust to stale `active.json`/`index.json`.
- **Continuation is not yet trustworthy.** A hard kill (or a concurrent panel+runner write)
  can leave the store *uncorrupted but un-continuable*: the decision and its answer are
  durable, yet the session was never flipped, so the documented resume path can't pick the
  run back up. **Corruption is the wrong lens; lost-continuation is the real risk here.**

---

## Method

### System under test
The file-backed CHAOS Interaction Runtime (`tools/chaos-interaction-runtime`, programmatic
API `src/index.ts`) — command sessions, material decisions, responses, change locks, resume
capsules, audit events. "Corruption" is measured against the on-disk ephemeral state
(`active.json`, `index.json`, `locks.json`, `audit.jsonl`, `sessions/`, `decisions/`,
`capsules/`). Every iteration runs against an **isolated temp store**; the repo's real
`.chaos/interactions/` is never touched.

### The abuse loop (×20)
Each iteration, driven from a seeded LCG (`seed = iteration index`, recorded per run):

1. **Seed** a governed sequence in a **child process** through the real runtime:
   `beginCommand` → `createDecision` (≥1 material decision) → `createResumeCapsule` →
   `answerDecision`, announcing ordered checkpoints on stdout.
2. **Hard-kill** the child with `SIGKILL` (== `TerminateProcess` on Windows) at/near a seeded
   checkpoint — either a **boundary** kill (fired as the target op starts) or a **mid-op**
   kill (fired after a jittered delay once the write window opens), so a write may be
   interrupted mid-flight. Kill landed in **20/20** runs.
3. **Resume** from a clean in-process runtime: run resume discovery
   (`findResumeCandidates`) + `resumeCommand`, incorporating any answered decision.
4. **Assert correct continuation:** resume finds the right candidate; `nextStep` matches the
   pre-kill expected continuation (`ea-x4-continue`); the answered decision is incorporated
   **exactly once** (idempotent consume, no duplicate effect — cf. `idempotentConsume`);
   locks are coherent.
5. **Assert 0 corruption:** every on-disk `.json` parses; every `audit.jsonl` line parses with
   no partial trailing line; **schema-validate every persisted record** against the Iteration-0
   schemas; flag orphan `.tmp` files and the null-capsule-hash gap.

### Two scenarios (both included, as the spec requires)
- **Single-kill** (runs 1–14): one child, killed at a seeded checkpoint (`begin`/`decision`/
  `capsule`/`answer`) via boundary or mid-op mechanism.
- **Concurrent panel+runner race** (runs 15–20): parent pre-seeds to *waiting-for-decision*
  with a shared decision, then a **panel** writer (`answerDecision` bridge) and a **runner**
  writer (`createResumeCapsule` artifact churn + `markDecisionConsumed`) race on the same
  session/change; both are hard-killed mid-race.

### Correctness oracle (how "correct continuation" is judged)
"Correct" is judged against the **last durably committed state read from disk**, not against
"the script finished" — a hard kill can legitimately land before, during, or after any
commit. A run is **correct** when resume deterministically reaches a coherent, continuable
state matching what actually committed (nothing lost, consume exactly-once, no corruption),
and **incorrect** when resume loses an answered decision, finds the wrong candidate, or lands
in an unrecoverable inconsistent state. Classifications:

| Classification | Meaning | Correct? |
|---|---|---|
| `no-session` / `no-decision` | kill before that commit; nothing durably promised; re-drivable | ✅ |
| `waiting-answerable` | cleanly paused for decision; resume answers → ready-to-resume | ✅ |
| `ready-answer-committed` | answer fully committed; resume continues directly | ✅ |
| `consumed` | decision consumed coherently; exactly-once verified | ✅ |
| `degraded-createdecision-window` | decision persisted but session not flipped (non-atomic `createDecision`) | ❌ |
| `inconsistent-lost-answer` | decision answered/consumed but session flip lost (write race) | ❌ |
| `inconsistent-other` | any other incoherent shape | ❌ |

---

## Results (headline run — 20 iterations, seed = iteration index)

```
correct continuation: 12/20 (60.0%)   threshold >=95%  -> FAIL
corruption (post-kill):   0            threshold 0       -> PASS
corruption (post-resume): 0
kills landed:            20/20
classification: no-decision 5 | waiting-answerable 6 | ready-answer-committed 1
                degraded-createdecision-window 4 | inconsistent-lost-answer 4
observations: nullCapsuleHash=present | orphanTempFileRuns=8 | missingTrailingNewline=0
```

| # | variant | kill | ok? | corrupt | classification |
|--:|---|---|:--:|:--:|---|
| 1 | single | decision/boundary | ✅ | no | no-decision |
| 2 | single | decision/boundary | ✅ | no | no-decision |
| 3 | single | decision/mid-op | ❌ | no | degraded-createdecision-window |
| 4 | single | decision/mid-op | ❌ | no | degraded-createdecision-window |
| 5 | single | decision/mid-op | ✅ | no | no-decision |
| 6 | single | decision/mid-op | ✅ | no | waiting-answerable |
| 7 | single | decision/mid-op | ✅ | no | waiting-answerable |
| 8 | single | decision/mid-op | ✅ | no | waiting-answerable |
| 9 | single | decision/boundary | ✅ | no | no-decision |
| 10 | single | decision/boundary | ❌ | no | degraded-createdecision-window |
| 11 | single | decision/boundary | ✅ | no | no-decision |
| 12 | single | decision/boundary | ❌ | no | degraded-createdecision-window |
| 13 | single | capsule/boundary | ✅ | no | waiting-answerable |
| 14 | single | capsule/mid-op | ✅ | no | waiting-answerable |
| 15 | concurrent | answer-race | ✅ | no | waiting-answerable |
| 16 | concurrent | answer-race | ❌ | no | inconsistent-lost-answer |
| 17 | concurrent | answer-race | ❌ | no | inconsistent-lost-answer |
| 18 | concurrent | answer-race | ❌ | no | inconsistent-lost-answer |
| 19 | concurrent | answer-race | ❌ | no | inconsistent-lost-answer |
| 20 | concurrent | answer-race | ✅ | no | ready-answer-committed |

---

## Failure classes (both reproducible — detail + repro in `failures.md`)

### F1 — `createDecision` is not crash-atomic (`degraded-createdecision-window`) — 4/20
`createDecision` writes `decisions/<id>/decision.json` (state `waiting`) **before** it flips
the session to `waiting-for-decision` and rebuilds `active.json`/`index.json`. A kill in that
window leaves **decision = waiting, session = running**, with `session.activeDecisionIds` not
referencing the decision and the derived `active.json` stale. Consequence: the auto-resume
path (`findResumeCandidates`, which only scans *ready-to-resume*) misses it; the derived
active-state pointer misses it; only a direct `getActiveDecision` scan surfaces the decision —
and answering it will **not** reach *ready-to-resume* (session state / `activeDecisionIds`
mismatch), so the run cannot reach the resumable state and its `nextStep` linkage is lost.
Durable but un-continuable. **Not corruption** (both files valid JSON). → **EA-V3 / EA-I08**.

### F2 — panel+runner lost session-flip (`inconsistent-lost-answer`) — 4/20 (all concurrent)
This is the **exact race the spec calls out**. The panel's `answerDecision` flips the session
to *ready-to-resume*; the runner's concurrent `createResumeCapsule` does a read-modify-write on
the **same** `sessions/<run>.json` and, from a stale snapshot, writes the session back to
*waiting-for-decision* — a classic lost update. Result: **decision = answered/consumed but
session = waiting-for-decision**. `findResumeCandidates` → none (not ready-to-resume);
`getActiveDecision` → `NO_ACTIVE_DECISION` (decision not waiting). The answer is durable
(`response.json` written) but the run is **frozen and not continuable via any public API**.
**Not corruption.** → **EA-V3 / EA-I08** ("Concurrent-writer test suite green" is an EA-V3
closure criterion).

### Secondary observations (recorded, not counted against the 0-corruption metric)
- **Null capsule hash gap (Observed).** Resume capsules carry no integrity hash, and
  `response.validatesAgainstDecisionHash` is always `null`. A torn/tampered capsule cannot be
  content-verified — recovery leans entirely on schema validity + atomic writes. Confirmed
  present in this run. → **EA-I09** (capsule integrity + quality gate).
- **Orphan temp-file litter (Observed).** 8/20 runs left an interrupted atomic-write temp file
  (e.g. `.locks.json.<pid>.<ts>.<rand>.tmp`, `.index.json.<pid>.<ts>.<rand>.tmp`). The **target
  file is intact** (atomic rename), so this is *not* corruption, but there is no GC of these
  temps — they accumulate across crashes. → **EA-V3 / EA-I08** (cleanup pass).

---

## Capsule-usefulness notes (spec metric 3, qualitative)

- When the answer **did** commit (`ready-answer-committed`), the resume capsule alone carried
  everything needed to continue: `nextStep = ea-x4-continue`, `answeredDecisionIds`, and the
  context capsule. Resume did **not** rely on luck. Capsule usefulness: **good** on the happy
  path.
- The capsule is only *written on the answer→ready-to-resume flip*. In both failure classes
  the flip never durably happened, so **no useful capsule exists** to recover from — the
  capsule can't rescue a run whose session was never flipped. The gap is upstream of the
  capsule (session-flip atomicity), which the capsule cannot compensate for.
- The capsule has **no integrity hash**, so even a present capsule cannot be trusted against a
  torn/partial write beyond schema shape (EA-I09).

---

## Reproducibility & honesty caveats

- **Deterministic stimulus, distributional outcome.** The seed fixes the *stimulus* (variant,
  checkpoint, mechanism, jitter) reproducibly, but *where a hard kill lands* relative to a
  fast synchronous write is subject to OS scheduling. So the exact per-run classification — and
  thus the exact rate — varies run to run. Across **four** full 20-run passes on this machine
  the correct-continuation rate was **60%, 70%, 75%, 80%** — **every pass failed ≥95%**, **every
  pass had 0 corruption**, and **both failure classes reproduced every pass**. The headline
  above is one representative Observed run (`abuse-run.json`); the stable conclusions are the
  0-corruption result and the two failure classes, not the precise percentage.
- **Even one occurrence is disqualifying.** Because a single frozen/un-continuable run means
  auto-resume silently drops governed work, the ≥95% bar is decisively missed regardless of
  which pass is quoted.
- **Scope.** This measures the runtime state layer + documented resume path under kill and
  concurrent-write abuse. It does not exercise the VS Code Decision Center UI, the live
  `chaos-interaction-runner` lease loop end-to-end, or multi-machine/network faults.

---

## Bottom line

Resume is **durable but not yet trustworthy under abuse**: 0 corruption, but **12/20 (60%)**
correct continuation against a **≥95%** bar, with two reproducible defect classes (non-atomic
`createDecision`; panel+runner lost session-flip) plus the null-capsule-hash and orphan-temp
gaps. **Threshold not met → harden (EA-V3 / EA-I09) before promoting auto-resume.** See
[`failures.md`](failures.md) for repros and [`harness-notes.md`](harness-notes.md) for the
harness + IL-RT9 CI wiring.
