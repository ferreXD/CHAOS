# T1 measured — the harness was under-reporting, and a parser bug manufactured governance

> Pre-registration: [`README.md`](README.md) §3/§4, frozen and committed (`bfda18e`/`798434e`)
> **before T1 ran**. Nothing below edits it. Workspace `demo-light` @ `93ced28`, one session,
> invoked as `chaos:run "..."` in plain text (not the slash form).

## 1. The headline

**23.7 minutes of machine time for what was predicted to be a trivial, zero-trigger change.**

| | Predicted | Measured |
|---|---|---|
| Band | **A** — no triggers | **M4 + M5 fired** — a band-B shape |
| Vector | all floors | `stops 2 · ev.t 1 · ev.b 0 · review 1 · verify 0 · openspec 1 · adr 0` |
| Machine time | 8–16 min | **23.7 min** |
| vs its bar | ≤5 min (band A) | ≤15 min (band B) ⇒ **FAIL 1.6×** |

Human wait was ~0: the two decisions were answered through the Decision Center fast enough that
no gap exceeded 45 s. **The 23.7 minutes is essentially all machine time.**

## 2. The direction test failed — in the worse direction

The frozen test (§4): *"product conditions should be no slower than the workflow arms. If T1
comes in materially under ~10 min, the harness was inflating the whole series."*

| | Measured |
|---|---:|
| Workflow band-A mean (arms) | 15.0 min |
| **T1 under product conditions** | **23.7 min** |
| B2 `filter-by-status` — the nearest analogue, near-identical task | 19.2 min |

**Product conditions are ~58% slower than the band-A arm mean and ~23% slower than the closest
matching task.** The harness was **under**-reporting, not inflating. Every wall-clock figure in
this program — including all 12 independently re-measured rows — **understates what a user
actually experiences.** The series is a floor, not an estimate.

## 3. Where the 23.7 minutes went

| Phase | Time | Share |
|---|---:|---:|
| **Frame** — digest, k1, adjudication merge, records, first renders, artifact writes | **9.3 min** | **39%** |
| Implementation — the filter, 8 tests, test runs | 7.7 min | 32% |
| **Close** — re-scope, rescan, k4 ×2, record, audit, render | **6.5 min** | 27% |

**Nine minutes elapsed before the first line of code was considered.** The actual change — a
query filter and its tests — took under eight. Two-thirds of the run is ceremony around it. This
is §6.3(b) of the rebase doc (the flat cost curve) showing up as clock time rather than tokens:
the fixed cost of *entering* the loop dominates.

## 4. M5 is a false positive caused by a parser bug — and it manufactured governance

`TRG-002` fired M5 scope-spill with the cite:

> diff touches `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`,
> `tests/TaskTracker.Tests/TaskEndpointsTests.cs`, **not in the approved scope**

The scope declared at K1 was:

```text
src/TaskTracker.Api/Endpoints/TaskEndpoints.cs tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

**The two files it flagged as out-of-scope are verbatim the two files that were declared.**

Root cause, `classify.py:139` — `parse_scope` splits on **commas only**:

```python
entries = [e.strip() for e in cleaned.split(",") if e.strip()]
```

A space-separated scope line collapses into **one entry** that matches no file, so every touched
path reads as spill. Reproduced directly: space-separated → 1 entry, `match_scope_entry` False;
comma-separated → 2 entries, True.

**What the false positive cost:** an unowed stop (`K3:trigger-fold`), an unowed decision
(`RUN-DEC-002`), and the whole `update-scope → rescan → k4 → k4` remediation tail at close.

This is the **D3 class** — a tool that lets a well-behaved caller manufacture governance by
formatting. D3 was `--self-review` free text firing X2 on every arm. This is worse: the caller
did nothing wrong at all, and the punishment is invisible unless you diff the cite against the
declaration.

## 5. M4 fired because the agent asked a *good* folded question

`TRG-001`: `2 material question(s) across 1 entry >= threshold 2`. `RUN-DEC-001` folded frame
approval together with a genuine contract ambiguity (how `?priority=` matches on case and empty).
Folding is the behaviour the design asks for — and it is charged as decision **density**.

Consequence worth stating plainly: **band A may be close to unreachable for any change carrying
one real question.** In the harness only B3 (title max length, zero questions) ever reached it.
That is a finding about the graduated bar, not about this task.

## 6. The good news, and it is genuinely large

**L1 executed at floor tier for the first time in this program.** `chaos:run` delegated the
implementation unit to `chaos-mechanical-executor` (`model: haiku`) — a 223-second subagent run —
and **quality held: 42/42 tests, up from 34.**

Every previous run reported `ceiling:1 mid:0 floor:0` because a workflow arm cannot spawn a
subagent. Here the tier band both banded *and acted*. **This is the first real evidence that
floor-tier implementation is safe on this workload**, and it partially reopens the L1 closure
(`a27f485`), which rested on Route B being untested and accepted as such. One positive data point
is not vindication, but it is no longer zero.

## 7. What this establishes

1. **Product conditions are slower than the harness.** The direction test failed the bad way; the
   whole series is a floor.
2. **The band prediction was wrong**, and for an interesting reason — M4 on a folded question and
   a false-positive M5.
3. **A parser bug manufactures governance** and inflated this very measurement.
4. **The fixed entry cost is the target**: 39% of the run happened before any code.
5. **L1 works in production** and floor-tier output was correct.
6. Quality never wavered: 42/42.

## 8. Caveats

- n=1, one task, one session.
- Decisions answered in the Decision Center do not appear as chat turns, so `humanWait` cannot
  see them. Here the gaps were small (no gap >45 s outside the subagent), so the number is sound,
  but the instrument should account for this before a run with slower answers.
- T1 was measured against band B's bar because that is where the classifier put it, not where the
  registration predicted.
