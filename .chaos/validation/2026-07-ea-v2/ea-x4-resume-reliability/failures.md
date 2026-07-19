# EA-X4 — Failures (repros + EA-V3 / EA-I09 cross-links)

> **✅ ALL RESOLVED (EA-V3 hardening, 2026-07-19).** F1, F2, O1, O2 below were fixed in the
> runtime; the same abuse suite now re-validates at **20/20 = 100%, 0 corruption, capsule
> integrity verified**. Fix + proof: [`post-fix-revalidation.md`](post-fix-revalidation.md).
> Per-issue resolution is noted inline (**RESOLVED →**). This document is retained as the
> original finding record with concrete repros.

Threshold **not met**: 12/20 (60%) correct continuation vs **≥95%**; corruption **0/20**.
Per the spec, this routes to hardening. Two reproducible defect classes + two observations.
All are **Observed** (agent-executed, deterministic stimulus, 2026-07-19, Node v24.18.0 / win32).

Routing targets:
- **EA-V3 — Runtime hardening pass** →
  [`.chaos/todo/roadmaps/public-alpha/items/2026-07-18-ea-v3-runtime-hardening-pass.md`](../../../todo/roadmaps/public-alpha/items/2026-07-18-ea-v3-runtime-hardening-pass.md)
  (closure criterion: *"Concurrent-writer test suite green"*; findings EA-I08/EA-I09/EA-I10).
- **EA-I09 — Capsule integrity + quality gate** →
  [`.chaos/todo/roadmaps/improvement-landscape/items/2026-07-18-r13-il-rt3-ea-i09-capsule-integrity.md`](../../../todo/roadmaps/improvement-landscape/items/2026-07-18-r13-il-rt3-ea-i09-capsule-integrity.md).

---

## F1 — `createDecision` is not crash-atomic across decision + session + derived state

**Class:** `degraded-createdecision-window` · **Hits:** 4/20 (runs 3, 4, 10, 12) · **Severity:**
High (governed decision becomes undiscoverable to the resume path) · **Corruption:** none.

**RESOLVED →** `reconcile()` re-flips the session from the durable waiting decision and recovers
`nextStep` from `decision.metadata.resumeHints`; wired into `beginCommand`/`findResumeCandidates`/
`getActiveDecision`. Unit test: `hardening.test.ts` "reconcile heals F1". Re-validated 100%.

### What happens
`InteractionRuntime.createDecision` persists the decision file **before** it flips the owning
session and rebuilds the derived pointers. In `tools/chaos-interaction-runtime/src/services/interactionRuntime.ts`:

1. `this.store.decisions.writeDecision(decision)` — `decisions/<id>/decision.json`, state `waiting` *(committed first)*
2. change-lock write (`locks.json`)
3. `transitionSession(session, "waiting-for-decision")` + `sessions.write(updated)` — sets `activeDecisionIds`, `nextStep` *(committed later)*
4. `store.refreshDerived(now)` — rebuilds `active.json` / `index.json` *(committed last)*

A hard kill between (1) and (3)/(4) leaves:
- `decision.json` = `waiting`
- `sessions/<run>.json` = `running`, `activeDecisionIds = []`, `nextStep = null`
- `active.json` = stale (`state: ready`, no pending decision)

### Why it fails continuation
- `findResumeCandidates()` scans only *ready-to-resume* sessions → **does not find the run**.
- The derived `active.json` pointer (what a Decision Center reading the pointer would show) →
  **does not show the pending decision**.
- Only a direct `getActiveDecision()` scan of decision files finds it. But answering it does
  **not** reach *ready-to-resume*: `answerDecision`'s flip is gated on
  `state === "waiting-for-decision"` with the decision in `activeDecisionIds` — neither holds —
  so the session stays `running`, no capsule/`nextStep` is produced, and the run never becomes
  resumable. The decision is **durable but the run is un-continuable via the documented path.**

### Repro
```
cd tools/chaos-interaction-runtime
npm run test:abuse -- --runs 14        # single-kill scenario
# mid-op / boundary kills at the 'decision' checkpoint reproduce F1 (timing-distributional;
# expect ~1-4 of the 'decision' kills to land in the window per 14-run pass).
```
Deterministic-in-principle: the window is the ordered writes in `createDecision`
(`writeDecision` → `sessions.write` → `refreshDerived`). Any crash between the first and last
reproduces the shape.

### Suggested hardening (EA-V3 / EA-I08)
Make `createDecision` crash-atomic or self-healing: write the session flip + decision in an
order where a crash is always recoverable (e.g. session references the decision *before or
atomically with* the decision file, or a reconciliation pass on `beginCommand`/resume that
re-derives `activeDecisionIds` + session state from decision files and rebuilds `active.json`).

---

## F2 — panel+runner concurrent write loses the session flip (the spec's named race)

**Class:** `inconsistent-lost-answer` · **Hits:** 4/20 (runs 16, 17, 18, 19 — all concurrent) ·
**Severity:** High (answered work is silently stranded) · **Corruption:** none.

