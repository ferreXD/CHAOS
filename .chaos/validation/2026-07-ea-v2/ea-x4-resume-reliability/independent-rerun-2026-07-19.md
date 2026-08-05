# EA-X4 — Independent re-execution of the abuse suite (post-fix)

> **What this file is.** A fresh, independent execution of the EA-X4 kill/resume abuse suite
> against the runtime **as it currently stands on `main`** (with the EA-V3 hardening landed),
> run from a separate thread that followed `ea-v2-kickoff/ea-x4-resume-reliability.md`
> end-to-end. It does **not** replace the honest history: the baseline FAIL is preserved in
> [`results.md`](results.md) + [`abuse-run.json`](abuse-run.json) + [`failures.md`](failures.md),
> and the original post-fix re-validation in [`post-fix-revalidation.md`](post-fix-revalidation.md)
> + [`abuse-run.postfix.json`](abuse-run.postfix.json). This file adds a second, independent
> confirmation of the post-fix result — nothing here was retouched or hand-picked.

**Provenance:** **Observed** — agent-executed, deterministic, no humans. Fully agent-executable
experiment (§15.1); no human stood in for anyone, so no agent-vs-human caveat is needed. What
*is* caveated is timing nondeterminism (see "Reproducibility" in `results.md`; addressed here by
running multiple passes + a higher-N stress pass).
**Date:** 2026-07-19 · **Platform:** win32 x64, Node v24.18.0 (same as baseline/post-fix).
**Runtime under test:** current `main` (EA-V3 hardening present: `reconcile()`, store-wide write
lock, capsule `contentHash`, stale-temp GC).

---

## Verdict — threshold MET, and stable

| Metric | Threshold | This re-execution | Result |
|---|---|---|---|
| Correct-continuation rate | **≥95%** (≥19/20) | **20/20 = 100%** (headline pass) | ✅ **PASS** |
| State corruption | **0** | **0** (post-kill and post-resume) | ✅ **PASS** |
| Capsule integrity (EA-I09) | present + valid | **6 verified, 0 null, 0 invalid** | ✅ **PASS** |
| **Overall** | both | headline **20/20, 0 corruption** | ✅ **PASS** |

**Plainly: the bar is met and holds up under repetition and stress.** This clears EA-X4's
kill/resume abuse dimensions and does **not** route to further EA-V3 hardening. The prior-thread
post-fix claim reproduces independently.

---

## What was run (four passes + CI gate, all clean)

The results doc rightly warns that the *rate* is distributional (where a hard kill lands is
subject to OS scheduling) and that "even one occurrence is disqualifying." So a single 20/20 is
not enough to claim PASS — the failure *classes* must stay absent across repetition. They did:

| Pass | N | Correct | Corruption (post-kill / post-resume) | Degraded/inconsistent | Capsules verified | Raw log |
|---|--:|---|---|:--:|--:|---|
| Re-run 1 (headline) | 20 | **20/20 (100%)** | 0 / 0 | 0 | 6 | [`abuse-run.independent-rerun.json`](abuse-run.independent-rerun.json) |
| Re-run 2 | 20 | **20/20 (100%)** | 0 / 0 | 0 | 6 | (scratch) |
| Re-run 3 | 20 | **20/20 (100%)** | 0 / 0 | 0 | 6 | (scratch) |
| **Stress** | **50** | **50/50 (100%)** | 0 / 0 | 0 | 36 | [`abuse-run.independent-stress50.json`](abuse-run.independent-stress50.json) |
| **Aggregate** | **110** | **110/110 (100%)** | **0 / 0** | **0** | **54** | — |

- **Kills landed:** 110/110 (every worker was actually terminated by SIGKILL, not left to
  finish — the abuse actually happened).
- **Classification histogram (110 runs):** `waiting-answerable` 67, `ready-answer-committed` 25,
  `no-decision` 18. **All healthy shapes.** Zero `degraded-createdecision-window`, zero
  `inconsistent-lost-answer` — i.e. **both former failure classes (F1, F2) are absent across all
  110 runs**, including 54 concurrent panel+runner races.
- **CI smoke gate** (`node --test test/abuse/killResume.abuse.test.ts`): **4/4 pass** — the
  hard invariants (no torn JSON, no torn audit line, no schema-invalid record, exactly-once
  consume, known classification shape) hold.
- **Capsule integrity:** 54 capsules present with a valid `metadata.contentHash`; **0 null
  hashes, 0 invalid hashes** — the EA-I09 null-capsule-hash gap is closed in every run.

### Why the stress pass matters
Runs beyond #14 are the **concurrent panel+runner race** — the exact race that produced failure
class **F2** (`inconsistent-lost-answer`) in the baseline. The N=50 stress pass therefore drives
**36 concurrent-race iterations** (vs 6 in a default N=20). All 36 continued correctly with 0
corruption, so the write-lock + `reconcile()` fix holds under ~6× the race pressure of the
standard run, not just at the default N.

### Honest residual (expected, not a regression)
`observations.orphanTempFileRuns` is non-zero (6/20 in the headline pass; 24/50 under stress).
This is **by design**: the stale-temp GC is age-gated (30s) so it never deletes a possibly
in-flight write, and the abuse suite resumes milliseconds after the kill — so fresh temps from a
just-killed process are still present at audit time. The **target files are intact** (atomic
rename), no `.tmp` is counted as corruption, and they are swept on the next runtime start past
the age threshold. Same characterization as `post-fix-revalidation.md`; confirmed here.

---

## How to reproduce

```bash
cd tools/chaos-interaction-runtime
node --test test/abuse/killResume.abuse.test.ts     # CI invariant gate (fast)
node test/abuse/run.ts --runs 20                    # full suite (exit 0 iff >=95% AND 0 corruption)
node test/abuse/run.ts --runs 50                    # higher-N stress (36 concurrent-race runs)
```
Each iteration uses its own `os.tmpdir()` store; the repo's real `.chaos/interactions/` is never
touched. See [`harness-notes.md`](harness-notes.md) for the harness map and IL-RT9 CI wiring.

---

## Bottom line

Independently re-executed on the current `main`, EA-X4 is **PASS**: **110/110 (100%)** correct
continuation across four passes (incl. a 36-race stress pass), **0 corruption** post-kill and
post-resume, **54/54 capsule integrity checks verified**, and **both former defect classes
absent in every run**. This confirms the EA-V3 post-fix result rather than uncovering a new
failure — auto-resume remains promotable with respect to the abuse dimensions EA-X4 measures.
The remaining EA-X4 caveats are unchanged and honest: scope is the runtime state layer +
documented resume path under kill/concurrent-write abuse (not the VS Code Decision Center UI,
the live runner lease loop end-to-end, or multi-machine/network faults).
