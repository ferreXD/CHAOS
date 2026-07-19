# EA-X4 — Post-fix re-validation (EA-V3 hardening landed)

**Provenance:** **Observed** — agent-executed, deterministic, no humans. Same abuse harness as
the baseline; only the runtime under test changed. **Date:** 2026-07-19 · Node v24.18.0 / win32.

The EA-X4 baseline ([`results.md`](results.md)) FAILED the continuation bar (12/20 = 60%) with
two reproducible defect classes. Those were routed to hardening ([`failures.md`](failures.md))
and **fixed in the runtime**. This is the re-validation of the same 20-run kill/resume abuse
suite (incl. the concurrent panel+runner variant) against the fixed runtime.

## Verdict — threshold now MET

| Metric | Threshold | Baseline (pre-fix) | Post-fix | Result |
|---|---|---|---|---|
| Correct-continuation rate | **≥95%** | 12/20 = 60% ❌ | **20/20 = 100%** | ✅ **PASS** |
| State corruption | **0** | 0/20 ✅ | **0/20** | ✅ **PASS** |
| Capsule integrity (EA-I09) | present+valid | null hash gap ❌ | **6 verified, 0 null, 0 invalid** | ✅ **PASS** |
| **Overall** | both | FAIL | **PASS** | ✅ |

Stable across **4 post-fix passes**: 100% / 100% / 100% / 100%, 0 corruption every pass, both
former failure classes (`degraded-createdecision-window`, `inconsistent-lost-answer`) **absent**
every pass. Raw log: [`abuse-run.postfix.json`](abuse-run.postfix.json). Baseline retained at
[`abuse-run.json`](abuse-run.json).

Post-fix classification histogram (all healthy shapes): `no-decision`, `waiting-answerable`,
`ready-answer-committed` — no inconsistent/degraded states remain.

## What was changed in the runtime (`tools/chaos-interaction-runtime`)

All fixes are additive and required **no schema change** (`decision.metadata` /
`capsule.metadata` accept additional properties; the `runtime-warning` audit type already
exists). Existing suite stayed green throughout; total tests **45 → 57**.

| Fix | Issue closed | Where |
|---|---|---|
| **`reconcile()`** — recompute session state + decision buckets + derived pointers from the source-of-truth decisions/responses; wired (no-op when healthy) into `beginCommand`, `findResumeCandidates`, `getActiveDecision` | **F1**, **F2** (heals a crash/race that lands mid-mutation) | `services/interactionRuntime.ts` |
| **Durable `nextStep`** — stashed in `decision.metadata.resumeHints` at creation (written first, atomically); `reconcile` restores it | F1/F2 nextStep loss | `services/interactionRuntime.ts` |
| **Global write lock** — re-entrant cross-process `withFileLock` around every mutating op; a dead-pid/stale lock is broken so a hard kill never wedges the store | **F2** root cause (concurrent lost update) | `store/writeLock.ts`, `services/interactionRuntime.ts` |
| **Capsule re-read** — `createResumeCapsule` re-reads the freshest session before writing, patching only capsule-pointer fields | F2 clobber window | `services/interactionRuntime.ts` |
| **Capsule integrity hash** — sha256 in `capsule.metadata.contentHash` + `verifyResumeCapsule()` / `verifyCapsuleIntegrity()` | **O1 / EA-I09** null capsule hash | `services/resumeCapsuleService.ts` |
| **Stale-temp GC** — age-gated `sweepStaleTempFiles()` on runtime init | **O2** orphan `.tmp` litter | `store/atomicWrite.ts`, `services/interactionRuntime.ts` |

Unit coverage for each fix is in `tools/chaos-interaction-runtime/test/hardening.test.ts`
(reconcile F1/F2 + no-op, capsule hash valid/tampered, temp GC age-gating, lock acquire/
release + dead-pid break + two-runtimes-one-root).

## Why this guarantees continuation

- **Durability was never the problem** (0 corruption pre- and post-fix): atomic writes hold.
  The problem was session *state* desyncing from decision/response truth under a kill or race.
- **`reconcile()` makes the desync unobservable to the resume path.** Because the runtime now
  recomputes lifecycle state from the authoritative decision/response files on every resume
  entry point, a durable *waiting* decision is always discoverable+answerable and a durable
  *answered* decision is always resumable — regardless of whether the session-flip write
  landed. This is the load-bearing guarantee (it alone moved the suite 60% → 100%).
- **The write lock removes the race at the source** so the inconsistency mostly never forms
  live; **the capsule re-read** narrows the residual window; **reconcile** is the crash
  backstop for the instant a kill lands mid-mutation. Defense in depth.

## Honest residuals (not blockers; tracked)

- **Orphan `.tmp` during the abuse window is expected and correct.** The GC is age-gated (30s)
  so it never deletes a possibly-in-flight write; temps left by a just-killed process are
  cleaned on the next runtime start past the threshold. The abuse suite (resume happens ms
  after the kill) therefore still reports a few fresh temps — by design, not a regression.
- **Lock granularity is coarse** (one store-wide lock). Correct and simple at this scale;
  a finer per-run lock is a future optimization, not a correctness need.
- **Scope unchanged from the baseline:** runtime state layer + documented resume path under
  kill/concurrent-write abuse; not the VS Code UI, live runner lease loop end-to-end, or
  multi-machine/network faults.

## Bottom line

The EA-X4 failure is **resolved**: kill/resume continuation is now **20/20 (100%)** with **0
corruption** and **verified capsule integrity**, stable across passes, backed by 12 new unit
tests. Auto-resume can be promoted with respect to the abuse dimensions EA-X4 measures. The
abuse harness remains as the standing regression gate (EA-V3 "concurrent-writer suite green" /
IL-RT9).