**RESOLVED →** global re-entrant write lock serialises the panel+runner writes (root cause);
`createResumeCapsule` re-reads the freshest session before writing (residual window); `reconcile()`
flips an answered-but-not-flipped session to ready-to-resume + rebuilds the capsule (crash
backstop). Unit test: `hardening.test.ts` "reconcile heals F2" + lock tests. Re-validated 100%.

### What happens
Two processes read-modify-write the **same** `sessions/<run>.json` with no cross-writer lock:
- **panel** `answerDecision` → reads session (`waiting-for-decision`), computes
  `ready-to-resume`, writes session (`interactionRuntime.ts`, session write in the
  answer/ready-to-resume branch).
- **runner** `createResumeCapsule` → reads session (stale `waiting-for-decision`), writes
  session back with a capsule path but **still `waiting-for-decision`** (`createResumeCapsule`
  session write).

If the runner's write lands after the panel's, the panel's flip is **lost**. End state:
`decision = answered` (or `consumed`), `session = waiting-for-decision`. The answer is durable
(`response.json` present) but:
- `findResumeCandidates()` → none (not *ready-to-resume*).
- `getActiveDecision()` → `NO_ACTIVE_DECISION` (decision is `answered`, not `waiting`).
- `beginCommand` re-entry → `BLOCKED_BY_PENDING_DECISION` pointing at the *already-answered*
  decision, which `answerDecision` then refuses (`DECISION_NOT_ANSWERABLE`).

The run is **frozen and not continuable via any public API** — exactly the panel+runner write
race §15.2 flags.

### Repro
```
cd tools/chaos-interaction-runtime
npm run test:abuse -- --runs 20        # runs 15-20 are the concurrent panel+runner variant
# concurrent runs reproduce F2 (expect ~2-4 lost-flip runs per pass; timing-distributional).
```
Root cause is structural (unsynchronized read-modify-write on `sessions/<run>.json`), so it is
reproducible independent of the kill — the kill only widens the window.

### Suggested hardening (EA-V3 / EA-I08)
Serialize session mutations (per-run write lock / compare-and-set on a version field / single
writer), or make the runner never write session state it did not author (capsule-only writes
that don't clobber `state`). EA-V3's closure criterion *"Concurrent-writer test suite green"*
is directly this suite's concurrent variant.

---

## Observation O1 — null capsule hash (→ EA-I09)

**Observed.** Resume capsules carry **no integrity hash**, and
`DecisionResponse.validatesAgainstDecisionHash` is always `null`
(`src/services/interactionRuntime.ts`, response construction). A torn or tampered capsule
cannot be content-verified — recovery relies solely on schema validity + atomic-write. Present
in this run (`observations.nullCapsuleHashGapPresent = true`). This is the EA-I09 "capsule
integrity + quality gate" item; EA-X4 confirms the gap empirically.

**RESOLVED →** capsules now carry a sha256 `metadata.contentHash`; `verifyResumeCapsule()` returns
`valid`/`tampered`/`missing`. Post-fix audit: `verified=6, nullHash=false, invalidHash=false`.
Unit test: `hardening.test.ts` capsule-integrity (valid + tampered). (Closes EA-I09.)

## Observation O2 — orphan atomic-write temp files (→ EA-V3 / EA-I08)

**Observed.** 8/20 runs left an interrupted atomic-write temp file (e.g.
`.locks.json.<pid>.<ts>.<rand>.tmp`, `.index.json.<pid>.<ts>.<rand>.tmp`). Because the rename
is atomic, the **target file is intact** — this is *not* corruption — but there is no
garbage-collection of these temps, so they accumulate across crashes. A cleanup/GC pass (sweep
`.*.tmp` on runtime init or `chaos:doctor`) belongs in the hardening pass.

**RESOLVED →** `sweepStaleTempFiles()` runs on runtime init, age-gated (30s) so it never deletes
an in-flight write. Unit test: `hardening.test.ts` "sweepStaleTempFiles ... aged ... but keeps
fresh". (The abuse suite still reports a few *fresh* temps by design — resume happens ms after
the kill; they are GC'd on the next runtime start past the threshold.)

---

## What is explicitly NOT broken

- **0 corruption in 20/20 runs** (and across 4 passes): no torn JSON, no torn `audit.jsonl`
  line, no schema-invalid persisted record, no missing trailing newline — post-kill and
  post-resume. The atomic-write primitive (temp → `fsync` → `rename`) holds under hard kill.
- **Consume is exactly-once.** `markDecisionConsumed` is idempotent by design
  (`consumed → consumed` is a no-op) and never duplicates the effect — verified on every run
  that reached consumption.
- **Discovery tolerates stale derived state.** `findResumeCandidates` / `getActiveDecision`
  read source-of-truth session/decision files, so a stale `active.json`/`index.json` (from a
  kill before `refreshDerived`) does not, by itself, break resume.
